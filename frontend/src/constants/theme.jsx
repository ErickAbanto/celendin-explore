export const COLORS = {
  background: '#F4F6F5',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',
  cardActive: '#ECFDF5',
  primary: '#0F5C41',
  primaryLight: '#107C53',
  primarySoft: '#E6F4EE',
  accent: '#F5A623',
  accentLight: '#FBBF24',
  pink: '#E11D48',
  pinkSoft: '#FFE4E6',
  button: '#0F5C41',
  text: '#111827',
  textMain: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#107C53',
};

export const DARK_COLORS = {
  background: '#050A08',
  card: '#0F1815',
  cardAlt: '#15221D',
  cardActive: '#102B21',
  primary: '#0F5C41',
  primaryLight: '#34D399',
  primarySoft: '#123327',
  accent: '#F5A623',
  accentLight: '#FBBF24',
  pink: '#FB7185',
  pinkSoft: '#3A1522',
  button: '#107C53',
  text: '#F9FAFB',
  textMain: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#1F2F28',
  success: '#34D399',
};

export function getColors(darkMode) {
  return darkMode ? DARK_COLORS : COLORS;
}
