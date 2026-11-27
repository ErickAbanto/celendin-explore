// Traducciones de contenido (ES -> EN) para toda la app Celendín Explore.
// Los datos base se guardan en español; estas funciones devuelven la versión
// en inglés cuando el usuario selecciona "EN" en Perfil.

const TERM_EN = {
  Todo: 'All',
  Todos: 'All',
  Guardados: 'Saved',
  Naturaleza: 'Nature',
  Cultura: 'Culture',
  Artesanía: 'Crafts',
  Aventura: 'Adventure',
  Gastronomía: 'Food',
  Hoteles: 'Hotels',
  Restaurante: 'Restaurant',
  Chocolatería: 'Chocolate Shop',
  Cafetería: 'Café',
  Hotel: 'Hotel',
  Hostal: 'Hostel',
  Libre: 'Free',
  Centro: 'Downtown',
  Destino: 'Destination',
  Soleado: 'Sunny',
  Despejado: 'Clear',
  Nublado: 'Cloudy',
  'Por llover': 'About to rain',
  Lloviendo: 'Raining',
  'Descargas eléctricas': 'Thunderstorm',
  'Lluvia ligera': 'Light rain',
  Lluvia: 'Rain',
  Tormenta: 'Storm',
  Reciente: 'Recent',
  'Viajero Explorador': 'Explorer Traveler',
  'Calzado cómodo, agua y cámara.': 'Comfortable shoes, water and camera.',
};

export function tr(value, language) {
  if (language !== 'en' || value === undefined || value === null) return value;
  return TERM_EN[value] ?? value;
}

const PLACE_EN = {
  'catarata-cornelio': {
    nombre: 'El Cornelio Waterfall',
    ubicacion: 'Jerez Village, Huasmín · Celendín',
    direccionCorta: 'Huasmín, Celendín',
    desc: 'An 80-meter waterfall formed by the Jadibamba River in the Huasmín district, surrounded by rocky cliffs and Andean flora.',
    llevar: 'Hiking boots, rain jacket and water.',
  },
  'plaza-armas': {
    nombre: 'Celendín Main Square',
    ubicacion: 'Jr. Unión & Jr. José Gálvez · Historic Center',
    direccionCorta: 'Historic Center',
    horario: 'Open 24 h · Church: 7:00 am – 8:00 pm',
    desc: "Heart of Celendín's grid-plan layout (1796), presided over by its central fountain and the Virgen del Carmen Mother Church.",
    llevar: 'Sunscreen during the day and a light jacket in the afternoon.',
  },
  'casa-sombrero': {
    nombre: 'Toquilla Straw Hat Workshops',
    ubicacion: 'Jr. Dos de Mayo & Hat Park',
    direccionCorta: 'Jr. Dos de Mayo',
    horario: 'Mon–Sat 8:30 am – 6:00 pm · Fair: Sun 6:30 am',
    desc: 'Craft shops and a Sunday fair where weavers and master hat-shapers display the traditional shilico toquilla straw hat.',
    llevar: 'Cash to buy directly from the artisans.',
  },
  'banos-llanguat': {
    nombre: 'Llanguat Hot Springs',
    ubicacion: 'Llanguat Valley, Sendamal River',
    direccionCorta: 'Llanguat Valley',
    desc: 'Warm valley with thermal-medicinal pools (>40 °C) and sugarcane mills along the Sendamal River.',
    llevar: 'Swimsuit, towel, sandals and water.',
  },
  'mirador-san-isidro': {
    nombre: 'San Isidro Viewpoint',
    ubicacion: 'West Hill, San Isidro District',
    direccionCorta: 'San Isidro District',
    desc: "Urban viewpoint crowned by a 10 m Christ the Redeemer statue with a panoramic view of Celendín's entire grid.",
    llevar: 'Comfortable shoes for the steps and a camera.',
  },
  'cerro-jelij': {
    nombre: 'Jelig Hill & Marañón Canyon',
    ubicacion: 'Celendín – Balsas Highway Km 6',
    direccionCorta: 'Road to Balsas Km 6',
    desc: 'Natural summit on the road to Balsas overlooking the Celendín countryside and the deep Marañón Canyon.',
    llevar: 'Windbreaker, sunscreen and water.',
  },
};

