import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePlayerDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    // the player's primary club; a membership is created alongside them
    @IsUUID()
    clubId!: string;

    @IsOptional()
    @IsBoolean()
    isFinancialMember?: boolean;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    utrId?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    tennisAustraliaNumber?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(30)
    phone?: string;
}
