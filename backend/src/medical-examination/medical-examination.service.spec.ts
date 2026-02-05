import { Test, TestingModule } from '@nestjs/testing';
import { MedicalExaminationService } from './medical-examination.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicalExamination } from './medical-examination.entity';
import { Reservation } from '../reservation/reservation.entity';
import { Doctor } from '../doctor/doctor.entity';
import { NotFoundException } from '@nestjs/common';

describe('MedicalExaminationService', () => {
    let service: MedicalExaminationService;

    const medicalExaminationRepository = {
        save: jest.fn(),
        create: jest.fn(),
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
    };

    const reservationRepository = {
        findOne: jest.fn(),
    };

    const doctorRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MedicalExaminationService,
                { provide: getRepositoryToken(MedicalExamination), useValue: medicalExaminationRepository },
                { provide: getRepositoryToken(Reservation), useValue: reservationRepository },
                { provide: getRepositoryToken(Doctor), useValue: doctorRepository },
            ],
        }).compile();

        service = module.get<MedicalExaminationService>(MedicalExaminationService);
    });

    describe('addMedicalExamination', () => {
        it('should create examination upon valid reservation', async () => {
            const mockReservation = {
                id: 'r1',
                startDate: new Date(),
                doctor: { id: 'd1' },
                patient: { id: 'p1' }
            };
            reservationRepository.findOne.mockResolvedValue(mockReservation);
            medicalExaminationRepository.save.mockResolvedValue({ id: 'm1' });

            const result = await service.addMedicalExamination({} as any, 'r1', { motivation: 'test', note: 'n' });
            expect(result).toEqual({ id: 'm1' });
        });

        it('should throw NotFound if reservation missing', async () => {
            reservationRepository.findOne.mockResolvedValue(null);
            await expect(service.addMedicalExamination({} as any, 'r1', {} as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getMedicalDetections (Examinations)', () => {
        it('should return paginated results', async () => {
            doctorRepository.findOne.mockResolvedValue({ id: 'd1' });

            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([{ id: 1, note: 'n' }]),
            };
            medicalExaminationRepository.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMedicalDetections('u1', 'p1', 10);
            expect(result.data).toHaveLength(1);
        });
    });

});
