import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, name) 
      VALUES (${email}, ${password_hash}, ${name}) 
      RETURNING id, email, name
    `;
    
    // Create default bot config
    await sql`INSERT INTO bot_config (user_id) VALUES (${user.id})`;

    // Insert default messages (2 variants for DM1 as requested)
    const defaultMessages = [
      { dm: 1, variant: 1, con_nombre: "Hola {nombre}, ¿cómo está? Soy Pablo, de la Zofri en Iquique. Le escribo súper breve — ¿usted o alguien de su equipo está vendiendo por lives en Facebook o Instagram actualmente?", generico: "Hola case, ¿cómo está? Soy Pablo, de la Zofri en Iquique. Le escribo súper breve — ¿usted o alguien de su equipo está vendiendo por lives en Facebook o Instagram actualmente?" },
      { dm: 1, variant: 2, con_nombre: "Hola {nombre}, ¿todo bien? Pablo por acá, de la Zofri en Iquique. Oiga, consulta rápida: ¿han probado hacer lives de ventas en Facebook o Instagram?", generico: "Hola case, ¿todo bien? Pablo por acá, de la Zofri en Iquique. Oiga, consulta rápida: ¿han probado hacer lives de ventas en Facebook o Instagram?" }
    ];

    for (const msg of defaultMessages) {
      await sql`
        INSERT INTO messages (user_id, dm, variant, con_nombre, generico) 
        VALUES (${user.id}, ${msg.dm}, ${msg.variant}, ${msg.con_nombre}, ${msg.generico})
      `;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
