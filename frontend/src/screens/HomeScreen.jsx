import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Linking, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPlaces, getImageUrl } from '../services/api';

const CARD_WIDTH = 195;
const CARD_GAP = 12;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const ATRACTIVOS_INICIALES = [
  {
    _id: '1',
    nombre: 'Plaza de Armas e Iglesia Virgen del Carmen',
    categoria: 'Patrimonio',
    imagen: '/images/plaza-armas.jpg',
    lat: -6.8660,
    lng: -78.1458,
    mapsQuery: 'Plaza de Armas de Celendin, Cajamarca, Peru',
  },
  {
    _id: '2',
    nombre: 'Mirador de San Isidro y Cristo Redentor',
    categoria: 'Mirador',
    imagen: '/images/mirador-san-isidro.jpg',
    lat: -6.8679,
    lng: -78.1518,
    mapsQuery: 'Mirador San Isidro, Celendin, Cajamarca, Peru',
  },
  {
    _id: '3',
    nombre: 'Catarata El Cornelio y Aguas de Llanguat',
    categoria: 'Naturaleza',
    imagen: '/images/catarata-cornelio.jpg',
    lat: -6.7845,
    lng: -78.1722,
    mapsQuery: 'Baños Termales de Llanguat, Celendin, Cajamarca, Peru',
  },
  {
    _id: '4',
    nombre: 'Parque del Sombrero y Museo del Marañón',
    categoria: 'Cultura',
    imagen: '/images/sombrero-shilico.jpg',
    lat: -6.8615,
    lng: -78.1452,
    mapsQuery: 'Parque El Sombrero, Celendin, Cajamarca, Peru',
  },
];

// Paleta oscura + morado neón
const UI = {
  bg: '#07070F',
  card: '#10101B',
  cardAlt: '#161625',
  border: '#22223A',
  purple: '#7C3AED',
  purpleLight: '#A855F7',
  glow: '#6366F1',
  text: '#FFFFFF',
  muted: '#A1A1B5',
};

