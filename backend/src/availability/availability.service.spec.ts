import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Availability } from './availability.entity';
import { Doctor } from '../doctor/doctor.entity';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('AvailabilityService', () => {
    let service: AvailabilityService;

    // Mocks
    const availabilityRepository = {
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const doctorRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AvailabilityService,
                { provide: getRepositoryToken(Availability), useValue: availabilityRepository },
                { provide: getRepositoryToken(Doctor), useValue: doctorRepository },
            ],
        }).compile();

        service = module.get<AvailabilityService>(AvailabilityService);
    });

    describe('createAvailability', () => {
        it('should create availability if valid and no overlap', async () => {
            const dto = { title: 'Test', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z' };
            const doctorId = 'd1';

            doctorRepository.findOne.mockResolvedValue({ id: 'doc1', userId: 'u1' });

            // Mock overlaps check -> no result (getOne returns null)
            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                setParameters: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };
            availabilityRepository.createQueryBuilder.mockReturnValue(qb);

            availabilityRepository.create.mockReturnValue({ id: 'a1' });
            availabilityRepository.save.mockResolvedValue({ id: 'a1' });

            const result = await service.createAvailability(dto as any, doctorId);
            expect(result).toBeDefined();
            expect(availabilityRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if overlapping', async () => {
            const dto = { title: 'Test', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z' };
            doctorRepository.findOne.mockResolvedValue({ id: 'doc1', userId: 'u1' });

            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                setParameters: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ id: 'overlap' }),
            };
            availabilityRepository.createQueryBuilder.mockReturnValue(qb);

            await expect(service.createAvailability(dto as any, 'd1')).rejects.toThrow(ConflictException);
        });
    });

    describe('getAvailabilities', () => {
        it('should return grouped availabilities', async () => {
            const doctor = { userId: 'u1' } as any;
            const start = new Date();
            const end = new Date();

            const dbSlots = [
                { id: '1', startTime: new Date('2026-01-01T10:00:00Z'), endTime: new Date('2026-01-01T11:00:00Z') }
            ];

            const qb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(dbSlots),
            };
            availabilityRepository.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getAvailabilities(doctor, start, end);
            expect(result).toBeInstanceOf(Array);
            // Expect to find key 2026-01-01
            const group = result.find(g => g.date === '2026-01-01');
            expect(group).toBeDefined();
            // Use optional chaining or exclamation mark
            expect(group!.slots).toHaveLength(1);
        });
    });

    describe('deleteAvailability', () => {
        it('should delete if exists', async () => {
            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ id: 'a1' }),
            };
            availabilityRepository.createQueryBuilder.mockReturnValue(qb);
            availabilityRepository.remove.mockResolvedValue(true);

            await service.deleteAvailability({ id: 'u1' } as any, 'a1');
            expect(availabilityRepository.remove).toHaveBeenCalled();
        });

        it('should throw BadRequest if not found', async () => {
            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };
            availabilityRepository.createQueryBuilder.mockReturnValue(qb);

            await expect(service.deleteAvailability({ id: 'u1' } as any, 'a1')).rejects.toThrow(BadRequestException);
        });
    });

});
