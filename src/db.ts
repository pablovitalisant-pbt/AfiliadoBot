import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * Helper to ensure tables exist.
 */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      nombre TEXT,
      url TEXT NOT NULL,
      pais TEXT DEFAULT 'Otro',
      notas TEXT,
      estado TEXT DEFAULT 'frio',
      fecha TIMESTAMPTZ DEFAULT NOW(),
      f3 JSONB DEFAULT '{"dm1_enviado": false, "dm1_respondio": false, "fechaEnvio": null}',
      f4 JSONB DEFAULT '{"dms": [{"e":false,"r":false,"fechaEnvio":null},{"e":false,"r":false,"fechaEnvio":null},{"e":false,"r":false,"fechaEnvio":null},{"e":false,"r":false,"fechaEnvio":null}]}',
      f5 JSONB DEFAULT '{"descartado": false}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      dm INTEGER NOT NULL,
      variant INTEGER NOT NULL,
      con_nombre TEXT NOT NULL,
      generico TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bot_config (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      running BOOLEAN DEFAULT false,
      max_daily INTEGER DEFAULT 20,
      start_hour INTEGER DEFAULT 9,
      end_hour INTEGER DEFAULT 18,
      allowed_days INTEGER[] DEFAULT '{1,2,3,4,5}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS send_log (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      dm INTEGER NOT NULL,
      mensaje_variant INTEGER NOT NULL,
      estado TEXT DEFAULT 'enviado',
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
