import { Request, Response } from 'express';
import { getLanguages } from './languages.service';

export const languagesController = async (req: Request, res: Response) => {
  try {
    const languages = await getLanguages();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
};
