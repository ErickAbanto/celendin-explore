import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getGalleryImages, getImageUrl } from '../services/api';

const GALERIA_RESPALDO = [
  { clave: 'hero', titulo: 'Panorámica de Celendín', subtitulo: 'El Cielo Azul del Edén · Cajamarca', imagen: '/images/celendin-hero.jpg' },
  { clave: 'plaza', titulo: 'Plaza Mayor y Catedral', subtitulo: 'Corazón histórico de la ciudad', imagen: '/images/plaza-armas.jpg' },
  { clave: 'mirador', titulo: 'Mirador de San Isidro', subtitulo: 'Cristo Redentor y vista del valle', imagen: '/images/mirador-san-isidro.jpg' },
  { clave: 'sombrero', titulo: 'Sombrero de Paja Toquilla', subtitulo: 'Arte milenario tejido a mano', imagen: '/images/sombrero-shilico.jpg' },
  { clave: 'chocolate', titulo: 'Chocolate Shilico', subtitulo: 'Aroma y tradición cacaotera', imagen: '/images/chocolate-celendin.jpg' },
  { clave: 'catarata', titulo: 'Catarata El Cornelio', subtitulo: 'Naturaleza viva en Huasmín', imagen: '/images/catarata-cornelio.jpg' },
];

const FICHA_PROVINCIAL = [
  { icono: 'navigate-outline', label: 'Ubicación', valor: 'Región Cajamarca, Andes del Norte del Perú' },
  { icono: 'trending-up-outline', label: 'Altitud y Clima', valor: '2,625 m s.n.m. · Templado seco (14 °C – 22 °C)' },
  { icono: 'car-outline', label: 'Distancia desde Cajamarca', valor: '107 km por carretera asfaltada (aprox. 2 h 30 min)' },
  { icono: 'people-outline', label: 'Gentilicio y Apelativo', valor: 'Celendino / Shilico · "El Cielo Azul del Edén"' },
  { icono: 'grid-outline', label: 'Distritos (12)', valor: 'Celendín, Chumuch, Cortegana, Huasmín, Jorge Chávez, José Gálvez, La Libertad de Pallán, Miguel Iglesias, Oxamarca, Sorochuco, Sucre y Utco' },
];

export default function ContactScreen() {
  const [galeria, setGaleria] = useState(GALERIA_RESPALDO);

  useEffect(() => {
    let activo = true;
    getGalleryImages()
      .then((data) => activo && data?.length && setGaleria(data))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Guía del Viajero</Text>
      <Text style={styles.headerSub}>Información esencial y galería fotográfica de Celendín servida desde el Backend:</Text>

      {/* Ficha informativa */}
      <View style={styles.infoBox}>
        {FICHA_PROVINCIAL.map((item) => (
          <View key={item.label} style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icono} size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoVal}>{item.valor}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Galería de imágenes del Backend */}
      <Text style={styles.sectionTitle}>Galería de Celendín</Text>
      <View style={styles.grid}>
        {galeria.map((img) => (
          <View key={img._id || img.clave} style={styles.photoCard}>
            <Image
              source={{ uri: img.imagenUrl || getImageUrl(img.imagen) }}
              style={styles.photo}
            />
            <View style={styles.photoCaption}>
              <Text style={styles.photoTitle}>{img.titulo}</Text>
              <Text style={styles.photoSub}>{img.subtitulo}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 18, paddingBottom: 30 },
  headerTitle: { color: COLORS.textMain, fontSize: 24, fontWeight: '800' },
  headerSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A1458',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  infoVal: { color: COLORS.textMain, fontSize: 13, lineHeight: 19, marginTop: 2 },
  sectionTitle: { color: COLORS.textMain, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  photoCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  photo: { width: '100%', height: 125, backgroundColor: COLORS.cardActive },
  photoCaption: { padding: 10 },
  photoTitle: { color: COLORS.textMain, fontSize: 13, fontWeight: 'bold' },
  photoSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
});
