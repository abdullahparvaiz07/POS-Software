import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateProdData() {
  console.log('Validating production database state...');

  const usersCount = await prisma.user.count();
  console.log(`Users: ${usersCount}`);

  const rolesCount = await prisma.role.count();
  console.log(`Roles: ${rolesCount}`);

  const categoriesCount = await prisma.category.count();
  console.log(`Categories: ${categoriesCount}`);

  const menuItemsCount = await prisma.menuItem.count();
  console.log(`Menu Items: ${menuItemsCount}`);

  const settingsCount = await prisma.settings.count();
  console.log(`Settings: ${settingsCount}`);

  const printersCount = await prisma.printer.count();
  console.log(`Printers: ${printersCount}`);

  const ordersCount = await prisma.order.count();
  console.log(`Orders: ${ordersCount}`);

  if (usersCount > 0 && categoriesCount > 0 && menuItemsCount > 0 && ordersCount === 0) {
    console.log('Validation passed: Database is clean and ready for production.');
  } else {
    console.error('Validation failed: Missing data or test data still exists.');
  }
}

validateProdData().catch(console.error).finally(() => prisma.$disconnect());
