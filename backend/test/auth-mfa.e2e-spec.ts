import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { TwoFactorService } from '../src/auth/two-factor.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/user/user.entity';
import { Session } from '../src/session/session.entity';
import { Doctor } from '../src/doctor/doctor.entity';
import { Patient } from '../src/patient/patient.entity';
import { AuthChallenge } from '../src/auth/auth-challenge.entity';
import { UserRoles } from '../src/common/enum/roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BaseUserInterceptor } from '../src/transform.interceptor';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

// Mock Repositories
const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    })),
};

const mockSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

const mockDoctorRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
};

const mockPatientRepository = {
    findOne: jest.fn(),
};

const mockChallengeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
};

describe('Auth MFA (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;

    // Mock Data
    const validPassword = 'password123';
    let hashedPassword = '';

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash(validPassword, 10);
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                AuthService,
                TwoFactorService,
                BaseUserInterceptor,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Session),
                    useValue: mockSessionRepository,
                },
                {
                    provide: getRepositoryToken(Doctor),
                    useValue: mockDoctorRepository,
                },
                {
                    provide: getRepositoryToken(Patient),
                    useValue: mockPatientRepository,
                },
                {
                    provide: getRepositoryToken(AuthChallenge),
                    useValue: mockChallengeRepository,
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(() => 'mock_token'),
                        verify: jest.fn(() => ({ userId: 1, sessionId: 1 })),
                    },
                },
                {
                    provide: ThrottlerGuard,
                    useValue: { canActivate: () => true }, // Bypass throttling
                },
            ],
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        authService = moduleFixture.get<AuthService>(AuthService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/signin', () => {
        it('should return tokens if 2FA is DISABLED', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                password: hashedPassword,
                role: UserRoles.DOCTOR,
                twoFactorEnabled: false,
            };

            mockUserRepository.findOne.mockResolvedValue(user);
            mockDoctorRepository.findOne.mockResolvedValue({ id: 1, userId: 1 });
            mockSessionRepository.create.mockReturnValue({ id: 1 });
            mockSessionRepository.save.mockResolvedValue({ id: 1 });

            const response = await request(app.getHttpServer())
                .post('/auth/signin')
                .send({ email: 'test@example.com', password: validPassword })
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body.requires2fa).toBe(false);
            expect(response.header['set-cookie']).toBeDefined();
        });

        it('should return challenge if 2FA is ENABLED', async () => {
            const user = {
                id: 1,
                email: 'mfa@example.com',
                password: hashedPassword,
                role: UserRoles.DOCTOR,
                twoFactorEnabled: true,
            };

            mockUserRepository.findOne.mockResolvedValue(user);
            mockChallengeRepository.create.mockReturnValue({ challengeId: 'challenge-uuid', userId: 1 });
            mockChallengeRepository.save.mockResolvedValue({});

            const response = await request(app.getHttpServer())
                .post('/auth/signin')
                .send({ email: 'mfa@example.com', password: validPassword })
                .expect(201);

            expect(response.body).toHaveProperty('requires2fa', true);
            expect(response.body.challengeId).toBeDefined();
            expect(typeof response.body.challengeId).toBe('string');
            expect(response.header['set-cookie']).toBeUndefined();
        });
    });

    describe('POST /auth/2fa/verify', () => {
        const challengeId = 'valid-challenge';
        const validCode = '123456';

        it('should return tokens if OTP is valid', async () => {
            const challenge = {
                challengeId,
                userId: 1,
                type: 'LOGIN_2FA',
                expiresAt: new Date(Date.now() + 100000), // Future
                attempts: 0,
                maxAttempts: 5,
            };

            const user = {
                id: 1,
                email: 'mfa@example.com',
                role: UserRoles.DOCTOR,
                twoFactorEnabled: true,
                twoFactorSecret: 'SECRET',
            };

            mockChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue(user);
            mockDoctorRepository.findOne.mockResolvedValue({ id: 1 });
            mockSessionRepository.create.mockReturnValue({ id: 1 });
            mockSessionRepository.save.mockResolvedValue({ id: 1 });

            // Mock authenticator via TwoFactorService spy or mock
            // Since we provided real TwoFactorService in test module but we want to control validation
            // we can spy on the authenticator import if possible, OR spy on the service method prototype
            // But simpler is to mock the check in the e2e integration test by mocking the service method.
            // Wait, in beforeEach I provided TwoFactorService real class.
            // I can overwrite specific method on the instance:
            const twoFactorService = app.get(TwoFactorService);
            jest.spyOn(twoFactorService, 'isTwoFactorCodeValid').mockReturnValue(true);

            const response = await request(app.getHttpServer())
                .post('/auth/2fa/verify')
                .send({ challengeId, code: validCode })
                .expect(201);

            expect(response.body).toHaveProperty('id'); // User object
            expect(response.header['set-cookie']).toBeDefined();
            expect(mockChallengeRepository.remove).toHaveBeenCalledWith(challenge);
        });

        it('should fail if OTP is invalid', async () => {
            const challenge = {
                challengeId,
                userId: 1,
                type: 'LOGIN_2FA',
                expiresAt: new Date(Date.now() + 100000),
                attempts: 0,
                maxAttempts: 5,
            };

            mockChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue({ id: 1, twoFactorSecret: 'SECRET' });

            const twoFactorService = app.get(TwoFactorService);
            jest.spyOn(twoFactorService, 'isTwoFactorCodeValid').mockReturnValue(false);

            await request(app.getHttpServer())
                .post('/auth/2fa/verify')
                .send({ challengeId, code: '000000' })
                .expect(401);

            expect(mockChallengeRepository.save).toHaveBeenCalled(); // Should save incremented attempts
        });
    });
});
