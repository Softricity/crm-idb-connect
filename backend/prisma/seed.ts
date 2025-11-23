// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Data Migration...');

  // 1. Create Head Office if it doesn't exist
  let headOffice = await prisma.branch.findUnique({
    where: { code: 'HO-001' },
  });

  if (!headOffice) {
    console.log('🏢 Creating Head Office...');
    headOffice = await prisma.branch.create({
      data: {
        name: 'Head Office',
        code: 'HO-001',
        type: 'HeadOffice',
        address: 'Central HQ',
        phone: '000-000-0000',
      },
    });
  } else {
    console.log('✅ Head Office already exists.');
  }

  // 2. Assign all Orphaned Partners to Head Office
  const partnersUpdate = await prisma.partners.updateMany({
    where: { branch_id: null },
    data: { branch_id: headOffice.id },
  });
  console.log(`👥 Assigned ${partnersUpdate.count} partners to Head Office.`);

  // 3. Assign all Orphaned Leads to Head Office
  const leadsUpdate = await prisma.leads.updateMany({
    where: { branch_id: null },
    data: { branch_id: headOffice.id },
  });
  console.log(`📉 Assigned ${leadsUpdate.count} leads to Head Office.`);

  console.log('✨ Migration Completed!');

  const announcementsUpdate = await prisma.announcements.updateMany({
    where: { 
      target_audience: 'branch',
      branch_id: null 
    },
    data: { branch_id: headOffice.id },
  });
  console.log(`📢 Assigned ${announcementsUpdate.count} announcements to Head Office.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });