import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
    checkEmailExists: jest.fn(),
    checkPhoneExist: jest.fn(),
    checkCfExist: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    logout: jest.fn(),
};

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('checkEmailExists', () => {
        it('should call authService.checkEmailExists', async () => {
            await controller.checkEmailExists('test@test.com');
            expect(mockAuthService.checkEmailExists).toHaveBeenCalledWith('test@test.com');
        });
    });

    describe('checkPhoneExists', () => {
        it('should call authService.checkPhoneExist', async () => {
            await controller.checkPhoneExists('1234567890');
            expect(mockAuthService.checkPhoneExist).toHaveBeenCalledWith('1234567890');
        });
    });
});
