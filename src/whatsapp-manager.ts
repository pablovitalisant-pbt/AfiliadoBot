import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  AuthenticationState
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { UserScheduler } from './scheduler';
import { sql } from './db';
import { Boom } from '@hapi/boom';

class WhatsAppManager {
  private sockets: Map<string, any> = new Map();
  private schedulers: Map<string, UserScheduler> = new Map();
  private qrData: Map<string, string> = new Map();
  private eventEmitters: Map<string, ((data: any) => void)[]> = new Map();

  async getOrCreateSocket(userId: string) {
    if (this.sockets.has(userId)) return this.sockets.get(userId);

    const authPath = path.join(process.cwd(), 'auth', userId);
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      logger: pino({ level: 'silent' }),
    });

    this.sockets.set(userId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrData.set(userId, qr);
        this.emit(userId, { type: 'qr', data: qr });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.sockets.delete(userId);
        this.qrData.delete(userId);
        this.emit(userId, { type: 'status', data: 'disconnected' });

        if (shouldReconnect) {
          this.getOrCreateSocket(userId);
        } else {
          this.disconnectUser(userId);
        }
      } else if (connection === 'open') {
        this.qrData.delete(userId);
        this.emit(userId, { type: 'status', data: 'connected' });
        console.log(`WhatsApp connected for user ${userId}`);
        this.initializeScheduler(userId);
      }
    });

    return sock;
  }

  private async initializeScheduler(userId: string) {
    if (!this.schedulers.has(userId)) {
      const scheduler = new UserScheduler(userId);
      this.schedulers.set(userId, scheduler);
      
      const [config] = await sql`SELECT running FROM bot_config WHERE user_id = ${userId}`;
      if (config?.running) {
        scheduler.start();
      }
    }
  }

  async disconnectUser(userId: string) {
    const sock = this.sockets.get(userId);
    if (sock) {
      await sock.logout();
      this.sockets.delete(userId);
    }
    const scheduler = this.schedulers.get(userId);
    if (scheduler) {
      scheduler.stop();
      this.schedulers.delete(userId);
    }
    this.qrData.delete(userId);

    // Remove auth folder
    const authPath = path.join(process.cwd(), 'auth', userId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
  }

  getStatus(userId: string) {
    const connected = !!(this.sockets.has(userId) && this.sockets.get(userId)?.user);
    return {
      connected,
      qr: this.qrData.get(userId)
    };
  }

  getSocket(userId: string) {
    return this.sockets.get(userId);
  }

  getScheduler(userId: string) {
    return this.schedulers.get(userId);
  }

  on(userId: string, callback: (data: any) => void) {
    if (!this.eventEmitters.has(userId)) {
      this.eventEmitters.set(userId, []);
    }
    this.eventEmitters.get(userId)!.push(callback);
  }

  private emit(userId: string, data: any) {
    const listeners = this.eventEmitters.get(userId);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }
}

export const waManager = new WhatsAppManager();
