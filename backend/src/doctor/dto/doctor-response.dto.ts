import { Expose, Type } from 'class-transformer';

export class DoctorUserDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    surname: string;

    @Expose()
    email: string;

    @Expose()
    phone: string;

    @Expose()
    cf: string;

    @Expose()
    gender: string;

    @Expose()
    birthDate: Date;
}

export class DoctorResponseDto {
    @Expose()
    userId: string;

    @Expose()
    specialization: string;

    @Expose()
    medicalOffice: string;

    @Expose()
    registrationNumber: string;

    @Expose()
    orderProvince: string;

    @Expose()
    orderDate: Date;

    @Expose()
    orderType: string;

    @Expose()
    @Type(() => DoctorUserDto)
    user: DoctorUserDto;
}
