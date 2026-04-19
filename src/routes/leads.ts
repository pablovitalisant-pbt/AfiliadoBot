import express from 'express';
import { sql } from '../db';
import { AuthRequest, requireAuth } from '../auth';
import { normalizeWhatsAppNumber } from '../lib/whatsapp-utils';

const router = express.Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const leads = await sql`
    SELECT * FROM leads WHERE user_id = ${req.userId} ORDER BY updated_at DESC
  `;
  res.json(leads);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { nombre, url, pais, notas } = req.body;

  const normalized = normalizeWhatsAppNumber(url ?? '');
  if (!normalized.ok) return res.status(400).json({ error: normalized.error });

  try {
    const [lead] = await sql`
      INSERT INTO leads (user_id, nombre, url, pais, notas)
      VALUES (${req.userId}, ${nombre}, ${normalized.url}, ${pais || 'Otro'}, ${notas})
      RETURNING *
    `;
    res.json(lead);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({
        error: 'duplicate',
        message: 'Este número de WhatsApp ya existe en tus leads'
      });
    }
    throw err;
  }
});

router.post('/bulk', requireAuth, async (req: AuthRequest, res) => {
  const leads = req.body; // Array of { nombre, telefono, wa_url }
  if (!Array.isArray(leads)) return res.status(400).json({ error: 'Invalid data' });

  let duplicates = 0;
  for (const l of leads) {
    try {
      await sql`
        INSERT INTO leads (user_id, nombre, url)
        VALUES (${req.userId}, ${l.nombre}, ${l.wa_url || l.url})
      `;
    } catch (err: any) {
      if (err?.code === '23505') {
        duplicates++;
      } else {
        throw err;
      }
    }
  }
  res.json({ success: true, duplicates });
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { nombre, url, pais, notas, estado, f3, f4, f5 } = req.body;
  
  try {
    const [updated] = await sql`
      UPDATE leads SET
        nombre = ${nombre},
        url = ${url},
        pais = ${pais},
        notas = ${notas},
        estado = ${estado},
        f3 = ${JSON.stringify(f3)},
        f4 = ${JSON.stringify(f4)},
        f5 = ${JSON.stringify(f5)},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({
        error: 'duplicate',
        message: 'Este número de WhatsApp ya existe en tus leads'
      });
    }
    throw err;
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  await sql`DELETE FROM leads WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
  res.json({ success: true });
});

export default router;
