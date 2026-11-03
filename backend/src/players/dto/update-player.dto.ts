import { IsDateString, IsEmail, IsOptional, IsString, IsBoolean, IsArray, ArrayMaxSize, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// One club membership the edit form sends back. Players can belong to more
// than one club; each membership carries its own financial flag.
export class MembershipInputDto {
    @IsString()
    clubId: string;

    @IsBoolean()
    isFinancialMember: boolean;
}

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

    // Full desired membership list. Only sent by the edit form when it has
    // loaded the player's clubs; absent means "don't touch memberships".
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => MembershipInputDto)
    memberships?: MembershipInputDto[];
}
