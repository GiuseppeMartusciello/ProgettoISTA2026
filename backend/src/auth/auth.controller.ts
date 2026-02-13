import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { DoctorRegisterDto } from './dto/doctor-register.dto';

import { DeviceInfo } from './utils/deviceInfo';
import { Request, Response } from 'express';

import { BaseUserInterceptor } from 'src/transform.interceptor';
import { UserItem } from 'src/common/types/userItem';
import { GetUser } from './decorators/get-user.decorator';

import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Get('/check/email/:email')
  async checkEmailExists(@Param('email') email: string) {
    return this.authService.checkEmailExists(email);
  }

  @Get('/check/phone/:phone')
  async checkPhoneExists(@Param('phone') phone: string) {
    return this.authService.checkPhoneExist(phone);
  }

  @Get('/check/cf/:cf')
  async checkCfExists(@Param('cf') cf: string) {
    return this.authService.checkCfExist(cf);
  }

  @UseInterceptors(BaseUserInterceptor)
  @Post('/signup')
  async signUp(
    @Body() authCredentialsDto: DoctorRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserItem> {
    const { accessToken, refreshToken, user } = await this.authService.signUp(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );
    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      });

    return user;
  }

  @UseInterceptors(BaseUserInterceptor)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{user: UserItem ; requires2fa: boolean} | { requires2fa: boolean; challengeId: string }> {
    const result = await this.authService.signIn(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );

    if ('requires2fa' in result) {
      return result;
    }

    const { accessToken, refreshToken, user } = result;

    console.log('REQ Cookies: ', req.cookies);

    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      });

    return {user, requires2fa:false};
  }

  @Post('/logout')
  async logout(@GetUser() user, @Req() req: Request, @Res() res: Response) {
    console.log('Utente che sta facendo il logout:', user);

    console.log('Req Cookie: ', req.cookies);

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    res.clearCookie('jwt');
    res.clearCookie('refreshToken');

    await this.authService.logout(refreshToken);

    return res.status(200).send({ message: 'Logout success' }); // ✅ chiude la response!
  }

  @Post('/2fa/setup')
  async setup2fa(@GetUser() user: UserItem) {
    return this.authService.generate2faSecret(user);
  }

  @Post('/2fa/confirm')
  async confirm2fa(@GetUser() user: UserItem, @Body('code') code: string) {
    return this.authService.confirm2fa(user, code);
  }

  @Post('/2fa/disable')
  async disable2fa(@GetUser() user: UserItem, @Body('code') code: string) {
    return this.authService.disable2fa(user, code);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/2fa/verify')
  async verify2fa(
    @Body('challengeId') challengeId: string,
    @Body('code') code: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!challengeId || !code)
      throw new UnauthorizedException('Missing challengeId or code');

    const result = await this.authService.verify2fa(
      challengeId,
      code,
      this.getDeviceInfo(req),
    );

    res
      .cookie('jwt', result.accessToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      })
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      });

    return result.user;
  }

  private getDeviceInfo(req: Request): DeviceInfo {
    return {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
        'Unknown',
    };
  }
}

