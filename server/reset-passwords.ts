import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPasswords() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    data: { password: hash }
  });
  console.log('All passwords reset to password123');
}

resetPasswords().finally(() => prisma.$disconnect());
