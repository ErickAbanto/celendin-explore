const { cleanText, normalizePhonePair, slugifyId } = require('./helpers');

// Longitud máxima para imágenes subidas en base64 (data:image/...) o links guardados en MongoDB Atlas
const MAX_IMAGE_URL_LENGTH = 800000;

// Límites anti-spam y protección para MongoDB Atlas Free Tier (512 MB)
const MAX_REVIEWS_PER_ITEM = 20;
const MAX_PLACES_FREE_TIER = 60;
const MAX_DIRECTORY_FREE_TIER = 60;
const MAX_PROFILES_FREE_TIER = 1000;

const HOME_DESTINATIONS = ['Directorio', 'Lugares', 'Perfil / Offline'];

function formatReviewInput(body) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(body?.rating) || 5)));
  const autor = cleanText(body?.autor || 'Viajero Explorador', 35);
  const comentario = cleanText(body?.comentario || '', 180);
  return {
    rating,
    reviewEntry: comentario
      ? {
          autor: autor || 'Viajero Explorador',
          fecha: 'Reciente',
          rating,
          comentario,
        }
      : null,
  };
}

function sanitizeBanner(body) {
  return {
    etiqueta: (cleanText(body.etiqueta, 40) || 'DESTACADO').toUpperCase(),
    titulo: cleanText(body.titulo, 80),
    subtitulo: cleanText(body.subtitulo, 200),
    destino: HOME_DESTINATIONS.includes(body.destino) ? body.destino : 'Directorio',
  };
}

function sanitizeEmergency(body) {
  const numero = cleanText(body.numero, 25);
  return {
    titulo: cleanText(body.titulo, 80),
    numero,
    tel: numero.replace(/\D/g, '') || numero,
    detalle: cleanText(body.detalle, 140) || 'Atención de emergencias en Celendín',
  };
}

function sanitizeTransport(body) {
  return {
    tipo: ['combis', 'autos'].includes(body.tipo) ? body.tipo : 'buses',
    empresa: cleanText(body.empresa, 80),
    ruta: cleanText(body.ruta, 140),
    terminal: cleanText(body.terminal, 140),
  };
}

function sanitizePlaceCreate(body = {}, count = 0) {
  const nombre = cleanText(body.nombre, 80);
  const ubicacion = cleanText(body.ubicacion, 120);
  const categoria = cleanText(body.categoria || 'Naturaleza', 30);
  const desc = cleanText(body.desc, 450);

  if (!nombre || !ubicacion || !desc) {
    return { error: 'Nombre, ubicación y descripción son obligatorios.' };
  }

  const distanciaCorta =
    cleanText(body.distanciaCorta || body.distanciaGrid || 'Centro', 35) || 'Centro';
  const distancia = cleanText(body.distancia || `A ${distanciaCorta} de Celendín`, 120);
  const direccionCorta = cleanText(body.direccionCorta || ubicacion, 90);
  const altitudTexto = cleanText(body.altitudTexto || '2,625 m.s.n.m.', 30) || '2,625 m.s.n.m.';
  const precioTexto = cleanText(body.precioTexto || 'Ingreso Libre', 35) || 'Ingreso Libre';
  const etiquetaDestacado = cleanText(body.etiquetaDestacado || 'Nuevo Destino', 35);
  const horario = cleanText(body.horario || '8:00 am – 5:00 pm', 80) || '8:00 am – 5:00 pm';
  const tiempoEstimado = cleanText(body.tiempoEstimado || horario, 80);
  const historia = cleanText(body.historia, 450);
  const actividades = cleanText(body.actividades, 300);
  const imagen = cleanText(body.imagen, MAX_IMAGE_URL_LENGTH);
  const mapsQuery = cleanText(
    body.mapsQuery || `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`,
    160
  );
  const mapEmbedUrl = cleanText(body.mapEmbedUrl, 600);

  return {
    data: {
      id: cleanText(body.id, 60) || slugifyId('lugar', nombre),
      nombre,
      ubicacion,
      direccionCorta,
      distancia,
      distanciaCorta,
      distanciaGrid: distanciaCorta,
      altitudTexto,
      categoria,
      categoriaFiltro: cleanText(body.categoriaFiltro || categoria, 30),
      precioTexto,
      rating: '0.0',
      ratingSum: 0,
      resenasCount: 0,
      etiquetaDestacado,
      mapsLabel: `Google Maps: ${nombre}`.slice(0, 70),
      horario,
      tiempoEstimado,
      tips: {
        llevar: cleanText(
          body.tips?.llevar || 'Calzado cómodo, agua, bloqueador solar y cámara.',
          200
        ),
        mejorHorario: cleanText(body.tips?.mejorHorario || horario, 120),
        dificultad: cleanText(body.tips?.dificultad || 'Fácil – Moderada.', 120),
      },
      resenas: [],
      desc,
      historia,
      actividades,
      imagen,
      mapEmbedUrl,
      mapsQuery,
      defaultSaved: false,
      esExperienciaHoy: Boolean(body.esExperienciaHoy),
      orden: count + 1,
    },
  };
}

