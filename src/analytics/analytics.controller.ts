import { Request, Response } from 'express';
import { getAnalytics } from './analytics.service';

export const analyticsController = async (req: Request, res: Response) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
