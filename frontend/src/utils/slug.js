export function buildSlugId(prefix, text) {
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
