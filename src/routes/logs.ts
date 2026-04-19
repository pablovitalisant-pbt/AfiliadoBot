import express from 'express';
import { sql } from '../db';
import { AuthRequest, requireAuth } from '../auth';

const router = express.Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const logs = await sql`
    SELECT l.*, lead.nombre as lead_nombre, lead.url as lead_url
    FROM send_log l
    LEFT JOIN leads lead ON l.lead_id = lead.id
    WHERE l.user_id = ${req.userId}
    ORDER BY l.sent_at DESC
    LIMIT 100
  `;
  res.json(logs);
});

export default router;
