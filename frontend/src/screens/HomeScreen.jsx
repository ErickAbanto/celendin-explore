import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ImageBackground, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPlaces, getImageUrl } from '../services/api';

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

// Paleta oscura + morado neón (mismo diseño de referencia)
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

  useEffect(() => {
    let activo = true;
    getPlaces()
      .then((data) => activo && data?.length && setAtractivos(data))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 28) }]}
    >
      {/* Encabezado */}
      <View style={styles.header}>
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

      {/* Hero principal con imagen servida desde el Backend */}
      <ImageBackground
        source={{ uri: getImageUrl('/images/celendin-hero.jpg') }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
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
      </ImageBackground>

      {/* Carrusel de atractivos con imágenes desde el Backend */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Destinos en Celendín</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Atractivos')}>
          <Text style={styles.sectionLink}>Ver todos ›</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {atractivos.map((item) => (
          <TouchableOpacity
            key={item._id || item.nombre}
            style={styles.serviceCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Atractivos', { lugarElegido: item.nombre })}
          >
            <ImageBackground
              source={{ uri: item.imagenUrl || getImageUrl(item.imagen) }}
              style={styles.serviceImg}
              imageStyle={styles.serviceImgInner}
            >
              <View style={styles.serviceShade} />
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
              <View>
                <Text style={styles.serviceName} numberOfLines={2}>{item.nombre}</Text>
                <Text style={styles.tapHint}>Toca para ver ruta GPS ›</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  content: { padding: 18, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
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
  heroImage: { borderRadius: 20, resizeMode: 'cover', opacity: 0.9 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(7,7,15,0.62)',
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
    width: 185,
    height: 215,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI.border,
    overflow: 'hidden',
    backgroundColor: UI.card,
  },
  serviceImg: { flex: 1, justifyContent: 'space-between', padding: 10 },
  serviceImgInner: { resizeMode: 'cover' },
  serviceShade: {
    ...StyleSheet.absoluteFillObject,
    top: '35%',
    backgroundColor: 'rgba(7,7,15,0.78)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  serviceName: { color: UI.text, fontSize: 14, fontWeight: 'bold', paddingHorizontal: 2 },
  tapHint: { color: UI.purpleLight, fontSize: 11, fontWeight: '600', marginTop: 3, paddingHorizontal: 2 },
  hero: {
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 22,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: UI.glow,
    shadowColor: UI.purpleLight,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
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
    marginBottom: 14,
  },
  badgeText: { color: UI.text, fontSize: 10, fontWeight: '600', marginLeft: 6, letterSpacing: 0.5 },
  title: { color: UI.text, fontSize: 31, fontWeight: '800' },
  titleAccent: { color: UI.purpleLight },
  subtitle: { color: '#E2E8F0', fontSize: 14, lineHeight: 21, marginTop: 10 },
  heroButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 18,
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
    backgroundColor: 'rgba(16, 16, 27, 0.85)',
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
