import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
})

async function main() {
  // Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: { name: 'super_admin', description: 'Super administrator — bypasses all permission checks' },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'System administrator' },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', description: 'Regular user' },
  })

  // Permissions
  const userManagePermission = await prisma.permission.upsert({
    where: { name: 'user:manage' },
    update: {},
    create: { name: 'user:manage', resource: 'users', action: 'manage' },
  })

  // Assign user:manage to admin (super_admin bypasses all checks, no need)
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: userManagePermission.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: userManagePermission.id },
  })

  // Default super admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aiflow.local' },
    update: {},
    create: {
      email: 'admin@aiflow.local',
      name: 'Admin',
      passwordHash,
    },
  })

  // Assign super_admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  })

  // eslint-disable-next-line no-console
  console.log('Seed complete')
  // eslint-disable-next-line no-console
  console.log('  Roles: super_admin, admin, user')
  // eslint-disable-next-line no-console
  console.log('  Super admin: admin@aiflow.local / admin123')
}

main()
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
