import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { Availability } from '../availability/availability.entity';
import { VisitType } from './visit-type.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationStatus } from './types/reservation-status-enum';
import { VisitTypeEnum } from './types/visit-type.enum';

const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    clone: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
});

describe('ReservationService', () => {
    let service: ReservationService;
    let reservationRepo: any;
    let availabilityRepo: any;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Define repositories with factory for QueryBuilder
        module = await Test.createTestingModule({
            providers: [
                ReservationService,
                {
                    provide: getRepositoryToken(Reservation),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    }
                },
                {
                    provide: getRepositoryToken(Availability),
                    useValue: {
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                    }
                },
                {
                    provide: getRepositoryToken(VisitType),
                    useValue: { findOne: jest.fn() }
                },
            ],
        }).compile();

        service = module.get<ReservationService>(ReservationService);
        reservationRepo = module.get(getRepositoryToken(Reservation));
        availabilityRepo = module.get(getRepositoryToken(Availability));
    });

    describe('createReservation', () => {
        const mockDoctor = { userId: 'd1' } as any;
        const mockPatient = { id: 'p1' } as any;
        const mockVisitType = { name: VisitTypeEnum.CONTROL, durationMinutes: 30 };
        const validDto = {
            startTime: new Date('2023-01-01T10:00:00.000Z'),
            endTime: new Date('2023-01-01T10:30:00.000Z'),
            visitType: VisitTypeEnum.CONTROL,
        };

        it('should create reservation successfully', async () => {
            // Setup VisitType
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);

            // Setup Availability QB
            // We need to control what createQueryBuilder returns specifically for this test
            const availQB = createMockQueryBuilder();
            availQB.getMany.mockResolvedValue([]); // logging
            availQB.getOne.mockResolvedValue({ id: 'avail1' }); // valid availability found
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            // Setup Reservation existing checks
            reservationRepo.findOne.mockResolvedValue(null); // No existing visits/bookings
            reservationRepo.create.mockReturnValue({ id: 'r1', ...validDto, visitType: mockVisitType });
            reservationRepo.save.mockResolvedValue({ id: 'r1', visitType: mockVisitType });

            const result = await service.createReservation(mockDoctor, mockPatient, validDto as any);
            expect(result).toBeDefined();
            expect(reservationRepo.save).toHaveBeenCalled();
        });

        it('should fail if duration mismatches visit type', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue({ ...mockVisitType, durationMinutes: 60 });

            await expect(service.createReservation(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(BadRequestException);
        });

        it('should fail if slot is already booked', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);

            // Mock findOne to return existing reservation when checking ensureSlotNotBooked
            // ensureSlotNotBooked is called AFTER checkExistOtherVisits and checkVisitDuration
            // The service calls findOne twice: once for isFirstVisit (checkExistOtherVisits), once for ensureSlotNotBooked

            reservationRepo.findOne
                .mockResolvedValueOnce({ id: 'booked' }); // ensureSlotNotBooked

            await expect(service.createReservation(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(ConflictException);
        });

        it('should fail if no valid availability found', async () => {
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue(mockVisitType);
            reservationRepo.findOne.mockResolvedValue(null);

            const availQB = createMockQueryBuilder();
            availQB.getOne.mockResolvedValue(null); // No availability
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            await expect(service.createReservation(mockDoctor, mockPatient, validDto as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getReservationSlots', () => {
        it('should generate slots correctly', async () => {
            const doc = { userId: 'd1' } as any;
            const visitTypeRepoMock = module.get(getRepositoryToken(VisitType));
            visitTypeRepoMock.findOne.mockResolvedValue({ durationMinutes: 30 });

            const availQB = createMockQueryBuilder();
            availQB.getMany.mockResolvedValue([{ startTime: new Date('2023-01-01T10:00:00Z'), endTime: new Date('2023-01-01T11:00:00Z') }]);
            availabilityRepo.createQueryBuilder.mockReturnValue(availQB);

            const resQB = createMockQueryBuilder();
            // Mock confirmed reservations
            resQB.getMany.mockResolvedValue([{ startDate: new Date('2023-01-01T10:30:00Z'), endDate: new Date('2023-01-01T11:00:00Z'), status: ReservationStatus.CONFIRMED }]);
            reservationRepo.createQueryBuilder.mockReturnValue(resQB);

            const slots = await service.getReservationSlots(doc, '2023-01-01', VisitTypeEnum.CONTROL);

            expect(slots).toHaveLength(1);
            expect(slots[0].startTime.toISOString()).toContain('10:00');
        });
    });

    describe('acceptReservation', () => {
        it('should confirm pending reservation', async () => {
            const mockRes = { id: 'r1', status: ReservationStatus.PENDING, doctor: { userId: 'd1' }, startDate: new Date(), endDate: new Date() };

            const qb = createMockQueryBuilder();
            qb.getOne
                .mockResolvedValueOnce(mockRes) // getPending
                .mockResolvedValueOnce(null); // checkConflict (no overlap)

            reservationRepo.createQueryBuilder.mockReturnValue(qb);
            reservationRepo.save.mockImplementation(val => Promise.resolve(val));

            const result = await service.acceptReservation('r1', { userId: 'd1' } as any);
            expect(result.status).toBe(ReservationStatus.CONFIRMED);
        });

        it('should throw ConflictException if overlap', async () => {
            const mockRes = { id: 'r1', status: ReservationStatus.PENDING, doctor: { userId: 'd1' }, startDate: new Date(), endDate: new Date() };
            const qb = createMockQueryBuilder();
            qb.getOne
                .mockResolvedValueOnce(mockRes) // getPending
                .mockResolvedValueOnce({ id: 'overlap' }); // checkConflict found one

            reservationRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.acceptReservation('r1', { userId: 'd1' } as any))
                .rejects.toThrow(ConflictException);
        });
    });
});
