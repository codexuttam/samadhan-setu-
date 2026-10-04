import { prisma } from '../server/lib/prisma';
import { hashPassword } from '../server/modules/authority/auth.service';

async function seed() {
  console.log('Seeding Samadhan Setu initial database structure...');

  // 1. Departments
  const roads = await prisma.department.upsert({
    where: { code: 'ROADS' },
    update: {},
    create: { code: 'ROADS', name: 'Roads & Infrastructure' },
  });
  const san = await prisma.department.upsert({
    where: { code: 'SANITATION' },
    update: {},
    create: { code: 'SANITATION', name: 'Garbage & Sanitation' },
  });
  const elec = await prisma.department.upsert({
    where: { code: 'ELECTRICITY' },
    update: {},
    create: { code: 'ELECTRICITY', name: 'Street Lights & Electricity' },
  });

  // 2. Zone & Ward
  const zone1 = await prisma.zone.upsert({
    where: { code: 'Z1' },
    update: {},
    create: { code: 'Z1', name: 'North Zone', city: 'Amravati' },
  });

  const ward14 = await prisma.ward.upsert({
    where: { code: 'W14' },
    update: {},
    create: { code: 'W14', name: 'Parvati Nagar', number: 14, zoneId: zone1.id },
  });

  // 3. Categories
  await prisma.ticketCategory.upsert({
    where: { code: 'POTHOLE' },
    update: {},
    create: { code: 'POTHOLE', name: 'Roads & Potholes', departmentId: roads.id, defaultPriority: 'HIGH' },
  });
  await prisma.ticketCategory.upsert({
    where: { code: 'STREET_LIGHT' },
    update: {},
    create: { code: 'STREET_LIGHT', name: 'Street Lights', departmentId: elec.id, defaultPriority: 'MEDIUM' },
  });
  await prisma.ticketCategory.upsert({
    where: { code: 'GARBAGE' },
    update: {},
    create: { code: 'GARBAGE', name: 'Garbage & Sanitation', departmentId: san.id, defaultPriority: 'MEDIUM' },
  });

  // 4. Authority Levels & Roles
  const lvl1 = await prisma.authorityLevel.upsert({
    where: { code: 'L1' },
    update: {},
    create: { code: 'L1', name: 'Ward Officer', levelOrder: 1 },
  });
  const lvl2 = await prisma.authorityLevel.upsert({
    where: { code: 'L2' },
    update: {},
    create: { code: 'L2', name: 'Zone Officer', levelOrder: 2 },
  });
  const lvl6 = await prisma.authorityLevel.upsert({
    where: { code: 'L6' },
    update: {},
    create: { code: 'L6', name: 'Super Admin', levelOrder: 6 },
  });

  const roleWard = await prisma.authorityRole.upsert({
    where: { code: 'WARD_OFFICER' },
    update: {},
    create: { code: 'WARD_OFFICER', name: 'Ward Officer', levelId: lvl1.id, scope: 'WARD' },
  });

  const roleAdmin = await prisma.authorityRole.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {},
    create: { code: 'SUPER_ADMIN', name: 'Super Admin', levelId: lvl6.id, scope: 'SYSTEM' },
  });

  // 5. Permissions
  const permissionsList = [
    'ticket.view',
    'ticket.accept',
    'ticket.update_status',
    'ticket.complete',
    'ticket.assign',
    'ticket.escalate',
    'ticket.close',
    'ticket.reopen_closed',
    'admin.users.manage',
    'admin.org.manage',
    'admin.rules.manage',
  ];

  for (const code of permissionsList) {
    const perm = await prisma.authorityPermission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });

    await prisma.authorityRolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: perm.id },
    });

    if (['ticket.view', 'ticket.accept', 'ticket.update_status', 'ticket.complete'].includes(code)) {
      await prisma.authorityRolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleWard.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleWard.id, permissionId: perm.id },
      });
    }
  }

  // 6. Users
  const pw = await hashPassword('Admin@Samadhan2026');
  await prisma.authorityUser.upsert({
    where: { email: 'admin@samadhansetu.gov.in' },
    update: { passwordHash: pw, status: 'ACTIVE' },
    create: {
      name: 'District Super Admin',
      email: 'admin@samadhansetu.gov.in',
      passwordHash: pw,
      roleId: roleAdmin.id,
      status: 'ACTIVE',
    },
  });

  const pwWard = await hashPassword('Officer@Samadhan2026');
  await prisma.authorityUser.upsert({
    where: { email: 'ward14.officer@samadhansetu.gov.in' },
    update: { passwordHash: pwWard, status: 'ACTIVE' },
    create: {
      name: 'Rajesh Patil',
      email: 'ward14.officer@samadhansetu.gov.in',
      passwordHash: pwWard,
      roleId: roleWard.id,
      departmentId: elec.id,
      zoneId: zone1.id,
      wardId: ward14.id,
      status: 'ACTIVE',
    },
  });

  console.log('Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
