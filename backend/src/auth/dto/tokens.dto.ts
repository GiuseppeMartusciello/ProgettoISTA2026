import { IsNotEmpty, IsString } from "class-validator";


export class TokensDto {

    @IsNotEmpty()
    @IsString()
    accessToken: string;

    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}