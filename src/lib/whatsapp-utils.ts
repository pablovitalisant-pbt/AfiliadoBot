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
