import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload } from './strategies/jwt.strategy'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) {
      throw new ConflictException('Email already in use')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    })

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.signToken(user.id, user.email),
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.signToken(user.id, user.email),
    }
  }

  private signToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email }
    return this.jwtService.sign(payload, { expiresIn: '7d' })
  }
}
