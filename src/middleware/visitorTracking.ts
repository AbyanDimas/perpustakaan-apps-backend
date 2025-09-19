import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

export const trackVisitor = async (req: Request, res: Response, next: NextFunction) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.dailyVisitor.update({
      where: { date: today },
      data: { count: { increment: 1 } },
    });
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to update not found.
      try {
        await prisma.dailyVisitor.create({ data: { date: today, count: 1 } });
      } catch (e) {
        // In case of a race condition where another request created the record in the meantime
        console.error("Failed to create visitor record after update failed:", e);
      }
    } else {
      console.error("Failed to track visitor:", error);
    }
  }
  next();
};
