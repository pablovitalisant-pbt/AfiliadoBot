import express from 'express';
import { sql } from '../db';
import { AuthRequest, requireAuth } from '../auth';
import { waManager } from '../whatsapp-manager';
import { DateTime } from 'luxon';

const router = express.Router();

router.get('/config', requireAuth, async (req: AuthRequest, res) => {
  const [config] = await sql`SELECT * FROM bot_config WHERE user_id = ${req.userId}`;
  res.json(config);
});

router.post('/config', requireAuth, async (req: AuthRequest, res) => {
  const { max_daily, start_hour, end_hour, allowed_days } = req.body;
  const [updated] = await sql`
    UPDATE bot_config SET 
      max_daily = ${max_daily}, 
      start_hour = ${start_hour}, 
      end_hour = ${end_hour}, 
      allowed_days = ${allowed_days},
      updated_at = NOW()
    WHERE user_id = ${req.userId}
    RETURNING *
  `;
  res.json(updated);
});

router.post('/start', requireAuth, async (req: AuthRequest, res) => {
  await waManager.restoreSocket(req.userId!);
  // wait a moment for connection
  await new Promise(r => setTimeout(r, 2000));
  const scheduler = waManager.getScheduler(req.userId!);
  if (scheduler) {
    await scheduler.start();
    res.json({ success: true });
  } else {
    // If no scheduler, it means WhatsApp is not connected
    const [config] = await sql`UPDATE bot_config SET running = true WHERE user_id = ${req.userId} RETURNING *`;
    res.json({ success: true, message: 'Bot will start once WhatsApp connects', config });
  }
});

router.post('/stop', requireAuth, async (req: AuthRequest, res) => {
  const scheduler = waManager.getScheduler(req.userId!);
  if (scheduler) {
    await scheduler.stop();
  } else {
    await sql`UPDATE bot_config SET running = false WHERE user_id = ${req.userId}`;
  }
  res.json({ success: true });
});

router.get('/status', requireAuth, async (req: AuthRequest, res) => {
  let [config] = await sql`SELECT * FROM bot_config WHERE user_id = ${req.userId}`;
  if (!config) {
    [config] = await sql`
      INSERT INTO bot_config (user_id) VALUES (${req.userId})
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    if (!config) [config] = await sql`SELECT * FROM bot_config WHERE user_id = ${req.userId}`;
  }
  
  const now = DateTime.now().setZone('America/Santiago');
  const todayStart = now.startOf('day').toJSDate();
  const [{ count }] = await sql`
    SELECT count(*) FROM send_log 
    WHERE user_id = ${req.userId} AND sent_at >= ${todayStart}
  `;

  res.json({
    running: config?.running || false,
    dailyCount: parseInt(count),
    maxDaily: config?.max_daily,
    startHour: config?.start_hour,
    endHour: config?.end_hour,
    allowedDays: config?.allowed_days
  });
});

export default router;
