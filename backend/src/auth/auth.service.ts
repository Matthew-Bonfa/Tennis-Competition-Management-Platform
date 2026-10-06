import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // Fetchs the account joined with their person profile and roles
    const account = await this.prisma.client.orm.public.Account.where({ email })
      .include('person', (p) => p.include('roles', (r) => r.select('role')))
      .first();

    // Account does not exist
    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Safely verifies the password with the hash
    const isMatch = await bcrypt.compare(pass, account.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extracts the roles into a flat array of strings
    const roles = account.person?.roles.map((r: any) => r.role) || [];

    // Constructs the JWT payload
    const payload = {
      sub: account.personId,
      email: account.email,
      roles: roles,
    };

    // Sign and return the token alongside the user metadata
    return {
      access_token: await this.jwtService.signAsync(payload),
      personId: account.personId,
      roles: roles,
    };
  }
}
