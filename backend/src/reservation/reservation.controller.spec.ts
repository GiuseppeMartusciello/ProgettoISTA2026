import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { UserRoles } from '../common/enum/roles.enum';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockReservationService = {
    getReservations: jest.fn(),
    createReservationByPatient: jest.fn(),
    createReservationByDoctor: jest.fn(),
    acceptReservation: jest.fn(),
    declineReservation: jest.fn(),
    getReservationSlots: jest.fn(),
    getPastReservationsPatient: jest.fn(),
    getHowManyPendingReservations: jest.fn(),
    getNextReservations: jest.fn(),
    isFirstVisit: jest.fn(),
    isFirstVisitForDoctor: jest.fn(),
    getReservationsPatient: jest.fn(),
};

describe('ReservationController', () => {
    let controller: ReservationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReservationController],
            providers: [
                {
                    provide: ReservationService,
                    useValue: mockReservationService,
                },
            ],
        }).compile();

        controller = module.get<ReservationController>(ReservationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createReservation', () => {
        it('should call service.createReservationByPatient', async () => {
            const user = { id: 'u1', role: UserRoles.PATIENT, patient: { doctor: { id: 'd1' } } } as any;
            const body = { startTime: '2023-01-01' } as any;

            await controller.createReservation(user, body);
            expect(mockReservationService.createReservationByPatient).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if not patient', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR, patient: null } as any;
            await expect(controller.createReservation(user, {} as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('acceptReservation', () => {
        it('should call service.acceptReservation', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR, doctor: { id: 'd1' } } as any;
            await controller.acceptReservation(user, 'r1');
            expect(mockReservationService.acceptReservation).toHaveBeenCalledWith('r1', user.doctor);
        });
    });

    describe('getReservations', () => {
        it('should return reservations for doctor', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await controller.getReservations(user, new Date(), new Date(), 'ALL' as any);
            expect(mockReservationService.getReservations).toHaveBeenCalled();
        });

        it('should throw Unauthorized if not doctor', async () => {
            const user = { doctor: null } as any;
            await expect(controller.getReservations(user, new Date(), new Date(), 'ALL' as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getPastReservationsPatient', () => {
        it('should return past reservations for patient', async () => {
            const user = { patient: { doctor: { userId: 'd1' } } } as any;
            await controller.getPastReservationsPatient(user, 'ALL' as any);
            expect(mockReservationService.getPastReservationsPatient).toHaveBeenCalled();
        });

        it('should throw Unauthorized if not patient', async () => {
            await expect(controller.getPastReservationsPatient({} as any, 'ALL' as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getHowManyPendingReservations', () => {
        it('should return count for doctor', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await controller.getHowManyPendingReservations(user);
            expect(mockReservationService.getHowManyPendingReservations).toHaveBeenCalledWith(user.doctor);
        });

        it('should throw Unauthorized if not doctor', async () => {
            await expect(controller.getHowManyPendingReservations({} as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('createReservationForPatient', () => {
        it('should call service.createReservationByDoctor', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            const dto = { some: 'data' } as any;
            await controller.createReservationForPatient(user, dto);
            expect(mockReservationService.createReservationByDoctor).toHaveBeenCalledWith(user.doctor, dto);
        });

        it('should throw Unauthorized if not doctor', async () => {
            await expect(controller.createReservationForPatient({} as any, {} as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('rejectReservation', () => {
        it('should call service.declineReservation', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await controller.rejectReservation(user, 'r1');
            expect(mockReservationService.declineReservation).toHaveBeenCalledWith('r1', user.doctor);
        });

        it('should throw Unauthorized if not doctor', async () => {
            await expect(controller.rejectReservation({} as any, 'r1')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getSlots', () => {
        it('should work for doctor', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            mockReservationService.getReservationSlots.mockResolvedValue([]);
            await controller.getSlots(user, '2023-01-01');
            expect(mockReservationService.getReservationSlots).toHaveBeenCalled();
        });

        it('should work for patient', async () => {
            const user = { patient: { doctor: { userId: 'd1' } } } as any;
            mockReservationService.getReservationSlots.mockResolvedValue([]);
            await controller.getSlots(user, '2023-01-01');
            expect(mockReservationService.getReservationSlots).toHaveBeenCalled();
        });

        it('should throw BadRequest if patient has no doctor', async () => {
            const user = { patient: {} } as any;
            await expect(controller.getSlots(user, '2023-01-01')).rejects.toThrow(BadRequestException);
        });
    });

    describe('getNestReservations', () => {
        it('should call service', async () => {
            const user = { patient: {} } as any;
            await controller.getNestReservations(user);
            expect(mockReservationService.getNextReservations).toHaveBeenCalledWith(user);
        });
    });

    describe('isFirstVisit', () => {
        it('should work for doctor with patientId', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await controller.isFirstVisit(user, 'p1');
            expect(mockReservationService.isFirstVisitForDoctor).toHaveBeenCalledWith(user.doctor, 'p1');
        });

        it('should throw BadRequest if doctor provides no patientId', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await expect(controller.isFirstVisit(user)).rejects.toThrow(BadRequestException);
        });

        it('should work for patient', async () => {
            const user = { patient: { id: 'p1' } } as any;
            await controller.isFirstVisit(user);
            expect(mockReservationService.isFirstVisit).toHaveBeenCalledWith(user.patient);
        });
    });
    describe('getReservationsPatient (Doctor)', () => {
        it('should return reservations for doctor', async () => {
            const user = { doctor: { userId: 'd1' } } as any;
            await controller.getReservationsPatient(user, 'p1', 1, 10, '');
            expect(mockReservationService.getReservationsPatient).toHaveBeenCalledWith(user.doctor, 'p1', 1, 10, '');
        });

        it('should throw Unauthorized if not doctor', async () => {
            const user = { doctor: null } as any;
            await expect(controller.getReservationsPatient(user, 'p1', 1, 10, '')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('createReservation Edge Cases', () => {
        it('should throw BadRequest if patient has no doctor', async () => {
            const user = { patient: { doctor: null } } as any;
            await expect(controller.createReservation(user, {} as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getSlots Edge Cases', () => {
        it('should throw Unauthorized if user has no role', async () => {
            const user = {} as any;
            await expect(controller.getSlots(user, '2023-01-01')).rejects.toThrow(UnauthorizedException);
        });
    });
});

