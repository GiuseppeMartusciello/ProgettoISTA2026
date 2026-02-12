import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dto/jtw-payload.interface';
import { DoctorRegisterDto } from './dto/doctor-register.dto';
import { TokensDto } from './dto/tokens.dto';
import { RefreshDto } from './dto/refresh.dto';
import { User } from 'src/user/user.entity';
import { Session } from 'src/session/session.entity';
import { DeviceInfo } from './utils/deviceInfo';
import { Doctor } from 'src/doctor/doctor.entity';
import { LogoutDto } from './dto/logout.dto';
import { UserRoles } from 'src/common/enum/roles.enum';
import { UserItem } from 'src/common/types/userItem';
import { addDays, addMinutes } from 'date-fns';
import { Patient } from 'src/patient/patient.entity';
import { AuthChallenge } from './auth-challenge.entity';
import { TwoFactorService } from './two-factor.service';
import { v4 as uuid } from 'uuid';
import * as qrcode from 'qrcode';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserItem;
}

interface TwoFactorResponse {
  requires2fa: true;
  challengeId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(AuthChallenge)
    private readonly challengeRepository: Repository<AuthChallenge>,

    private readonly twoFactorService: TwoFactorService,

    private jwtService: JwtService,
  ) { }

  async checkEmailExists(email: string) {
    const exist = await this.userRepository.findOne({
      where: { email: email },
    });

    return {
      exist: !!exist,
      message: exist ? 'Email already used' : 'Email available',
    };
  }
  async checkPhoneExist(phone: string) {
    const exist = await this.userRepository.findOne({
      where: { phone: phone },
    });

    return {
      exist: !!exist,
      message: exist ? 'Phone already used' : 'Phone available',
    };
  }
  async checkCfExist(cf: string) {
    const exist = await this.userRepository.findOne({
      where: { cf: cf },
    });

    return {
      exist: !!exist,
      message: exist ? 'CF already used' : 'CF available',
    };
  }

  async signUp(
    info: DoctorRegisterDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    const existingUser = await this.findUser(info.email, info.phone, info.cf);
    console.log('Utente esistente: ', existingUser);
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await this.hashPassword(info.password);

    const doctor = await this.createUserDoctor(info, hashedPassword);
    await this.createDoctorInfo(info, doctor);

    const session = await this.createSession(doctor, deviceInfo);

    const tokens: TokensDto = await this.generateTokens({
      userId: doctor.id,
      sessionId: session.id,
    });

    session.refreshToken = await this.hashToken(tokens.refreshToken);
    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: doctor,
    };
  }

  async signIn(
    credentials: AuthCredentialsDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse | TwoFactorResponse> {
    const { email, password } = credentials;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA login check
    if (user.twoFactorEnabled) {
      const challengeId = uuid();
      const challenge = this.challengeRepository.create({
        challengeId,
        userId: user.id,
        type: 'LOGIN_2FA',
        expiresAt: addMinutes(new Date(), 5),
        attempts: 0,
        maxAttempts: 5,
      });
      await this.challengeRepository.save(challenge);
      return { requires2fa: true, challengeId };
    }

    return this.completeLogin(user, deviceInfo);
  }

  private async completeLogin(user: User, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    let finalUser: UserItem = user;
    if (user.role === UserRoles.DOCTOR) {
      const doctor = await this.doctorRepository.findOne({
        where: { userId: user.id },
      });

      if (!doctor) throw new NotFoundException("Doctor's info not found");

      finalUser.doctor = doctor;
    } else {
      const patient = await this.patientRepository.findOne({
        where: { user: user },
      });

      if (!patient) throw new NotFoundException("Patient's info not found");

      finalUser.patient = patient;
    }

    const session = await this.createSession(user, deviceInfo);

    const tokens: TokensDto = await this.generateTokens({
      userId: user.id,
      sessionId: session.id,
    });

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    session.refreshToken = hashedRefreshToken;
    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: finalUser,
    };
  }

  async verify2fa(challengeId: string, code: string, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    const challenge = await this.challengeRepository.findOne({ where: { challengeId } });

    if (!challenge) {
      // Simulate verification to prevent timing attacks? Or just generic error
      throw new UnauthorizedException('Invalid challenge or code');
    }

    if (challenge.type !== 'LOGIN_2FA' || challenge.expiresAt < new Date()) {
      await this.challengeRepository.remove(challenge);
      throw new UnauthorizedException('Challenge expired or invalid');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.challengeRepository.remove(challenge);
      throw new UnauthorizedException('Too many attempts');
    }

    const user = await this.userRepository.findOne({
      where: { id: challenge.userId },
    });
    // Ensure twoFactorSecret is present and verify
    if (!user || !user.twoFactorSecret) {
      await this.challengeRepository.remove(challenge);
      throw new UnauthorizedException('User 2FA not properly configured'); // Should not happen if logic is correct
    }

    const isValid = this.twoFactorService.isTwoFactorCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isValid) {
      challenge.attempts += 1;
      await this.challengeRepository.save(challenge);
      throw new UnauthorizedException('Invalid code');
    }

    // Success
    await this.challengeRepository.remove(challenge);
    return this.completeLogin(user, deviceInfo);
  }

  async generate2faSecret(user: User) {
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(
      user.email,
    );
    const qrPngBase64 = await qrcode.toDataURL(otpauthUrl);

    user.twoFactorSecretPending = secret;
    await this.userRepository.save(user);

    return { otpauthUrl, qrPngBase64 };
  }

  async confirm2fa(user: User, code: string) {
    if (!user.twoFactorSecretPending) {
      throw new BadRequestException('No pending 2FA setup found');
    }

    const isValid = this.twoFactorService.isTwoFactorCodeValid(
      code,
      user.twoFactorSecretPending,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid code');
    }

    user.twoFactorSecret = user.twoFactorSecretPending;
    user.twoFactorSecretPending = null;
    user.twoFactorEnabled = true;

    await this.userRepository.save(user);

    return { enabled: true };
  }

  async disable2fa(user: User, code: string) {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    // Verify code against current secret
    // Note: Reusing the same service which uses the same window options
    const isValid = this.twoFactorService.isTwoFactorCodeValid(
      code,
      user.twoFactorSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid code');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorSecretPending = null;


    await this.userRepository.save(user);
    return { message: '2FA disabled' };
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const payload = this.verifyToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
      relations: ['user'],
    });

    if (
      !session ||
      !(await this.isRefreshTokenValid(refreshToken, session.refreshToken))
    ) {
      throw new UnauthorizedException();
    }

    const cleanPayload = {
      userId: payload.userId,
      sessionId: payload.sessionId,
    };

    const accessToken: string = await this.jwtService.sign(cleanPayload, {
      expiresIn: '15m',
    });

    return accessToken;
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.verifyToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
    });

    if (
      !session ||
      !(await this.isRefreshTokenValid(refreshToken, session.refreshToken))
    ) {
      throw new UnauthorizedException();
    }

    await this.sessionRepository.remove(session);
  }

  private async hashPassword(password: string) {
    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error('There is a problem to hash the password');
    }
  }

  private async hashToken(token: string) {
    try {
      const salt = await bcrypt.genSalt();
      return bcrypt.hash(token, salt);
    } catch (err) {
      throw new Error('There is a problem to hashToken');
    }
  }

  private async findUser(email: string, phone: string, cf: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email OR user.phone = :phone OR user.cf = :cf', {
        email,
        phone,
        cf,
      })
      .getOne();
  }

  private async createUserDoctor(
    info: DoctorRegisterDto,
    hashedPassword: string,
  ): Promise<User> {
    const user = this.userRepository.create({
      email: info.email,
      password: hashedPassword,
      name: info.name,
      surname: info.surname,
      cf: info.cf,
      birthDate: info.birthDate,
      phone: info.phone,
      gender: info.gender,
      address: info.address,
      city: info.city,
      cap: info.cap,
      province: info.province,
      role: UserRoles.DOCTOR,
    });

    return this.userRepository.save(user);
  }

  private async createDoctorInfo(
    info: DoctorRegisterDto,
    user: User,
  ): Promise<Doctor> {
    const doctor = this.doctorRepository.create({
      medicalOffice: info.medicalOffice,
      registrationNumber: info.registrationNumber,
      orderProvince: info.orderProvince,
      orderDate: info.orderDate,
      orderType: info.orderType,
      specialization: info.specialization,
      user: user,
    });

    return this.doctorRepository.save(doctor);
  }

  private async createSession(
    user: User,
    deviceInfo: DeviceInfo,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      user: user,
      createdAt: new Date(),
      expiresAt: addDays(new Date(), 14),
      deviceInfo: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
    });

    return this.sessionRepository.save(session);
  }

  private async generateTokens(payload: JwtPayload): Promise<TokensDto> {
    const accessToken: string = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken: string = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private verifyToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify(refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async isRefreshTokenValid(
    token: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }
}
