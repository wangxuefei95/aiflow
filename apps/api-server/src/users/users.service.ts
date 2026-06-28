import { Injectable, NotFoundException } from '@nestjs/common'

import { LoggerService } from '../logger/logger.service'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateUserInput {
  email: string
  name: string
  passwordHash: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  avatar?: string
}

@Injectable()
export class UsersService {
  private readonly log: LoggerService

  constructor(
    private readonly prisma: PrismaService,
    rootLogger: LoggerService
  ) {
    this.log = rootLogger.child('UsersService')
  }

  async findAll() {
    this.log.debug('findAll')
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    this.log.debug('findById', { id })
    return this.prisma.user.findUnique({ where: { id } })
  }

  async findByIdWithRoles(id: string) {
    this.log.debug('findByIdWithRoles', { id })
    return this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    })
  }

  async findByEmail(email: string) {
    this.log.debug('findByEmail', { email })
    return this.prisma.user.findUnique({ where: { email } })
  }

  async create(input: CreateUserInput) {
    this.log.log('creating user', { email: input.email })
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
      },
    })
  }

  async update(id: string, input: UpdateUserInput) {
    this.log.log('updating user', { id })
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('User not found')
    return this.prisma.user.update({
      where: { id },
      data: input,
      select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true },
    })
  }

  async delete(id: string) {
    this.log.log('deleting user', { id })
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('User not found')
    await this.prisma.user.delete({ where: { id } })
    return { deleted: true }
  }
}
