import { Test, TestingModule } from '@nestjs/testing';
import { MedicalDetectionService } from './medical-detection.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicalDetection } from './medical-detection.entity';
import { Patient } from '../patient/patient.entity';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { MedicalDetectionQueryFilter } from './medical-detection.controller';

describe('MedicalDetectionService', () => {
    let service: MedicalDetectionService;

    const medicalDetectionRepository = {
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const patientRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MedicalDetectionService,
                { provide: getRepositoryToken(MedicalDetection), useValue: medicalDetectionRepository },
                { provide: getRepositoryToken(Patient), useValue: patientRepository },
            ],
        }).compile();

        service = module.get<MedicalDetectionService>(MedicalDetectionService);
    });

    describe('getMedicalDetections', () => {
        it('should return detections logic', async () => {
            patientRepository.findOne.mockResolvedValue({ id: 'p1' });

            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'd1', value: 10 }], 1]),
            };
            medicalDetectionRepository.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getMedicalDetections('p1', MedicalDetectionQueryFilter.ALL);
            expect(result.total).toBe(1);
            expect(result.detections[0].value).toBe(10);
        });

        it('should throw NotFoundException if patient invalid', async () => {
            patientRepository.findOne.mockResolvedValue(null);
            await expect(service.getMedicalDetections('p1', MedicalDetectionQueryFilter.ALL)).rejects.toThrow(NotFoundException);
        });
    });

    describe('postMedicalDetection', () => {
        it('should save detection', async () => {
            const user = { patient: { id: 'p1' } };
            const dto = { type: 'ECG', value: 100, date: new Date() };

            medicalDetectionRepository.create.mockReturnValue(dto);
            medicalDetectionRepository.save.mockResolvedValue(dto);

            const result = await service.postMedicalDetection(user as any, dto as any);
            expect(result.message).toBeDefined();
        });

        it('should throw Unauthorized if not patient', async () => {
            await expect(service.postMedicalDetection({} as any, {} as any)).rejects.toThrow(UnauthorizedException);
        });
    });

});