function abrirComoLlegar(item) {
  const dest = item.lat && item.lng
    ? `${item.lat},${item.lng}`
    : encodeURIComponent(item.mapsQuery || `${item.nombre}, Celendín, Cajamarca, Perú`);
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`);
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [atractivos, setAtractivos] = useState(ATRACTIVOS_INICIALES);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    let activo = true;
    getPlaces()
      .then((data) => activo && data?.length && setAtractivos(data))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  // Auto-rotación del carrusel "Destinos en Celendín" cada 3 segundos
  useEffect(() => {
    if (!atractivos.length) return;
    const timer = setInterval(() => {
      setIndiceActivo((prev) => {
        const siguiente = (prev + 1) % atractivos.length;
        carouselRef.current?.scrollTo({
          x: siguiente * CARD_STEP,
          animated: true,
        });
        return siguiente;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [atractivos.length]);

  const topNotchSpace = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 12
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Barra fija superior bajo el notch de la cámara */}
      <View style={[styles.topHeaderBar, { paddingTop: topNotchSpace }]}>
        <View style={styles.brand}>
          <Ionicons name="compass" size={22} color={UI.purpleLight} />
          <Text style={styles.brandText}>CELENDÍN EXPLORE</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Atractivos')}
          >
            <Ionicons name="map-outline" size={20} color={UI.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { marginLeft: 10 }]}
            onPress={() => navigation.navigate('Guía')}
          >
            <Ionicons name="images-outline" size={20} color={UI.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >

      {/* Hero principal con imagen 16:9 completa arriba y texto abajo */}
      <View style={styles.hero}>
        <Image
          source={{ uri: getImageUrl('/images/celendin-hero.jpg') }}
          style={styles.heroBannerImg}
          resizeMode="contain"
        />
        <View style={styles.heroBody}>
          <View style={styles.badge}>
            <Ionicons name="location" size={11} color={UI.purpleLight} />
            <Text style={styles.badgeText}>EL CIELO AZUL DEL EDÉN · CAJAMARCA</Text>
          </View>
          <Text style={styles.title}>
            CELENDÍN<Text style={styles.titleAccent}> EXPLORE</Text>
          </Text>
          <Text style={styles.subtitle}>
            Guía informativa y rutas GPS de la Tierra del Sombrero de Paja Toquilla y el Chocolate Artesanal en Cajamarca.
          </Text>
          <View style={styles.heroButtonsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Atractivos')}
            >
              <Text style={styles.primaryButtonText}>Explorar Atractivos</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapHeroBtn}
              onPress={() =>
                Linking.openURL(
                  'https://www.google.com/maps/dir/?api=1&destination=-6.8660,-78.1458&travelmode=driving'
                )
              }
            >
              <Ionicons name="navigate" size={14} color={UI.purpleLight} />
              <Text style={styles.mapHeroBtnText}>Ruta a Celendín</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Carrusel de atractivos con imágenes completas (1:1 sin recortar) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Destinos en Celendín</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Atractivos')}>
          <Text style={styles.sectionLink}>Ver todos ›</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={carouselRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={{ paddingRight: 18 }}
        snapToInterval={CARD_STEP}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_STEP);
          if (idx >= 0 && idx < atractivos.length) setIndiceActivo(idx);
        }}
      >
        {atractivos.map((item, idx) => (
          <TouchableOpacity
            key={item._id || item.nombre}
            style={[styles.serviceCard, idx === indiceActivo && styles.serviceCardActive]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Atractivos', { lugarElegido: item.nombre })}
          >
            <View style={styles.serviceImgBox}>
              <Image
                source={{ uri: item.imagenUrl || getImageUrl(item.imagen) }}
                style={styles.serviceImgFull}
                resizeMode="contain"
              />
            </View>
            <View style={styles.serviceCardFooter}>
              <View style={styles.cardTopRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{item.categoria || 'Destino'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.miniMapBtn}
                  onPress={() => abrirComoLlegar(item)}
                >
                  <Ionicons name="navigate" size={13} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.serviceName} numberOfLines={2}>{item.nombre}</Text>
              <Text style={styles.tapHint}>Ver ficha y ruta GPS ›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicadores de rotación automática */}
      <View style={styles.dotsRow}>
        {atractivos.map((item, idx) => (
          <TouchableOpacity
            key={item._id || item.nombre || idx}
            onPress={() => {
              setIndiceActivo(idx);
              carouselRef.current?.scrollTo({ x: idx * CARD_STEP, animated: true });
            }}
            style={[styles.dot, idx === indiceActivo && styles.dotActive]}
          />
        ))}
      </View>

      {/* Datos clave de Celendín */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#2A1458' }]}>
            <Ionicons name="analytics-outline" size={20} color={UI.purpleLight} />
          </View>
          <Text style={styles.statNumber}>2,625 m</Text>
          <Text style={styles.statLabel}>Altitud s.n.m.</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#14264F' }]}>
            <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
          </View>
          <Text style={[styles.statNumber, { color: '#60A5FA' }]}>1862</Text>
          <Text style={styles.statLabel}>Creación Provincial</Text>
        </View>
      </View>

      {/* Tarjeta informativa destacada con navegación a Cultura */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Identidad y Tradición Shilica</Text>
        <Text style={styles.heroDesc}>
          Descubre el arte del sombrero de paja toquilla, el chocolate celendino, la fiesta patronal de la Virgen del Carmen y su gastronomía andina.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Cultura')}
        >
          <Text style={styles.buttonText}>Conocer Cultura y Gastronomía</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UI.bg },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: UI.card,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },
  container: { flex: 1, backgroundColor: UI.bg },
  content: { padding: 18, paddingBottom: 30 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { color: UI.text, fontSize: 17, fontWeight: '800', letterSpacing: 1.5, marginLeft: 8 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: UI.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UI.glow,
    shadowColor: UI.purpleLight,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  heroBannerImg: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#05050A',
  },
  heroBody: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { color: UI.text, fontSize: 20, fontWeight: '800' },
  sectionLink: { color: UI.purpleLight, fontSize: 13, fontWeight: '600' },
  carousel: { marginHorizontal: -18, paddingLeft: 18 },
  serviceCard: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI.border,
    overflow: 'hidden',
    backgroundColor: UI.card,
  },
  serviceCardActive: {
    borderColor: UI.purpleLight,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: UI.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: UI.purpleLight,
  },
  serviceImgBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#05050A',
  },
  serviceImgFull: {
    width: '100%',
    height: '100%',
  },
  serviceCardFooter: {
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: UI.purple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  miniMapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { color: UI.text, fontSize: 14, fontWeight: 'bold' },
  tapHint: { color: UI.purpleLight, fontSize: 11, fontWeight: '600', marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.cardAlt,
    borderWidth: 1,
    borderColor: UI.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: { color: UI.text, fontSize: 10, fontWeight: '600', marginLeft: 6, letterSpacing: 0.5 },
  title: { color: UI.text, fontSize: 29, fontWeight: '800' },
  titleAccent: { color: UI.purpleLight },
  subtitle: { color: '#E2E8F0', fontSize: 14, lineHeight: 21, marginTop: 8 },
  heroButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.purple,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: UI.purple,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  primaryButtonText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  mapHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.cardAlt,
    borderWidth: 1,
    borderColor: UI.purpleLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  mapHeroBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  statCard: {
    flex: 0.48,
    backgroundColor: UI.card,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: { color: UI.purpleLight, fontSize: 26, fontWeight: 'bold' },
  statLabel: { color: UI.muted, fontSize: 13, marginTop: 4 },
  heroCard: {
    backgroundColor: '#2A1060',
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI.purple,
  },
  heroTitle: { color: UI.text, fontSize: 19, fontWeight: 'bold', marginBottom: 8 },
  heroDesc: { color: '#D4D4E8', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  button: {
    backgroundColor: '#DB2777',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
