import express from 'express';
import { sql } from '../db';
import { AuthRequest, requireAuth } from '../auth';

const router = express.Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const leads = await sql`
    SELECT * FROM leads WHERE user_id = ${req.userId} ORDER BY created_at DESC
  `;
  res.json(leads);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { nombre, url, pais, notas } = req.body;
  const [lead] = await sql`
    INSERT INTO leads (user_id, nombre, url, pais, notas) 
    VALUES (${req.userId}, ${nombre}, ${url}, ${pais || 'Otro'}, ${notas}) 
    RETURNING *
  `;
  res.json(lead);
});

router.post('/bulk', requireAuth, async (req: AuthRequest, res) => {
  const leads = req.body; // Array of { nombre, telefono, wa_url }
  if (!Array.isArray(leads)) return res.status(400).json({ error: 'Invalid data' });

  for (const l of leads) {
    // Check duplicate by url
    const [exists] = await sql`SELECT id FROM leads WHERE user_id = ${req.userId} AND url = ${l.wa_url || l.url}`;
    if (!exists) {
      await sql`
        INSERT INTO leads (user_id, nombre, url) 
        VALUES (${req.userId}, ${l.nombre}, ${l.wa_url || l.url})
      `;
    }
  }
  res.json({ success: true });
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { nombre, url, pais, notas, estado, f3, f4, f5 } = req.body;
  
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
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  await sql`DELETE FROM leads WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
  res.json({ success: true });
});

export default router;
