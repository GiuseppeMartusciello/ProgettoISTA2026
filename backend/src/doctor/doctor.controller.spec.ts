import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { UserRoles } from '../common/enum/roles.enum';

const mockDoctorService = {
    getPatients: jest.fn(),
    getPatientById: jest.fn(),
    getDoctorByUserId: jest.fn(),
    updatePatient: jest.fn(),
    deletePatient: jest.fn(),
};

describe('DoctorController', () => {
    let controller: DoctorController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DoctorController],
            providers: [
                {
                    provide: DoctorService,
                    useValue: mockDoctorService,
                },
            ],
        }).compile();

        controller = module.get<DoctorController>(DoctorController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getPatients', () => {
        it('should call service.getPatients', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR } as any;
            await controller.getPatients(user, 1, 10, 'search');
            expect(mockDoctorService.getPatients).toHaveBeenCalledWith('u1', 1, 10, 'search');
        });
    });

    describe('getPatientById', () => {
        it('should call service.getPatientById', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR } as any;
            await controller.getPatientById(user, 'p1');
            expect(mockDoctorService.getPatientById).toHaveBeenCalledWith('p1');
        });
    });

    describe('updatePatient', () => {
        it('should call service.updatePatient', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR } as any;
            const dto = { name: 'New' };
            await controller.updatePatient(user, 'p1', dto);
            expect(mockDoctorService.updatePatient).toHaveBeenCalledWith('u1', 'p1', dto);
        });
    });

    describe('deletePatient', () => {
        it('should call service.deletePatient', async () => {
            const user = { id: 'u1', role: UserRoles.DOCTOR } as any;
            await controller.deletePatient(user, 'p1');
            expect(mockDoctorService.deletePatient).toHaveBeenCalledWith('u1', 'p1');
        });
    });
});
