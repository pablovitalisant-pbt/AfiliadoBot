import { describe, it, expect } from 'vitest';
import { normalizeWhatsAppNumber, resolveLidJid } from './whatsapp-utils';

describe('normalizeWhatsAppNumber', () => {
  it('acepta número de 11 dígitos sin formato', () => {
    const r = normalizeWhatsAppNumber('56920948874');
    expect(r).toEqual({ ok: true, url: 'https://wa.me/56920948874' });
  });

  it('acepta número con + y espacios', () => {
    const r = normalizeWhatsAppNumber('+56 9 2094 8874');
    expect(r).toEqual({ ok: true, url: 'https://wa.me/56920948874' });
  });

  it('acepta número con paréntesis y guiones', () => {
    const r = normalizeWhatsAppNumber('(56) 9-2094-8874');
    expect(r).toEqual({ ok: true, url: 'https://wa.me/56920948874' });
  });

  it('acepta URL wa.me completa (retrocompatibilidad)', () => {
    const r = normalizeWhatsAppNumber('https://wa.me/56920948874');
    expect(r).toEqual({ ok: true, url: 'https://wa.me/56920948874' });
  });

  it('rechaza input vacío', () => {
    const r = normalizeWhatsAppNumber('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('El número de WhatsApp es obligatorio');
  });

  it('rechaza input solo con espacios', () => {
    const r = normalizeWhatsAppNumber('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('El número de WhatsApp es obligatorio');
  });

  it('rechaza número con menos de 10 dígitos', () => {
    const r = normalizeWhatsAppNumber('12345');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/muy corto/);
  });

  it('rechaza número con más de 15 dígitos', () => {
    const r = normalizeWhatsAppNumber('1234567890123456');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/demasiados/);
  });

  it('produce el mismo output para diferentes formatos del mismo número', () => {
    const a = normalizeWhatsAppNumber('56920948874');
    const b = normalizeWhatsAppNumber('+56 9 2094 8874');
    const c = normalizeWhatsAppNumber('(56) 9-2094-8874');
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(a.url).toBe(b.url);
      expect(b.url).toBe(c.url);
    }
  });
});

describe('resolveLidJid', () => {
  it('retorna el jid tal cual si termina en @s.whatsapp.net', () => {
    const r = resolveLidJid('56912345678@s.whatsapp.net', new Map());
    expect(r).toBe('56912345678@s.whatsapp.net');
  });

  it('resuelve @lid cuando Map tiene contacto con lid matching e id válido', () => {
    const contactsMap = new Map();
    contactsMap.set('abc@lid', { lid: 'abc@lid', id: '56912345678@s.whatsapp.net' });
    const r = resolveLidJid('abc@lid', contactsMap);
    expect(r).toBe('56912345678@s.whatsapp.net');
  });

  it('retorna null si jid es @lid y Map no tiene match', () => {
    const contactsMap = new Map();
    contactsMap.set('other@lid', { lid: 'other@lid', id: '56911111111@s.whatsapp.net' });
    const r = resolveLidJid('abc@lid', contactsMap);
    expect(r).toBeNull();
  });

  it('retorna null para jid de grupo @g.us', () => {
    const r = resolveLidJid('120363025246125678@g.us', new Map());
    expect(r).toBeNull();
  });

  it('retorna null para input vacío', () => {
    const r = resolveLidJid('', new Map());
    expect(r).toBeNull();
  });

  it('retorna null si contacto matching tiene id que NO es @s.whatsapp.net', () => {
    const contactsMap = new Map();
    contactsMap.set('abc@lid', { lid: 'abc@lid', id: 'something@broadcast' });
    const r = resolveLidJid('abc@lid', contactsMap);
    expect(r).toBeNull();
  });
});
