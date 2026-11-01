import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

// One role an invited account should receive. CLUB_ADMIN/PLAYER roles are
// scoped to a club, ASSOCIATION_ADMIN to an association.
export class InviteRoleDto {
  @IsIn(['PLAYER', 'CLUB_ADMIN', 'ASSOCIATION_ADMIN'])
  role: string;

  @IsOptional()
  @IsString()
  clubId?: string;

  @IsOptional()
  @IsString()
  associationId?: string;
}

export class InviteAccountDto {
  @IsString()
  personId: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => InviteRoleDto)
  roles: InviteRoleDto[];
}

export class AcceptInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(200)
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;
}
