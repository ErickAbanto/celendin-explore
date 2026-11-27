export const ADMIN_NUMERIC_PIN = '20262026';

export const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

export const PLACE_CATEGORIES = ['Naturaleza', 'Cultura', 'Artesanía', 'Aventura'];
export const DIR_CATEGORIES = ['Gastronomía', 'Artesanía', 'Hoteles'];

export const PERFIL_SECTIONS = [
  { key: 'emergencias', label: 'Emergencias' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'favoritos', label: 'Favoritos' },
];

export const TRANSPORT_TYPES = [
  { key: 'buses', label: 'Buses' },
  { key: 'combis', label: 'Combis' },
  { key: 'autos', label: 'Autos' },
];

export const ROUTE_TABS = [
  { key: 'places', label: 'Lugares', icon: 'location-outline' },
  { key: 'directory', label: 'Directorio', icon: 'restaurant-outline' },
  { key: 'perfil', label: 'Perfil', icon: 'person-outline' },
];

export const IMAGE_URL_REGEX = /^https?:\/\/\S+$/i;

export const EMPTY_PLACE_FORM = {
  nombre: '',
  categoria: 'Naturaleza',
  esExperienciaHoy: false,
  ubicacion: '',
  direccionCorta: '',
  distanciaCorta: 'Centro',
  altitudTexto: '2,625 m',
  precioTexto: 'Libre',
  horario: '8:00 am – 5:00 pm',
  tiempoEstimado: '45 min',
  llevar: 'Calzado cómodo, agua y cámara.',
  mejorHorario: '8:00 am – 5:00 pm',
  dificultad: 'Fácil – Moderada',
  desc: '',
  imagen: '',
  mapEmbedUrl: '',
  mapsQuery: '',
};

export const EMPTY_DIR_FORM = {
  nombre: '',
  categoria: 'Gastronomía',
  especialidad: '',
  direccion: '',
  rangoPrecio: 'S/ 15 - S/ 45',
  telefono: '',
  imagen: '',
};

export const EMPTY_SOS_FORM = {
  titulo: '',
  numero: '',
  detalle: '',
};

export const EMPTY_BUS_FORM = {
  tipo: 'buses',
  empresa: '',
  ruta: '',
  terminal: '',
};
