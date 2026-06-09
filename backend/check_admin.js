const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@adsight.com' } });
  console.log("Admin user:", admin);
  if (admin) {
    const isMatch = await bcrypt.compare('password123', admin.password);
    console.log("Does 'password123' match?", isMatch);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
