import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from '../mail/mailer.service.js';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { toInstant, fromInstant } from '../common/temporal.js';
import type { InviteAccountDto } from './dto/account.dto.js';

// How long each token works before it expires
const INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// The frontend page each email links to
const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
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

  // ========== ACCOUNT INVITES ==========
  // An admin picks an existing person, an email and roles. The person gets an
  // email with a link; opening it and choosing a password creates the account.

  async createInvite(dto: InviteAccountDto, user: { personId: string; roles: string[] }) {
    const email = dto.email.toLowerCase();

    const person = await this.prisma.client.orm.public.Person.where({ id: dto.personId })
      .select('id', 'firstName', 'lastName')
      .first();
    if (!person) {
      throw new NotFoundException(`Person ${dto.personId} not found`);
    }

    // One account per person and per email
    const existingByEmail = await this.prisma.client.orm.public.Account.where({ email }).select('id').first();
    if (existingByEmail) {
      throw new ConflictException('An account already exists for that email');
    }
    const existingByPerson = await this.prisma.client.orm.public.Account.where({ personId: dto.personId }).select('id').first();
    if (existingByPerson) {
      throw new ConflictException('That person already has an account');
    }

    // Validate each requested role against what the inviting admin may grant
    const validatedRoles = [];
    for (const requested of dto.roles) {
      validatedRoles.push(await this.validateInviteRole(requested, user));
    }

    // A fresh invite replaces any earlier unused one for the same email
    await this.prisma.client.orm.public.AccountToken
      .where((t) => t.email.eq(email))
      .where((t) => t.type.eq('invite'))
      .where((t) => t.usedAt.isNull())
      .deleteAll();

    const { token, tokenHash, expiresAt } = this.newToken(INVITE_TTL_MS);
    await this.prisma.client.orm.public.AccountToken.create({
      tokenHash,
      type: 'invite',
      email,
      personId: dto.personId,
      rolesJson: JSON.stringify(validatedRoles),
      expiresAt: toInstant(expiresAt),
    });

    const personName = `${person.firstName} ${person.lastName}`.trim();
    await this.mailer.sendInviteEmail({
      to: email,
      personName,
      acceptUrl: `${frontendUrl}/accept-invite?token=${token}`,
      expiresAt,
    });

    return { message: `Invitation sent to ${email}` };
  }

  // Public: the accept-invite page checks the link before showing the form
  async getInvite(token: string) {
    const row = await this.validTokenRow(token, 'invite');
    const person = row.personId
      ? await this.prisma.client.orm.public.Person.where({ id: row.personId })
          .select('firstName', 'lastName')
          .first()
      : null;

    return {
      email: row.email,
      personName: person ? `${person.firstName} ${person.lastName}`.trim() : null,
      expiresAt: fromInstant(row.expiresAt).toISOString(),
    };
  }

  async acceptInvite(token: string, password: string) {
    const row = await this.validTokenRow(token, 'invite');

    const existing = await this.prisma.client.orm.public.Account.where({ email: row.email }).select('id').first();
    if (existing) {
      throw new ConflictException('An account already exists for that email');
    }

    let roles: { role: string; clubId?: string; associationId?: string }[] = [];
    if (row.rolesJson) {
      try {
        roles = JSON.parse(row.rolesJson);
      } catch {
        // A corrupt roles list still allows the account to be created
      }
    }

    // One transaction: the account, its roles and the used token land together
    await this.prisma.client.transaction(async (tx) => {
      await tx.orm.public.Account.create({
        personId: row.personId!,
        email: row.email,
        passwordHash: await bcrypt.hash(password, 10),
      });

      for (const role of roles) {
        await tx.orm.public.PersonRole.create({
          personId: row.personId!,
          role: role.role,
          clubId: role.clubId,
          associationId: role.associationId,
        });
      }

      await tx.orm.public.AccountToken.where({ id: row.id }).update({ usedAt: toInstant(new Date()) });
    });

    return { message: 'Account created. You can now sign in.' };
  }

  // ========== PASSWORD RESET ==========

  // Always answers the same message, so the endpoint can't be used to find
  // out which emails have accounts.
  async requestPasswordReset(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const genericMessage = 'If an account exists for that email, a reset link has been sent.';

    const account = await this.prisma.client.orm.public.Account.where({ email })
      .select('id', 'personId')
      .first();
    if (!account) {
      return { message: genericMessage };
    }

    await this.prisma.client.orm.public.AccountToken
      .where((t) => t.email.eq(email))
      .where((t) => t.type.eq('password_reset'))
      .where((t) => t.usedAt.isNull())
      .deleteAll();

    const { token, tokenHash, expiresAt } = this.newToken(RESET_TTL_MS);
    await this.prisma.client.orm.public.AccountToken.create({
      tokenHash,
      type: 'password_reset',
      email,
      personId: account.personId,
      expiresAt: toInstant(expiresAt),
    });

    await this.mailer.sendResetEmail({
      to: email,
      resetUrl: `${frontendUrl}/reset-password?token=${token}`,
      expiresAt,
    });

    return { message: genericMessage };
  }

  async resetPassword(token: string, password: string) {
    const row = await this.validTokenRow(token, 'password_reset');

    const account = await this.prisma.client.orm.public.Account.where({ email: row.email }).select('id').first();
    if (!account) {
      throw new NotFoundException('No account exists for that email');
    }

    await this.prisma.client.transaction(async (tx) => {
      await tx.orm.public.Account.where({ id: account.id }).update({
        passwordHash: await bcrypt.hash(password, 10),
      });
      await tx.orm.public.AccountToken.where({ id: row.id }).update({ usedAt: toInstant(new Date()) });
    });

    return { message: 'Password updated. You can now sign in.' };
  }

  // ========== HELPERS ==========

  // 256 bits of randomness; only the SHA-256 hash goes into the database, so
  // a database leak can't be replayed against the email links
  private newToken(ttlMs: number) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return { token, tokenHash, expiresAt: new Date(Date.now() + ttlMs) };
  }

  private async validTokenRow(token: string, type: 'invite' | 'password_reset') {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = await this.prisma.client.orm.public.AccountToken.where({ tokenHash }).first();

    if (!row || row.type !== type || row.usedAt) {
      throw new NotFoundException('This link is invalid or has already been used');
    }
    if (fromInstant(row.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('This link has expired. Ask for a new one.');
    }
    return row;
  }

  // Checks one requested role against the inviting admin's own permissions:
  // a club admin may only grant PLAYER/CLUB_ADMIN inside a club they admin;
  // an association admin may grant anything, with CLUB_ADMIN/PLAYER scoped to
  // an existing club and ASSOCIATION_ADMIN to an existing association.
  private async validateInviteRole(
    requested: { role: string; clubId?: string; associationId?: string },
    user: { personId: string; roles: string[] },
  ) {
    if (requested.role === 'PLAYER' || requested.role === 'CLUB_ADMIN') {
      if (!requested.clubId) {
        throw new BadRequestException(`${requested.role} requires a club`);
      }
      if (!user.roles.includes('ASSOCIATION_ADMIN')) {
        const adminRole = await this.prisma.client.orm.public.PersonRole.where({
          personId: user.personId,
          role: 'CLUB_ADMIN',
          clubId: requested.clubId,
        }).first();
        if (!adminRole) {
          throw new ForbiddenException('You can only invite people to a club you administer');
        }
      } else {
        const club = await this.prisma.client.orm.public.Club.where({ id: requested.clubId }).select('id').first();
        if (!club) {
          throw new BadRequestException(`Club ${requested.clubId} not found`);
        }
      }
      return { role: requested.role, clubId: requested.clubId };
    }

    if (requested.role === 'ASSOCIATION_ADMIN') {
      if (!user.roles.includes('ASSOCIATION_ADMIN')) {
        throw new ForbiddenException('Only an association admin can grant association admin');
      }
      if (!requested.associationId) {
        throw new BadRequestException('ASSOCIATION_ADMIN requires an association');
      }
      const association = await this.prisma.client.orm.public.Association
        .where({ id: requested.associationId })
        .select('id')
        .first();
      if (!association) {
        throw new BadRequestException(`Association ${requested.associationId} not found`);
      }
      return { role: requested.role, associationId: requested.associationId };
    }

    throw new BadRequestException(`Unknown role ${requested.role}`);
  }
}
