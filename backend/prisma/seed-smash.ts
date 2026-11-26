import { PrismaClient } from '@prisma/client';
import { seedSmashClient } from '../src/digital/smash-seed';

const prisma = new PrismaClient();

seedSmashClient(prisma)
  .catch((e) => {
    console.error('❌ Error provisionando Smash:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
