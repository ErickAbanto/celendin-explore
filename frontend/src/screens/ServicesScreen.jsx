import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getPlaces, getImageUrl } from '../services/api';

// Información real verificada y coordenadas GPS de los atractivos de Celendín - Cajamarca
const INFO_REAL_POR_NOMBRE = {
  'Plaza de Armas e Iglesia Virgen del Carmen': {
    distancia: 'Km 0 de la ciudad (a 107 km / 2 h 30 min de Cajamarca)',
    historia:
      'Frente a la plaza se alza la Iglesia Matriz Virgen del Carmen (inicios del siglo XIX), edificada en adobe y tapial con dos torres gemelas. Resguarda altares tallados en madera y la famosa imagen del Cristo Crucificado, que según la tradición histórica celendina fue esculpida sobre la osamenta real de un joven devoto local.',
    actividades:
      'Fotografía arquitectónica, visita al templo neoclásico, paseo por casonas coloniales y degustación de chocolate y dulces en los alrededores.',
    lat: -6.8660,
    lng: -78.1458,
    mapsQuery: 'Plaza de Armas de Celendin, Cajamarca, Peru',
  },
  'Mirador de San Isidro y Cristo Redentor': {
    distancia: 'A 1 km de la Plaza de Armas (4 cuadras / 12 min a pie por escalinatas)',
    historia:
      'En 1920 se edificó en la cima la capilla de adobe y teja en honor a San Isidro Labrador. En el año 2005, el escultor celendino Miguel Díaz Dávila levantó la monumental estatua blanca del Cristo Redentor de 10 metros de altura con los brazos extendidos bendiciendo al pueblo shilico.',
    actividades:
      'Caminata por las escalinatas, vista panorámica del atardecer celendino y visita a la capilla de San Isidro.',
    lat: -6.8679,
    lng: -78.1518,
    mapsQuery: 'Mirador San Isidro, Celendin, Cajamarca, Peru',
  },
  'Catarata El Cornelio y Aguas de Llanguat': {
    distancia: 'Cornelio: ~28 km vía Jerez–Huasmín · Llanguat: ~18 km al norte de Celendín',
    historia:
      'Llanguat ha sido históricamente el "Edén agrícola" de Celendín en la margen derecha del río Sendamal, célebre por sus haciendas cañeras, trapiches artesanales de chancaca y aguardiente, y sus fuentes termales ricas en minerales para dolencias óseas y reumáticas.',
    actividades:
      'Trekking ecológico hacia las caídas del río Jadibamba, baños termales en las pozas de Llanguat y avistamiento de flora y aves andinas.',
    lat: -6.7845,
    lng: -78.1722,
    mapsQuery: 'Baños Termales de Llanguat, Celendin, Cajamarca, Peru',
  },
  'Parque del Sombrero y Museo del Marañón': {
    distancia: 'A 800 m de la Plaza de Armas (5 min en mototaxi o 10 min a pie)',
    historia:
      'El circuito cultural se completa con el Museo Regional del Marañón "Gregorio Sánchez Araujo", que conserva cerámicos, textiles, armas líticas y metalurgia de las culturas preincas Cajamarca, Chachapoyas e Inca, además de restos paleontológicos locales.',
    actividades:
      'Recorrido por el monumento al sombrero, visita guiada al Museo del Marañón y compra directa a tejedores en la feria dominical.',
    lat: -6.8615,
    lng: -78.1452,
    mapsQuery: 'Parque El Sombrero, Celendin, Cajamarca, Peru',
  },
  'Parque El Sombrero y Museo del Marañón': {
    distancia: 'A 800 m de la Plaza de Armas (5 min en mototaxi o 10 min a pie)',
    historia:
      'El circuito cultural se completa con el Museo Regional del Marañón "Gregorio Sánchez Araujo", que conserva cerámicos, textiles, armas líticas y metalurgia de las culturas preincas Cajamarca, Chachapoyas e Inca, además de restos paleontológicos locales.',
    actividades:
      'Recorrido por el monumento al sombrero, visita guiada al Museo del Marañón y compra directa a tejedores en la feria dominical.',
    lat: -6.8615,
    lng: -78.1452,
    mapsQuery: 'Parque El Sombrero, Celendin, Cajamarca, Peru',
  },
  'Cerro Jelij y Ruta al Cañón del Marañón': {
    distancia: 'A 4 km al este de la ciudad de Celendín (ruta hacia Balsas / Amazonas)',
    historia:
      'El Cerro Jelij posee un enorme valor paleontológico y científico: en sus laderas se hallaron los restos fósiles de un megaterio (perezoso gigante prehistórico de unas 4 toneladas) que habitó la región hace más de 10,000 años en la era Cuaternaria.',
    actividades:
      'Senderismo de montaña, observación de los meandros del río Marañón y fotografía paisajística de alta montaña.',
    lat: -6.8520,
    lng: -78.1280,
    mapsQuery: 'Cerro Jelij, Celendin, Cajamarca, Peru',
  },
  'Cerro Jelij y Mirador del Cañón del Marañón': {
    distancia: 'A 4 km al este de la ciudad de Celendín (ruta hacia Balsas / Amazonas)',
    historia:
      'El Cerro Jelij posee un enorme valor paleontológico y científico: en sus laderas se hallaron los restos fósiles de un megaterio (perezoso gigante prehistórico de unas 4 toneladas) que habitó la región hace más de 10,000 años en la era Cuaternaria.',
    actividades:
      'Senderismo de montaña, observación de los meandros del río Marañón y fotografía paisajística de alta montaña.',
    lat: -6.8520,
    lng: -78.1280,
    mapsQuery: 'Cerro Jelij, Celendin, Cajamarca, Peru',
  },
  'Complejo Arqueológico La Chocta': {
    distancia: 'A 42 km al sur de Celendín (hasta Oxamarca) + 10 km hacia la ciudadela',
    historia:
      'Data del periodo Intermedio Tardío (entre los siglos XI y XV d.C.), con arquitectura de piedra laja unida con argamasa, murallas perimétricas, torreones de vigilancia, plazas ceremoniales y chullpas funerarias de dos y tres pisos que controlaban el paso entre los Andes y la ceja de selva.',
    actividades:
      'Exploración arqueológica de chullpas y torreones, caminata por cumbres altoandinas y observación de paisajes nubosos.',
    lat: -7.0436,
    lng: -78.0694,
    mapsQuery: 'Complejo Arqueologico La Chocta, Oxamarca, Celendin, Peru',
  },
};

