import { Request, Response } from 'express';
import { getLogs, createLog, deleteLogs } from './logs.service';

export const getLogsController = async (req: Request, res: Response) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const createLogController = async (req: Request, res: Response) => {
  const { action, details } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required.' });
  }

  try {
    const log = await createLog(action, details);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
};

export const deleteLogsController = async (req: Request, res: Response) => {
  try {
    await deleteLogs();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete logs' });
  }
};
