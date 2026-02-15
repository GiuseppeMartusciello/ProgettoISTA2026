import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class MedicalExaminationDTO {
    @IsNotEmpty()
    @IsString()
    motivation: string;

    @IsNotEmpty()
    @IsString()
    note: string;

    @IsNotEmpty()
    @IsDate()
    date: Date;
}