const LUGARES_RESPALDO = [
  {
    _id: '1',
    nombre: 'Plaza de Armas e Iglesia Virgen del Carmen',
    ubicacion: 'Centro Histórico de Celendín · 2,625 m s.n.m.',
    distancia: 'Km 0 de la ciudad (a 107 km / 2 h 30 min de Cajamarca)',
    categoria: 'Patrimonio',
    horario: 'Plaza: 24 h · Iglesia Matriz: 7:00 am – 8:00 pm (Ingreso libre)',
    desc: 'Trazada el 5 de mayo de 1796 por iniciativa del obispo Baltasar Jaime Martínez Compañón y el agrimensor José Comesana con colonos españoles y portugueses. Es una de las plazas mayores más grandes del Perú (dos manzanas en cuadrícula perfecta), con pisos de cuarcita, pileta central y árboles centenarios.',
    historia:
      'Frente a la plaza se alza la Iglesia Matriz Virgen del Carmen (inicios del siglo XIX), edificada en adobe y tapial con dos torres gemelas. Resguarda altares tallados en madera y la famosa imagen del Cristo Crucificado, que según la tradición histórica celendina fue esculpida sobre la osamenta real de un joven devoto local.',
    actividades:
      'Fotografía arquitectónica, visita al templo neoclásico, paseo por casonas coloniales y degustación de chocolate y dulces en los alrededores.',
    imagen: '/images/plaza-armas.jpg',
    lat: -6.8660,
    lng: -78.1458,
    mapsQuery: 'Plaza de Armas de Celendin, Cajamarca, Peru',
  },
  {
    _id: '2',
    nombre: 'Mirador de San Isidro y Cristo Redentor',
    ubicacion: 'Colina Oeste de Celendín · 2,680 m s.n.m.',
    distancia: 'A 1 km de la Plaza de Armas (4 cuadras / 12 min a pie por escalinatas)',
    categoria: 'Mirador',
    horario: '6:00 am – 9:00 pm · Ingreso libre',
    desc: 'Principal balcón natural urbano de Celendín. Desde su cima se contempla en 360° el famoso trazo geométrico en damero (tablero de ajedrez) de la ciudad, sus tejados rojizos y la amplitud del valle interandino bajo el cielo azul.',
    historia:
      'En 1920 se edificó en la cima la capilla de adobe y teja en honor a San Isidro Labrador. En el año 2005, el escultor celendino Miguel Díaz Dávila levantó la monumental estatua blanca del Cristo Redentor de 10 metros de altura con los brazos extendidos bendiciendo al pueblo shilico.',
    actividades:
      'Caminata por las escalinatas, vista panorámica del atardecer celendino y visita a la capilla de San Isidro.',
    imagen: '/images/mirador-san-isidro.jpg',
    lat: -6.8679,
    lng: -78.1518,
    mapsQuery: 'Mirador San Isidro, Celendin, Cajamarca, Peru',
  },
  {
    _id: '3',
    nombre: 'Catarata El Cornelio y Aguas de Llanguat',
    ubicacion: 'C.P. Chilac N.° 8 (Huasmín, 2,840 m) y Valle de Llanguat (2,100 m s.n.m.)',
    distancia: 'Cornelio: ~28 km vía Jerez–Huasmín · Llanguat: ~18 km al norte de Celendín',
    categoria: 'Naturaleza',
    horario: '7:00 am – 5:00 pm · Entrada referencial: S/ 2 a S/ 5',
    desc: 'La Catarata El Cornelio (sector Jamich, Huasmín) se alimenta de las aguas cristalinas del río Jadibamba, precipitándose entre farallones de roca y vegetación de jalca y ceja de selva. Muy cerca, el valle de Llanguat ofrece pozas termo-medicinales entre 40 °C y 44 °C.',
    historia:
      'Llanguat ha sido históricamente el "Edén agrícola" de Celendín en la margen derecha del río Sendamal, célebre por sus haciendas cañeras, trapiches artesanales de chancaca y aguardiente, y sus fuentes termales ricas en minerales para dolencias óseas y reumáticas.',
    actividades:
      'Trekking ecológico hacia las caídas del río Jadibamba, baños termales en las pozas de Llanguat y avistamiento de flora y aves andinas.',
    imagen: '/images/catarata-cornelio.jpg',
    lat: -6.7845,
    lng: -78.1722,
    mapsQuery: 'Baños Termales de Llanguat, Celendin, Cajamarca, Peru',
  },
  {
    _id: '4',
    nombre: 'Parque El Sombrero y Museo del Marañón',
    ubicacion: 'Zona Urbana de Celendín · 2,625 m s.n.m.',
    distancia: 'A 800 m de la Plaza de Armas (5 min en mototaxi o 10 min a pie)',
    categoria: 'Cultura',
    horario: 'Parque: 24 h · Museo Regional: 8:30 am – 5:00 pm',
    desc: 'El Parque El Sombrero luce una escultura gigante en homenaje al sombrero shilico de paja toquilla, símbolo de identidad provincial tejido 100% a mano por artesanas celendinas y moldeado por maestros enfrenadores con paja procedente de Rioja y Moyobamba.',
    historia:
      'El circuito cultural se completa con el Museo Regional del Marañón "Gregorio Sánchez Araujo", que conserva cerámicos, textiles, armas líticas y metalurgia de las culturas preincas Cajamarca, Chachapoyas e Inca, además de restos paleontológicos locales.',
    actividades:
      'Recorrido por el monumento al sombrero, visita guiada al Museo del Marañón y compra directa a tejedores en la feria dominical.',
    imagen: '/images/sombrero-shilico.jpg',
    lat: -6.8615,
    lng: -78.1452,
    mapsQuery: 'Parque El Sombrero, Celendin, Cajamarca, Peru',
  },
  {
    _id: '5',
    nombre: 'Cerro Jelij y Mirador del Cañón del Marañón',
    ubicacion: 'Cordillera Oriental de Celendín · 2,950 m s.n.m.',
    distancia: 'A 4 km al este de la ciudad de Celendín (ruta hacia Balsas / Amazonas)',
    categoria: 'Aventura',
    horario: '6:00 am – 5:00 pm · Acceso libre',
    desc: 'Imponente cumbre tutelar que domina tanto la campiña de Celendín como el vertiginoso descenso hacia el profundo Cañón del río Marañón, donde la carretera desciende desde los 2,950 m hasta los 850 m s.n.m. en el puente Chacanto.',
    historia:
      'El Cerro Jelij posee un enorme valor paleontológico y científico: en sus laderas se hallaron los restos fósiles de un megaterio (perezoso gigante prehistórico de unas 4 toneladas) que habitó la región hace más de 10,000 años en la era Cuaternaria.',
    actividades:
      'Senderismo de montaña, observación de los meandros del río Marañón y fotografía paisajística de alta montaña.',
    imagen: '/images/celendin-hero.jpg',
    lat: -6.8520,
    lng: -78.1280,
    mapsQuery: 'Cerro Jelij, Celendin, Cajamarca, Peru',
  },
  {
    _id: '6',
    nombre: 'Complejo Arqueológico La Chocta',
    ubicacion: 'Cima del Cerro La Chocta, Distrito de Oxamarca · 3,320 m s.n.m.',
    distancia: 'A 42 km al sur de Celendín (hasta Oxamarca) + 10 km hacia la ciudadela',
    categoria: 'Arqueología',
    horario: '7:00 am – 4:30 pm · Ingreso libre',
    desc: 'Uno de los complejos arqueológicos prehispánicos más monumentales del oriente de Cajamarca. Se levanta en la cresta de un acantilado inexpugnable rodeado de bosques de neblina y abismos cordilleranos.',
    historia:
      'Data del periodo Intermedio Tardío (entre los siglos XI y XV d.C.), con arquitectura de piedra laja unida con argamasa, murallas perimétricas, torreones de vigilancia, plazas ceremoniales y chullpas funerarias de dos y tres pisos que controlaban el paso entre los Andes y la ceja de selva.',
    actividades:
      'Exploración arqueológica de chullpas y torreones, caminata por cumbres altoandinas y observación de paisajes nubosos.',
    imagen: '/images/mirador-san-isidro.jpg',
    lat: -7.0436,
    lng: -78.0694,
    mapsQuery: 'Complejo Arqueologico La Chocta, Oxamarca, Celendin, Peru',
  },
];

