import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class TwoFactorService {
    constructor() {
        authenticator.options = { window: 1 }; // window +/- 1 step (30s * 1 = +/- 30s tolerance)
    }

    generateSecret(userEmail: string) {
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(userEmail, 'SymbioCare', secret);
        return { secret, otpauthUrl };
    }

    isTwoFactorCodeValid(twoFactorCode: string, userSecret: string): boolean {
        return authenticator.verify({
            token: twoFactorCode,
            secret: userSecret,
        });
    }
}
