import { PrismaClient, CurrencyType, ThemeMode } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportBackup() {
  console.log('--- Step 1: Taking pre-migration snapshot ---');
  
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `db-snapshot-${timestamp}.json`);

  // Basic backup of crucial tables to preserve
  const users = await prisma.user.findMany();
  const settings = await prisma.settings.findFirst();

  fs.writeFileSync(backupFile, JSON.stringify({ users, settings }, null, 2));
  console.log(`Backup saved to ${backupFile}`);
}

async function purgeDemoData() {
  console.log('--- Step 2: Purging Demo Data ---');
  
  // Transaction to ensure FK constraints don't break
  await prisma.$transaction(async (tx) => {
    // Queues
    await tx.kitchenQueue.deleteMany();
    await tx.barQueue.deleteMany();

    // Orders
    await tx.printJob.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.orderCounter.deleteMany();

    // Inventory & Purchases
    await tx.stockMovement.deleteMany();
    await tx.purchaseItem.deleteMany();
    await tx.purchase.deleteMany();
    
    // Recipes & Menu
    await tx.recipeItem.deleteMany();
    await tx.recipe.deleteMany();
    await tx.menuVariant.deleteMany();
    await tx.menuItem.deleteMany();
    await tx.category.deleteMany();
    
    // Core suppliers/ingredients
    await tx.ingredient.deleteMany();
    await tx.supplier.deleteMany();
    await tx.unit.deleteMany();

    // Clean all users except ADMIN
    const nonAdminUsers = await tx.user.findMany({
      where: {
        userRoles: {
          none: {
            role: {
              name: 'ADMIN'
            }
          }
        }
      }
    });

    for (const u of nonAdminUsers) {
      // Must delete userRoles first
      await tx.userRole.deleteMany({ where: { userId: u.id } });
      await tx.user.delete({ where: { id: u.id } });
    }
  });

  console.log('Demo data successfully purged.');
}

async function seedProductionData() {
  console.log('--- Step 3: Seeding Production Data ---');

  const adminUser = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { name: 'ADMIN' } } } }
  });

  if (!adminUser) {
    throw new Error('No ADMIN user found to attribute creation.');
  }

  // 1. Core Units
  await prisma.unit.createMany({
    data: [
      { name: 'Kilogram', shortName: 'kg', unitType: 'WEIGHT', isBaseUnit: true, conversionFactor: 1 },
      { name: 'Gram', shortName: 'g', unitType: 'WEIGHT', isBaseUnit: false, conversionFactor: 0.001 },
      { name: 'Liter', shortName: 'L', unitType: 'VOLUME', isBaseUnit: true, conversionFactor: 1 },
      { name: 'Milliliter', shortName: 'ml', unitType: 'VOLUME', isBaseUnit: false, conversionFactor: 0.001 },
      { name: 'Piece', shortName: 'pc', unitType: 'COUNT', isBaseUnit: true, conversionFactor: 1 },
    ],
    skipDuplicates: true
  });

  // 2. Initial Categories
  await prisma.category.createMany({
    data: [
      { name: 'Starters', slug: 'starters', displayOrder: 1, createdBy: adminUser.id, updatedBy: adminUser.id },
      { name: 'Main Course', slug: 'main-course', displayOrder: 2, createdBy: adminUser.id, updatedBy: adminUser.id },
      { name: 'Desserts', slug: 'desserts', displayOrder: 3, createdBy: adminUser.id, updatedBy: adminUser.id },
      { name: 'Beverages', slug: 'beverages', displayOrder: 4, createdBy: adminUser.id, updatedBy: adminUser.id },
    ],
    skipDuplicates: true
  });

  // 3. Production Settings
  const settingsCount = await prisma.settings.count();
  if (settingsCount > 0) {
    // Update existing
    const s = await prisma.settings.findFirst();
    if (s) {
      await prisma.settings.update({
        where: { id: s.id },
        data: {
          restaurantName: 'The Fine Dine Restaurant',
          currency: 'PKR',
          currencySymbol: 'Rs',
          taxPercentage: 16,
          serviceCharge: 5,
          timezone: 'Asia/Karachi',
          autoDeductInventory: true,
          printTax: true
        }
      });
    }
  } else {
    // Create new
    await prisma.settings.create({
      data: {
        restaurantName: 'The Fine Dine Restaurant',
        phone: '111-222-333',
        address: 'Downtown Avenue',
        city: 'Metropolis',
        country: 'Pakistan',
        currency: 'PKR',
        currencySymbol: 'Rs',
        taxPercentage: 16,
        serviceCharge: 5,
        timezone: 'Asia/Karachi',
        language: 'en',
        orderPrefix: 'POS',
        invoicePrefix: 'INV',
        theme: 'LIGHT',
        autoDeductInventory: true
      }
    });
  }

  console.log('Production parameters successfully seeded.');
}

async function validateState() {
  console.log('--- Step 4: Validation Check ---');

  const usersCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const ordersCount = await prisma.order.count();

  console.log(`Validation Results:
    Users remaining: ${usersCount} (Expected >= 1)
    Categories: ${categoryCount} (Expected 4)
    Orders remaining: ${ordersCount} (Expected 0)
  `);

  if (usersCount === 0) throw new Error('Validation failed: No admin users left.');
  if (categoryCount === 0) throw new Error('Validation failed: Categories failed to seed.');
  if (ordersCount > 0) throw new Error('Validation failed: Orders were not successfully cleared.');

  console.log('ALL VALIDATION CHECKS PASSED.');
}

async function runMigration() {
  try {
    await exportBackup();
    await purgeDemoData();
    await seedProductionData();
    await validateState();
    
    console.log('====================================');
    console.log('PRODUCTION MIGRATION COMPLETED SUCCESSFULLY');
    console.log('====================================');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
