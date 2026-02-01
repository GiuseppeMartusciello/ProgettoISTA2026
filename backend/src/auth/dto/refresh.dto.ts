import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";


export class RefreshDto {

    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}