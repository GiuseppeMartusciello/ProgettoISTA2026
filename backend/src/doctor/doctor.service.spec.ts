import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from '../patient/patient.entity';
import { User } from '../user/user.entity';

import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';

const mockDoctorRepository = {
    findOne: jest.fn(),
};

const mockPatientRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
};



describe('DoctorService', () => {
    let service: DoctorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DoctorService,
                { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepository },
                { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },

            ],
        }).compile();

        service = module.get<DoctorService>(DoctorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDoctorByUserId', () => {
        it('should return doctor info', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'u1', name: 'Doc' });
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1', medicalOffice: 'Office' });

            const result = await service.getDoctorByUserId('u1');
            expect(result.userId).toBe('u1');
            expect(result.user.name).toBe('Doc');
        });

        it('should throw Error if doctor not found', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'u1' });
            mockDoctorRepository.findOne.mockResolvedValue(null);
            await expect(service.getDoctorByUserId('u1')).rejects.toThrow('Doctor not found');
        });
    });

    describe('getPatients', () => {
        it('should return paginated patients', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'u1' });
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });

            mockPatientRepository.find.mockResolvedValue([
                { id: 'p1', user: { id: 'pu1', name: 'Mario', password: 'xx' } },
                { id: 'p2', user: { id: 'pu2', name: 'Luigi' } }
            ]);

            const result = await service.getPatients('u1', 1, 10, '');
            expect(result.total).toBe(2);
            expect(result.data[0].user.name).toBe('Mario');
            expect(result.data[1].user.name).toBe('Luigi');
        });
    });

    describe('updatePatient', () => {
        it('should throw Forbidden if patient belongs to another doctor', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue({
                id: 'p1',
                doctor: { userId: 'other-doc' }
            });

            await expect(service.updatePatient('u1', 'p1', {})).rejects.toThrow(ForbiddenException);
        });

        it('should update patient and user', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            const mockPatient = {
                id: 'p1',
                doctor: { userId: 'u1' },
                user: { id: 'pu1', name: 'Old' }
            };
            mockPatientRepository.findOne.mockResolvedValue(mockPatient);
            mockUserRepository.findOne.mockResolvedValue(mockPatient.user); // update user logic
            mockPatientRepository.save.mockResolvedValue({});
            mockUserRepository.save.mockResolvedValue({});

            // Mock getPatientById for return
            // We need to spy on getPatientById or just mock the repo calls again for it.
            // getPatientById calls patientRepository.findOne again.
            mockPatientRepository.findOne
                .mockResolvedValueOnce(mockPatient) // for updatePatient find
                .mockResolvedValueOnce(mockPatient); // for getPatientById

            await service.updatePatient('u1', 'p1', { name: 'New' });
            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(mockPatientRepository.save).toHaveBeenCalled();
        });
    });

    describe('deletePatient', () => {
        it('should delete patient', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', doctor: { userId: 'u1' } });

            await service.deletePatient('u1', 'p1');

            expect(mockPatientRepository.remove).toHaveBeenCalled();
        });
    });
});
