import express from 'express';
import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';
import { sql } from '../db';
import { eventBus } from '../lib/event-bus';
import { waManager } from '../whatsapp-manager';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

router.get('/stream', async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Compute and emit snapshot
    const now = DateTime.now().setZone('America/Santiago');
    const todayStart = now.startOf('day').toJSDate();

    const [{ count: totalLeads }] = await sql`
      SELECT count(*) FROM leads WHERE user_id = ${userId}
    `;
    const [{ count: pendingFollowups }] = await sql`
      SELECT count(*) FROM leads
      WHERE user_id = ${userId}
        AND estado = 'frio'
        AND (f3->>'dm1_enviado')::boolean = false
    `;
    const [{ count: sentToday }] = await sql`
      SELECT count(*) FROM send_log
      WHERE user_id = ${userId} AND sent_at >= ${todayStart}
    `;
    const [config] = await sql`SELECT max_daily FROM bot_config WHERE user_id = ${userId}`;
    const connected = waManager.getStatus(userId).connected;

    send({
      type: 'snapshot',
      data: {
        totalLeads: parseInt(totalLeads),
        sentToday: parseInt(sentToday),
        maxDaily: config?.max_daily ?? 20,
        pendingFollowups: parseInt(pendingFollowups),
        connected,
      },
    });

    const unsubscribe = eventBus.subscribe(userId, (event) => send(event));
    const keepAlive = setInterval(() => res.write(':keepalive\n\n'), 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  } catch {
    res.status(401).end();
  }
});

export default router;
