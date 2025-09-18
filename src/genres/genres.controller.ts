import { Request, Response } from 'express';
import { getGenres } from './genres.service';

export const genresController = async (req: Request, res: Response) => {
  try {
    const genres = await getGenres();
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
};
