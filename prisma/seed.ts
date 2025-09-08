
import { PrismaClient, BookStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const books = [];
  for (let i = 1; i <= 15; i++) {
    books.push({
      title: `Book Title ${i}`,
      author: `Author ${i}`,
      description: `Description for book ${i}`,
      pdfPath: `/path/to/book-${i}.pdf`,
      coverPath: `/path/to/cover-${i}.jpg`,
      genre: `Genre ${i % 5 + 1}`,
      status: i % 2 === 0 ? BookStatus.TERSEDIA : BookStatus.DIPINJAM,
      language: `Language ${i % 3 + 1}`,
    });
  }

  for (const book of books) {
    await prisma.book.create({
      data: book,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