function enriquecerLugar(item) {
  const extra = INFO_REAL_POR_NOMBRE[item.nombre] || {};
  return {
    ...extra,
    ...item,
    distancia: item.distancia || extra.distancia,
    historia: item.historia || extra.historia,
    actividades: item.actividades || extra.actividades,
    lat: item.lat ?? extra.lat,
    lng: item.lng ?? extra.lng,
    mapsQuery: item.mapsQuery || extra.mapsQuery || `${item.nombre}, Celendín, Cajamarca, Perú`,
  };
}

function abrirComoLlegar(lugar) {
  const { lat, lng, mapsQuery } = enriquecerLugar(lugar);
  const destination = lat && lng ? `${lat},${lng}` : encodeURIComponent(mapsQuery);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  Linking.openURL(url);
}

function abrirVerEnMapa(lugar) {
  const { lat, lng, mapsQuery } = enriquecerLugar(lugar);
  const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(mapsQuery);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url);
}

export default function ServicesScreen({ route }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    if (route?.params?.lugarElegido) {
      setSeleccionado(route.params.lugarElegido);
    }
  }, [route?.params?.lugarElegido]);

  const cargarLugares = useCallback(async () => {
    try {
      const data = await getPlaces();
      setLugares(data?.length ? data : LUGARES_RESPALDO);
    } catch {
      setLugares(LUGARES_RESPALDO);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarLugares();
  }, [cargarLugares]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargarLugares();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.headerTitle}>Atractivos de Celendín</Text>
      <Text style={styles.headerSub}>
        Información histórica, geográfica y rutas GPS reales de los destinos de la provincia de Celendín:
      </Text>
      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

      {lugares.map((rawItem) => {
        const item = enriquecerLugar(rawItem);
        const activo = seleccionado === item.nombre;
        const imgUri = item.imagenUrl || getImageUrl(item.imagen);
        return (
          <TouchableOpacity
            key={item._id || item.nombre}
            style={[styles.card, activo && styles.cardActiva]}
            activeOpacity={0.92}
            onPress={() => setSeleccionado(activo ? null : item.nombre)}
          >
            <View style={styles.cardImageWrap}>
              <Image source={{ uri: imgUri }} style={styles.cardBanner} resizeMode="contain" />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <Text style={styles.categoryTag}>{item.categoria}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.ubicacion}</Text>
              </View>

              {!!item.distancia && (
                <View style={styles.metaRow}>
                  <Ionicons name="car-outline" size={14} color="#60A5FA" />
                  <Text style={[styles.metaText, { color: '#93C5FD' }]}>{item.distancia}</Text>
                </View>
              )}

              <Text style={styles.cardDesc}>{item.desc}</Text>

              {!!item.historia && (
                <View style={styles.historyBox}>
                  <Text style={styles.sectionMiniTitle}>Reseña Histórica y Cultural</Text>
                  <Text style={styles.historyText}>{item.historia}</Text>
                </View>
              )}

              {!!item.actividades && (
                <View style={styles.activitiesBox}>
                  <Text style={styles.sectionMiniTitle}>Actividades Recomendadas</Text>
                  <Text style={styles.historyText}>{item.actividades}</Text>
                </View>
              )}

              <View style={styles.extraBox}>
                <Ionicons name="time-outline" size={14} color={COLORS.success} />
                <Text style={styles.extraText}>{item.horario}</Text>
              </View>

              {/* Botones de Google Maps: Cómo llegar y Ver en mapa */}
              <View style={styles.mapsRow}>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => abrirComoLlegar(item)}
                >
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={styles.directionsBtnText}>Cómo llegar (Google Maps)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapPinBtn}
                  onPress={() => abrirVerEnMapa(item)}
                >
                  <Ionicons name="map-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.mapPinBtnText}>Mapa</Text>
                </TouchableOpacity>
              </View>

              {item.lat && item.lng && (
                <Text style={styles.coordsText}>
                  GPS: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 18, paddingBottom: 30 },
  headerTitle: { color: COLORS.textMain, fontSize: 24, fontWeight: '800' },
  headerSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardActiva: {
    borderColor: COLORS.button,
    backgroundColor: COLORS.cardActive,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cardImageWrap: {
    width: '100%',
    height: 250,
    backgroundColor: '#05050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { color: COLORS.textMain, fontSize: 17, fontWeight: 'bold', flex: 1, marginRight: 8 },
  categoryTag: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#2A1458',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { color: COLORS.primary, fontSize: 12, marginLeft: 6, fontWeight: '600', flex: 1 },
  cardDesc: { color: '#E2E8F0', fontSize: 13, lineHeight: 20, marginTop: 4 },
  historyBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#151526',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  activitiesBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#121E2B',
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
  },
  sectionMiniTitle: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  historyText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
  },
  extraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  extraText: { color: COLORS.success, fontSize: 12, fontWeight: '600', marginLeft: 6, flex: 1 },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.button,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  directionsBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 7,
  },
  mapPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1B36',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  mapPinBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  coordsText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
});
