import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { UsersService } from '../../users/users.service'

export interface JwtPayload {
  sub: string
  email: string
}

/** Parse token cookie from request without cookie-parser */
function cookieExtractor(req: Request): string | null {
  if (!req.headers.cookie) return null
  const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.get<string>('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload): Promise<{ id: string; email: string; roles: string[] }> {
    const roles: string[] = []
    try {
      const user = await this.usersService.findByIdWithRoles(payload.sub)
      if (user?.userRoles) {
        roles.push(...user.userRoles.map(ur => (ur as any).role?.name).filter(Boolean))
      }
    } catch {
      // Roles lookup failure shouldn't block auth
    }
    return { id: payload.sub, email: payload.email, roles }
  }
}
