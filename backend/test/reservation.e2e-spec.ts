import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as request from 'supertest';
import { ReservationController } from '../src/reservation/reservation.controller';
import { ReservationService } from '../src/reservation/reservation.service';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRoles } from '../src/common/enum/roles.enum';
import { ReservationStatus } from '../src/reservation/types/reservation-status-enum';
import { VisitTypeEnum } from '../src/reservation/types/visit-type.enum';
import { Reflector } from '@nestjs/core';

// ---------------------------------------------------------------------------
// Shared mock state — aggiornato prima di ogni test per simulare l'utente
// ---------------------------------------------------------------------------
let currentMockUser: any = null;

// ---------------------------------------------------------------------------
// Mock del ReservationService — tutti i metodi sostituiti con jest.fn()
// ---------------------------------------------------------------------------
const mockReservationService = {
  createReservationByDoctor: jest.fn(),
  createReservationByPatient: jest.fn(),
  getReservationSlots: jest.fn(),
  isFirstVisit: jest.fn(),
  isFirstVisitForDoctor: jest.fn(),
  getReservations: jest.fn(),
  getPastReservationsPatient: jest.fn(),
  getHowManyPendingReservations: jest.fn(),
  getNextReservations: jest.fn(),
  acceptReservation: jest.fn(),
  declineReservation: jest.fn(),
  getReservationsPatient: jest.fn(),
};

// ---------------------------------------------------------------------------
// Payload valido per POST /reservations/for-patient
// ---------------------------------------------------------------------------
const VALID_DOCTOR_RESERVATION_DTO = {
  patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  startTime: '2026-04-01T10:00:00.000Z',
  endTime: '2026-04-01T10:30:00.000Z',
  visitType: VisitTypeEnum.CONTROL,
};

// ---------------------------------------------------------------------------
// Payload valido per POST /reservations (flusso paziente)
// ---------------------------------------------------------------------------
const VALID_PATIENT_RESERVATION_DTO = {
  startTime: '2026-04-01T10:00:00.000Z',
  endTime: '2026-04-01T10:30:00.000Z',
  visitType: VisitTypeEnum.CONTROL,
};

// ---------------------------------------------------------------------------
// Utenti mock
// ---------------------------------------------------------------------------
const MOCK_DOCTOR_USER = {
  id: 'user-doctor-1',
  email: 'doctor@example.com',
  role: UserRoles.DOCTOR,
  doctor: { userId: 'user-doctor-1', id: 'doctor-entity-1' },
  patient: null,
};

const MOCK_PATIENT_USER = {
  id: 'user-patient-1',
  email: 'patient@example.com',
  role: UserRoles.PATIENT,
  patient: {
    id: 'patient-entity-1',
    doctor: { userId: 'user-doctor-1', id: 'doctor-entity-1' },
  },
  doctor: null,
};

