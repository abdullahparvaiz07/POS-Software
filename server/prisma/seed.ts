import { PrismaClient, CurrencyType, ThemeMode } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create Roles
  const roles = [
    "ADMIN",
    "MANAGER",
    "CASHIER",
    "CHEF",
    "BARTENDER",
    "WAITER",
    "RIDER",
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} Role`,
        isSystem: true,
        isActive: true,
      },
    });
  }
  console.log("Roles seeded.");

  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  if (!adminRole) {
    throw new Error("Admin role not found!");
  }

  // 2. Create Default Administrator Account
  const adminPhone = "03000000000";
  const plainPassword = "Admin123!";
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      fullName: "Administrator",
      phone: adminPhone,
      password: hashedPassword,
      joiningDate: new Date(),
      status: "ACTIVE",
    },
  });
  console.log("Admin user seeded.");

  // 3. Assign the ADMIN role to that user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log("Admin role assigned to admin user.");

  // 4. Create the default Settings record
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        restaurantName: "Default Restaurant",
        phone: adminPhone,
        address: "123 Main Street",
        city: "Default City",
        country: "Default Country",
        currency: "PKR" as CurrencyType,
        currencySymbol: "Rs",
        timezone: "Asia/Karachi",
        language: "en",
        taxPercentage: 0,
        serviceCharge: 0,
        orderPrefix: "ORD",
        invoicePrefix: "INV",
        theme: "LIGHT" as ThemeMode,
      },
    });
    console.log("Default settings seeded.");
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
