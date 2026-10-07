import { IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePlayerDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string | null;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    utrId?: string | null;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    tennisAustraliaNumber?: string | null;

    @IsOptional()
    @IsEmail()
    email?: string | null;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(30)
    phone?: string | null;
}
