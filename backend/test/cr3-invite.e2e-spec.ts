import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DoctorController } from '../src/doctor/doctor.controller';
import { DoctorService } from '../src/doctor/doctor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/user/user.entity';
import { Patient } from '../src/patient/patient.entity';
import { Doctor } from '../src/doctor/doctor.entity';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRoles } from '../src/common/enum/roles.enum';
import { JwtService } from '@nestjs/jwt';

// Mock CodiceFiscale to bypass real CF checks during e2e testing
jest.mock('codice-fiscale-js', () => ({
    check: jest.fn().mockReturnValue(true),
}));

// Mock Nodemailer to prevent real emails being sent during tests
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue(true),
    })),
}));

describe('CR3 - Invite e2e (Invite Flow)', () => {
    let app: INestApplication;

    // Mock Repositories
    let mockUserRepository: any;
    let mockPatientRepository: any;
    let mockDoctorRepository: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const queryBuilderMock = {
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        mockUserRepository = {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({ id: 'new-user-id', ...dto })),
            save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'new-user-id', ...user })),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
        };

        mockPatientRepository = {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({ id: 'new-patient-id', ...dto })),
            save: jest.fn().mockImplementation((patient) => Promise.resolve({ id: 'new-patient-id', ...patient })),
            remove: jest.fn(),
        };

        mockDoctorRepository = {
            findOne: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [DoctorController],
            providers: [
                DoctorService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Patient),
                    useValue: mockPatientRepository,
                },
                {
                    provide: getRepositoryToken(Doctor),
                    useValue: mockDoctorRepository,
                },
                // In case auth module or guards try to use it
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                        verify: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(RolesGuard)
            .useValue({
                canActivate: (context: any) => {
                    // Bypassing RolesGuard and pretending user is logged in as DOCTOR
                    const req = context.switchToHttp().getRequest();
                    req.user = { id: 'doctor-user-id', role: UserRoles.DOCTOR };
                    return true;
                },
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    const validInviteDto = {
        email: 'newpatient@example.com',
        cf: 'RSSMRA80A01H501Z',
        phone: '3331234567',
        name: 'Mario',
        surname: 'Rossi',
        birthDate: '1980-01-01',
        gender: 'Uomo',
        address: 'Via Roma 1',
        city: 'Roma',
        cap: '00100',
        province: 'RM',
        weight: 75,
        height: 180,
        bloodType: 'A+',
        level: 'ADVANCED',
        sport: 'Calcio',
        pathologies: [],
        medications: [],
        injuries: [],
    };

    describe('POST /doctor/invite (CR3 Flow)', () => {
        it('should successfully create an invite (patient + user) and send email', async () => {
            // 1. Doctor verification
            mockDoctorRepository.findOne.mockResolvedValue({
                id: 'doctor-id',
                userId: 'doctor-user-id',
            });

            // 2. Ensuring findUser (called inside createInvite to check uniqueness) returns null (user does not exist)
            mockUserRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null); // findUser before creating Patient
            mockUserRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null); // findUser before creating User

            // 3. Ensuring assignPatientToUser works
            // It will look for the successfully created patient matching this doctor to link the user
            mockPatientRepository.findOne.mockResolvedValue({
                id: 'new-patient-id',
                doctor: { userId: 'doctor-user-id' },
            });

            const response = await request(app.getHttpServer())
                .post('/doctor/invite')
                .send(validInviteDto)
                .expect(201);

            // Verify the response
            expect(response.body).toHaveProperty('patientId');
            expect(response.body.patientId).toBe('new-patient-id');

            // Verify repository operations were executed as per CR3 flow
            expect(mockPatientRepository.create).toHaveBeenCalled();
            expect(mockPatientRepository.save).toHaveBeenCalled();
            expect(mockUserRepository.create).toHaveBeenCalled();
            expect(mockUserRepository.save).toHaveBeenCalled();

            // Ensure the generated User object has generated fields e.g., role PATIENT and mustChangePassword
            const savedUserArgument = mockUserRepository.save.mock.calls[0][0];
            expect(savedUserArgument.role).toBe(UserRoles.PATIENT);
            expect(savedUserArgument.mustChangePassword).toBe(true);
            expect(savedUserArgument.password).toBeDefined(); // Password MUST be generated and hashed
        });

        it('should return 400 Bad Request if user already exists', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({
                id: 'doctor-id',
                userId: 'doctor-user-id',
            });

            // Simulating constraint failure (user already in system with same CF/email/phone)
            mockUserRepository.createQueryBuilder().getOne.mockResolvedValue({
                id: 'existing-conflict-user',
                email: validInviteDto.email,
                cf: validInviteDto.cf,
            });

            const response = await request(app.getHttpServer())
                .post('/doctor/invite')
                .send(validInviteDto)
                .expect(400);

            expect(response.body.message).toBe('Tale paziente già esiste');

            // Verify it did NOT proceed with creating anything
            expect(mockPatientRepository.create).not.toHaveBeenCalled();
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });

        it('should return 500 / Error if doctor is not found (Invalid state)', async () => {
            // Mock scenario where the authenticated user isn't actually a doctor in DB
            mockDoctorRepository.findOne.mockResolvedValue(null);

            const response = await request(app.getHttpServer())
                .post('/doctor/invite')
                .send(validInviteDto)
                .expect(500);

            expect(response.body.message).toBe('Internal server error');
        });

        it('should return 400 if validation fails (e.g. missing required fields)', async () => {
            const invalidDto = {
                email: 'not-an-email',
            };

            const response = await request(app.getHttpServer())
                .post('/doctor/invite')
                .send(invalidDto)
                .expect(400);

            // We expect automatic ValidationPipe constraints to trigger
            expect(response.body.message).toBeInstanceOf(Array);
            expect(response.body.error).toBe('Bad Request');
        });
    });
});
