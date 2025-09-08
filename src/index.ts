import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cache from 'memory-cache';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = 3001;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${port}`;

// --- SSE Setup ---
let clients: { id: number; res: express.Response }[] = [];

const sendEventToClients = (data: any) => {
  console.log('Sending event to all clients:', data);
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}

`));
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
// --- End SSE Setup ---

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware to count visitors
app.use(async (req, res, next) => {
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
});

app.use(cors());
app.use(express.json());

// Security Best Practices
// Helmet untuk mengatur berbagai header HTTP keamanan
app.use(helmet());

// Rate limiting untuk mencegah penyalahgunaan API
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 10000, // Batasi setiap IP hingga 100 permintaan per `window`
	standardHeaders: true, // Kembalikan info rate limit di header `RateLimit-*`
	legacyHeaders: false, // Nonaktifkan header `X-RateLimit-*`
});

// Terapkan middleware rate limiting hanya ke endpoint API
const bookUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 50000, // Batasi setiap IP hingga 5 permintaan per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan upload buku, coba lagi setelah 1 menit',
});

app.use('/api', (req, res, next) => {
  // SSE endpoint should not be rate-limited in the same way
  if (req.path === '/books/stream') {
    return next();
  }
  if (req.path === '/books' && req.method === 'POST') {
    return bookUploadLimiter(req, res, next);
  }
  limiter(req, res, next);
});

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const getFullUrl = (filePath: string | null | undefined) => {
  if (!filePath) return null;
  return `${API_BASE_URL}/uploads/${path.basename(filePath)}`;
};

// --- SSE Endpoint ---
app.get('/api/books/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
  console.log(`Client ${clientId} connected to SSE stream.`);

  // Send a welcome message to the client
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to SSE' })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
    console.log(`Client ${clientId} disconnected.`);
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalBooks = await prisma.book.count();
    const availableBooks = await prisma.book.count({ where: { status: 'TERSEDIA' } });
    const borrowedBooks = totalBooks - availableBooks;
    const totalVisitors = await prisma.dailyVisitor.aggregate({ _sum: { count: true } });

    res.json({
      totalBooks,
      availableBooks,
      borrowedBooks,
      totalVisitors: totalVisitors._sum.count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await prisma.dailyVisitor.findMany({
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
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
    res.json(genres.map(g => g.genre));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/languages', async (req, res) => {
  try {
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
    res.json(languages.map(l => l.language));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

app.get('/api/books', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[Cache] HIT: ${cacheKey}`);
    return res.json(cachedData);
  }
  console.log(`[Cache] MISS: ${cacheKey}`);

  const { sort, order = 'asc', genre, status, search, limit } = req.query;

  try {
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

    const booksWithFullPaths = books.map(book => ({
      ...book,
      pdfPath: getFullUrl(book.pdfPath),
      coverPath: getFullUrl(book.coverPath),
    }));

    cache.put(cacheKey, booksWithFullPaths, 10 * 60 * 1000); // 10-minute cache
    res.json(booksWithFullPaths);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.post('/api/books', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  const { title, author, description, genre, status, language } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const pdfFile = files?.['pdf']?.[0];
  const coverImageFile = files?.['coverImage']?.[0];

  if (!title || !author || !description || !genre || !pdfFile) {
    return res.status(400).json({ error: 'Title, author, description, genre, and a PDF file are required.' });
  }

  if (status && !['TERSEDIA', 'DIPINJAM'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided.' });
  }

  try {
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
    
    const bookWithFullPaths = {
      ...newBook,
      pdfPath: getFullUrl(newBook.pdfPath),
      coverPath: getFullUrl(newBook.coverPath),
    };

    sendEventToClients({ type: 'BOOK_ADDED', payload: bookWithFullPaths });
    clearBooksCache();

    res.status(201).json(bookWithFullPaths);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.put('/api/books/:id', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  const { title, author, description, genre, status, language } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const pdfFile = files?.['pdf']?.[0];
  const coverImageFile = files?.['coverImage']?.[0];

  if (status && !['TERSEDIA', 'DIPINJAM'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided.' });
  }

  try {
    const existingBook = await prisma.book.findUnique({ where: { id } });
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
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
    
    const bookWithFullPaths = {
      ...updatedBook,
      pdfPath: getFullUrl(updatedBook.pdfPath),
      coverPath: getFullUrl(updatedBook.coverPath),
    };

    sendEventToClients({ type: 'BOOK_UPDATED', payload: bookWithFullPaths });
    clearBooksCache();

    res.json(bookWithFullPaths);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
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

    sendEventToClients({ type: 'BOOK_DELETED', payload: { id } });
    clearBooksCache();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.post('/api/logs', async (req, res) => {
  const { action, details } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required.' });
  }

  try {
    const log = await prisma.log.create({
      data: {
        action,
        details,
      },
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await prisma.log.deleteMany();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete logs' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on ${API_BASE_URL}`);
});
