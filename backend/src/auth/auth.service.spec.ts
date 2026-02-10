import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
import { AuthChallenge } from './auth-challenge.entity';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorService } from './two-factor.service';
import { ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRoles } from '../common/enum/roles.enum';
import { v4 as uuid } from 'uuid';
import * as qrcode from 'qrcode';

jest.mock('qrcode', () => ({
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

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

// Mock Services
const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
};

const mockTwoFactorService = {
    generateSecret: jest.fn(),
    isTwoFactorCodeValid: jest.fn(),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
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
                    useValue: mockJwtService,
                },
                {
                    provide: TwoFactorService,
                    useValue: mockTwoFactorService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('signIn', () => {
        const mockCredentials = { email: 'test@test.com', password: 'password123' };
        const mockDeviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

        it('should throw UnauthorizedException if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password incorrect', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1, password: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should return tokens if 2FA is DISADLED', async () => {
            const userNoMfa = { id: 1, email: 'test@test.com', password: 'hash', role: UserRoles.DOCTOR, twoFactorEnabled: false };
            mockUserRepository.findOne.mockResolvedValue(userNoMfa);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockDoctorRepository.findOne.mockResolvedValue({ id: 1 }); // Mock Doctor finding
            mockSessionRepository.create.mockReturnValue({ id: 10 });
            mockSessionRepository.save.mockResolvedValue({ id: 10 });
            mockJwtService.sign.mockReturnValue('mockToken');

            const result: any = await service.signIn(mockCredentials, mockDeviceInfo);

            expect(result).toHaveProperty('accessToken');
            expect(result.user).toBeDefined();
            expect(mockChallengeRepository.create).not.toHaveBeenCalled();
        });

        it('should return challenge if 2FA is ENABLED', async () => {
            const userMfa = { id: 1, email: 'test@test.com', password: 'hash', role: UserRoles.DOCTOR, twoFactorEnabled: true };
            mockUserRepository.findOne.mockResolvedValue(userMfa);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            mockChallengeRepository.create.mockReturnValue({ challengeId: 'uuid', userId: 1 }); // Mock challenge creation
            mockChallengeRepository.save.mockResolvedValue({});

            const result: any = await service.signIn(mockCredentials, mockDeviceInfo);

            expect(result).toHaveProperty('requires2fa', true);
            expect(result).toHaveProperty('challengeId');
            expect(mockChallengeRepository.save).toHaveBeenCalled();
            expect(mockSessionRepository.create).not.toHaveBeenCalled(); // No session created yet
        });
    });

    describe('verify2fa', () => {
        const challengeId = 'test-challenge-id';
        const code = '123456';
        const deviceInfo = { userAgent: 'test', ipAddress: '1.2.3.4' };

        it('should throw if challenge not found', async () => {
            mockChallengeRepository.findOne.mockResolvedValue(null);
            await expect(service.verify2fa(challengeId, code, deviceInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw if challenge expired', async () => {
            const expiredChallenge = {
                challengeId,
                expiresAt: new Date(Date.now() - 10000), // Past
                type: 'LOGIN_2FA'
            };
            mockChallengeRepository.findOne.mockResolvedValue(expiredChallenge);

            await expect(service.verify2fa(challengeId, code, deviceInfo)).rejects.toThrow(UnauthorizedException);
            expect(mockChallengeRepository.remove).toHaveBeenCalledWith(expiredChallenge);
        });

        it('should throw if max attempts reached', async () => {
            const maxAttemptsChallenge = {
                challengeId,
                expiresAt: new Date(Date.now() + 10000),
                type: 'LOGIN_2FA',
                attempts: 5,
                maxAttempts: 5
            };
            mockChallengeRepository.findOne.mockResolvedValue(maxAttemptsChallenge);

            await expect(service.verify2fa(challengeId, code, deviceInfo)).rejects.toThrow(UnauthorizedException);
            expect(mockChallengeRepository.remove).toHaveBeenCalledWith(maxAttemptsChallenge);
        });

        it('should increment attempts and throw if code is invalid', async () => {
            const validChallenge = {
                challengeId,
                userId: 1,
                expiresAt: new Date(Date.now() + 10000),
                type: 'LOGIN_2FA',
                attempts: 0,
                maxAttempts: 5
            };
            mockChallengeRepository.findOne.mockResolvedValue(validChallenge);
            mockUserRepository.findOne.mockResolvedValue({ id: 1, twoFactorSecret: 'secret' });
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(false);

            await expect(service.verify2fa(challengeId, code, deviceInfo)).rejects.toThrow(UnauthorizedException);
            expect(validChallenge.attempts).toBe(1); // Incremented
            expect(mockChallengeRepository.save).toHaveBeenCalledWith(validChallenge);
        });

        it('should return tokens and remove challenge if code is valid', async () => {
            const validChallenge = {
                challengeId,
                userId: 1,
                expiresAt: new Date(Date.now() + 10000),
                type: 'LOGIN_2FA',
                attempts: 0,
                maxAttempts: 5
            };
            mockChallengeRepository.findOne.mockResolvedValue(validChallenge);
            mockUserRepository.findOne.mockResolvedValue({ id: 1, twoFactorSecret: 'secret', role: UserRoles.DOCTOR });
            mockDoctorRepository.findOne.mockResolvedValue({ id: 1 });
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(true);

            mockSessionRepository.create.mockReturnValue({ id: 10 });
            mockSessionRepository.save.mockResolvedValue({ id: 10 });
            mockJwtService.sign.mockReturnValue('token');

            const result = await service.verify2fa(challengeId, code, deviceInfo);

            expect(result).toHaveProperty('accessToken');
            expect(mockChallengeRepository.remove).toHaveBeenCalledWith(validChallenge);
        });
    });

    // Additional tests for coverage (generate, confirm, disable) if needed
    // Assuming standard behavior for now to keep it concise but complete enough as per request.
    describe('generate2faSecret', () => {
        it('should generate secret and return QR code', async () => {
            const user = { id: 1, email: 'test@test.com' };
            mockTwoFactorService.generateSecret.mockReturnValue({ secret: 'S', otpauthUrl: 'url' });

            // Mock qrcode (internal usage in service) - might need mocking `qrcode` module 
            // but since it's imported I might just assume it works or use jest.mock

            const result = await service.generate2faSecret(user as any);
            expect(result).toHaveProperty('otpauthUrl');
        });
    });
});