const DIRECTORY_EN = {
  'dir-la-reserve': {
    especialidad: 'Fried guinea pig, shilica cured meat and typical dishes',
  },
  'dir-chokosol': {
    especialidad: 'Artisanal 100% cacao drinking chocolate',
  },
  'dir-intimachay': {
    especialidad: 'Specialty coffee and country-style food',
    direccion: 'Km 3 Celendín – Cajamarca Highway',
  },
  'dir-ecosol-toquilla': {
    especialidad: 'Toquilla straw hats and chocolates',
  },
  'dir-hotel-loyers': {
    especialidad: 'Rooms with Wi-Fi, hot water and parking',
  },
  'dir-hostal-celendin': {
    especialidad: 'Lodging facing the Main Square, with restaurant',
    direccion: 'Jr. Unión 305, Main Square',
  },
};

const EMERGENCY_EN = {
  pnp: {
    titulo: 'Celendín Police Station (PNP)',
    detalle: 'Av. Cajamarca Block 1 · Hotline 105',
  },
  hospital: {
    titulo: 'Celendín Support Hospital',
    detalle: 'Av. Túpac Amaru S/N · Emergency room',
  },
  samu: {
    titulo: 'SAMU Emergencies',
    detalle: 'Free medical assistance',
  },
};

const TRANSPORT_EN = {
  'bus-palacios': {
    ruta: 'Celendín ↔ Cajamarca (morning and afternoon departures)',
  },
  'bus-virgen-carmen': {
    terminal: 'Bus Terminal · Jr. Cáceres Nº 142, Celendín',
  },
  'combi-araujo': {
    ruta: 'Celendín ↔ Cajamarca (departures from 5:00 AM)',
    terminal: 'Bus Terminal · Jr. Cáceres Nº 142 (Office 03), Celendín',
  },
  'auto-colectivos-caceres': {
    empresa: 'Direct Shared Cars to Cajamarca',
    ruta: 'Celendín ↔ Cajamarca (~2h direct via paved road)',
    terminal: 'Jr. Cáceres Nº 114 – 142 (around the Bus Terminal)',
  },
  'auto-manantial': {
    empresa: 'El Manantial / Regional Shared Cars',
    ruta: 'Celendín ↔ Cajamarca (departs once 4 passengers board)',
    terminal: 'Jr. Cáceres & Jr. Dos de Mayo, Celendín',
  },
};

export function localizePlace(item, language) {
  if (!item) return item;
  const base = { ...item, categoriaRaw: item.categoriaRaw || item.categoria };
  if (language !== 'en') return base;

  const en = PLACE_EN[item.id] || {};
  const { llevar, ...enFields } = en;
  return {
    ...base,
    ...enFields,
    categoria: tr(item.categoria, language),
    precioTexto: tr(item.precioTexto, language),
    distanciaCorta: tr(item.distanciaCorta, language),
    horario: en.horario || item.horario,
    tips: {
      ...(item.tips || {}),
      llevar: llevar || tr(item.tips?.llevar, language),
    },
    resenas: Array.isArray(item.resenas)
      ? item.resenas.map((r) => ({
          ...r,
          autor: tr(r.autor, language),
          fecha: tr(r.fecha, language),
        }))
      : item.resenas,
  };
}

export function localizeDirectoryItem(item, language) {
  if (!item || language !== 'en') return item;
  const en = DIRECTORY_EN[item.id] || {};
  return {
    ...item,
    ...en,
    categoria: tr(item.categoria, language),
    badge: tr(item.badge, language),
  };
}

export function localizeEmergency(item, language) {
  if (!item || language !== 'en') return item;
  return { ...item, ...(EMERGENCY_EN[item.id] || {}) };
}

export function localizeTransport(item, language) {
  if (!item || language !== 'en') return item;
  return { ...item, ...(TRANSPORT_EN[item.id] || {}) };
}
