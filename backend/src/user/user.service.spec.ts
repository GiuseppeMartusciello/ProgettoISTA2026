import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Patient } from '../patient/patient.entity';
import { Doctor } from '../doctor/doctor.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserRoles } from '../common/enum/roles.enum';

const mockUserRepository = {
    findOne: jest.fn(),
};

const mockPatientRepository = {
    findOne: jest.fn(),
};

const mockDoctorRepository = {
    findOne: jest.fn(),
};

describe('UserService', () => {
    let service: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
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
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getMe', () => {
        it('should throw BadRequestException if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            await expect(service.getMe('unknown-id')).rejects.toThrow(BadRequestException);
        });

        it('should return patient data if role is PATIENT', async () => {
            const mockUser = { id: 'p1', role: UserRoles.PATIENT, name: 'Peppe' };
            const mockPatient = { id: 'pat1', user: { id: 'p1' } };

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockPatientRepository.findOne.mockResolvedValue(mockPatient);

            const result = await service.getMe('p1');
            expect(result.patient).toEqual(mockPatient);
            expect(result.doctor).toBeUndefined();
        });

        it('should throw UnauthorizedException if patient record missing', async () => {
            const mockUser = { id: 'p1', role: UserRoles.PATIENT };
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockPatientRepository.findOne.mockResolvedValue(null);

            await expect(service.getMe('p1')).rejects.toThrow(UnauthorizedException);
        });

        it('should return doctor data if role is DOCTOR', async () => {
            const mockUser = { id: 'd1', role: UserRoles.DOCTOR, name: 'Doc' };
            const mockDoctor = { id: 'doc1', userId: 'd1' };

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);

            const result = await service.getMe('d1');
            expect(result.doctor).toEqual(mockDoctor);
            expect(result.patient).toBeUndefined();
        });

        it('should throw UnauthorizedException if doctor record missing', async () => {
            const mockUser = { id: 'd1', role: UserRoles.DOCTOR };
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockDoctorRepository.findOne.mockResolvedValue(null);

            await expect(service.getMe('d1')).rejects.toThrow(UnauthorizedException);
        });
    });
});
