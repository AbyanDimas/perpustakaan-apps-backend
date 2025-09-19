import { prisma } from '../lib/prisma';
import { getFullUrl } from '@/lib/utils';
import fs from 'fs';
import path from 'path';
import cache from 'memory-cache';

const uploadDir = path.join(__dirname, '../../uploads');

export const getBooks = async (query: any) => {
  const { sort, order = 'asc', genre, status, search, limit } = query;

  const where: any = {};
  if (genre) where.genre = genre as string;
  if (status) where.status = status as any;
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { author: { contains: search as string } },
      { description: { contains: search as string } },
      { genre: { contains: search as string } },
    ];
  }

  const orderBy: any = {};
  if (sort) {
    orderBy[sort as string] = order;
  } else {
    orderBy.createdAt = 'desc';
  }

  const take = limit ? parseInt(limit as string) : undefined;

  const books = await prisma.book.findMany({ where, orderBy, take });

  return books.map(book => ({
    ...book,
    pdfPath: getFullUrl(book.pdfPath),
    coverPath: getFullUrl(book.coverPath),
  }));
};

export const createBook = async (body: any, files: any) => {
  const { title, author, description, genre, status, language } = body;
  const pdfFile = files?.['pdf']?.[0];
  const coverImageFile = files?.['coverImage']?.[0];

  if (!title || !author || !description || !genre || !pdfFile) {
    throw new Error('Title, author, description, genre, and a PDF file are required.');
  }

  if (status && !['TERSEDIA', 'DIPINJAM'].includes(status)) {
    throw new Error('Invalid status provided.');
  }

  const newBook = await prisma.book.create({
    data: {
      title,
      author,
      description,
      genre,
      status: status || 'TERSEDIA',
      language: language || 'Unknown',
      pdfPath: pdfFile ? `uploads/${pdfFile.filename}` : null,
      coverPath: coverImageFile ? `uploads/${coverImageFile.filename}` : null,
    },
  });

  clearBooksCache();
  return {
    ...newBook,
    pdfPath: getFullUrl(newBook.pdfPath),
    coverPath: getFullUrl(newBook.coverPath),
  };
};

export const updateBook = async (id: string, body: any, files: any) => {
  const { title, author, description, genre, status, language } = body;
  const pdfFile = files?.['pdf']?.[0];
  const coverImageFile = files?.['coverImage']?.[0];

  if (status && !['TERSEDIA', 'DIPINJAM'].includes(status)) {
    throw new Error('Invalid status provided.');
  }

  const existingBook = await prisma.book.findUnique({ where: { id } });
  if (!existingBook) {
    throw new Error('Book not found');
  }

  const dataToUpdate: any = { title, author, description, genre, status, language };

  if (pdfFile) {
    dataToUpdate.pdfPath = `uploads/${pdfFile.filename}`;
  }
  if (coverImageFile) {
    dataToUpdate.coverPath = `uploads/${coverImageFile.filename}`;
  }

  const updatedBook = await prisma.book.update({
    where: { id },
    data: dataToUpdate,
  });

  const unlinkFile = (filePath: string | null) => {
    if (!filePath) return;
    const oldFilePath = path.join(uploadDir, path.basename(filePath));
    fs.unlink(oldFilePath, (err) => {
      if (err) console.error(`Failed to delete old file: ${oldFilePath}`, err);
    });
  };

  if (pdfFile && existingBook.pdfPath) {
    unlinkFile(existingBook.pdfPath);
  }
  if (coverImageFile && existingBook.coverPath) {
    unlinkFile(existingBook.coverPath);
  }

  clearBooksCache();
  return {
    ...updatedBook,
    pdfPath: getFullUrl(updatedBook.pdfPath),
    coverPath: getFullUrl(updatedBook.coverPath),
  };
};

export const deleteBook = async (id: string) => {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new Error('Book not found');
  }

  await prisma.book.delete({ where: { id } });

  const unlinkFile = (filePath: string | null) => {
    if (!filePath) return;
    const oldFilePath = path.join(uploadDir, path.basename(filePath));
    fs.unlink(oldFilePath, (err) => {
      if (err) console.error(`Failed to delete file: ${oldFilePath}`, err);
    });
  };

  unlinkFile(book.pdfPath);
  unlinkFile(book.coverPath);

  clearBooksCache();
};

const clearBooksCache = () => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('/api/books')) {
      cache.del(key);
    }
  });
  console.log('Book cache cleared.');
};
