// src/serverinfo/serverinfo.router.ts
import { Router, Request, Response } from 'express';
import { getServerIp } from '@/serverinfo/serverinfo.service';

const router = Router();

router.get('/ip', (req: Request, res: Response) => {
  const ips = getServerIp();
  res.json({ serverIps: ips });
});

export default router;

