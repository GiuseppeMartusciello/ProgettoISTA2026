import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserRoles } from '../common/enum/roles.enum';

const mockPatientService = {
    getDoctor: jest.fn(),
};

describe('PatientController', () => {
    let controller: PatientController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PatientController],
            providers: [
                { provide: PatientService, useValue: mockPatientService },
            ],
        }).compile();

        controller = module.get<PatientController>(PatientController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getDoctor', () => {
        it('should throw UnauthorizedException if user has no patient record', async () => {
            const user = { id: 'u1', role: UserRoles.PATIENT, patient: null } as any;
            await expect(controller.getDoctor(user)).rejects.toThrow(UnauthorizedException);
        });

        it('should return doctor info', async () => {
            const user = { id: 'u1', role: UserRoles.PATIENT, patient: { id: 'p1' } } as any;
            const mockDocs = {
                userId: 'd1',
                user: { name: 'Dr. House', surname: 'H' },
                medicalOffice: 'Office'
            };
            mockPatientService.getDoctor.mockResolvedValue(mockDocs);

            const result = await controller.getDoctor(user);
            // Tests serialization implicitly if plainToInstance works or if we just check object structure
            expect(mockPatientService.getDoctor).toHaveBeenCalledWith('p1');
            expect(result.user.name).toBe('Dr. House');
        });
    });
});
