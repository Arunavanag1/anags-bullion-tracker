import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function main() {
  const email = 'arunavaknag@gmail.com';
  const password = 'Test123';
  const name = 'Arunava Knag';

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`✅ User ${email} already exists (ID: ${user.id})`);
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log(`✅ Created user: ${email} (ID: ${user.id})`);
  }

  // All new items will be created with a userId
  console.log('ℹ️  All new items will be associated with authenticated users');

  // Show summary
  const totalItems = await prisma.collectionItem.count({
    where: { userId: user.id },
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Total Items: ${totalItems}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
