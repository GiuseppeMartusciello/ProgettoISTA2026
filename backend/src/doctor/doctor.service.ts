import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UserRoles } from '../common/enum/roles.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Repository } from 'typeorm';
import { Patient } from 'src/patient/patient.entity';
import { User } from 'src/user/user.entity';
import { UserItem } from 'src/common/types/userItem';
import { PatientItem } from 'src/common/types/patientItem';

import { DoctorItem, UserWithoutPassword } from 'src/common/types/doctorItem';
import { PatientsResponse } from 'src/patient/types/patients-response.interface';
import { take } from 'rxjs';
import { UpdatePatientDto } from 'src/auth/dto/update-patient.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async getDoctorByUserId(userId: string): Promise<DoctorItem> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor || !user) {
      throw new Error('Doctor not found');
    }

    if (doctor.user) doctor.user.password = '';

    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      cf: user.cf,
      birthDate: user.birthDate,
      gender: user.gender,
      phone: user.phone,
      role: user.role,
      address: user.address,
      city: user.city,
      cap: user.cap,
      province: user.province,
    };

    const doctorItem: DoctorItem = {
      userId: doctor.userId,
      specialization: doctor.specialization,
      medicalOffice: doctor.medicalOffice,
      registrationNumber: doctor.registrationNumber,
      orderProvince: doctor.orderProvince,
      orderDate: doctor.orderDate,
      orderType: doctor.orderType,
      user: userWithoutPassword,
    };

    return doctorItem;
  }

  async getPatients(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
  ): Promise<PatientsResponse> {
    const doctor = await this.getDoctorOrThrow(userId);

    const allPatients = await this.patientRepository.find({
      where: { doctor: { userId: doctor.userId } },
      relations: ['user'],
    });

    const mapped = allPatients.map((patient): PatientItem => {
      const user = patient.user;
      let safeUser: any = null;

      if (user) {
        const { password, ...rest } = user;
        safeUser = rest;
      }

      return {
        id: patient.id,
        user: safeUser,
        weight: patient.weight,
        height: patient.height,
        bloodType: patient.bloodType,
        level: patient.level,
        sport: patient.sport,
        pathologies: patient.pathologies,
        medications: patient.medications,
        injuries: patient.injuries,
      };
    });
    // console.log('Search:', `{ ${search} }`);




    const filtered =
      search && search !== ''
        ? mapped.filter((p) => {
          const user = p.user;
          if (!user) return false;

          const searchLower = search.toLowerCase();
          return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.surname?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.cf?.toLowerCase().includes(searchLower)
          );
        })
        : mapped;

    const startIndex = (page - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);

    const valid = filtered.filter((p) => p.user != null);

    return {
      data: valid.slice(startIndex, endIndex),
      total: valid.length, // ← Questo è il fix principale!
      page,
      limit,
      hasMore: endIndex < filtered.length,
    };
  }

  async getPatientById(patientId: string): Promise<PatientItem> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user'],
    });

    if (!patient) throw new BadRequestException("Patient doesn't exist.");

    let safeUser: any = null;
    if (patient.user) {
      const { password, ...rest } = patient.user;
      safeUser = rest;
    }

    return {
      id: patient.id,
      user: safeUser,
      weight: patient.weight,
      height: patient.height,
      bloodType: patient.bloodType,
      level: patient.level,
      sport: patient.sport,
      pathologies: patient.pathologies,
      medications: patient.medications,
      injuries: patient.injuries,
    };
  }

  private async getDoctorOrThrow(userId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return doctor;
  }

  async updatePatient(
    userId: string,
    patientId: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientItem> {
    // Verifica che il dottore esista
    const doctor = await this.getDoctorOrThrow(userId);

    // Trova il paziente con le relazioni
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user', 'doctor'],
    });

    if (!patient) {
      throw new NotFoundException('Paziente non trovato');
    }

    // Verifica che il paziente appartenga al dottore
    if (patient.doctor?.userId !== doctor.userId) {
      throw new ForbiddenException(
        'Non hai i permessi per modificare questo paziente',
      );
    }

    // Aggiorna i dati specifici del paziente
    if (updatePatientDto.weight !== undefined)
      patient.weight = updatePatientDto.weight;
    if (updatePatientDto.height !== undefined)
      patient.height = updatePatientDto.height;
    if (updatePatientDto.bloodType !== undefined)
      patient.bloodType = updatePatientDto.bloodType;
    if (updatePatientDto.level !== undefined)
      patient.level = updatePatientDto.level;
    if (updatePatientDto.sport !== undefined)
      patient.sport = updatePatientDto.sport;
    if (updatePatientDto.pathologies !== undefined)
      patient.pathologies = updatePatientDto.pathologies;
    if (updatePatientDto.medications !== undefined)
      patient.medications = updatePatientDto.medications;
    if (updatePatientDto.injuries !== undefined)
      patient.injuries = updatePatientDto.injuries;

    // Salva le modifiche al paziente
    await this.patientRepository.save(patient);

    // Se il paziente ha un user associato, aggiorna anche quello
    if (patient.user) {
      const user = await this.userRepository.findOne({
        where: { id: patient.user.id },
      });

      if (user) {
        if (updatePatientDto.name !== undefined)
          user.name = updatePatientDto.name;
        if (updatePatientDto.surname !== undefined)
          user.surname = updatePatientDto.surname;
        if (updatePatientDto.email !== undefined)
          user.email = updatePatientDto.email;
        if (updatePatientDto.cf !== undefined) user.cf = updatePatientDto.cf;
        if (updatePatientDto.birthDate !== undefined)
          user.birthDate = new Date(updatePatientDto.birthDate);
        if (updatePatientDto.gender !== undefined)
          user.gender = updatePatientDto.gender;
        if (updatePatientDto.phone !== undefined)
          user.phone = updatePatientDto.phone;
        if (updatePatientDto.address !== undefined)
          user.address = updatePatientDto.address;
        if (updatePatientDto.city !== undefined)
          user.city = updatePatientDto.city;
        if (updatePatientDto.cap !== undefined) user.cap = updatePatientDto.cap;
        if (updatePatientDto.province !== undefined)
          user.province = updatePatientDto.province;

        await this.userRepository.save(user);
      }
    }

    // Ritorna il paziente aggiornato
    return this.getPatientById(patientId);
  }

  async deletePatient(
    userId: string,
    patientId: string,
  ): Promise<{ message: string }> {
    // Verifica che il dottore esista
    const doctor = await this.getDoctorOrThrow(userId);

    // Trova il paziente
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['doctor', 'user'],
    });

    if (!patient) {
      throw new NotFoundException('Paziente non trovato');
    }

    // Verifica che il paziente appartenga al dottore
    if (patient.doctor?.userId !== doctor.userId) {
      throw new ForbiddenException(
        'Non hai i permessi per eliminare questo paziente',
      );
    }



    // Elimina il paziente (cascade dovrebbe gestire le altre relazioni)
    await this.patientRepository.remove(patient);

    return { message: 'Paziente eliminato con successo' };
  }

  async createInvite(
    userId: string,
    createInviteDto: CreateInviteDto,
  ): Promise<{ patientId: string }> {
    // console.log('DEBUG: createInvite called in DoctorService');
    const doctor = await this.getDoctorOrThrow(userId);

    const { email, cf, phone } = createInviteDto;

    // Check if user/patient exists
    const found = await this.findUser(email, phone, cf);
    // console.log('Found user/patient check: ', found);

    if (found)
      throw new BadRequestException('Tale paziente già esiste');

    const patient = await this.createPatient(createInviteDto, doctor);
    const password = this.generateRandomPassword();
    const hashedPassword = await this.hashPassword(password);
    const user = await this.createUserPatient(createInviteDto, hashedPassword);
    await this.assignPatientToUser(doctor.userId, patient.id, user); // using doctor.userId from existing getDoctorOrThrow
    await this.sendPasswordEmail(email, password);

    console.log('Patient created: ', patient);

    return { patientId: patient.id };
  }

  // --- Helpers moved from InviteService ---

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

  private async createPatient(
    createInviteDto: CreateInviteDto,
    doctor: Doctor,
  ) {
    const patient = this.patientRepository.create({
      weight: createInviteDto.weight,
      height: createInviteDto.height,
      bloodType: createInviteDto.bloodType,
      level: createInviteDto.level,
      sport: createInviteDto.sport,
      pathologies: createInviteDto.pathologies,
      medications: createInviteDto.medications,
      injuries: createInviteDto.injuries,
      doctor: doctor,
    });

    return await this.patientRepository.save(patient);
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

  private async createUserPatient(
    info: CreateInviteDto,
    hashedPassword: string,
  ): Promise<User> {
    const exist = await this.findUser(info.email, info.phone, info.cf);

    if (exist) throw new ConflictException('User already exist');

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
      role: UserRoles.PATIENT,
      mustChangePassword: true,
    });

    return this.userRepository.save(user);
  }

  private async assignPatientToUser(
    doctorId: string,
    patientId: string,
    newUser: User,
  ) {
    const patient = await this.patientRepository.findOne({
      where: { doctor: { userId: doctorId }, id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.user = newUser;
    await this.patientRepository.save(patient);
  }

  private generateRandomPassword(): string {
    return crypto.randomBytes(4).toString('hex');
  }

  private async sendPasswordEmail(email: string, password: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: '"SymbioCare" <noreply@symbiocare.com>',
      to: email,
      subject: 'Benvenuto in SymbioCare - Le tue credenziali',
      text: `Ciao,\n\nIl tuo account è stato creato con successo.\n\nUsername: ${email}\nPassword: ${password}\n\nPer motivi di sicurezza, ti invitiamo a cambiare la password dopo il primo accesso.\n\nCordiali saluti,\nIl Team di SymbioCare`,
      html: `<p>Ciao,</p><p>Il tuo account è stato creato con successo.</p><p><strong>Username:</strong> ${email}<br><strong>Password:</strong> ${password}</p><p>Per motivi di sicurezza, ti invitiamo a cambiare la password dopo il primo accesso.</p><p>Cordiali saluti,<br>Il Team di SymbioCare</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Generated password for ${email}: ${password}`);
      }
    }
  }
}
