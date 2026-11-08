import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getPlaces, getImageUrl } from '../services/api';

const LUGARES_RESPALDO = [
  {
    _id: '1',
    nombre: 'Plaza de Armas e Iglesia Virgen del Carmen',
    ubicacion: 'Centro Histórico · 2,625 m s.n.m.',
    categoria: 'Patrimonio',
    horario: 'Acceso libre · Templo: 7:00 am – 8:00 pm',
    desc: 'Una de las plazas mayores más amplias y bellas del Perú, con pisos de cuarcita, pileta central y la majestuosa Catedral Virgen del Carmen de torres ajedrezadas.',
    imagen: '/images/plaza-armas.jpg',
  },
  {
    _id: '2',
    nombre: 'Mirador de San Isidro y Cristo Redentor',
    ubicacion: 'Colina Oeste de Celendín',
    categoria: 'Mirador',
    horario: '6:00 am – 9:00 pm',
    desc: 'Colina panorámica coronada por la imponente estatua blanca del Cristo Redentor, desde donde se aprecia el trazo perfecto en damero de la ciudad y todo el valle.',
    imagen: '/images/mirador-san-isidro.jpg',
  },
  {
    _id: '3',
    nombre: 'Catarata El Cornelio y Aguas de Llanguat',
    ubicacion: 'Huasmín y Valle de Llanguat',
    categoria: 'Naturaleza',
    horario: '7:00 am – 5:00 pm',
    desc: 'Imponente caída de agua rodeada de vegetación andina y las famosas pozas termo-medicinales de Llanguat (más de 40 °C), ideales para el descanso y la salud.',
    imagen: '/images/catarata-cornelio.jpg',
  },
  {
    _id: '4',
    nombre: 'Parque del Sombrero y Museo del Marañón',
    ubicacion: 'Ciudad de Celendín',
    categoria: 'Cultura',
    horario: '8:30 am – 5:30 pm',
    desc: 'Monumento gigante dedicado al sombrero shilico de paja toquilla y el Museo Regional Gregorio Sánchez Araujo con piezas preincas, incas y fósiles locales.',
    imagen: '/images/sombrero-shilico.jpg',
  },
  {
    _id: '5',
    nombre: 'Cerro Jelij y Ruta al Cañón del Marañón',
    ubicacion: 'Cordillera Oriental de Celendín',
    categoria: 'Aventura',
    horario: '6:00 am – 5:00 pm',
    desc: 'Mirador natural de gran altitud que domina los valles interandinos y el profundo cañón del río Marañón, famoso también por sus hallazgos paleontológicos.',
    imagen: '/images/celendin-hero.jpg',
  },
  {
    _id: '6',
    nombre: 'Complejo Arqueológico La Chocta',
    ubicacion: 'Distrito de Oxamarca',
    categoria: 'Arqueología',
    horario: '7:00 am – 4:30 pm',
    desc: 'Antigua ciudadela preincaica de piedra con chullpas y estructuras defensivas enclavadas sobre las cumbres nubosas del sur de la provincia de Celendín.',
    imagen: '/images/mirador-san-isidro.jpg',
  },
];

export default function ServicesScreen() {
  const [seleccionado, setSeleccionado] = useState(null);
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

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
      <Text style={styles.headerSub}>Toca un destino para ampliar su ficha informativa:</Text>
      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

      {lugares.map((item) => {
        const activo = seleccionado === item.nombre;
        const imgUri = item.imagenUrl || getImageUrl(item.imagen);
        return (
          <TouchableOpacity
            key={item._id || item.nombre}
            style={[styles.card, activo && styles.cardActiva]}
            activeOpacity={0.88}
            onPress={() => setSeleccionado(activo ? null : item.nombre)}
          >
            <Image source={{ uri: imgUri }} style={styles.cardBanner} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <Text style={styles.categoryTag}>{item.categoria}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.ubicacion}</Text>
              </View>
              <Text style={styles.cardDesc}>{item.desc}</Text>
              {activo && (
                <View style={styles.extraBox}>
                  <Ionicons name="time-outline" size={14} color={COLORS.success} />
                  <Text style={styles.extraText}>Horario recomendado: {item.horario}</Text>
                </View>
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
    marginBottom: 16,
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
  cardBanner: {
    width: '100%',
    height: 155,
    backgroundColor: COLORS.cardActive,
  },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaText: { color: COLORS.primary, fontSize: 12, marginLeft: 5, fontWeight: '600' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  extraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  extraText: { color: COLORS.success, fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
