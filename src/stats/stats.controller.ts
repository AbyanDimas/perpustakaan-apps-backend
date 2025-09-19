import { Request, Response } from 'express';
import { getStats } from '@/stats/stats.service';

export const statsController = async (req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
