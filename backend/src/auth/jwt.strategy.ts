import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] || 'super-secret-development-key',
    });
  }

  // Passport automatically verifies the signature. If valid, it calls this method.
  // Whatever we return here gets attached to `req.user` in our controllers.
  async validate(payload: any) {
    return {
      personId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
