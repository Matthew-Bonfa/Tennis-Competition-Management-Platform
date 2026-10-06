import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  // Mock Prisma's fluent chaining API: where() -> include() -> first()
  const mockFirst = vi.fn();
  const mockInclude = vi.fn().mockReturnValue({ first: mockFirst });
  const mockWhere = vi.fn().mockReturnValue({ include: mockInclude });

  const mockPrismaService = {
    client: {
      orm: {
        public: {
          Account: {
            where: mockWhere,
          },
        },
      },
    },
  };

  const mockJwtService = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);

    vi.clearAllMocks();
  });

  it('should return an access token and user metadata for valid credentials', async () => {
    const mockAccount = {
      email: 'admin@tennis.com',
      passwordHash: 'hashed_password',
      personId: 'uuid-1234',
      person: { roles: [{ role: 'ASSOCIATION_ADMIN' }] },
    };

    // Simulate database finding the user
    mockFirst.mockResolvedValue(mockAccount);
    // Simulate bcrypt confirming the password matches
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    // Simulate JWT service generating a token
    vi.mocked(jwtService.signAsync).mockResolvedValue('fake_jwt_token');

    const result = await authService.login('admin@tennis.com', 'password123');

    expect(result).toEqual({
      access_token: 'fake_jwt_token',
      personId: 'uuid-1234',
      roles: ['ASSOCIATION_ADMIN'],
    });
  });

  it('should throw UnauthorizedException if account email is not found', async () => {
    // Simulate database returning nothing
    mockFirst.mockResolvedValue(null);

    await expect(
      authService.login('test@test.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    const mockAccount = { passwordHash: 'hashed_password' };

    mockFirst.mockResolvedValue(mockAccount);
    // Simulate bcrypt rejecting the password
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login('test@test.com', 'wrong_pass'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
