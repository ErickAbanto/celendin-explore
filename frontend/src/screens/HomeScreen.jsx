import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaces, getImageUrl } from '../services/api';

const ATRACTIVOS_INICIALES = [
  { _id: '1', nombre: 'Plaza de Armas y Catedral', categoria: 'Patrimonio', imagen: '/images/plaza-armas.jpg' },
  { _id: '2', nombre: 'Mirador de San Isidro', categoria: 'Mirador', imagen: '/images/mirador-san-isidro.jpg' },
  { _id: '3', nombre: 'Catarata El Cornelio', categoria: 'Naturaleza', imagen: '/images/catarata-cornelio.jpg' },
  { _id: '4', nombre: 'Parque del Sombrero Shilico', categoria: 'Cultura', imagen: '/images/sombrero-shilico.jpg' },
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

export default function HomeScreen({ navigation }) {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Ionicons name="compass" size={22} color={UI.purpleLight} />
          <Text style={styles.brandText}>CELENDÍN EXPLORE</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Atractivos')}>
            <Ionicons name="map-outline" size={20} color={UI.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Guía')} style={{ marginLeft: 16 }}>
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
          Guía informativa de la Tierra del Sombrero de Paja Toquilla y el Chocolate Artesanal en los Andes de Cajamarca.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Atractivos')}
        >
          <Text style={styles.primaryButtonText}>Explorar Atractivos</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
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
            onPress={() => navigation.navigate('Atractivos')}
          >
            <ImageBackground
              source={{ uri: item.imagenUrl || getImageUrl(item.imagen) }}
              style={styles.serviceImg}
              imageStyle={styles.serviceImgInner}
            >
              <View style={styles.serviceShade} />
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{item.categoria || 'Destino'}</Text>
              </View>
              <Text style={styles.serviceName}>{item.nombre}</Text>
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
  content: { padding: 18, paddingTop: 24, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { color: UI.text, fontSize: 17, fontWeight: '800', letterSpacing: 1.5, marginLeft: 8 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  heroImage: { borderRadius: 20, resizeMode: 'cover', opacity: 0.9 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(7,7,15,0.58)',
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
    width: 175,
    height: 205,
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
    top: '40%',
    backgroundColor: 'rgba(7,7,15,0.75)',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: UI.purple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  serviceName: { color: UI.text, fontSize: 14, fontWeight: 'bold', paddingHorizontal: 2, paddingBottom: 2 },
  hero: {
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 22,
    paddingVertical: 28,
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
  primaryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.purple,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: UI.purple,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
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
