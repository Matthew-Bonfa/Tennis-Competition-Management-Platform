import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import {
  AcceptInviteDto,
  ForgotPasswordDto,
  InviteAccountDto,
  ResetPasswordDto,
} from './dto/account.dto.js';
import { Public } from './decorators/public.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import type { RequestUser } from '../players/players.service.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // Admins invite an existing person to create an account
  @Roles('ASSOCIATION_ADMIN', 'CLUB_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @Post('invites')
  invite(@Body() dto: InviteAccountDto, @Req() req: { user: RequestUser }) {
    return this.authService.createInvite(dto, req.user);
  }

  // The accept-invite page checks the link before showing the password form
  @Public()
  @Get('invites/:token')
  checkInvite(@Param('token') token: string) {
    return this.authService.getInvite(token);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto.token, dto.password);
  }

  // Always 200 with a generic message, so it can't reveal which emails exist
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