function sanitizePlaceUpdate(body = {}) {
  const updates = {};
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    updates.nombre = body.nombre.trim().slice(0, 80);
    updates.mapsLabel = `Google Maps: ${updates.nombre}`.slice(0, 70);
  }
  if (typeof body.ubicacion === 'string' && body.ubicacion.trim()) {
    updates.ubicacion = body.ubicacion.trim().slice(0, 120);
    updates.direccionCorta = cleanText(body.direccionCorta || updates.ubicacion, 90);
  } else if (typeof body.direccionCorta === 'string') {
    updates.direccionCorta = body.direccionCorta.trim().slice(0, 90);
  }
  if (typeof body.categoria === 'string' && body.categoria.trim()) {
    updates.categoria = body.categoria.trim().slice(0, 30);
    updates.categoriaFiltro = updates.categoria;
  }
  if (typeof body.distanciaCorta === 'string') {
    updates.distanciaCorta = body.distanciaCorta.trim().slice(0, 35) || 'Centro';
    updates.distanciaGrid = updates.distanciaCorta;
    updates.distancia = `A ${updates.distanciaCorta} de Celendín`;
  }
  if (typeof body.altitudTexto === 'string') {
    updates.altitudTexto = body.altitudTexto.trim().slice(0, 30) || '2,625 m';
  }
  if (typeof body.precioTexto === 'string') {
    updates.precioTexto = body.precioTexto.trim().slice(0, 35) || 'Libre';
  }
  if (typeof body.horario === 'string') {
    updates.horario = body.horario.trim().slice(0, 80);
  }
  if (typeof body.tiempoEstimado === 'string') {
    updates.tiempoEstimado = body.tiempoEstimado.trim().slice(0, 80);
  }
  if (typeof body.desc === 'string' && body.desc.trim()) {
    updates.desc = body.desc.trim().slice(0, 450);
  }
  if (typeof body.imagen === 'string') {
    updates.imagen = body.imagen.trim().slice(0, MAX_IMAGE_URL_LENGTH);
  }
  if (typeof body.mapEmbedUrl === 'string') {
    updates.mapEmbedUrl = body.mapEmbedUrl.trim().slice(0, 600);
  }
  if (typeof body.mapsQuery === 'string') {
    updates.mapsQuery = body.mapsQuery.trim().slice(0, 160);
  }
  if (body.esExperienciaHoy !== undefined) {
    updates.esExperienciaHoy =
      body.esExperienciaHoy === true || body.esExperienciaHoy === 'true';
  }
  if (body.tips && typeof body.tips === 'object') {
    updates.tips = {
      llevar: cleanText(body.tips.llevar || 'Calzado cómodo, agua y cámara.', 200),
      mejorHorario: cleanText(
        body.tips.mejorHorario || updates.horario || '8:00 am – 5:00 pm',
        120
      ),
      dificultad: cleanText(body.tips.dificultad || 'Fácil – Moderada', 120),
    };
  }
  return updates;
}

function sanitizeDirectoryCreate(body = {}, count = 0) {
  const nombre = cleanText(body.nombre, 80);
  const categoria = cleanText(body.categoria || 'Gastronomía', 35);
  const especialidad = cleanText(body.especialidad, 140);
  const direccion = cleanText(body.direccion, 120);

  if (!nombre || !especialidad || !direccion) {
    return { error: 'Nombre, especialidad y dirección son obligatorios.' };
  }

  const badge = cleanText(body.badge || categoria || 'Recomendado', 35) || 'Recomendado';
  const rangoPrecio = cleanText(body.rangoPrecio || 'S/ 15 - S/ 45', 35) || 'S/ 15 - S/ 45';
  const { telefono, whatsapp } = normalizePhonePair(
    body.telefono,
    body.whatsapp,
    '51976000000'
  );
  const imagen = cleanText(body.imagen, MAX_IMAGE_URL_LENGTH);

  return {
    data: {
      id: cleanText(body.id, 60) || slugifyId('dir', nombre),
      categoria,
      badge,
      rangoPrecio,
      nombre,
      verificado: true,
      rating: '0.0',
      ratingSum: 0,
      resenasCount: 0,
      especialidad,
      direccion,
      telefono,
      whatsapp,
      imagen,
      orden: count + 1,
    },
  };
}

function sanitizeDirectoryUpdate(body = {}) {
  const updates = {};
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    updates.nombre = body.nombre.trim().slice(0, 80);
  }
  if (typeof body.categoria === 'string' && body.categoria.trim()) {
    updates.categoria = body.categoria.trim().slice(0, 35);
    updates.badge = cleanText(body.badge || updates.categoria, 35);
  }
  if (typeof body.especialidad === 'string' && body.especialidad.trim()) {
    updates.especialidad = body.especialidad.trim().slice(0, 140);
  }
  if (typeof body.direccion === 'string' && body.direccion.trim()) {
    updates.direccion = body.direccion.trim().slice(0, 120);
  }
  if (typeof body.rangoPrecio === 'string') {
    updates.rangoPrecio = body.rangoPrecio.trim().slice(0, 35) || 'S/ 15 - S/ 45';
  }
  if (typeof body.telefono === 'string' && body.telefono.trim()) {
    const { telefono, whatsapp } = normalizePhonePair(
      body.telefono,
      body.whatsapp,
      '51976579996'
    );
    updates.telefono = telefono;
    updates.whatsapp = whatsapp;
  }
  if (typeof body.imagen === 'string') {
    updates.imagen = body.imagen.trim().slice(0, MAX_IMAGE_URL_LENGTH);
  }
  return updates;
}

module.exports = {
  MAX_IMAGE_URL_LENGTH,
  MAX_REVIEWS_PER_ITEM,
  MAX_PLACES_FREE_TIER,
  MAX_DIRECTORY_FREE_TIER,
  MAX_PROFILES_FREE_TIER,
  formatReviewInput,
  sanitizeBanner,
  sanitizeEmergency,
  sanitizeTransport,
  sanitizePlaceCreate,
  sanitizePlaceUpdate,
  sanitizeDirectoryCreate,
  sanitizeDirectoryUpdate,
};
