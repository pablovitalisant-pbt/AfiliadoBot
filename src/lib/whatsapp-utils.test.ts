import { describe, it, expect } from 'vitest';
import { normalizeWhatsAppNumber } from './whatsapp-utils';

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
