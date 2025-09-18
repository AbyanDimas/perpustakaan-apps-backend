import { Request, Response } from 'express';
import { getBooks, createBook, updateBook, deleteBook } from './books.service';
import { sendEventToClients } from '../sse/sse.service';
import cache from 'memory-cache';

export const getBooksController = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[Cache] HIT: ${cacheKey}`);
    return res.json(cachedData);
  }
  console.log(`[Cache] MISS: ${cacheKey}`);

  try {
    const books = await getBooks(req.query);
    cache.put(cacheKey, books, 10 * 60 * 1000); // 10-minute cache
    res.json(books);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBookController = async (req: Request, res: Response) => {
  try {
    const book = await createBook(req.body, req.files);
    sendEventToClients({ type: 'BOOK_ADDED', payload: book });
    res.status(201).json(book);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateBookController = async (req: Request, res: Response) => {
  try {
    const book = await updateBook(req.params.id, req.body, req.files);
    sendEventToClients({ type: 'BOOK_UPDATED', payload: book });
    res.json(book);
  } catch (error: any) {
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const deleteBookController = async (req: Request, res: Response) => {
  try {
    await deleteBook(req.params.id);
    sendEventToClients({ type: 'BOOK_DELETED', payload: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
