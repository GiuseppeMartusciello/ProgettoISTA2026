import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { authenticator } from 'otplib';

jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: jest.fn(),
        keyuri: jest.fn(),
        verify: jest.fn(),
        options: {},
    },
}));

describe('TwoFactorService', () => {
    let service: TwoFactorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TwoFactorService],
        }).compile();

        service = module.get<TwoFactorService>(TwoFactorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateSecret', () => {
        it('should return secret and otpauthUrl', () => {
            (authenticator.generateSecret as jest.Mock).mockReturnValue('MOCK_SECRET');
            (authenticator.keyuri as jest.Mock).mockReturnValue('otpauth://test');

            const result = service.generateSecret('test@example.com');

            expect(authenticator.generateSecret).toHaveBeenCalled();
            expect(authenticator.keyuri).toHaveBeenCalledWith('test@example.com', 'SymbioCare', 'MOCK_SECRET');
            expect(result).toEqual({ secret: 'MOCK_SECRET', otpauthUrl: 'otpauth://test' });
        });
    });

    describe('isTwoFactorCodeValid', () => {
        it('should return true for valid code', () => {
            (authenticator.verify as jest.Mock).mockReturnValue(true);

            const isValid = service.isTwoFactorCodeValid('123456', 'SECRET');

            expect(authenticator.verify).toHaveBeenCalledWith({ token: '123456', secret: 'SECRET' });
            expect(isValid).toBe(true);
        });

        it('should return false for invalid code', () => {
            (authenticator.verify as jest.Mock).mockReturnValue(false);

            const isValid = service.isTwoFactorCodeValid('000000', 'SECRET');

            expect(isValid).toBe(false);
        });
    });
});
