import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define Permissions Map based on frontend/src/lib/utils.ts
const PERMISSIONS = {
  'Lead Module': [
    'Lead Create', 'Lead Assignment', 'Lead View', 'Lead Update', 'Lead Manage', 'Lead Delete', 'Bulk Import', 'Lead Download', 'View Email and Phone'
  ],
  'Application Module': [
    'Application Manage', 'Lead to Application'
  ],
  'Branch Module': [
    'Branch Create', 'Branch Manage', 'Branch Delete'
  ],
  'Agency Module': [
    'Agency Create', 'Agency Update', 'Agency Delete', 'Agency Manage'
  ],
  'Agents Module': [
    'Agents Create', 'Agents Update', 'Agents Agreement', 'Agents Delete', 'Agents Payout'
  ],
  'University Module': [
    'University Create', 'University Update', 'University Delete'
  ],
  'Courses Module': [
    'Courses Create', 'Courses Update', 'Courses Delete', 'Courses View'
  ],
  'Offline Payment Module': [
    'Offline Payment Create', 'Offline Payment Receive', 'Offline Payment Approval'
  ],
  'Commission Module': [
    'Commission Create', 'Commission Payout', 'Commission Manage'
  ],
  'Employee Module': [
    'Employee Create', 'Employee Update', 'Employee Delete', 'Employee Manage'
  ],
  'Administrative Module': [
    'Reports View', 'Activity Logs'
  ],
  'Permission Module': [
    'Roles Create', 'Roles Permission', 'Permission Delete'
  ]
};

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed Permissions and Groups
  console.log('🛡️  Seeding Permissions...');
  const allPermissionIds: string[] = [];

  for (const [groupName, permissions] of Object.entries(PERMISSIONS)) {
    // Create/Find Group
    const group = await prisma.permission_group.upsert({
      where: { name: groupName },
      update: {},
      create: { name: groupName },
    });

    for (const permName of permissions) {
      const perm = await prisma.permission.upsert({
        where: { name: permName },
        update: { permission_group_id: group.id },
        create: {
          name: permName,
          permission_group_id: group.id,
        },
      });
      allPermissionIds.push(perm.id);
    }
  }
  console.log(`   - Seeded ${allPermissionIds.length} permissions across ${Object.keys(PERMISSIONS).length} groups.`);

  // 2. Ensure "admin" Role exists
  console.log('👑 Creating/Checking Admin Role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Super Administrator with full access',
    },
  });

  // 3. Assign ALL permissions to Admin
  console.log('🔗 Assigning All Permissions to Admin...');
  
  // Clear existing permissions to avoid duplicates/stale data
  await prisma.role_permission.deleteMany({
    where: { role_id: adminRole.id }
  });

  const rolePermissionData = allPermissionIds.map(permId => ({
    role_id: adminRole.id,
    permission_id: permId
  }));

  if (rolePermissionData.length > 0) {
    await prisma.role_permission.createMany({
      data: rolePermissionData,
      skipDuplicates: true
    });
  }
  console.log(`   - Assigned ${rolePermissionData.length} permissions to 'admin'.`);

  // 4. Ensure "Head Office" Branch exists
  console.log('🏢 Creating/Checking Head Office...');
  const headOffice = await prisma.branch.upsert({
    where: { code: 'HO-001' },
    update: {},
    create: {
      name: 'Head Office',
      code: 'HO-001',
      type: 'HeadOffice',
      address: 'Central HQ',
      phone: '000-000-0000',
    },
  });

  // 5. Create Super Admin User
  const adminEmail = 'idbconnect@gmail.com';
  const adminPassword = 'idbconnect';
  
  console.log(`👤 Creating/Checking Admin User (${adminEmail})...`);
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.partners.upsert({
    where: { email: adminEmail },
    update: {
      role_id: adminRole.id, 
      branch_id: headOffice.id 
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      mobile: '9999999999',
      password: hashedPassword,
      role_id: adminRole.id,
      branch_id: headOffice.id,
      address: 'Admin HQ',
      city: 'Central City',
      state: 'Central State',
      area: 'Admin Area',
      zone: 'North',
    },
  });

  console.log(`✅ Seeding Completed!`);
  console.log(`   - Admin Login: ${adminEmail}`);
  console.log(`   - Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });