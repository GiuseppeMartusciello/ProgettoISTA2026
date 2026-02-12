import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
    checkEmailExists: jest.fn(),
    checkPhoneExist: jest.fn(),
    checkCfExist: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    logout: jest.fn(),
    generate2faSecret: jest.fn(),
    confirm2fa: jest.fn(),
    disable2fa: jest.fn(),
    verify2fa: jest.fn(),
};

const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (body?, cookies?, headers?) => ({
    body,
    cookies: cookies || {},
    headers: headers || {},
}) as any;

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
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => {
        jest.clearAllMocks();
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

    describe('checkCfExists', () => {
        it('should call authService.checkCfExist', async () => {
            await controller.checkCfExists('CF123');
            expect(mockAuthService.checkCfExist).toHaveBeenCalledWith('CF123');
        });
    });

    describe('signUp', () => {
        it('should sign up user and set cookies', async () => {
            const dto = { email: 'test@test.com' } as any;
            const res = mockResponse();
            const req = mockRequest();

            mockAuthService.signUp.mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
                user: { id: 1 }
            });

            const result = await controller.signUp(dto, req, res);

            expect(mockAuthService.signUp).toHaveBeenCalled();
            expect(res.cookie).toHaveBeenCalledTimes(2); // accessToken + refreshToken
            expect(result).toEqual({ id: 1 });
        });
    });

    describe('signIn', () => {
        it('should sign in (no MFA) and set cookies', async () => {
            const dto = { email: 'test@test.com', password: 'p' };
            const req = mockRequest();
            const res = mockResponse();

            mockAuthService.signIn.mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
                user: { id: 1 }
            });

            const result = await controller.signIn(dto, req, res);

            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ user: { id: 1 }, requires2fa: false });
        });

        it('should sign in (MFA enabled) and return challenge without cookies', async () => {
            const dto = { email: 'test@test.com', password: 'p' };
            const req = mockRequest();
            const res = mockResponse();

            mockAuthService.signIn.mockResolvedValue({
                requires2fa: true,
                challengeId: 'uuid'
            });

            const result = await controller.signIn(dto, req, res);

            expect(res.cookie).not.toHaveBeenCalled();
            expect(result).toEqual({ requires2fa: true, challengeId: 'uuid' });
        });
    });

    describe('logout', () => {
        const user = { id: 1 };

        it('should clear cookies and call logout service', async () => {
            const req = mockRequest(null, { refreshToken: 'rt' });
            const res = mockResponse();

            await controller.logout(user, req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('jwt');
            expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(mockAuthService.logout).toHaveBeenCalledWith('rt');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should throw Unauthorized if no refresh token', async () => {
            const req = mockRequest(null, {}); // No cookies
            const res = mockResponse();

            await expect(controller.logout(user, req, res)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('2fa endpoints', () => {
        const user = { id: 1 } as any;

        it('setup2fa should call service', async () => {
            await controller.setup2fa(user);
            expect(mockAuthService.generate2faSecret).toHaveBeenCalledWith(user);
        });

        it('confirm2fa should call service', async () => {
            await controller.confirm2fa(user, '123456');
            expect(mockAuthService.confirm2fa).toHaveBeenCalledWith(user, '123456');
        });

        it('disable2fa should call service', async () => {
            await controller.disable2fa(user, '123456');
            expect(mockAuthService.disable2fa).toHaveBeenCalledWith(user, '123456');
        });
    });

    describe('verify2fa', () => {
        it('should verify 2fa and set cookies', async () => {
            const req = mockRequest();
            const res = mockResponse();
            mockAuthService.verify2fa.mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
                user: { id: 1 }
            });

            const result = await controller.verify2fa('challenge', 'code', req, res);

            expect(mockAuthService.verify2fa).toHaveBeenCalledWith('challenge', 'code', expect.any(Object));
            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ id: 1 });
        });

        it('should throw Unauthorized if params missing', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await expect(controller.verify2fa('', '', req, res)).rejects.toThrow(UnauthorizedException);
        });
    });
});
