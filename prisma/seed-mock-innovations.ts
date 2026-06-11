import { PrismaClient } from "@prisma/client";
import { seedMockInnovations } from "./mock-innovation-data";

const prisma = new PrismaClient();

seedMockInnovations(prisma)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
