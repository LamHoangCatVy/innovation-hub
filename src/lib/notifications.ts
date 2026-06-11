import { prisma } from "@/lib/db";

export async function createNotification(userId: string, data: {
  type: string;
  title: string;
  body: string;
  innovationId?: string;
}) {
  return prisma.notification.create({
    data: { userId, ...data },
  });
}
