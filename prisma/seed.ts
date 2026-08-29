import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@test.com";
  const adminPassword = "tajne123";
  const userEmail = "user@test.com";
  const userPassword = "tajne123";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedUserPassword = await bcrypt.hash(userPassword, 10);

  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedAdminPassword,
        name: "Admin",
        role: "admin",
      },
    });

    console.log("Admin created:", admin.email);
  } else {
    admin = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedAdminPassword,
        role: "admin",
        name: "Admin",
      },
    });

    console.log("Admin updated:", admin.email);
  }

  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedUserPassword,
        name: "User",
        role: "user",
      },
    });

    console.log("User created:", user.email);
  } else {
    user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        password: hashedUserPassword,
        name: "User",
        role: "user",
      },
    });

    console.log("User updated:", user.email);
  }

  const existingSales = await prisma.affiliateSale.findMany({
    where: { userId: user.id },
  });

  if (existingSales.length === 0) {
    await prisma.affiliateSale.createMany({
      data: [
        {
          userId: user.id,
          buyer: "client1",
          amount: 35,
          status: "Pending",
        },
        {
          userId: user.id,
          buyer: "client2",
          amount: 30,
          status: "Approved",
        },
        {
          userId: user.id,
          buyer: "client3",
          amount: 30,
          status: "Paid",
        },
      ],
    });

    console.log("Affiliate sales created (user)");
  } else {
    console.log("Affiliate sales already exist (user)");
  }

  const existingStats = await prisma.dashboardStat.findUnique({
    where: { userId: user.id },
  });

  if (!existingStats) {
    await prisma.dashboardStat.create({
      data: {
        userId: user.id,
        clicks: 1284,
        sales: 18,
        conversion: 13.6,
        monthlyPnl: 4280,
      },
    });

    console.log("Dashboard stats created (user)");
  } else {
    console.log("Stats already exist (user)");
  }

  const existingAffiliateStats = await prisma.affiliateStat.findUnique({
    where: { userId: user.id },
  });

  if (!existingAffiliateStats) {
    await prisma.affiliateStat.create({
      data: {
        userId: user.id,
        availablePayout: 420,
        pendingCommission: 210,
        totalEarned: 630,
      },
    });

    console.log("Affiliate stats created (user)");
  } else {
    console.log("Affiliate stats already exist (user)");
  }

  const existingPayout = await prisma.payoutRequest.findFirst({
    where: { userId: user.id },
  });

  if (!existingPayout) {
    await prisma.payoutRequest.create({
      data: {
        userId: user.id,
        amount: 100,
        status: "Pending",
      },
    });

    console.log("Payout request created");
  } else {
    console.log("Payout already exists");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("SEED ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  });