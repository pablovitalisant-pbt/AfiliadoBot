import express from 'express';
import { sql } from '../db';
import { AuthRequest, requireAuth } from '../auth';

const router = express.Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const messages = await sql`
    SELECT * FROM messages WHERE user_id = ${req.userId} ORDER BY dm, variant
  `;
  res.json(messages);
});

router.put('/', requireAuth, async (req: AuthRequest, res) => {
  const messages = req.body; // Array of { dm, variant, con_nombre, generico }
  
  await sql`DELETE FROM messages WHERE user_id = ${req.userId}`;
  
  for (const m of messages) {
    await sql`
      INSERT INTO messages (user_id, dm, variant, con_nombre, generico) 
      VALUES (${req.userId}, ${m.dm}, ${m.variant}, ${m.con_nombre}, ${m.generico})
    `;
  }
  
  res.json({ success: true });
});

router.get('/template', (req, res) => {
  res.json([
    { "dm": 1, "variant": 1, "con_nombre": "Hola {nombre}, mensaje DM1 variante 1", "generico": "Hola case, mensaje DM1 variante 1" },
    { "dm": 1, "variant": 2, "con_nombre": "Hola {nombre}, mensaje DM1 variante 2", "generico": "Hola case, mensaje DM1 variante 2" },
    { "dm": 2, "variant": 1, "con_nombre": "Hola {nombre}, seguimiento día 3", "generico": "Hola case, seguimiento día 3" }
  ]);
});

export default router;
