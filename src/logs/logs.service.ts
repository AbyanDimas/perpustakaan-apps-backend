import { prisma } from '@/lib/prisma';

export const getLogs = async () => {
  return await prisma.log.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const createLog = async (action: string, details: string) => {
  return await prisma.log.create({
    data: {
      action,
      details,
    },
  });
};

export const deleteLogs = async () => {
  await prisma.log.deleteMany();
};
