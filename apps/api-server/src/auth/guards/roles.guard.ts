import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()])
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }
    const { user } = context.switchToHttp().getRequest()
    if (!user || !user.roles) {
      return false
    }
    // super_admin bypasses all permission checks
    if (user.roles.includes('super_admin')) {
      return true
    }
    return requiredRoles.some(role => user.roles.includes(role))
  }
}
