export const cleanExact = (str) => String(str || '').toLowerCase().trim();

// Quita tildes vocales pero CONSERVA intacta la letra ñ
export const cleanKeepEnye = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/ñ/g, '__ENYE__')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/__ENYE__/g, 'ñ')
    .trim();

export function createSearchMatcher(searchQuery) {
  const rawQueryLower = cleanExact(searchQuery);
  const flexQueryLower = cleanKeepEnye(searchQuery);
  const isSearching = rawQueryLower.length > 0;
  const hasExplicitAccentOrEnye = /[áéíóúüñ]/i.test(searchQuery || '');

  const valueMatchesQuery = (val) => {
    if (!isSearching) return true;
    const text = String(val || '');
    if (!text) return false;
    if (hasExplicitAccentOrEnye) {
      return cleanExact(text).includes(rawQueryLower);
    }
    return (
      cleanExact(text).includes(rawQueryLower) ||
      cleanKeepEnye(text).includes(flexQueryLower)
    );
  };

  const textMatchesItem = (item) => {
    if (!isSearching) return true;
    return [
      item.nombre,
      item.titulo,
      item.empresa,
      item.desc,
      item.especialidad,
      item.categoria,
      item.categoriaRaw,
      item.badge,
      item.ubicacion,
      item.direccionCorta,
      item.direccion,
      item.distanciaCorta,
      item.precioTexto,
      item.rangoPrecio,
      item.horario,
      item.tiempoEstimado,
      item.altitudTexto,
      item.ruta,
      item.terminal,
      item.detalle,
      item.numero,
      item.telefono,
      item.tips?.llevar,
      item.tips?.dificultad,
      item.tips?.mejorHorario,
    ].some((v) => valueMatchesQuery(v));
  };

  return { isSearching, textMatchesItem };
}

export function buildGlobalSearchResults({
  searchQuery,
  localizedPlaces,
  localizedDirectory,
  localizedTransport,
  localizedEmergencies,
}) {
  const { textMatchesItem } = createSearchMatcher(searchQuery);

  const matchedPlaces = localizedPlaces
    .filter((item) => textMatchesItem(item))
    .map((item) => ({ ...item, _searchKind: 'place' }));

  const matchedDirectory = localizedDirectory
    .filter((d) => textMatchesItem(d))
    .map((d) => ({
      ...d,
      id: `search-dir-${d.id}`,
      _rawId: d.id,
      _rawCategoria: d.categoriaRaw || d.categoria,
      _searchKind: 'directory',
      categoria: d.badge || d.categoria || 'Directorio',
      distanciaCorta: d.direccion || 'Celendín',
      precioTexto: d.rangoPrecio || d.telefono || '',
      desc: d.especialidad || '',
    }));

  const matchedTransport = localizedTransport
    .filter((b) => textMatchesItem(b))
    .map((b) => ({
      ...b,
      id: `search-bus-${b.id}`,
      _rawId: b.id,
      _rawTipo: b.tipo || 'buses',
      _searchKind: 'transport',
      nombre: b.empresa,
      categoria:
        b.tipo === 'combis'
          ? 'Combis'
          : b.tipo === 'autos'
          ? 'Autos'
          : 'Buses',
      distanciaCorta: b.terminal || 'Celendín',
      precioTexto: b.ruta || '',
      rating: '5.0',
    }));

  const matchedEmergencies = localizedEmergencies
    .filter((e) => textMatchesItem(e))
    .map((e) => ({
      ...e,
      id: `search-sos-${e.id}`,
      _rawId: e.id,
      _searchKind: 'emergency',
      nombre: e.titulo,
      categoria: 'Emergencia SOS',
      distanciaCorta: e.detalle || 'Celendín',
      precioTexto: e.numero || '',
      rating: '5.0',
    }));

  return [
    ...matchedPlaces,
    ...matchedDirectory,
    ...matchedTransport,
    ...matchedEmergencies,
  ];
}
