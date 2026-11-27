const cleanText = (value, max) => String(value || '').trim().slice(0, max);

function slugifyId(prefix, text) {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const suffix = Date.now().toString(36).slice(-4);
  return `${prefix}-${base || 'item'}-${suffix}`;
}

function toPlainObject(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (typeof obj.imagen === 'string' && obj.imagen.startsWith('/images/')) {
    obj.imagen = '';
  }
  return obj;
}

function normalizePhonePair(rawInput, whatsappInput, fallback = '51976000000') {
  const rawPhone = cleanText(rawInput || whatsappInput || `+${fallback}`, 25);
  const digitsOnly = String(whatsappInput || rawPhone).replace(/\D/g, '');
  const whatsapp =
    digitsOnly.length === 9 && digitsOnly.startsWith('9')
      ? `51${digitsOnly}`
      : digitsOnly || fallback;
  const telefono = rawPhone.startsWith('+') ? rawPhone : `+${whatsapp}`;
  return { telefono, whatsapp };
}

module.exports = {
  cleanText,
  slugifyId,
  toPlainObject,
  normalizePhonePair,
};
