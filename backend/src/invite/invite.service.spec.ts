import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite } from './invite.entity';
import { Doctor } from '../doctor/doctor.entity';
import { User } from '../user/user.entity';
import { Patient } from '../patient/patient.entity';
// @ts-ignore
import * as bcrypt from 'bcryptjs';

// ---- Tipi minimi per i DTO usati nel test ----
type CreateInviteDto = {
  email: string;
  cf: string;
  phone: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  level?: string;
  sport?: string;
  pathologies?: string[];
  medications?: string[];
  injuries?: string[];
};

describe('InviteService', () => {
  let service: InviteService;

  // Mocks dei repository
  const inviteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const doctorRepository = {
    findOne: jest.fn(),
  };

  const userRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const patientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  // Helper per mockare la query builder chain: where(...).getOne()
  const mockQueryBuilder = (found: any | null) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(found),
    };
    inviteRepository.createQueryBuilder.mockReturnValue(qb);
    userRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(Invite), useValue: inviteRepository },
        { provide: getRepositoryToken(Doctor), useValue: doctorRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Patient), useValue: patientRepository },
      ],
    }).compile();

    service = module.get<InviteService>(InviteService);
  });

  const USER_ID = 'doctor-user-id-123';

  const createInviteDto: CreateInviteDto = {
    email: 'patient@example.com',
    cf: 'ABCDEF12G34H567I',
    phone: '3331112222',
  };

  describe('createInvite', () => {
    test('crea paziente e invito quando non ci sono duplicati', async () => {
      // 1) il medico esiste
      const mockDoctor = {
        id: 'doctor-id-1',
        user: { id: USER_ID },
        userId: USER_ID,
      };
      doctorRepository.findOne.mockResolvedValue(mockDoctor);

      // 2) nessun invito duplicato (qb for invite)
      const qbInvite = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null)
      };
      inviteRepository.createQueryBuilder.mockReturnValue(qbInvite);

      // 3) salvataggio paziente
      const savedPatient = { id: 'patient-id-1' };
      patientRepository.create.mockImplementation((data) => ({
        id: 'temp',
        ...data,
      }));
      patientRepository.save.mockResolvedValue(savedPatient);

      // 4) salvataggio invito
      inviteRepository.create.mockImplementation((data) => ({
        id: 'invite-id-1',
        ...data,
      }));
      inviteRepository.save.mockResolvedValue({ id: 'invite-id-1' });

      const res = await service.createInvite(createInviteDto as any, USER_ID);

      expect(doctorRepository.findOne).toHaveBeenCalled();
      expect(inviteRepository.createQueryBuilder).toHaveBeenCalled();
      expect(patientRepository.save).toHaveBeenCalled();
      expect(inviteRepository.save).toHaveBeenCalled();
      expect(res).toEqual({ patientId: 'patient-id-1' });
    });

    test('lancia BadRequestException se esiste un invito duplicato', async () => {
      doctorRepository.findOne.mockResolvedValue({ id: 'doctor-id-1' });

      const qbInvite = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing' })
      };
      inviteRepository.createQueryBuilder.mockReturnValue(qbInvite);

      await expect(
        service.createInvite(createInviteDto as any, USER_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    test('lancia UnauthorizedException se il medico non esiste', async () => {
      doctorRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createInvite(createInviteDto as any, USER_ID),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getInvite', () => {
    it('should return invite if found and valid', async () => {
      inviteRepository.findOne.mockResolvedValue({ id: 'inv1', used: false, doctor: {}, patient: {} });
      const result = await service.getInvite('inv1');
      expect(result).toBeDefined();
    });

    it('should throw NotFound if not found', async () => {
      inviteRepository.findOne.mockResolvedValue(null);
      await expect(service.getInvite('inv1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequest if used', async () => {
      inviteRepository.findOne.mockResolvedValue({ id: 'inv1', used: true });
      await expect(service.getInvite('inv1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite and create user', async () => {
      // Invite found
      const mockInvite = { id: 'inv1', used: false, doctor: { userId: 'd1' }, patient: { id: 'p1' } };
      inviteRepository.findOne.mockResolvedValue(mockInvite);

      // User not exists (qb for user)
      const qbUser = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null)
      };
      userRepository.createQueryBuilder.mockReturnValue(qbUser);

      // Hash password
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed'));

      // Create user
      userRepository.save.mockResolvedValue({ id: 'u1' });

      // Find patient
      patientRepository.findOne.mockResolvedValue({ id: 'p1', user: null });
      patientRepository.save.mockResolvedValue({ id: 'p1', user: { id: 'u1' } });

      const result = await service.acceptInvite({
        email: 'e', password: 'p', name: 'n', surname: 's', cf: 'c', birthDate: new Date(), phone: '1', gender: 'M' as any, address: 'a', city: 'c', cap: '1', province: 'p'
      }, 'inv1');

      expect(result.message).toBeDefined();
      expect(inviteRepository.update).toHaveBeenCalledWith({ id: 'inv1' }, { used: true });
    });

    it('should throw ConflictException if user already exists', async () => {
      inviteRepository.findOne.mockResolvedValue({ id: 'inv1', used: false });
      const qbUser = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'existing' })
      };
      userRepository.createQueryBuilder.mockReturnValue(qbUser);

      await expect(service.acceptInvite({} as any, 'inv1')).rejects.toThrow(ConflictException);
    });
  });

});
