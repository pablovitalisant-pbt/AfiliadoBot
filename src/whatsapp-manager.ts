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
import { eventBus } from './lib/event-bus';
import { resolveLidJid } from './lib/whatsapp-utils';

const featureFlagsPath = path.join(process.cwd(), 'config', 'feature-flags.json');
let featureFlags: Record<string, boolean> = {};
try {
  featureFlags = JSON.parse(fs.readFileSync(featureFlagsPath, 'utf-8'));
} catch (err) {
  console.warn('Could not load feature flags, using defaults:', (err as Error).message);
}

class WhatsAppManager {
  private sockets: Map<string, any> = new Map();
  private schedulers: Map<string, UserScheduler> = new Map();
  private qrData: Map<string, string> = new Map();
  private eventEmitters: Map<string, ((data: any) => void)[]> = new Map();
  private contactsMap: Map<string, Map<string, any>> = new Map();
  private groupsMap: Map<string, Map<string, any>> = new Map();
  private syncTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isSyncing: Map<string, boolean> = new Map();

  private getUserContactsMap(userId: string): Map<string, any> {
    if (!this.contactsMap.has(userId)) this.contactsMap.set(userId, new Map());
    return this.contactsMap.get(userId)!;
  }

  private getUserGroupsMap(userId: string): Map<string, any> {
    if (!this.groupsMap.has(userId)) this.groupsMap.set(userId, new Map());
    return this.groupsMap.get(userId)!;
  }

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

    sock.ev.on('contacts.update', (updates: any[]) => {
      if (!featureFlags.capture_contacts_and_groups) return;
      const userContacts = this.getUserContactsMap(userId);
      for (const contact of updates) {
        if (!contact?.id) continue;
        const existing = userContacts.get(contact.id) || {};
        userContacts.set(contact.id, { ...existing, ...contact });
      }
      this.debounceFlush(userId);
    });

    sock.ev.on('contacts.upsert', (newContacts: any[]) => {
      if (!featureFlags.capture_contacts_and_groups) return;
      const userContacts = this.getUserContactsMap(userId);
      for (const contact of newContacts) {
        if (!contact?.id) continue;
        const existing = userContacts.get(contact.id) || {};
        userContacts.set(contact.id, { ...existing, ...contact });
      }
      this.debounceFlush(userId);
    });

    sock.ev.on('messaging-history.set', async ({ chats, contacts: newContacts }: any) => {
      if (!featureFlags.capture_contacts_and_groups) return;
      const userContacts = this.getUserContactsMap(userId);
      const userGroups = this.getUserGroupsMap(userId);

      if (newContacts) {
        for (const contact of newContacts) {
          if (!contact?.id) continue;
          const existing = userContacts.get(contact.id) || {};
          userContacts.set(contact.id, { ...existing, ...contact });
        }
      }

      const rawGroups = (chats || []).filter(
        (c: any) => c?.id && typeof c.id === 'string' && c.id.endsWith('@g.us')
      );
      for (const group of rawGroups) {
        try {
          const metadata = await sock.groupMetadata(group.id);
          userGroups.set(group.id, { ...group, participants: metadata.participants });
        } catch (e) {
          userGroups.set(group.id, group);
        }
      }

      this.debounceFlush(userId);
    });

    sock.ev.on('groups.upsert', async (newGroups: any[]) => {
      if (!featureFlags.capture_contacts_and_groups) return;
      const userGroups = this.getUserGroupsMap(userId);
      for (const group of newGroups) {
        if (!group?.id) continue;
        try {
          const metadata = await sock.groupMetadata(group.id);
          userGroups.set(group.id, { ...group, participants: metadata.participants });
        } catch (e) {
          userGroups.set(group.id, group);
        }
      }
      this.debounceFlush(userId);
    });

    return sock;
  }

  private debounceFlush(userId: string) {
    if (!this.isSyncing.get(userId)) {
      this.isSyncing.set(userId, true);
      eventBus.emit(userId, { type: 'syncing', data: true });
    }
    const existing = this.syncTimeouts.get(userId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.flushToDb(userId).catch((err) => {
        console.error(`flushToDb error for user ${userId}:`, err);
      });
    }, 3000);
    this.syncTimeouts.set(userId, timer);
  }

  private async flushToDb(userId: string) {
    const userContacts = this.getUserContactsMap(userId);
    const userGroups = this.getUserGroupsMap(userId);

    let contactsUpserted = 0;
    let groupsUpserted = 0;

    try {
      for (const [jid, contact] of userContacts.entries()) {
        if (jid.endsWith('@g.us')) continue;

        let realJid: string | null = null;
        if (jid.endsWith('@s.whatsapp.net')) {
          realJid = jid;
        } else if (jid.endsWith('@lid')) {
          realJid = resolveLidJid(jid, userContacts);
        }
        if (!realJid) continue;

        const phone = realJid.split('@')[0];
        if (!/^\d+$/.test(phone)) continue;

        const name = contact?.name || contact?.verifiedName || contact?.notify || null;

        await sql`
          INSERT INTO contacts (user_id, jid, name, notify, verified_name, phone, synced_at)
          VALUES (${userId}, ${realJid}, ${name}, ${contact?.notify || null}, ${contact?.verifiedName || null}, ${phone}, NOW())
          ON CONFLICT (user_id, jid) DO UPDATE SET
            name = EXCLUDED.name,
            notify = EXCLUDED.notify,
            verified_name = EXCLUDED.verified_name,
            phone = EXCLUDED.phone,
            synced_at = NOW()
        `;
        contactsUpserted++;
      }

      for (const [jid, group] of userGroups.entries()) {
        await sql`
          INSERT INTO whatsapp_groups (user_id, jid, subject, participants, synced_at)
          VALUES (${userId}, ${jid}, ${group?.subject || null}, ${JSON.stringify(group?.participants || [])}::jsonb, NOW())
          ON CONFLICT (user_id, jid) DO UPDATE SET
            subject = EXCLUDED.subject,
            participants = EXCLUDED.participants,
            synced_at = NOW()
        `;
        groupsUpserted++;
      }
    } finally {
      this.isSyncing.set(userId, false);
      eventBus.emit(userId, { type: 'syncing', data: false });
      eventBus.emit(userId, {
        type: 'contacts_synced',
        data: { contacts: contactsUpserted, groups: groupsUpserted },
      });
    }
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

    // Cleanup contact/group capture state
    this.contactsMap.delete(userId);
    this.groupsMap.delete(userId);
    const timer = this.syncTimeouts.get(userId);
    if (timer) clearTimeout(timer);
    this.syncTimeouts.delete(userId);
    this.isSyncing.delete(userId);
  }

  async restoreSocket(userId: string) {
    if (this.sockets.has(userId)) return;
    await this.getOrCreateSocket(userId);
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
