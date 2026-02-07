import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { Doctor } from '../doctor/doctor.entity';
import { User } from '../user/user.entity';
import { NotFoundException } from '@nestjs/common';

const mockPatientRepository = {
    findOne: jest.fn(),
};

const mockDoctorRepository = {
    findOne: jest.fn(),
};

const mockUserRepository = {
    findOne: jest.fn(),
};

describe('PatientService', () => {
    let service: PatientService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PatientService,
                { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
                { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        service = module.get<PatientService>(PatientService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDoctor', () => {
        it('should return doctor info for patient', async () => {
            const mockPatient = { id: 'p1', doctor: { userId: 'd1' } };
            const mockDoctor = { userId: 'd1', user: { id: 'd1', name: 'Dr. House', password: 'pw' } };

            mockPatientRepository.findOne.mockResolvedValue(mockPatient);
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);

            const result = await service.getDoctor('p1');
            expect(result.userId).toBe('d1');
            expect(result.user.name).toBe('Dr. House');
            expect(result.user).not.toHaveProperty('password');
        });

        it('should throw NotFoundException if patient not found', async () => {
            mockPatientRepository.findOne.mockResolvedValue(null);
            await expect(service.getDoctor('p1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if doctor not found', async () => {
            const mockPatient = { id: 'p1', doctor: { userId: 'd1' } };
            mockPatientRepository.findOne.mockResolvedValue(mockPatient);
            mockDoctorRepository.findOne.mockResolvedValue(null);
            await expect(service.getDoctor('p1')).rejects.toThrow(NotFoundException);
        });
    });
});
