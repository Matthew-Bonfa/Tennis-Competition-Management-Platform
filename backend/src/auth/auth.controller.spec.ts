import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginDto } from './dto/login.dto.js';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('should route login requests to the AuthService', async () => {
    const mockDto: LoginDto = {
      email: 'test@tennis.com',
      password: 'password123',
    };
    const mockResult = { access_token: 'token', personId: '123', roles: [] };

    vi.mocked(authService.login).mockResolvedValue(mockResult);

    const result = await authController.signIn(mockDto);

    expect(authService.login).toHaveBeenCalledWith(
      'test@tennis.com',
      'password123',
    );
    expect(result).toEqual(mockResult);
  });
});
