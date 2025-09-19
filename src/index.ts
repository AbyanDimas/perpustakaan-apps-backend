import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';

import { prisma } from '@/lib/prisma';
import { limiter } from '@/middleware/rateLimiter';
import { trackVisitor } from '@/middleware/visitorTracking';

import analyticsRouter from '@/analytics/analytics.router';
import booksRouter from '@/books/books.router';
import genresRouter from '@/genres/genres.router';
import languagesRouter from '@/languages/languages.router';
import logsRouter from '@/logs/logs.router';
import sseRouter from '@/sse/sse.router';
import statsRouter from '@/stats/stats.router';
import serverInfoRouter from '@/serverinfo/serverinfo.router';

dotenv.config();

const app = express();
const port = 5000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${port}`;

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(limiter);
app.use(trackVisitor);

const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/api/analytics', analyticsRouter);
app.use('/api/books', booksRouter);
app.use('/api/genres', genresRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/sse', sseRouter);
app.use('/api/stats', statsRouter);
app.use('/api/serverinfo', serverInfoRouter);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('DB check failed:', err);
    res.status(500).json({error: 'Database connection failed'})
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on ${API_BASE_URL}`);
});
