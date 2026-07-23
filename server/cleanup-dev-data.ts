import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDevData() {
  console.log('Starting cleanup of development data...');

  try {
    // Delete transactional data
    console.log('Deleting Orders & Queues...');
    await prisma.printJob.deleteMany();
    await prisma.kitchenQueue.deleteMany();
    await prisma.barQueue.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.orderCounter.deleteMany();

    // Delete inventory & purchase data
    console.log('Deleting Purchases & Inventory...');
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.stockMovement.deleteMany();
    
    // Delete catalog data
    console.log('Deleting Catalog Data...');
    await prisma.menuVariant.deleteMany();
    await prisma.recipeItem.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.supplier.deleteMany();
    
    // Delete operations data
    console.log('Deleting Operations Data...');
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.backup.deleteMany();
    await prisma.printer.deleteMany();
    
    // Delete non-admin users
    console.log('Deleting Users...');
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (adminRole) {
      // First delete userRoles for non-admins
      await prisma.userRole.deleteMany({
        where: {
          roleId: { not: adminRole.id }
        }
      });
      // Then delete users
      await prisma.user.deleteMany({
        where: {
          userRoles: {
            none: {
              roleId: adminRole.id
            }
          }
        }
      });
    }

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDevData();
