import { prisma } from '../lib/prisma';

export const getGenres = async () => {
  const genres = await prisma.book.findMany({
    where: {
      genre: {
        not: null,
      },
    },
    distinct: ['genre'],
    select: {
      genre: true,
    },
  });
  return genres.map(g => g.genre);
};
