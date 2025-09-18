import { prisma } from '../lib/prisma';

export const getStats = async () => {
  const totalBooks = await prisma.book.count();
  const availableBooks = await prisma.book.count({ where: { status: 'TERSEDIA' } });
  const borrowedBooks = totalBooks - availableBooks;
  const totalVisitors = await prisma.dailyVisitor.aggregate({ _sum: { count: true } });

  return {
    totalBooks,
    availableBooks,
    borrowedBooks,
    totalVisitors: totalVisitors._sum.count || 0,
  };
};
