import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants/theme';
import {
  buildMapIframeHtml,
  getGoogleMapsEmbedUrl,
  getPlaceImageSource,
  openGoogleMapsLocation,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import PlaceDetailScreen from './PlaceDetailScreen';

const FILTER_TABS = ['Todos', 'Naturaleza', 'Cultura', 'Artesanía', 'Aventura'];

const CIRCUITOS = [
  {
    id: 'circuito-shilico',
    badge: '8 HORAS • FÁCIL - FAMILIAR',
    price: 'S/ 45 aprox.',
    title: 'Ruta 1 Día: Esencia Shilica',
    bgColor: '#0B5D42',
    priceColor: '#FBBF24',
    stops: [
      { label: '1. Plaza de Armas', placeName: 'Plaza de Armas e Iglesia Virgen del Carmen' },
      { label: '2. Taller Paja Toquilla', placeName: 'Casa del Sombrero de Paja Toquilla' },
      { label: '3. Chocolatería Artesanal', targetTab: 'Directorio' },
      { label: '4. Mirador Cristo Redentor', placeName: 'Mirador del Cristo Redentor y San Isidro' },
    ],
  },
  {
    id: 'circuito-aventura',
    badge: 'FULL DAY (9H) • MODERADA',
    price: 'S/ 85 aprox.',
    title: 'Ruta Aventura: Cataratas y Termales',
    bgColor: '#C95A0A',
    priceColor: '#FDE047',
    stops: [
      { label: '1. Catarata Langascocha', placeName: 'Catarata de Langascocha y Cornelio' },
      { label: '2. Almuerzo Campestre', targetTab: 'Directorio' },
      { label: '3. Termales de Llanguat', placeName: 'Baños Termales de Llanguat' },
    ],
  },
];

export default function LugaresScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const {
    places,
    refreshing,
    syncPlaces,
    toggleSaved,
    isSaved,
  } = useSavedPlaces();

  const [lugarDetalle, setLugarDetalle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedMaps, setExpandedMaps] = useState({});
  const [expandedDetails, setExpandedDetails] = useState({});

  const toggleInlineMap = (id) => {
    setExpandedMaps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleInlineDetails = (id) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );

  useEffect(() => {
    const nombreElegido = route?.params?.lugarElegido;
    if (nombreElegido && places.length > 0) {
      const encontrado = places.find((l) => l.nombre === nombreElegido);
      if (encontrado) {
        setLugarDetalle(encontrado);
      }
      navigation?.setParams?.({ lugarElegido: undefined });
    }
  }, [route?.params?.lugarElegido, places, navigation]);

  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'Todos') return places;
    return places.filter(
      (item) =>
        item.categoria === selectedCategory ||
        item.categoriaFiltro === selectedCategory
    );
  }, [places, selectedCategory]);

  if (lugarDetalle) {
    const currentPlace =
      places.find((p) => p.id === lugarDetalle.id) || lugarDetalle;
    return (
      <PlaceDetailScreen
        lugar={currentPlace}
        onBack={() => setLugarDetalle(null)}
      />
    );
  }

  const handleStopPress = (stop) => {
    if (stop.placeName) {
      const match = places.find((p) => p.nombre === stop.placeName);
      if (match) {
        setLugarDetalle(match);
        return;
      }
    }
    if (stop.targetTab) {
      navigation.navigate(stop.targetTab);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Franja superior verde esmeralda bajo el notch */}
      <View style={[styles.notchBar, { height: topInset }]} />

      {/* Cabecera blanca fija */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.eyebrow}>
              GUÍA GEOLOCALIZADA • {places.length} DESTINOS
            </Text>
            <Text style={styles.headerTitle}>Lugares Turísticos</Text>
            <Text style={styles.headerSub}>
              Cada atractivo cuenta con su ubicación oficial en Google Maps
            </Text>
          </View>

          <View style={styles.mapsActiveBadge}>
            <Ionicons
              name="location-outline"
              size={15}
              color={COLORS.primaryLight}
            />
            <Text style={styles.mapsActiveText}>{'Maps\nActivo'}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTER_TABS.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de lugares y circuitos */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={syncPlaces}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredPlaces.map((item) => {
          const saved = isSaved(item.id);
          const isMapOpen = !!expandedMaps[item.id];
          const isDetailsOpen = !!expandedDetails[item.id];
          const embedUrl = isMapOpen ? getGoogleMapsEmbedUrl(item) : '';

          return (
            <View key={item.id} style={styles.placeCard}>
              {/* Imagen superior con badges y título */}
              <TouchableOpacity
                style={styles.cardImgBox}
                activeOpacity={0.92}
                onPress={() => setLugarDetalle(item)}
              >
                <Image
                  source={getPlaceImageSource(item)}
                  style={styles.cardImg}
                  resizeMode="cover"
                />
                <View style={styles.cardBottomScrim} pointerEvents="none" />

                <View style={styles.cardImgTopRow}>
                  <View style={styles.pillsGroup}>
                    <View style={styles.amberPill}>
                      <Text style={styles.amberPillText}>{item.categoria}</Text>
                    </View>
                    {!!item.etiquetaDestacado && (
                      <View style={styles.greenPill}>
                        <Text style={styles.greenPillText}>
                          {item.etiquetaDestacado}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.heartCircle}
                    activeOpacity={0.8}
                    onPress={() => toggleSaved(item.id)}
                  >
                    <Ionicons
                      name={saved ? 'heart' : 'heart-outline'}
                      size={17}
                      color={saved ? '#EC2D5B' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardImgBottomBlock}>
                  <Text style={styles.cardImgTitle} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                  <View style={styles.cardImgSubRow}>
                    <View style={styles.addressWrap}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#FBBF24"
                      />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {item.direccionCorta || item.ubicacion}
                      </Text>
                    </View>
                    <View style={styles.starWrap}>
                      <Ionicons name="star" size={13} color="#FBBF24" />
                      <Text style={styles.starText}>{item.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Cuerpo blanco con métricas y botones */}
              <View style={styles.cardBody}>
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Distancia</Text>
                    <Text
                      style={[styles.metricValue, { color: COLORS.primaryLight }]}
                    >
                      {item.distanciaGrid || item.distanciaCorta}
                    </Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Altitud</Text>
                    <Text style={styles.metricValue}>
                      {item.altitudTexto || '2,625 m.s.n.m.'}
                    </Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Entrada</Text>
                    <Text style={[styles.metricValue, { color: '#D97706' }]}>
                      {item.precioTexto}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.mapsLinkPill}
                  activeOpacity={0.85}
                  onPress={() => toggleInlineMap(item.id)}
                >
                  <View style={styles.mapsLinkLeft}>
                    <View style={styles.greenDot} />
                    <Text style={styles.mapsLinkName} numberOfLines={1}>
                      {item.mapsLabel || `Google Maps: ${item.nombre}`}
                    </Text>
                  </View>
                  <Text style={styles.verMapaText}>
                    {isMapOpen ? 'Ocultar mapa' : 'Ver mapa aquí'}
                  </Text>
                </TouchableOpacity>

                {isMapOpen && (
                  <View style={styles.inlineMapBox}>
                    <View style={styles.inlineMapHeader}>
                      <View style={styles.inlineMapTitleRow}>
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color={COLORS.primary}
                        />
                        <Text style={styles.inlineMapTitle}>
                          Ubicación en Google Maps
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeMapBtn}
                        activeOpacity={0.85}
                        onPress={() => toggleInlineMap(item.id)}
                      >
                        <Ionicons name="close" size={14} color="#374151" />
                        <Text style={styles.closeMapText}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inlineMapFrame}>
                      {Platform.OS === 'web' ? (
                        <iframe
                          src={embedUrl}
                          style={{ width: '100%', height: '100%', border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <WebView
                          originWhitelist={['*']}
                          source={{ html: buildMapIframeHtml(embedUrl) }}
                          style={styles.inlineMapWebview}
                          javaScriptEnabled
                          domStorageEnabled
                          nestedScrollEnabled
                        />
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.detailsBtn,
                      isDetailsOpen && styles.detailsBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleInlineDetails(item.id)}
                  >
                    <Ionicons
                      name={
                        isDetailsOpen
                          ? 'chevron-up-circle-outline'
                          : 'information-circle-outline'
                      }
                      size={17}
                      color={isDetailsOpen ? COLORS.primary : '#D97706'}
                    />
                    <Text
                      style={[
                        styles.detailsBtnText,
                        isDetailsOpen && styles.detailsBtnTextActive,
                      ]}
                    >
                      Detalles y Tips
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.googleMapsBtn}
                    activeOpacity={0.85}
                    onPress={() => openGoogleMapsLocation(item)}
                  >
                    <Ionicons
                      name="paper-plane-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={styles.googleMapsBtnText}>Google Maps</Text>
                  </TouchableOpacity>
                </View>

                {isDetailsOpen && (
                  <View style={styles.detailsDrawer}>
                    <Text style={styles.detailsDesc}>{item.desc}</Text>

                    <Text style={styles.tipsHeading}>
                      Recomendaciones para el visitante
                    </Text>

                    <View style={styles.tipRow}>
                      <Ionicons
                        name="bag-handle-outline"
                        size={15}
                        color={COLORS.primaryLight}
                        style={styles.tipIcon}
                      />
                      <Text style={styles.tipText}>
                        <Text style={styles.tipLabel}>Qué llevar: </Text>
                        {item.tips?.llevar ||
                          'Calzado cómodo, agua y protección solar.'}
                      </Text>
                    </View>

                    <View style={styles.tipRow}>
                      <Ionicons
                        name="time-outline"
                        size={15}
                        color="#D97706"
                        style={styles.tipIcon}
                      />
                      <Text style={styles.tipText}>
                        <Text style={styles.tipLabel}>Mejor horario: </Text>
                        {item.tips?.mejorHorario || item.horario}
                      </Text>
                    </View>

                    <View style={styles.tipRow}>
                      <Ionicons
                        name="walk-outline"
                        size={15}
                        color="#0284C7"
                        style={styles.tipIcon}
                      />
                      <Text style={styles.tipText}>
                        <Text style={styles.tipLabel}>Dificultad: </Text>
                        {item.tips?.dificultad || 'Fácil – Moderada.'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.fullSheetLink}
                      onPress={() => setLugarDetalle(item)}
                    >
                      <Text style={styles.fullSheetLinkText}>
                        Ver reseña histórica y actividades ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Circuitos Sugeridos en Celendín */}
        <Text style={styles.circuitsHeading}>
          Circuitos Sugeridos en Celendín
        </Text>

        {CIRCUITOS.map((circuito) => (
          <View
            key={circuito.id}
            style={[styles.circuitCard, { backgroundColor: circuito.bgColor }]}
          >
            <View style={styles.circuitTopRow}>
              <View style={styles.circuitBadge}>
                <Text style={styles.circuitBadgeText}>{circuito.badge}</Text>
              </View>
              <Text
                style={[styles.circuitPrice, { color: circuito.priceColor }]}
              >
                {circuito.price}
              </Text>
            </View>

            <Text style={styles.circuitTitle}>{circuito.title}</Text>

            <View style={styles.stopsWrap}>
              {circuito.stops.map((stop) => (
                <TouchableOpacity
                  key={stop.label}
                  style={styles.stopChip}
                  activeOpacity={0.85}
                  onPress={() => handleStopPress(stop)}
                >
                  <Text style={styles.stopChipText}>{stop.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notchBar: {
    backgroundColor: '#0F5C41',
    width: '100%',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  eyebrow: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  mapsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#C6E7D6',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6,
  },
  mapsActiveText: {
    color: COLORS.primaryLight,
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 14,
  },
  chipsRow: {
    paddingTop: 14,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  chipText: {
    color: '#374151',
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 18,
    paddingBottom: 28,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImgBox: {
    height: 156,
    backgroundColor: '#111827',
    justifyContent: 'space-between',
    padding: 12,
    overflow: 'hidden',
  },
  cardImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  cardImgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amberPill: {
    backgroundColor: '#F5B82E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amberPillText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  greenPill: {
    backgroundColor: '#0F7653',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  greenPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heartCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgBottomBlock: {
    width: '100%',
  },
  cardImgTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 21,
  },
  cardImgSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  addressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    color: '#F3F4F6',
    fontSize: 11.5,
    fontWeight: '500',
    marginLeft: 4,
  },
  starWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 10.5,
    fontWeight: '500',
  },
  metricValue: {
    marginTop: 2,
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  mapsLinkPill: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  mapsLinkName: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  verMapaText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  buttonsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsBtnText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  googleMapsBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineMapBox: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  inlineMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  inlineMapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineMapTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  closeMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 3,
  },
  closeMapText: {
    color: '#374151',
    fontSize: 11.5,
    fontWeight: '700',
  },
  inlineMapFrame: {
    width: '100%',
    height: 205,
    backgroundColor: '#E5E7EB',
  },
  inlineMapWebview: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  detailsBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#A7F3D0',
  },
  detailsBtnTextActive: {
    color: COLORS.primary,
  },
  detailsDrawer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 13,
  },
  detailsDesc: {
    color: '#374151',
    fontSize: 12.8,
    lineHeight: 19,
  },
  tipsHeading: {
    marginTop: 11,
    marginBottom: 8,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    color: '#4B5563',
    fontSize: 12.5,
    lineHeight: 18,
  },
  tipLabel: {
    color: '#111827',
    fontWeight: '700',
  },
  fullSheetLink: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  fullSheetLinkText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  circuitsHeading: {
    color: COLORS.textMain,
    fontSize: 17.5,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 12,
  },
  circuitCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  circuitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circuitBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  circuitBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  circuitPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  circuitTitle: {
    color: '#FFFFFF',
    fontSize: 17.5,
    fontWeight: '800',
    marginTop: 10,
  },
  stopsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  stopChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stopChipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
});

