export function normalizePhonePair(rawInput, fallback = '51976579996') {
  const rawPhone = String(rawInput || `+${fallback}`).trim();
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const whatsapp =
    digitsOnly.length === 9 && digitsOnly.startsWith('9')
      ? `51${digitsOnly}`
      : digitsOnly || fallback;
  const telefono = rawPhone.startsWith('+') ? rawPhone : `+${whatsapp}`;
  return { telefono, whatsapp };
}
