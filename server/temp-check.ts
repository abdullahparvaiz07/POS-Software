import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany().then(users => console.log(users.map(u => ({ phone: u.phone, email: u.email })))).finally(() => prisma.$disconnect());
