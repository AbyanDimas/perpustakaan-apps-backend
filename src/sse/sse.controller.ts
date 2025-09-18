import { Request, Response } from 'express';
import { addClient, removeClient } from './sse.service';

export const sseController = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  addClient(newClient);

  // Send a welcome message to the client
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to SSE' })}\n\n`);

  req.on('close', () => {
    removeClient(clientId);
  });
};
