import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { Availability } from '../availability/availability.entity';
import { Patient } from '../patient/patient.entity';

import { VisitType } from './visit-type.entity';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ReservationStatus } from './types/reservation-status-enum';
import { VisitTypeEnum } from './types/visit-type.enum';

const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndMapOne: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    clone: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
});

describe('ReservationService', () => {
    let service: ReservationService;
    let reservationRepo: any;
    let availabilityRepo: any;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Define repositories with factory for QueryBuilder
        module = await Test.createTestingModule({
            providers: [
                ReservationService,
                {
                    provide: getRepositoryToken(Reservation),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    }
                },
                {
                    provide: getRepositoryToken(Availability),
                    useValue: {
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    }
                },
                {
                    provide: getRepositoryToken(VisitType),
                    useValue: { findOne: jest.fn() }
                },
                {
                    provide: getRepositoryToken(Patient),
                    useValue: {
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    }
                },

            ],
        }).compile();

        service = module.get<ReservationService>(ReservationService);
        reservationRepo = module.get(getRepositoryToken(Reservation));
        availabilityRepo = module.get(getRepositoryToken(Availability));
    });

    describe('createReservation', () => {
        const mockDoctor = { userId: 'd1' } as any;
        const mockPatient = { id: 'p1' } as any;
        const mockVisitType = { name: VisitTypeEnum.CONTROL, durationMinutes: 30 };
        const validDto = {
            startTime: new Date('2023-01-01T10:00:00.000Z'),
            endTime: new Date('2023-01-01T10:30:00.000Z'),
            visitType: VisitTypeEnum.CONTROL,
        };

        it('should create reservation successfully', async () => {
            // Setup VisitType
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);

            // Setup Availability QB
            // We need to control what createQueryBuilder returns specifically for this test
            const availQB = createMockQueryBuilder();
            availQB.getMany.mockResolvedValue([]); // logging
            availQB.getOne.mockResolvedValue({ id: 'avail1' }); // valid availability found
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            // Setup Reservation existing checks
            reservationRepo.findOne.mockResolvedValue(null); // No existing visits/bookings
            reservationRepo.create.mockReturnValue({ id: 'r1', ...validDto, visitType: mockVisitType });
            reservationRepo.save.mockResolvedValue({ id: 'r1', visitType: mockVisitType });

            const result = await service.createReservationByPatient(mockDoctor, mockPatient, validDto as any);
            expect(result).toBeDefined();
            expect(reservationRepo.save).toHaveBeenCalled();
        });

        it('should fail if duration mismatches visit type', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue({ ...mockVisitType, durationMinutes: 60 });

            await expect(service.createReservationByPatient(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(BadRequestException);
        });

        it('should fail if slot is already booked', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);

            // Mock findOne to return existing reservation when checking ensureSlotNotBooked
            // ensureSlotNotBooked is called AFTER checkExistOtherVisits and checkVisitDuration
            // The service calls findOne twice: once for isFirstVisit (checkExistOtherVisits), once for ensureSlotNotBooked

            reservationRepo.findOne
                .mockResolvedValueOnce({ id: 'booked' }); // ensureSlotNotBooked

            await expect(service.createReservationByPatient(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(ConflictException);
        });

        it('should fail if no valid availability found', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);
            reservationRepo.findOne.mockResolvedValue(null);

            const availQB = createMockQueryBuilder();
            availQB.getOne.mockResolvedValue(null); // No availability
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            await expect(service.createReservationByPatient(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getReservationSlots', () => {
        it('should generate slots correctly', async () => {
            const doc = { userId: 'd1' } as any;
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue({ durationMinutes: 30 });

            const availQB = createMockQueryBuilder();
            availQB.getMany.mockResolvedValue([{ startTime: new Date('2023-01-01T10:00:00Z'), endTime: new Date('2023-01-01T11:00:00Z') }]);
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            const resQB = createMockQueryBuilder();
            // Mock confirmed reservations
            resQB.getMany.mockResolvedValue([{ startDate: new Date('2023-01-01T10:30:00Z'), endDate: new Date('2023-01-01T11:00:00Z'), status: ReservationStatus.CONFIRMED }]);
            reservationRepo.createQueryBuilder.mockReturnValue(resQB);

            const slots = await service.getReservationSlots(doc, '2023-01-01', VisitTypeEnum.CONTROL);

            expect(slots).toHaveLength(1);
            expect(slots[0].startTime.toISOString()).toContain('10:00');
        });
    });

    describe('acceptReservation', () => {
        it('should confirm pending reservation', async () => {
            const mockRes = { id: 'r1', status: ReservationStatus.PENDING, doctor: { userId: 'd1' }, startDate: new Date(), endDate: new Date() };

            const qb = createMockQueryBuilder();
            qb.getOne
                .mockResolvedValueOnce(mockRes) // getPending
                .mockResolvedValueOnce(null); // checkConflict (no overlap)

            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            reservationRepo.save.mockImplementation(val => Promise.resolve(val));

            const result = await service.acceptReservation('r1', { userId: 'd1' } as any);
            expect(result.status).toBe(ReservationStatus.CONFIRMED);
        });

        it('should throw ConflictException if overlap', async () => {
            const mockRes = { id: 'r1', status: ReservationStatus.PENDING, doctor: { userId: 'd1' }, startDate: new Date(), endDate: new Date() };
            const qb = createMockQueryBuilder();
            qb.getOne
                .mockResolvedValueOnce(mockRes) // getPending
                .mockResolvedValueOnce({ id: 'overlap' }); // checkConflict found one

            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.acceptReservation('r1', { userId: 'd1' } as any))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('isFirstVisit', () => {
        it('should return true if no previous reservation', async () => {
            reservationRepo.findOne.mockResolvedValue(null);
            const result = await service.isFirstVisit({ id: 'p1' } as any);
            expect(result.isFirstVisit).toBe(true);
        });

        it('should return false if previous reservation exists', async () => {
            reservationRepo.findOne.mockResolvedValue({ id: 'r1' });
            const result = await service.isFirstVisit({ id: 'p1' } as any);
            expect(result.isFirstVisit).toBe(false);
        });
    });

    describe('isFirstVisitForDoctor', () => {
        const mockDoctor = { userId: 'd1' } as any;

        it('should throw NotFound if patient not belonging to doctor', async () => {
            const patientRepo = module.get(getRepositoryToken(Patient));
            patientRepo.findOne.mockResolvedValue(null);
            await expect(service.isFirstVisitForDoctor(mockDoctor, 'p1')).rejects.toThrow(NotFoundException);
        });

        it('should call isFirstVisit if patient found', async () => {
            const patientRepo = module.get(getRepositoryToken(Patient));
            patientRepo.findOne.mockResolvedValue({ id: 'p1', doctor: { userId: 'd1' } });
            reservationRepo.findOne.mockResolvedValue(null);

            const result = await service.isFirstVisitForDoctor(mockDoctor, 'p1');
            expect(result.isFirstVisit).toBe(true);
        });
    });

    describe('getNextReservations', () => {
        it('should return mapped reservations for patient', async () => {
            const mockUser = { patient: { id: 'p1' } } as any;
            const mockRes = [
                { id: 'r1', createdAt: new Date(), startDate: new Date(), endDate: new Date(), status: ReservationStatus.CONFIRMED, visitType: { name: 'CONTROL' } }
            ];

            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue(mockRes);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getNextReservations(mockUser);
            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result![0].id).toBe('r1');
        });

        it('should throw Unauthorized if no patient in user', async () => {
            await expect(service.getNextReservations({} as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getHowManyPendingReservations', () => {
        it('should return count', async () => {
            reservationRepo.count.mockResolvedValue(5);
            const result = await service.getHowManyPendingReservations({ userId: 'd1' } as any);
            expect(result.total).toBe(5);
        });
    });

    describe('getPastReservationsPatient', () => {
        it('should map reservation status correctly', async () => {
            const mockRes = [{
                id: 'r1',
                startDate: new Date(),
                endDate: new Date(),
                createdAt: new Date(),
                status: ReservationStatus.CONFIRMED,
                visitType: { name: 'CONTROL' }
            }];
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue(mockRes);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getPastReservationsPatient({ userId: 'd1' } as any, 'CONFIRMED', { id: 'p1' } as any);
            expect(result).toHaveLength(1);
            expect(result[0].status).toBe(ReservationStatus.CONFIRMED);
        });

        it('should handle ALL status', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([]);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            const result = await service.getPastReservationsPatient({ userId: 'd1' } as any, 'ALL', { id: 'p1' } as any);
            expect(result).toBeDefined();
        });
    });

    describe('getReservationsPatient', () => {
        it('should return paginated result', async () => {
            const mockRes = [{
                id: 'r1',
                startDate: new Date(),
                endDate: new Date(),
                createdAt: new Date(),
                status: ReservationStatus.CONFIRMED,
                visitType: { name: 'CONTROL' }
            }];
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue(mockRes);
            qb.getCount.mockResolvedValue(10);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getReservationsPatient({ userId: 'd1' } as any, 'p1', 1, 10, '');
            expect(result.total).toBe(10);
            expect(result.reservations).toHaveLength(1);
        });
    });

    describe('getReservations (Doctor Dashboard)', () => {
        it('should group reservations by date', async () => {
            const today = new Date().toISOString();
            const mockRes = [{
                id: 'r1',
                startDate: new Date(today),
                endDate: new Date(today),
                createdAt: new Date(),
                status: ReservationStatus.CONFIRMED,
                visitType: { name: 'CONTROL' },
                patient: { id: 'p1', user: { name: 'Mario', surname: 'Rossi' } }
            }];

            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue(mockRes);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getReservations({ userId: 'd1' } as any, 'CONFIRMED', new Date(), new Date());
            const dateKey = today.split('T')[0];

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].date).toBe(dateKey);
            expect(result[0].reservations[0].patient.name).toBe('Mario');
        });


    });

    describe('getReservationsByDay', () => {
        it('should return reservations for specific day', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([{ id: 'r1' }]);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getReservationsByDay('d1', new Date());
            expect(result).toHaveLength(1);
        });
    });

    describe('createReservationByDoctor', () => {
        const mockDoctor = { userId: 'd1' } as any;
        const validDto = {
            startTime: new Date('2023-01-01T10:00:00.000Z'),
            endTime: new Date('2023-01-01T10:30:00.000Z'),
            visitType: VisitTypeEnum.CONTROL,
            patientId: 'p1'
        };

        it('should create confirmed reservation', async () => {
            const patientRepo = module.get(getRepositoryToken(Patient));
            patientRepo.findOne.mockResolvedValue({ id: 'p1' });

            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue({ name: VisitTypeEnum.CONTROL, durationMinutes: 30 });

            const availQB = createMockQueryBuilder();
            availQB.getOne.mockResolvedValue({ id: 'a1' });
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            reservationRepo.findOne.mockResolvedValue(null);
            reservationRepo.save.mockResolvedValue({ id: 'r1', status: ReservationStatus.CONFIRMED });

            const result = await service.createReservationByDoctor(mockDoctor, validDto as any);
            expect(result.status).toBe(ReservationStatus.CONFIRMED);
        });

        it('should throw NotFound if patient not found', async () => {
            const patientRepo = module.get(getRepositoryToken(Patient));
            patientRepo.findOne.mockResolvedValue(null);
            await expect(service.createReservationByDoctor(mockDoctor, validDto as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('declineReservation', () => {
        it('should decline pending reservation', async () => {
            const mockRes = { id: 'r1', status: ReservationStatus.PENDING, doctor: { userId: 'd1' } };
            const qb = createMockQueryBuilder();
            qb.getOne.mockResolvedValue(mockRes);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            reservationRepo.save.mockImplementation(val => Promise.resolve(val));

            const result = await service.declineReservation('r1', { userId: 'd1' } as any);
            expect(result.status).toBe(ReservationStatus.DECLINED);
        });

        it('should throw BadRequest if reservation not found', async () => {
            const qb = createMockQueryBuilder();
            qb.getOne.mockResolvedValue(null);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.declineReservation('r1', { userId: 'd1' } as any)).rejects.toThrow(BadRequestException);
        });
    });


    describe('Service Edge Cases', () => {
        describe('getNextReservations', () => {
            it('should throw NotFound if getMany returns null/empty', async () => {
                const qb = createMockQueryBuilder();
                qb.getMany.mockResolvedValue(null); // Force null to test "if (!reservations)"
                reservationRepo.createQueryBuilder.mockReturnValue(qb);
                // If getMany returns null, "if (!reservations)" throws NotFound.
                // If Typescript prevents null, we cast or force it.
                await expect(service.getNextReservations({ patient: { id: 'p1' } } as any)).rejects.toThrow(NotFoundException);
            });
        });

        describe('getPastReservationsPatient', () => {
            it('should filter PENDING', async () => {
                const qb = createMockQueryBuilder();
                qb.getMany.mockResolvedValue([]);
                reservationRepo.createQueryBuilder.mockReturnValue(qb);
                await service.getPastReservationsPatient({ userId: 'u1' } as any, 'PENDING', { id: 'p1' } as any);
                expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('r.status = :status'), { status: ReservationStatus.PENDING });
            });

            it('should filter DECLINED', async () => {
                const qb = createMockQueryBuilder();
                qb.getMany.mockResolvedValue([]);
                reservationRepo.createQueryBuilder.mockReturnValue(qb);
                await service.getPastReservationsPatient({ userId: 'u1' } as any, 'DECLINED', { id: 'p1' } as any);
                expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('r.status = :status'), { status: ReservationStatus.DECLINED });
            });
        });

        describe('createReservationByPatient FIRST_VISIT', () => {
            it('should fail if previous visit exists', async () => {
                const doctor = { id: 'd1', userId: 'd1' } as any;
                const patient = { id: 'p1' } as any;
                const dto = {
                    startTime: new Date(),
                    endTime: new Date(),
                    visitType: VisitTypeEnum.FIRST_VISIT
                };

                const visitTypeRepo = module.get(getRepositoryToken(VisitType));
                visitTypeRepo.findOne.mockResolvedValue({ name: VisitTypeEnum.FIRST_VISIT });

                // Mock checkExistOtherVisits -> findOne returns a reservation
                reservationRepo.findOne.mockResolvedValue({ id: 'existing' });

                await expect(service.createReservationByPatient(doctor, patient, dto as any)).rejects.toThrow(BadRequestException);
            });

            it('should succeed if no previous visit', async () => {
                const doctor = { id: 'd1', userId: 'd1' } as any;
                const patient = { id: 'p1' } as any;
                const dto = {
                    startTime: new Date('2023-01-01T10:00:00.000Z'),
                    endTime: new Date('2023-01-01T10:30:00.000Z'),
                    visitType: VisitTypeEnum.FIRST_VISIT
                };

                const visitTypeRepo = module.get(getRepositoryToken(VisitType));
                visitTypeRepo.findOne.mockResolvedValue({ name: VisitTypeEnum.FIRST_VISIT, durationMinutes: 30 });

                // Availability check
                const availQB = createMockQueryBuilder();
                availQB.getOne.mockResolvedValue({ id: 'a1' });
                availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

                // ensureSlotNotBooked
                const bookedQB = createMockQueryBuilder();
                bookedQB.getOne.mockResolvedValue(null);
                // We need to differentiate createQueryBuilder calls?
                // createReservationCore calls:
                // 1. checkVisitDuration (no repos)
                // 2. checkExistOtherVisits -> reservationRepo.findOne
                // 3. ensureSlotNotBooked -> reservationRepo.createQueryBuilder
                // 4. findValidAvailabilityOrThrow -> availabilityRepo.createQueryBuilder

                // Mock findOne for checkExistOtherVisits to return null (no prev visit)
                reservationRepo.findOne.mockResolvedValue(null);

                // Mock createQueryBuilder for ensureSlotNotBooked
                const resQB = createMockQueryBuilder();
                resQB.getOne.mockResolvedValue(null); // locked slot logic
                reservationRepo.createQueryBuilder.mockReturnValue(resQB);

                reservationRepo.save.mockResolvedValue({ id: 'new', status: ReservationStatus.PENDING });

                const result = await service.createReservationByPatient(doctor, patient, dto as any);
                expect(result.status).toBe(ReservationStatus.PENDING);
            });
        });

        describe('acceptReservation Edge Cases', () => {
            it('should throw BadRequest if reservation not found', async () => {
                const qb = createMockQueryBuilder();
                qb.getOne.mockResolvedValue(null);
                reservationRepo.createQueryBuilder.mockReturnValue(qb);
                await expect(service.acceptReservation('r1', { userId: 'd1' } as any)).rejects.toThrow(BadRequestException);
            });
        });
    });

    describe('Final Edge Cases', () => {
        it('should handle getReservations with ALL status', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([]);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            await service.getReservations({ userId: 'd1' } as any, 'ALL', new Date(), new Date());
            expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('r.status != :status'), { status: ReservationStatus.DECLINED });
        });

        it('should throw BadRequest for invalid date in getReservationSlots', async () => {
            await expect(service.getReservationSlots({} as any, 'invalid-date', VisitTypeEnum.CONTROL)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequest for invalid visit type in getReservationSlots', async () => {
            const visitTypeRepo = module.get(getRepositoryToken(VisitType));
            visitTypeRepo.findOne.mockResolvedValue(null);
            await expect(service.getReservationSlots({} as any, '2023-01-01', 'INVALID' as any)).rejects.toThrow(BadRequestException);
        });
        it('should use default page/limit in getReservationsPatient', async () => {
            const qb = createMockQueryBuilder();
            qb.getMany.mockResolvedValue([]);
            qb.getCount.mockResolvedValue(0);
            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            await service.getReservationsPatient({ userId: 'd1' } as any, 'p1', undefined, undefined, '');
            expect(qb.skip).toHaveBeenCalledWith(0); // (1-1)*12 = 0
            expect(qb.take).toHaveBeenCalledWith(12);
        });
    });
});
