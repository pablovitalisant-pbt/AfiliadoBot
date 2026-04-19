import { DateTime } from 'luxon';
import { sql } from './db';
import { waManager } from './whatsapp-manager';

const DM_INTERVALS = [0, 3, 7, 12, 21];

export class UserScheduler {
  userId: string;
  running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    await sql`UPDATE bot_config SET running = true WHERE user_id = ${this.userId}`;
    this.intervalId = setInterval(() => this.tick(), 10000);
    console.log(`Scheduler started for user ${this.userId}`);
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    await sql`UPDATE bot_config SET running = false WHERE user_id = ${this.userId}`;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log(`Scheduler stopped for user ${this.userId}`);
  }

  async tick() {
    try {
      // 1. Load config
      const [config] = await sql`SELECT * FROM bot_config WHERE user_id = ${this.userId}`;
      if (!config || !config.running) {
        if (this.running) this.stop();
        return;
      }

      // 2. Validate time and days (Chile timezone)
      const now = DateTime.now().setZone('America/Santiago');
      const currentHour = now.hour;
      const currentDay = now.weekday; // 1 (Mon) to 7 (Sun)

      if (!config.allowed_days.includes(currentDay)) return;
      if (currentHour < config.start_hour || currentHour >= config.end_hour) return;

      // 3. Daily limit check
      const todayStart = now.startOf('day').toJSDate();
      const [{ count }] = await sql`
        SELECT count(*) FROM send_log 
        WHERE user_id = ${this.userId} AND sent_at >= ${todayStart}
      `;
      if (parseInt(count) >= config.max_daily) return;

      // 4. WhatsApp connection check
      const socket = waManager.getSocket(this.userId);
      if (!socket) return;

      // 5. Select lead to message
      // Priority 1: Follow-ups (F4)
      const leadsF4 = await sql`
        SELECT * FROM leads 
        WHERE user_id = ${this.userId} 
        AND estado = 'dm' 
        AND (f3->>'dm1_enviado')::boolean = true 
        AND (f3->>'dm1_respondio')::boolean = false
      `;

      for (const lead of leadsF4) {
        const dms = lead.f4.dms;
        const lastSent = lead.f3.fechaEnvio ? DateTime.fromISO(lead.f3.fechaEnvio) : null;
        if (!lastSent) continue;

        const daysSinceStart = Math.floor(now.diff(lastSent, 'days').days);
        
        // Find if any DM in F4 is due
        for (let i = 0; i < dms.length; i++) {
          const dmIndex = i + 2; // F4 starts at DM2
          const intervalDay = DM_INTERVALS[i + 1]; // next interval
          if (!dms[i].e && daysSinceStart >= intervalDay) {
            await this.sendMessage(lead, dmIndex, i);
            return; // Send one per tick
          }
        }
      }

      // Priority 2: Cold leads (Frio)
      const [coldLead] = await sql`
        SELECT * FROM leads 
        WHERE user_id = ${this.userId} 
        AND estado = 'frio' 
        AND (f3->>'dm1_enviado')::boolean = false 
        AND url LIKE '%wa.me/%'
        LIMIT 1
      `;

      if (coldLead) {
        await this.sendMessage(coldLead, 1);
        return;
      }

    } catch (error) {
      console.error(`Scheduler error for user ${this.userId}:`, error);
    }
  }

  private async sendMessage(lead: any, dmNumber: number, f4Index?: number) {
    const socket = waManager.getSocket(this.userId);
    if (!socket) return;

    // Get random message variant
    const variants = await sql`
      SELECT * FROM messages 
      WHERE user_id = ${this.userId} AND dm = ${dmNumber}
    `;
    if (variants.length === 0) return;

    const variant = variants[Math.floor(Math.random() * variants.length)];
    let text = lead.nombre ? variant.con_nombre.replace('{nombre}', lead.nombre) : variant.generico;

    // Extract phone from URL: https://wa.me/569...
    const phoneMatch = lead.url.match(/wa\.me\/(\d+)/);
    if (!phoneMatch) return;
    const jid = `${phoneMatch[1]}@s.whatsapp.net`;

    // Random delay 15-45s
    const delay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
    setTimeout(async () => {
      try {
        await socket.sendMessage(jid, { text });
        
        // Update DB
        if (dmNumber === 1) {
          const f3 = { ...lead.f3, dm1_enviado: true, fechaEnvio: new Date().toISOString() };
          await sql`
            UPDATE leads SET estado = 'dm', f3 = ${JSON.stringify(f3)}, updated_at = NOW() 
            WHERE id = ${lead.id}
          `;
        } else if (f4Index !== undefined) {
          const dms = [...lead.f4.dms];
          dms[f4Index] = { ...dms[f4Index], e: true, fechaEnvio: new Date().toISOString() };
          await sql`
            UPDATE leads SET f4 = ${JSON.stringify({ dms })}, updated_at = NOW() 
            WHERE id = ${lead.id}
          `;
        }

        // Log
        await sql`
          INSERT INTO send_log (user_id, lead_id, dm, mensaje_variant, estado) 
          VALUES (${this.userId}, ${lead.id}, ${dmNumber}, ${variant.variant}, 'enviado')
        `;

        console.log(`Message sent to ${jid} for user ${this.userId}`);
      } catch (err) {
        console.error(`Failed to send message to ${jid}:`, err);
      }
    }, delay);
  }
}
