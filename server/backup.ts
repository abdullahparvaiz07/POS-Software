import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const backupDir = path.join(process.cwd(), 'backups', 'pre_prod_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Get all models from Prisma
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof (prisma as any)[k].findMany === 'function');
  
  for (const model of models) {
    console.log(`Backing up ${model}...`);
    try {
      const data = await (prisma as any)[model].findMany();
      fs.writeFileSync(path.join(backupDir, `${model}.json`), JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Failed to backup ${model}:`, e);
    }
  }

  console.log('Backup completed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
