import { PrismaClient, UserStatus, PreparationArea, PricingMode, PrinterType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedProdData() {
  console.log('Starting production data seed...');
  try {
    // 1. Roles
    const rolesData = [
      { name: 'ADMIN', description: 'System Administrator' },
      { name: 'MANAGER', description: 'Restaurant Manager' },
      { name: 'CASHIER', description: 'POS Cashier' },
      { name: 'KITCHEN', description: 'Kitchen Staff' },
      { name: 'BAR', description: 'Bar Staff' }
    ];

    const roleMap: Record<string, number> = {};
    for (const r of rolesData) {
      let role = await prisma.role.findFirst({ where: { name: r.name } });
      if (!role) {
        role = await prisma.role.create({ data: r });
      }
      roleMap[r.name] = role.id;
    }

    // 2. Users
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    const usersToCreate = [
      { fullName: 'Admin User', phone: '0000000001', email: 'admin@restaurant.com', role: 'ADMIN' },
      { fullName: 'Manager User', phone: '0000000002', email: 'manager@restaurant.com', role: 'MANAGER' },
      { fullName: 'Cashier One', phone: '0000000003', email: 'cashier@restaurant.com', role: 'CASHIER' },
      { fullName: 'Kitchen Chef', phone: '0000000004', email: 'kitchen@restaurant.com', role: 'KITCHEN' },
      { fullName: 'Bar Tender', phone: '0000000005', email: 'bar@restaurant.com', role: 'BAR' }
    ];

    for (const u of usersToCreate) {
      const existing = await prisma.user.findFirst({ where: { OR: [{ phone: u.phone }, { email: u.email }] } });
      if (!existing) {
        const user = await prisma.user.create({
          data: {
            fullName: u.fullName,
            phone: u.phone,
            email: u.email,
            password: defaultPassword,
            joiningDate: new Date(),
            status: UserStatus.ACTIVE
          }
        });
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: roleMap[u.role]
          }
        });
      }
    }

    // 3. Settings
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          restaurantName: 'The Great Restaurant',
          phone: '+1 800 123 4567',
          address: '123 Main Street',
          city: 'Metropolis',
          country: 'United States',
          currency: 'USD',
          currencySymbol: '$',
          timezone: 'America/New_York',
          language: 'en',
          taxPercentage: 10.0,
          allowNegativeInventory: false
        }
      });
    }

    // 4. Categories & Menu Items
    const adminId = (await prisma.user.findFirst({ where: { email: 'admin@restaurant.com' } }))?.id || 1;
    const categories = [
      { name: 'Appetizers', slug: 'appetizers', description: 'Starters' },
      { name: 'Mains', slug: 'mains', description: 'Main Courses' },
      { name: 'Beverages', slug: 'beverages', description: 'Drinks' }
    ];

    const categoryMap: Record<string, number> = {};
    for (const c of categories) {
      let cat = await prisma.category.findFirst({ where: { slug: c.slug } });
      if (!cat) {
        cat = await prisma.category.create({ 
          data: {
            ...c,
            createdByUser: { connect: { id: adminId } },
            updatedByUser: { connect: { id: adminId } }
          }
        });
      }
      categoryMap[c.name] = cat.id;
    }

    // Menu Items
    const menuItems = [
      { name: 'Caesar Salad', slug: 'caesar-salad', price: 12.00, categoryName: 'Appetizers', preparationArea: PreparationArea.KITCHEN, pricingMode: PricingMode.SINGLE_PRICE, isAvailable: true },
      { name: 'Classic Burger', slug: 'classic-burger', price: 18.00, categoryName: 'Mains', preparationArea: PreparationArea.KITCHEN, pricingMode: PricingMode.SINGLE_PRICE, isAvailable: true },
      { name: 'Margherita Pizza', slug: 'margherita-pizza', price: 20.00, categoryName: 'Mains', preparationArea: PreparationArea.KITCHEN, pricingMode: PricingMode.SINGLE_PRICE, isAvailable: true },
      { name: 'Coca Cola', slug: 'coca-cola', price: 3.50, categoryName: 'Beverages', preparationArea: PreparationArea.BAR, pricingMode: PricingMode.SINGLE_PRICE, isAvailable: true }
    ];

    for (const m of menuItems) {
      const existingItem = await prisma.menuItem.findFirst({ where: { slug: m.slug } });
      if (!existingItem) {
        await prisma.menuItem.create({ 
          data: {
            name: m.name,
            slug: m.slug,
            isAvailable: m.isAvailable,
            preparationArea: m.preparationArea,
            pricingMode: m.pricingMode,
            category: { connect: { id: categoryMap[m.categoryName] } },
            createdByUser: { connect: { id: adminId } },
            updatedByUser: { connect: { id: adminId } },
            variants: {
              create: [
                {
                  name: 'Regular',
                  price: m.price,
                  isDefault: true,
                  isAvailable: true,
                  createdByUser: { connect: { id: adminId } },
                  updatedByUser: { connect: { id: adminId } }
                }
              ]
            }
          }
        });
      }
    }

    // 5. Printers
    const existingPrinters = await prisma.printer.findMany();
    if (existingPrinters.length === 0) {
      await prisma.printer.createMany({
        data: [
          { name: 'Receipt Printer', ipAddress: '192.168.1.100', port: 9100, type: PrinterType.RECEIPT, isDefault: true },
          { name: 'Kitchen Printer', ipAddress: '192.168.1.101', port: 9100, type: PrinterType.KITCHEN, isDefault: false },
          { name: 'Bar Printer', ipAddress: '192.168.1.102', port: 9100, type: PrinterType.BAR, isDefault: false }
        ]
      });
    }

    console.log('Production data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProdData();
