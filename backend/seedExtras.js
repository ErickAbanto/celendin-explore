// Datos iniciales reales de Celendín para las colecciones administrables
// (Inicio, Emergencias y Transporte). Se insertan una sola vez en MongoDB.

const homeBanners = [
  {
    id: 'inicio-portada',
    etiqueta: 'PORTADA',
    titulo: 'Explora Celendín',
    subtitulo:
      'Naturaleza, cultura y gastronomía en la provincia de Celendín, Cajamarca.',
    destino: 'Lugares',
    orden: 1,
  },
];

const emergencyNumbers = [
  {
    id: 'pnp',
    titulo: 'Comisaría PNP Celendín',
    numero: '964 765 077',
    tel: '964765077',
    detalle: 'Av. Cajamarca Cdra. 1 · Central 105',
    orden: 1,
  },
  {
    id: 'hospital',
    titulo: 'Hospital de Apoyo Celendín',
    numero: '971 764 243',
    tel: '971764243',
    detalle: 'Av. Túpac Amaru S/N · Emergencias',
    orden: 2,
  },
  {
    id: 'samu',
    titulo: 'SAMU Emergencias',
    numero: '106',
    tel: '106',
    detalle: 'Atención médica gratuita',
    orden: 3,
  },
];

const transportAgencies = [
  {
    id: 'bus-palacios',
    tipo: 'buses',
    empresa: 'Transportes Palacios',
    ruta: 'Celendín ↔ Cajamarca (Salidas mañana y tarde)',
    terminal: 'Jr. Pardo Nº 462, Celendín',
    orden: 1,
  },
  {
    id: 'bus-royal-palace',
    tipo: 'buses',
    empresa: "Transportes Royal Palace's",
    ruta: 'Celendín ↔ Cajamarca ↔ Lima',
    terminal: 'Jr. Unión Nº 405, Celendín',
    orden: 2,
  },
  {
    id: 'bus-virgen-carmen',
    tipo: 'buses',
    empresa: 'Turismo Virgen del Carmen',
    ruta: 'Celendín ↔ Cajamarca',
    terminal: 'Terminal Terrestre · Jr. Cáceres Nº 142, Celendín',
    orden: 3,
  },
  {
    id: 'combi-araujo',
    tipo: 'combis',
    empresa: 'Transportes Araujo (Combis / Minivans)',
    ruta: 'Celendín ↔ Cajamarca (Salidas desde las 5:00 AM)',
    terminal: 'Terminal Terrestre · Jr. Cáceres Nº 142 (Of. 03), Celendín',
    orden: 4,
  },
  {
    id: 'combi-rojas',
    tipo: 'combis',
    empresa: 'Transporte y Turismo Rojas',
    ruta: 'Celendín ↔ La Encañada ↔ Cajamarca',
    terminal: 'Av. Amazonas Nº 313, Celendín',
    orden: 5,
  },
  {
    id: 'auto-colectivos-caceres',
    tipo: 'autos',
    empresa: 'Autos Colectivos Directos a Cajamarca',
    ruta: 'Celendín ↔ Cajamarca (~2h directo vía asfaltada)',
    terminal: 'Jr. Cáceres Nº 114 – 142 (Entorno Terminal Terrestre)',
    orden: 6,
  },
  {
    id: 'auto-manantial',
    tipo: 'autos',
    empresa: 'Colectivos El Manantial / Regionales',
    ruta: 'Celendín ↔ Cajamarca (Salidas continuas al completar 4 pasajeros)',
    terminal: 'Jr. Cáceres con Jr. Dos de Mayo, Celendín',
    orden: 7,
  },
];

// IDs de establecimientos ficticios antiguos que deben retirarse de la BD
const legacyDirectoryIds = [
  'dir-tradicion-shilica',
  'dir-chocolateria-eden',
  'dir-taller-toquilla',
  'dir-hotel-edendelnorte',
  'dir-posada-san-isidro',
];

module.exports = {
  homeBanners,
  emergencyNumbers,
  transportAgencies,
  legacyDirectoryIds,
};