// ---------------------------------------------------------------------------
// Suite principale
// ---------------------------------------------------------------------------
describe('Reservation (e2e) — CR Doctor Reservation', () => {
  let app: INestApplication;
  let reflector: Reflector;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
        Reflector,
      ],
    }).compile();

    reflector = moduleFixture.get<Reflector>(Reflector);

    /**
     * CombinedGuard (istanza, non classe):
     *  1) inietta req.user dal valore di `currentMockUser`
     *  2) applica la logica @Roles() del RolesGuard reale
     * Viene passato come `useValue` per evitare problemi di DI con classi inline.
     */
    const combinedGuard: CanActivate = {
      canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        req.user = currentMockUser;

        const allowedRoles = reflector.get<string[]>(
          'roles',
          context.getHandler(),
        );

        // Nessun decoratore @Roles → accesso libero
        if (!allowedRoles) return true;

        const user = req.user;
        const isAuthorized = user && allowedRoles.includes(user.role);

        if (!isAuthorized) {
          throw new ForbiddenException(
            'You do not have permission to access this resource',
          );
        }

        return true;
      },
    };

    app = moduleFixture.createNestApplication();

    // Override del RolesGuard con il combined guard (istanza già pronta)
    app.useGlobalGuards(combinedGuard);

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // POST /reservations/for-patient
  // =========================================================================
  describe('POST /reservations/for-patient', () => {
    describe('Creazione prenotazione da parte del medico', () => {
      it('dovrebbe restituire 201 e il corpo della prenotazione creata', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        const createdReservation = {
          id: 'reservation-uuid-1',
          status: ReservationStatus.CONFIRMED,
          startDate: VALID_DOCTOR_RESERVATION_DTO.startTime,
          endDate: VALID_DOCTOR_RESERVATION_DTO.endTime,
        };
        mockReservationService.createReservationByDoctor.mockResolvedValue(
          createdReservation,
        );

        const response = await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(201);

        expect(response.body).toHaveProperty('id', 'reservation-uuid-1');
        expect(
          mockReservationService.createReservationByDoctor,
        ).toHaveBeenCalledWith(
          MOCK_DOCTOR_USER.doctor,
          expect.objectContaining({
            patientId: VALID_DOCTOR_RESERVATION_DTO.patientId,
          }),
        );
      });

      it('la prenotazione creata dal medico deve avere status CONFIRMED', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        mockReservationService.createReservationByDoctor.mockResolvedValue({
          id: 'reservation-uuid-1',
          status: ReservationStatus.CONFIRMED,
        });

        const response = await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(201);

        expect(response.body.status).toBe(ReservationStatus.CONFIRMED);
      });
    });

    describe('Controllo autorizzazione', () => {
      it("dovrebbe restituire 403 se l'utente è un paziente (non medico)", async () => {
        currentMockUser = MOCK_PATIENT_USER;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(403);

        expect(
          mockReservationService.createReservationByDoctor,
        ).not.toHaveBeenCalled();
      });

      it("dovrebbe restituire 401 se il medico non ha entità doctor associata", async () => {
        currentMockUser = { ...MOCK_DOCTOR_USER, doctor: null };

        mockReservationService.createReservationByDoctor.mockImplementation(
          () => {
            throw new UnauthorizedException('You are not a doctor');
          },
        );

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(401);
      });
    });

    describe('Validazione DTO', () => {
      it('dovrebbe restituire 400 se patientId è mancante', async () => {
        currentMockUser = MOCK_DOCTOR_USER;
        const { patientId, ...dtoWithoutPatientId } =
          VALID_DOCTOR_RESERVATION_DTO;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(dtoWithoutPatientId)
          .expect(400);

        expect(
          mockReservationService.createReservationByDoctor,
        ).not.toHaveBeenCalled();
      });

      it('dovrebbe restituire 400 se patientId non è un UUID valido', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send({ ...VALID_DOCTOR_RESERVATION_DTO, patientId: 'not-a-uuid' })
          .expect(400);
      });

      it('dovrebbe restituire 400 se startTime non è una data ISO8601 valida', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send({
            ...VALID_DOCTOR_RESERVATION_DTO,
            startTime: 'data-non-valida',
          })
          .expect(400);
      });

      it('dovrebbe restituire 400 se endTime non è una data ISO8601 valida', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send({
            ...VALID_DOCTOR_RESERVATION_DTO,
            endTime: 'data-non-valida',
          })
          .expect(400);
      });

      it('dovrebbe restituire 400 se visitType non è un valore enum valido', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send({
            ...VALID_DOCTOR_RESERVATION_DTO,
            visitType: 'TIPO_INESISTENTE',
          })
          .expect(400);
      });

      it('dovrebbe restituire 400 se visitType è mancante', async () => {
        currentMockUser = MOCK_DOCTOR_USER;
        const { visitType, ...dtoWithoutVisitType } =
          VALID_DOCTOR_RESERVATION_DTO;

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(dtoWithoutVisitType)
          .expect(400);
      });
    });

    describe('Errori di logica applicativa', () => {
      it('dovrebbe restituire 404 se il paziente non appartiene al medico', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        mockReservationService.createReservationByDoctor.mockImplementation(
          () => {
            throw new NotFoundException(
              'Patient not found or does not belong to this doctor',
            );
          },
        );

        const response = await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(404);

        expect(response.body.message).toContain('Patient not found');
      });

      it('dovrebbe restituire 409 se lo slot è già prenotato', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        mockReservationService.createReservationByDoctor.mockImplementation(
          () => {
            throw new ConflictException('This slot has been booked');
          },
        );

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(409);
      });

      it('dovrebbe restituire 400 se la disponibilità del medico non copre lo slot', async () => {
        currentMockUser = MOCK_DOCTOR_USER;

        mockReservationService.createReservationByDoctor.mockImplementation(
          () => {
            throw new BadRequestException(
              'The reservation must be within an available time slot for the doctor.',
            );
          },
        );

        await request(app.getHttpServer())
          .post('/reservations/for-patient')
          .send(VALID_DOCTOR_RESERVATION_DTO)
          .expect(400);
      });
    });
  });

  // =========================================================================
  // GET /reservations/slots — estensione per il ruolo medico
  // =========================================================================
  describe('GET /reservations/slots', () => {
    const MOCK_SLOTS = [
      {
        startTime: new Date('2026-04-01T08:00:00.000Z'),
        endTime: new Date('2026-04-01T08:30:00.000Z'),
      },
    ];

    it('il medico può richiedere gli slot disponibili (200)', async () => {
      currentMockUser = MOCK_DOCTOR_USER;
      mockReservationService.getReservationSlots.mockResolvedValue(MOCK_SLOTS);

      const response = await request(app.getHttpServer())
        .get('/reservations/slots')
        .query({ date: '2026-04-01', visitType: VisitTypeEnum.CONTROL })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockReservationService.getReservationSlots).toHaveBeenCalledWith(
        MOCK_DOCTOR_USER.doctor,
        expect.any(String),
        VisitTypeEnum.CONTROL,
      );
    });

    it('il paziente può richiedere gli slot disponibili (200) — retro-compatibilità', async () => {
      currentMockUser = MOCK_PATIENT_USER;
      mockReservationService.getReservationSlots.mockResolvedValue(MOCK_SLOTS);

      const response = await request(app.getHttpServer())
        .get('/reservations/slots')
        .query({ date: '2026-04-01', visitType: VisitTypeEnum.CONTROL })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockReservationService.getReservationSlots).toHaveBeenCalledWith(
        MOCK_PATIENT_USER.patient.doctor,
        expect.any(String),
        VisitTypeEnum.CONTROL,
      );
    });

    it('dovrebbe restituire 400 se il paziente non ha un medico assegnato', async () => {
      currentMockUser = {
        ...MOCK_PATIENT_USER,
        patient: { id: 'patient-entity-1', doctor: null },
      };

      await request(app.getHttpServer())
        .get('/reservations/slots')
        .query({ date: '2026-04-01', visitType: VisitTypeEnum.CONTROL })
        .expect(400);
    });

    it('gli slot sono restituiti nel fuso orario Europe/Rome', async () => {
      currentMockUser = MOCK_DOCTOR_USER;
      mockReservationService.getReservationSlots.mockResolvedValue(MOCK_SLOTS);

      const response = await request(app.getHttpServer())
        .get('/reservations/slots')
        .query({ date: '2026-04-01', visitType: VisitTypeEnum.CONTROL })
        .expect(200);

      // La risposta deve contenere l'offset europeo (+02:00 in estate o +01:00 in inverno)
      expect(response.body[0].startTime).toMatch(/\+02:00|\+01:00/);
    });
  });

  // =========================================================================
  // GET /reservations/isFirstVisit — estensione per il ruolo medico
  // =========================================================================
  describe('GET /reservations/isFirstVisit', () => {
    it('il medico con patientId riceve la risposta corretta (200)', async () => {
      currentMockUser = MOCK_DOCTOR_USER;
      mockReservationService.isFirstVisitForDoctor.mockResolvedValue({
        isFirstVisit: true,
      });

      const response = await request(app.getHttpServer())
        .get('/reservations/isFirstVisit')
        .query({ patientId: VALID_DOCTOR_RESERVATION_DTO.patientId })
        .expect(200);

      expect(response.body).toHaveProperty('isFirstVisit', true);
      expect(mockReservationService.isFirstVisitForDoctor).toHaveBeenCalledWith(
        MOCK_DOCTOR_USER.doctor,
        VALID_DOCTOR_RESERVATION_DTO.patientId,
      );
    });

    it('dovrebbe restituire 400 se il medico non fornisce patientId', async () => {
      currentMockUser = MOCK_DOCTOR_USER;

      await request(app.getHttpServer())
        .get('/reservations/isFirstVisit')
        .expect(400);

      expect(mockReservationService.isFirstVisitForDoctor).not.toHaveBeenCalled();
    });

    it('il paziente può verificare la propria prima visita senza patientId (200)', async () => {
      currentMockUser = MOCK_PATIENT_USER;
      mockReservationService.isFirstVisit.mockResolvedValue({
        isFirstVisit: false,
      });

      const response = await request(app.getHttpServer())
        .get('/reservations/isFirstVisit')
        .expect(200);

      expect(response.body).toHaveProperty('isFirstVisit', false);
      expect(mockReservationService.isFirstVisit).toHaveBeenCalledWith(
        MOCK_PATIENT_USER.patient,
      );
    });

    it('dovrebbe restituire 404 se il paziente non appartiene al medico', async () => {
      currentMockUser = MOCK_DOCTOR_USER;

      mockReservationService.isFirstVisitForDoctor.mockImplementation(() => {
        throw new NotFoundException(
          'Patient not found or does not belong to this doctor',
        );
      });

      await request(app.getHttpServer())
        .get('/reservations/isFirstVisit')
        .query({ patientId: VALID_DOCTOR_RESERVATION_DTO.patientId })
        .expect(404);
    });
  });

  // =========================================================================
  // POST /reservations — retro-compatibilità flusso paziente
  // =========================================================================
  describe('POST /reservations — retro-compatibilità flusso paziente', () => {
    it('il paziente può creare una prenotazione (201) con status PENDING', async () => {
      currentMockUser = MOCK_PATIENT_USER;

      mockReservationService.createReservationByPatient.mockResolvedValue({
        id: 'reservation-patient-1',
        status: ReservationStatus.PENDING,
      });

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .send(VALID_PATIENT_RESERVATION_DTO)
        .expect(201);

      expect(response.body.status).toBe(ReservationStatus.PENDING);
      expect(
        mockReservationService.createReservationByPatient,
      ).toHaveBeenCalledWith(
        MOCK_PATIENT_USER.patient.doctor,
        MOCK_PATIENT_USER.patient,
        expect.objectContaining({
          visitType: VALID_PATIENT_RESERVATION_DTO.visitType,
        }),
      );
    });

    it("dovrebbe restituire 403 se il medico tenta di usare il flusso paziente", async () => {
      currentMockUser = MOCK_DOCTOR_USER;

      await request(app.getHttpServer())
        .post('/reservations')
        .send(VALID_PATIENT_RESERVATION_DTO)
        .expect(403);

      expect(
        mockReservationService.createReservationByPatient,
      ).not.toHaveBeenCalled();
    });

    it('il flusso paziente non usa createReservationByDoctor', async () => {
      currentMockUser = MOCK_PATIENT_USER;

      mockReservationService.createReservationByPatient.mockResolvedValue({
        id: 'reservation-patient-1',
        status: ReservationStatus.PENDING,
      });

      await request(app.getHttpServer())
        .post('/reservations')
        .send(VALID_PATIENT_RESERVATION_DTO)
        .expect(201);

      expect(
        mockReservationService.createReservationByDoctor,
      ).not.toHaveBeenCalled();
    });

    it('dovrebbe restituire 400 se il DTO del paziente è invalido (mancano campi)', async () => {
      currentMockUser = MOCK_PATIENT_USER;

      await request(app.getHttpServer())
        .post('/reservations')
        .send({ startTime: '2026-04-01T10:00:00.000Z' }) // mancano endTime e visitType
        .expect(400);
    });
  });
});
