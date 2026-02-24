const { PrismaClient } = require('@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.watchlist.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user (FREE tier, $10,000)
  const demoPasswordHash = await bcrypt.hash('demo1234', 10);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@papertrade.com',
      passwordHash: demoPasswordHash,
      balance: 10000.0,
      subscriptionTier: 'FREE',
    },
  });

  // Create premium user (PREMIUM tier, $50,000)
  const premiumPasswordHash = await bcrypt.hash('premium1234', 10);
  const premiumUser = await prisma.user.create({
    data: {
      name: 'Premium User',
      email: 'premium@papertrade.com',
      passwordHash: premiumPasswordHash,
      balance: 50000.0,
      subscriptionTier: 'PREMIUM',
    },
  });

  // Create subscriptions
  await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: premiumUser.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt: new Date('2027-02-24'),
    },
  });

  // Create holdings for premium user
  await prisma.holding.createMany({
    data: [
      {
        userId: premiumUser.id,
        stockSymbol: 'AAPL',
        quantity: 10,
        avgBuyPrice: 178.50,
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'GOOGL',
        quantity: 5,
        avgBuyPrice: 141.25,
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'TSLA',
        quantity: 8,
        avgBuyPrice: 248.00,
      },
    ],
  });

  // Create sample transactions for premium user
  await prisma.transaction.createMany({
    data: [
      {
        userId: premiumUser.id,
        stockSymbol: 'AAPL',
        type: 'BUY',
        quantity: 10,
        pricePerShare: 178.50,
        totalAmount: 1785.00,
        createdAt: new Date('2026-01-15'),
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'GOOGL',
        type: 'BUY',
        quantity: 5,
        pricePerShare: 141.25,
        totalAmount: 706.25,
        createdAt: new Date('2026-01-20'),
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'TSLA',
        type: 'BUY',
        quantity: 8,
        pricePerShare: 248.00,
        totalAmount: 1984.00,
        createdAt: new Date('2026-02-01'),
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'MSFT',
        type: 'BUY',
        quantity: 3,
        pricePerShare: 410.75,
        totalAmount: 1232.25,
        createdAt: new Date('2026-02-05'),
      },
      {
        userId: premiumUser.id,
        stockSymbol: 'MSFT',
        type: 'SELL',
        quantity: 3,
        pricePerShare: 425.00,
        totalAmount: 1275.00,
        createdAt: new Date('2026-02-10'),
      },
    ],
  });

  // Create a sample transaction for demo user
  await prisma.transaction.create({
    data: {
      userId: demoUser.id,
      stockSymbol: 'NVDA',
      type: 'BUY',
      quantity: 2,
      pricePerShare: 890.00,
      totalAmount: 1780.00,
      createdAt: new Date('2026-02-20'),
    },
  });

  // Create watchlist items
  await prisma.watchlist.createMany({
    data: [
      { userId: demoUser.id, stockSymbol: 'AAPL' },
      { userId: demoUser.id, stockSymbol: 'TSLA' },
      { userId: demoUser.id, stockSymbol: 'NVDA' },
      { userId: premiumUser.id, stockSymbol: 'AMZN' },
      { userId: premiumUser.id, stockSymbol: 'META' },
      { userId: premiumUser.id, stockSymbol: 'NFLX' },
      { userId: premiumUser.id, stockSymbol: 'MSFT' },
    ],
  });

  console.log('Seed data created successfully!');
  console.log(`  Demo user: ${demoUser.email} (${demoUser.id})`);
  console.log(`  Premium user: ${premiumUser.email} (${premiumUser.id})`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
