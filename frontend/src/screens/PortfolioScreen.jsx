import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCulture, getImageUrl } from '../services/api';

const CULTURA_RESPALDO = [
  {
    _id: '1',
    nombre: 'El Sombrero Shilico de Paja Toquilla',
    categoria: 'Artesanía',
    etiqueta: 'Patrimonio e Identidad',
    desc: 'Tejido 100% a mano por artesanas celendinas y acabado por maestros enfrenadores. Su finura y elegancia han llevado el nombre de Celendín a nivel internacional.',
    imagen: '/images/sombrero-shilico.jpg',
  },
  {
    _id: '2',
    nombre: 'El Auténtico Chocolate de Celendín',
    categoria: 'Gastronomía',
    etiqueta: 'Tierra del Chocolate',
    desc: 'Elaborado de forma artesanal con cacao selecto tostado, canela y clavo. Es la bebida emblemática para compartir en las tardes bajo el cielo azul celendino.',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    _id: '3',
    nombre: 'Fiesta Patronal Virgen del Carmen',
    categoria: 'Festividad',
    etiqueta: '15 de Julio – 4 de Agosto',
    desc: 'La fiesta mayor de los shilicos: procesiones multitudinarias, concursos de marinera, noches de fuegos artificiales, danzas típicas y ferias tradicionales.',
    imagen: '/images/plaza-armas.jpg',
  },
  {
    _id: '4',
    nombre: 'Gastronomía Shilica: Cuy, Mote y Queso',
    categoria: 'Gastronomía',
    etiqueta: 'Sabores Andinos',
    desc: 'Destacan el cuy frito con papas y mote, el chicharrón con zarza, el queso fresco celendino, el manjar blanco y las tradicionales roscas y panes de leña.',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    _id: '5',
    nombre: 'Historia y Damero Colonial (1796 – 1862)',
    categoria: 'Historia',
    etiqueta: 'El Cielo Azul del Edén',
    desc: 'Planificada en cuadrícula perfecta en 1796 por iniciativa del obispo Martínez Compañón y elevada a provincia el 30 de septiembre de 1862.',
    imagen: '/images/celendin-hero.jpg',
  },
];

export default function PortfolioScreen() {
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarCultura = useCallback(async () => {
    try {
      const data = await getCulture();
      setTemas(data?.length ? data : CULTURA_RESPALDO);
    } catch {
      setTemas(CULTURA_RESPALDO);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarCultura();
  }, [cargarCultura]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={() => {
            setRefrescando(true);
            cargarCultura();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.headerTitle}>Cultura, Arte y Sabor</Text>
      <Text style={styles.headerSub}>Tradiciones, historia y gastronomía de la provincia de Celendín:</Text>
      {cargando && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

      {temas.map((item) => (
        <View key={item._id || item.nombre} style={styles.card}>
          <View style={styles.imageBox}>
            <Image
              source={{ uri: item.imagenUrl || getImageUrl(item.imagen) }}
              style={styles.fullImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.topMeta}>
              <Text style={styles.proyStack}>{item.categoria}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.etiqueta}</Text>
              </View>
            </View>
            <Text style={styles.proyTitle}>{item.nombre}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        </View>
      ))}
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
  imageBox: {
    width: '100%',
    height: 230,
    backgroundColor: '#05050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  cardContent: { padding: 16 },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  proyTitle: { color: COLORS.textMain, fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  proyStack: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statusBadge: {
    backgroundColor: '#0F2A22',
    borderWidth: 1,
    borderColor: '#14532D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { color: COLORS.success, fontSize: 11, fontWeight: 'bold' },
  desc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
