import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from '../patient/patient.entity';
import { User } from '../user/user.entity';

import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { UserRoles } from '../common/enum/roles.enum';

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
}));

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(),
    })),
}));

jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => Buffer.from('mock password')),
}));

describe('DoctorService', () => {
    let service: DoctorService;

    const mockDoctorRepository = {
        findOne: jest.fn(),
    };

    const mockPatientRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        create: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DoctorService,
                { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepository },
                { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        service = module.get<DoctorService>(DoctorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDoctorByUserId', () => {
        const mockUser = {
            id: 'u1',
            name: 'Doc',
            password: 'mypassword',
            email: 'test@doc.com',
        };
        const mockDoctor = { userId: 'u1', medicalOffice: 'Office', user: mockUser };

        it('should return doctor info', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);

            const result = await service.getDoctorByUserId('u1');
            expect(result.userId).toBe('u1');
            expect(result.user.name).toBe('Doc');
            expect(result.user['password']).toBeUndefined(); // check password removed from type
            expect(mockUser.password).toBe(''); // password is set to '' on original
        });

        it('should throw Error if doctor not found', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'u1' });
            mockDoctorRepository.findOne.mockResolvedValue(null);
            await expect(service.getDoctorByUserId('u1')).rejects.toThrow('Doctor not found');
        });

        it('should throw Error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            await expect(service.getDoctorByUserId('u1')).rejects.toThrow('Doctor not found');
        });
    });

    describe('getPatients', () => {
        it('should return paginated patients without search', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });

            mockPatientRepository.find.mockResolvedValue([
                { id: 'p1', user: { id: 'pu1', name: 'Mario', password: 'xx' } },
                { id: 'p2', user: { id: 'pu2', name: 'Luigi' } },
                { id: 'p3', user: null },
            ]);

            const result = await service.getPatients('u1', 1, 10, undefined);
            expect(result.total).toBe(2);
            expect(result.data[0].user.name).toBe('Mario');
            expect((result.data[0].user as any).password).toBeUndefined();
            expect(result.data[1].user.name).toBe('Luigi');
        });

        it('should return paginated patients with search', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });

            mockPatientRepository.find.mockResolvedValue([
                { id: 'p1', user: { id: 'pu1', name: 'Mario', surname: 'Rossi', cf: 'MRO', email: 'm@r.it' } },
                { id: 'p2', user: { id: 'pu2', name: 'Luigi', surname: 'Verdi' } },
            ]);

            const result = await service.getPatients('u1', 1, 10, 'mario');
            expect(result.total).toBe(1);
            expect(result.data[0].user.name).toBe('Mario');
        });

        it('should return paginated patients with search matching surname, cf, email', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });

            mockPatientRepository.find.mockResolvedValue([
                { id: 'p1', user: { id: 'pu1', surname: 'Rossi' } },
                { id: 'p2', user: { id: 'pu2', email: 'luigi@mail.com' } },
                { id: 'p3', user: { id: 'pu3', cf: 'CFABC' } },
            ]);

            const res1 = await service.getPatients('u1', 1, 10, 'rossi');
            expect(res1.total).toBe(1);
            expect(res1.data[0].user.surname).toBe('Rossi');

            const res2 = await service.getPatients('u1', 1, 10, 'luigi@');
            expect(res2.total).toBe(1);
            expect(res2.data[0].user.email).toBe('luigi@mail.com');

            const res3 = await service.getPatients('u1', 1, 10, 'cfA');
            expect(res3.total).toBe(1);
            expect(res3.data[0].user.cf).toBe('CFABC');
        });

        it('should handle getDoctorOrThrow failure', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(null);
            await expect(service.getPatients('u1', 1, 10, '')).rejects.toThrow('Doctor not found');
        });
    });

    describe('getPatientById', () => {
        it('should throw BadRequestException if patient does not exist', async () => {
            mockPatientRepository.findOne.mockResolvedValue(null);
            await expect(service.getPatientById('p1')).rejects.toThrow(BadRequestException);
        });

        it('should return patient safely', async () => {
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', user: { password: 'pwd', name: 'test' } });
            const res = await service.getPatientById('p1');
            expect(res.id).toBe('p1');
            expect(res.user.name).toBe('test');
            expect((res.user as any).password).toBeUndefined();
        });

        it('should return patient safely with no user', async () => {
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', user: null });
            const res = await service.getPatientById('p1');
            expect(res.id).toBe('p1');
            expect(res.user).toBeNull();
        });
    });

    describe('updatePatient', () => {
        it('should throw NotFoundException if patient not found', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue(null);
            await expect(service.updatePatient('u1', 'p1', {})).rejects.toThrow(NotFoundException);
        });

        it('should throw Forbidden if patient belongs to another doctor', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue({
                id: 'p1',
                doctor: { userId: 'other-doc' },
            });

            await expect(service.updatePatient('u1', 'p1', {})).rejects.toThrow(ForbiddenException);
        });

        it('should update patient and user correctly', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            const mockPatient: any = {
                id: 'p1',
                doctor: { userId: 'u1' },
                user: { id: 'pu1', name: 'Old' },
            };
            const mockUser: any = { id: 'pu1', name: 'Old' };

            // First call for the existence check, second for getPatientById
            mockPatientRepository.findOne
                .mockResolvedValueOnce(mockPatient)
                .mockResolvedValueOnce(mockPatient);

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockPatientRepository.save.mockResolvedValue({});
            mockUserRepository.save.mockResolvedValue({});

            await service.updatePatient('u1', 'p1', {
                name: 'New',
                surname: 'SN',
                weight: 80,
                height: 180,
                bloodType: 'A+',
                level: 'Pro' as any,
                sport: 'Tennis' as any,
                pathologies: 'None' as any,
                medications: 'None' as any,
                injuries: 'None' as any,
                email: 'e@e.com',
                cf: 'CF',
                birthDate: '1990-01-01',
                gender: 'M' as any,
                phone: '123',
                address: 'Addr',
                city: 'City',
                cap: 'CAP',
                province: 'PR',
            });

            expect(mockPatient.weight).toBe(80);
            expect(mockPatient.height).toBe(180);
            expect(mockPatient.bloodType).toBe('A+');
            expect(mockPatient.level).toBe('Pro');
            expect(mockPatient.sport).toBe('Tennis');
            expect(mockPatient.pathologies).toBe('None');
            expect(mockPatient.medications).toBe('None');
            expect(mockPatient.injuries).toBe('None');

            expect(mockUser.name).toBe('New');
            expect(mockUser.surname).toBe('SN');
            expect(mockUser.email).toBe('e@e.com');
            expect(mockUser.cf).toBe('CF');
            expect(mockUser.gender).toBe('M');
            expect(mockUser.phone).toBe('123');
            expect(mockUser.address).toBe('Addr');
            expect(mockUser.city).toBe('City');
            expect(mockUser.cap).toBe('CAP');
            expect(mockUser.province).toBe('PR');

            expect(mockPatientRepository.save).toHaveBeenCalledWith(mockPatient);
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('deletePatient', () => {
        it('should throw NotFoundException if patient not found', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue(null);

            await expect(service.deletePatient('u1', 'p1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if patient doctor mismatch', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', doctor: { userId: 'u2' } });

            await expect(service.deletePatient('u1', 'p1')).rejects.toThrow(ForbiddenException);
        });

        it('should delete patient', async () => {
            mockDoctorRepository.findOne.mockResolvedValue({ userId: 'u1' });
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', doctor: { userId: 'u1' } });

            const res = await service.deletePatient('u1', 'p1');

            expect(mockPatientRepository.remove).toHaveBeenCalled();
            expect(res.message).toBe('Paziente eliminato con successo');
        });
    });

    describe('createInvite', () => {
        const mockDto = {
            email: 'p@p.com',
            cf: 'PCF',
            phone: '1234',
            name: 'P',
            surname: 'S',
            gender: 'M',
            birthDate: new Date(),
            address: 'A',
            city: 'C',
            cap: '00',
            province: 'PR'
        };

        const mockDoctor = { userId: 'u1' };

        let qbMock;

        beforeEach(() => {
            qbMock = {
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };
            mockUserRepository.createQueryBuilder.mockReturnValue(qbMock);
        });

        it('should throw BadRequest if user/patient exists', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            qbMock.getOne.mockResolvedValue({ id: 'existing' });

            await expect(service.createInvite('u1', mockDto as any)).rejects.toThrow(BadRequestException);
        });

        it('should create patient and user, hash password, handle sending email', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);

            // first call to findUser returning null
            qbMock.getOne.mockResolvedValueOnce(null);
            // second call inside createUserPatient returning null
            qbMock.getOne.mockResolvedValueOnce(null);

            mockPatientRepository.create.mockReturnValue({ id: 'p1', doctor: mockDoctor });
            mockPatientRepository.save.mockResolvedValue({ id: 'p1', doctor: mockDoctor });

            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

            const createdUser = { id: 'u2', email: 'p@p.com' };
            mockUserRepository.create.mockReturnValue(createdUser);
            mockUserRepository.save.mockResolvedValue(createdUser);

            // for assignPatientToUser
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', doctor: mockDoctor });

            const mockSendMail = jest.fn().mockResolvedValue(true);
            (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });

            const res = await service.createInvite('u1', mockDto as any);
            expect(res.patientId).toBe('p1');
            expect(mockPatientRepository.create).toHaveBeenCalled();
            expect(mockPatientRepository.save).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('6d6f636b2070617373776f7264', 'salt');
            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalled();
        });

        it('should handle mail error silently', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            qbMock.getOne.mockResolvedValueOnce(null);
            qbMock.getOne.mockResolvedValueOnce(null);
            mockPatientRepository.create.mockReturnValue({ id: 'p1', doctor: mockDoctor });
            mockPatientRepository.save.mockResolvedValue({ id: 'p1', doctor: mockDoctor });
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            const createdUser = { id: 'u2', email: 'p@p.com' };
            mockUserRepository.create.mockReturnValue(createdUser);
            mockUserRepository.save.mockResolvedValue(createdUser);
            mockPatientRepository.findOne.mockResolvedValue({ id: 'p1', doctor: mockDoctor });

            const mockSendMail = jest.fn().mockRejectedValue(new Error('mail error'));
            (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });

            const res = await service.createInvite('u1', mockDto as any);
            expect(res.patientId).toBe('p1'); // still returns
        });

        it('should throw ConflictException if createUserPatient finds user existing', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            qbMock.getOne.mockResolvedValueOnce(null);
            qbMock.getOne.mockResolvedValueOnce({ id: 'existing' });

            mockPatientRepository.create.mockReturnValue({ id: 'p1', doctor: mockDoctor });
            mockPatientRepository.save.mockResolvedValue({ id: 'p1', doctor: mockDoctor });
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

            await expect(service.createInvite('u1', mockDto as any)).rejects.toThrow(ConflictException);
        });

        it('should throw on password hash failure', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            qbMock.getOne.mockResolvedValueOnce(null);
            mockPatientRepository.create.mockReturnValue({ id: 'p1', doctor: mockDoctor });
            mockPatientRepository.save.mockResolvedValue({ id: 'p1', doctor: mockDoctor });
            (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('salt error'));

            await expect(service.createInvite('u1', mockDto as any)).rejects.toThrow('There is a problem to hash the password');
        });

        it('should throw NotFoundException if assignPatientToUser fails to find patient', async () => {
            mockDoctorRepository.findOne.mockResolvedValue(mockDoctor);
            qbMock.getOne.mockResolvedValueOnce(null);
            qbMock.getOne.mockResolvedValueOnce(null);
            mockPatientRepository.create.mockReturnValue({ id: 'p1', doctor: mockDoctor });
            mockPatientRepository.save.mockResolvedValue({ id: 'p1', doctor: mockDoctor });
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            const createdUser = { id: 'u2', email: 'p@p.com' };
            mockUserRepository.create.mockReturnValue(createdUser);
            mockUserRepository.save.mockResolvedValue(createdUser);

            // patient not found during assign
            mockPatientRepository.findOne.mockResolvedValue(null);

            await expect(service.createInvite('u1', mockDto as any)).rejects.toThrow(NotFoundException);
        });
    });
});
