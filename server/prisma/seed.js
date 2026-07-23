"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield prisma.role.upsert({
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
        const adminRole = yield prisma.role.findUnique({
            where: { name: "ADMIN" },
        });
        if (!adminRole) {
            throw new Error("Admin role not found!");
        }
        // 2. Create Default Administrator Account
        const adminPhone = "03000000000";
        const plainPassword = "Admin123!";
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
        const hashedPassword = yield bcrypt_1.default.hash(plainPassword, saltRounds);
        const adminUser = yield prisma.user.upsert({
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
        yield prisma.userRole.upsert({
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
        const settingsCount = yield prisma.settings.count();
        if (settingsCount === 0) {
            yield prisma.settings.create({
                data: {
                    restaurantName: "Default Restaurant",
                    phone: adminPhone,
                    address: "123 Main Street",
                    city: "Default City",
                    country: "Default Country",
                    currency: "PKR",
                    currencySymbol: "Rs",
                    timezone: "Asia/Karachi",
                    language: "en",
                    taxPercentage: 0,
                    serviceCharge: 0,
                    orderPrefix: "ORD",
                    invoicePrefix: "INV",
                    theme: "LIGHT",
                },
            });
            console.log("Default settings seeded.");
        }
        console.log("Database seeded successfully.");
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
