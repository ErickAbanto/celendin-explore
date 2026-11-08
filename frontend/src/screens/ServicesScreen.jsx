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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getPlaces, getImageUrl } from '../services/api';
import placesFromDataJs from '../constants/placesData.json';
import PlaceDetailScreen from './PlaceDetailScreen';

function enriquecerLugar(item) {
  if (!item) return null;
  const localItem =
    placesFromDataJs.find((p) => p.nombre === item.nombre) ||
    placesFromDataJs.find((p) => p.orden === item.orden) ||
    {};

  return {
    ...localItem,
    ...item,
    distancia: localItem.distancia || item.distancia,
    historia: localItem.historia || item.historia,
    actividades: localItem.actividades || item.actividades,
    // Toma siempre el mapEmbedUrl que coloques en backend/data.js
    mapEmbedUrl: localItem.mapEmbedUrl || item.mapEmbedUrl || '',
  };
}

export default function ServicesScreen({ route, navigation }) {
  const [lugarDetalle, setLugarDetalle] = useState(null);
  const [lugares, setLugares] = useState(placesFromDataJs);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarLugares = useCallback(async () => {
    try {
      const data = await getPlaces();
      setLugares(data?.length ? data : placesFromDataJs);
    } catch {
      setLugares(placesFromDataJs);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarLugares();
  }, [cargarLugares]);

  // Si se navega desde Inicio tocando un atractivo, abre directamente su página de detalle
  useEffect(() => {
    const nombreElegido = route?.params?.lugarElegido;
    if (nombreElegido && lugares.length > 0) {
      const encontrado =
        lugares.find((l) => l.nombre === nombreElegido) ||
        placesFromDataJs.find((l) => l.nombre === nombreElegido);
      if (encontrado) {
        setLugarDetalle(enriquecerLugar(encontrado));
      }
      navigation?.setParams?.({ lugarElegido: undefined });
    }
  }, [route?.params?.lugarElegido, lugares, navigation]);

  // Si hay un atractivo seleccionado, muestra la pantalla de detalle completa
  if (lugarDetalle) {
    return (
      <PlaceDetailScreen
        lugar={enriquecerLugar(lugarDetalle)}
        onBack={() => setLugarDetalle(null)}
      />
    );
  }

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
        Toca cualquier atractivo turístico para abrir su página con la historia, datos reales y ubicación:
      </Text>
      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

      {lugares.map((rawItem) => {
        const item = enriquecerLugar(rawItem);
        const imgUri = item.imagenUrl || getImageUrl(item.imagen);
        return (
          <TouchableOpacity
            key={item._id || item.nombre}
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => setLugarDetalle(item)}
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

              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.desc}
              </Text>

              <View style={styles.openDetailBtn}>
                <Text style={styles.openDetailText}>Ver información completa y cómo llegar</Text>
                <Ionicons name="arrow-forward-circle" size={18} color={COLORS.primary} />
              </View>
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
  cardImageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#05050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
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
  metaText: { color: COLORS.primary, fontSize: 12, marginLeft: 5, fontWeight: '600', flex: 1 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  openDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  openDetailText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
