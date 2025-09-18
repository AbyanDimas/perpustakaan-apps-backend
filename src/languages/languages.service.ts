import { prisma } from '../lib/prisma';

export const getLanguages = async () => {
  const languages = await prisma.book.findMany({
    where: {
      language: {
        not: null,
      },
    },
    distinct: ['language'],
    select: {
      language: true,
    },
  });
  return languages.map(l => l.language);
};
