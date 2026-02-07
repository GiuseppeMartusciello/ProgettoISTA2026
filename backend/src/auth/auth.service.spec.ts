import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRoles } from '../common/enum/roles.enum';

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

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
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
                    provide: JwtService,
                    useValue: mockJwtService,
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

    describe('signIn', () => {
        const mockCredentials = { email: 'test@test.com', password: 'password123' };
        const mockUser = {
            id: 1,
            email: 'test@test.com',
            password: 'hashedPassword',
            role: UserRoles.DOCTOR
        };
        const mockDeviceInfo = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

        it('should throw UnauthorizedException if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password incorrect', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException if doctor info missing', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1, password: 'hash', role: UserRoles.DOCTOR });
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockDoctorRepository.findOne.mockResolvedValue(null);

            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if patient info missing', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 1, password: 'hash', role: UserRoles.PATIENT });
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockPatientRepository.findOne.mockResolvedValue(null);

            await expect(service.signIn(mockCredentials, mockDeviceInfo)).rejects.toThrow(NotFoundException);
        });

        it('should return tokens and user if credentials valid (Doctor)', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            mockDoctorRepository.findOne.mockResolvedValue({ id: 1, medicalOffice: 'Office' });
            mockSessionRepository.create.mockReturnValue({ id: 10 });
            mockSessionRepository.save.mockResolvedValue({ id: 10 });
            mockJwtService.sign.mockReturnValue('mockToken');

            const result = await service.signIn(mockCredentials, mockDeviceInfo);
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user).toBeDefined();
        });
    });

    describe('refreshToken', () => {
        it('should return new access token', async () => {
            // Mock verify
            mockJwtService.verify.mockReturnValue({ sessionId: 1, userId: 1 });

            // Mock session found
            const mockSession = { id: 1, refreshToken: 'hashedToken', user: { id: 1 } };
            mockSessionRepository.findOne.mockResolvedValue(mockSession);

            // Mock compare token true
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            // Mock sign new token
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
    });
});
