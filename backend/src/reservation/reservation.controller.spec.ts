import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { UserRoles } from '../common/enum/roles.enum';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockReservationService = {
    getReservations: jest.fn(),
    createReservation: jest.fn(),
    acceptReservation: jest.fn(),
    declineReservation: jest.fn(),
    getReservationSlots: jest.fn(),
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
        it('should call service.createReservation', async () => {
            const user = { id: 'u1', role: UserRoles.PATIENT, patient: { doctor: { id: 'd1' } } } as any;
            const body = { startTime: '2023-01-01' } as any;

            await controller.createReservation(user, body);
            expect(mockReservationService.createReservation).toHaveBeenCalled();
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
});
