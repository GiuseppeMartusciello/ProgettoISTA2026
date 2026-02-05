import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRoles } from '../common/enum/roles.enum';

const mockUserService = {
    getMe: jest.fn(),
};

describe('UserController', () => {
    let controller: UserController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        controller = module.get<UserController>(UserController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getMe', () => {
        it('should call userService.getMe', async () => {
            const mockUser = { id: 'u1', role: UserRoles.PATIENT };
            await controller.getMe(mockUser, {});
            expect(mockUserService.getMe).toHaveBeenCalledWith('u1');
        });
    });
});
