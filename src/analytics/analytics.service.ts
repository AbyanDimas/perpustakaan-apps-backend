import { prisma } from '@/lib/prisma';

export const getAnalytics = async () => {
  const analytics = await prisma.dailyVisitor.findMany({
    orderBy: { date: 'asc' },
    take: 30, // Last 30 days
  });
  return analytics;
};
