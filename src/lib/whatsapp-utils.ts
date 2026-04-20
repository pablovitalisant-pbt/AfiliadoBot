export type NormalizeResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function normalizeWhatsAppNumber(input: string): NormalizeResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: 'El número de WhatsApp es obligatorio' };
  }

  const digits = trimmed.replace(/[^0-9]/g, '');

  if (digits.length < 10) {
    return { ok: false, error: 'Número inválido: muy corto (mínimo 10 dígitos incluyendo código de país)' };
  }
  if (digits.length > 15) {
    return { ok: false, error: 'Número inválido: demasiados dígitos' };
  }

  return { ok: true, url: `https://wa.me/${digits}` };
}

export function resolveLidJid(
  jid: string,
  contactsMap: Map<string, any>
): string | null {
  if (!jid) return null;

  // JID ya es real (@s.whatsapp.net) → retornar tal cual
  if (jid.endsWith('@s.whatsapp.net')) return jid;

  // JIDs de grupo no son contactos individuales
  if (jid.endsWith('@g.us')) return null;

  // JIDs @lid → buscar contacto con lid matching y id @s.whatsapp.net
  if (jid.endsWith('@lid')) {
    for (const contact of contactsMap.values()) {
      const match = (contact?.lid === jid || contact?.id === jid);
      if (match && typeof contact?.id === 'string' && contact.id.endsWith('@s.whatsapp.net')) {
        return contact.id;
      }
    }
    return null;
  }

  // Cualquier otro formato → null
  return null;
}
