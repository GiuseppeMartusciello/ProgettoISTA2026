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
const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
};

const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
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

    describe('checkEmailExists', () => {
        it('should return exist: true if email exists', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });
            const result = await service.checkEmailExists('test@example.com');
            expect(result).toEqual({ exist: true, message: 'Email already used' });
        });

        it('should return exist: false if email does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            const result = await service.checkEmailExists('new@example.com');
            expect(result).toEqual({ exist: false, message: 'Email available' });
        });
    });

    describe('checkPhoneExist', () => {
        it('should return exist: true if phone exists', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1 });
            const result = await service.checkPhoneExist('1234567890');
            expect(result.exist).toBe(true);
        });

        it('should return exist: false if phone does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            const result = await service.checkPhoneExist('1234567890');
            expect(result.exist).toBe(false);
        });
    });

    describe('checkCfExist', () => {
        it('should return exist: true if cf exists', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1 });
            const result = await service.checkCfExist('CF123');
            expect(result.exist).toBe(true);
        });

        it('should return exist: false if cf does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            const result = await service.checkCfExist('CF123');
            expect(result.exist).toBe(false);
        });
    });

    describe('signUp', () => {
        const mockDoctorRegisterDto = {
            email: 'doctor@test.com',
            password: 'password',
            name: 'John',
            surname: 'Doe',
            cf: 'CF123',
            birthDate: new Date(),
            phone: '1234567890',
            gender: 'M',
            address: 'Address',
            city: 'City',
            cap: '12345',
            province: 'PR',
            medicalOffice: 'Office',
            registrationNumber: '12345',
            orderProvince: 'PR',
            orderDate: new Date(),
            orderType: 'Type',
            specialization: 'Spec'
        } as any;
        const mockDeviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

        it('should successfully register a doctor', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null); // User not exists

            mockUserRepository.create.mockReturnValue({ id: 1, ...mockDoctorRegisterDto });
            mockUserRepository.save.mockResolvedValue({ id: 1, ...mockDoctorRegisterDto });

            mockDoctorRepository.create.mockReturnValue({ id: 1 });
            mockDoctorRepository.save.mockResolvedValue({ id: 1 });

            mockSessionRepository.create.mockReturnValue({ id: 1 });
            mockSessionRepository.save.mockResolvedValue({ id: 1 });

            mockJwtService.sign.mockReturnValue('token');

            const result = await service.signUp(mockDoctorRegisterDto, mockDeviceInfo);

            expect(result).toHaveProperty('accessToken');
            expect(result.user).toBeDefined();
            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(mockDoctorRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if user already exists', async () => {
            mockQueryBuilder.getOne.mockResolvedValue({ id: 1 }); // User exists

            await expect(service.signUp(mockDoctorRegisterDto, mockDeviceInfo)).rejects.toThrow(ConflictException);
        });
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

        it('should return tokens for PATIENT', async () => {
            const userPatient: any = { id: 2, email: 'p@p.com', password: 'hash', role: UserRoles.PATIENT, twoFactorEnabled: false };
            mockUserRepository.findOne.mockResolvedValue(userPatient);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockPatientRepository.findOne.mockResolvedValue({ id: 2 });
            mockSessionRepository.create.mockReturnValue({ id: 11 });
            mockSessionRepository.save.mockResolvedValue({ id: 11 });
            mockJwtService.sign.mockReturnValue('mockToken');

            const result: any = await service.signIn({ email: 'p@p.com', password: 'p' }, mockDeviceInfo);

            expect(result).toHaveProperty('accessToken');
            expect(result.user).toBeDefined();
            expect(mockPatientRepository.findOne).toHaveBeenCalled();
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

    describe('refreshToken', () => {
        it('should return new access token', async () => {
            mockJwtService.verify.mockReturnValue({ sessionId: 1, userId: 1 });
            const mockSession = { id: 1, refreshToken: 'hashedToken', user: { id: 1 } };
            mockSessionRepository.findOne.mockResolvedValue(mockSession);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockJwtService.sign.mockReturnValue('newAccessToken');

            const result = await service.refreshToken('validRefreshToken');
            expect(result).toBe('newAccessToken');
        });

        it('should throw Unauthorized if session not found', async () => {
            mockJwtService.verify.mockReturnValue({ sessionId: 1, userId: 1 });
            mockSessionRepository.findOne.mockResolvedValue(null);

            await expect(service.refreshToken('rt')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw Unauthorized if token invalid', async () => {
            mockJwtService.verify.mockReturnValue({ sessionId: 1, userId: 1 });
            mockSessionRepository.findOne.mockResolvedValue({ id: 1, refreshToken: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            await expect(service.refreshToken('rt')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw Unauthorized if token verification fails', async () => {
            mockJwtService.verify.mockImplementation(() => { throw new Error('Invalid'); });
            await expect(service.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should remove session if token valid', async () => {
            mockJwtService.verify.mockReturnValue({ sessionId: 1 });
            const mockSession = { id: 1, refreshToken: 'hash' };
            mockSessionRepository.findOne.mockResolvedValue(mockSession);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            await service.logout('validToken');
            expect(mockSessionRepository.remove).toHaveBeenCalledWith(mockSession);
        });

        it('should throw Unauthorized if session not found', async () => {
            mockJwtService.verify.mockReturnValue({ sessionId: 1 });
            mockSessionRepository.findOne.mockResolvedValue(null);
            await expect(service.logout('token')).rejects.toThrow(UnauthorizedException);
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

        it('should throw Unauthorized if user has no secret (defensive)', async () => {
            const challenge = { challengeId, userId: 1, type: 'LOGIN_2FA', expiresAt: new Date(Date.now() + 10000), attempts: 0, maxAttempts: 5 };
            mockChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue({ id: 1, twoFactorSecret: null }); // No secret

            await expect(service.verify2fa(challengeId, code, deviceInfo)).rejects.toThrow(UnauthorizedException);
            expect(mockChallengeRepository.remove).toHaveBeenCalledWith(challenge);
        });
    });

    describe('generate2faSecret', () => {
        it('should generate secret and return QR code', async () => {
            const user = { id: 1, email: 'test@test.com' };
            mockTwoFactorService.generateSecret.mockReturnValue({ secret: 'S', otpauthUrl: 'url' });

            const result = await service.generate2faSecret(user as any);
            expect(result).toHaveProperty('otpauthUrl');
            expect(mockUserRepository.save).toHaveBeenCalled();
        });
    });

    describe('confirm2fa', () => {
        it('should enable 2fa if code is valid', async () => {
            const user = { id: 1, twoFactorSecretPending: 'pending' } as any;
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(true);

            await service.confirm2fa(user, '123456');

            expect(user.twoFactorEnabled).toBe(true);
            expect(user.twoFactorSecret).toBe('pending');
            expect(user.twoFactorSecretPending).toBeNull();
            expect(mockUserRepository.save).toHaveBeenCalledWith(user);
        });

        it('should throw BadRequest if no pending secret', async () => {
            const user = { id: 1, twoFactorSecretPending: null } as any;
            await expect(service.confirm2fa(user, '123456')).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequest if code invalid', async () => {
            const user = { id: 1, twoFactorSecretPending: 'pending' } as any;
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(false);
            await expect(service.confirm2fa(user, '123456')).rejects.toThrow(BadRequestException);
        });
    });

    describe('disable2fa', () => {
        it('should disable 2fa if code valid', async () => {
            const user = { id: 1, twoFactorEnabled: true, twoFactorSecret: 'secret' } as any;
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(true);

            await service.disable2fa(user, '123456');

            expect(user.twoFactorEnabled).toBe(false);
            expect(user.twoFactorSecret).toBeNull();
            expect(mockUserRepository.save).toHaveBeenCalledWith(user);
        });

        it('should throw BadRequest if 2fa not enabled', async () => {
            const user = { id: 1, twoFactorEnabled: false } as any;
            await expect(service.disable2fa(user, '123456')).rejects.toThrow(BadRequestException);
        });

        it('should throw Unauthorized if code invalid', async () => {
            const user = { id: 1, twoFactorEnabled: true, twoFactorSecret: 'secret' } as any;
            mockTwoFactorService.isTwoFactorCodeValid.mockReturnValue(false);
            await expect(service.disable2fa(user, '123456')).rejects.toThrow(UnauthorizedException);
        });
    });
});
