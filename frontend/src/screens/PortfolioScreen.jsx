import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/theme';
import { getPlaceImageSource } from '../constants/placesCatalog';
import { addDirectoryReview, getDirectory } from '../services/api';
import {
  MAX_REVIEWS_PER_ITEM,
  useSavedPlaces,
} from '../context/SavedPlacesContext';

const DIRECTORY_CATEGORIES = [
  { key: 'Todos', labelEs: 'Todos', labelEn: 'All' },
  { key: 'Gastronomía', labelEs: 'Gastronomía', labelEn: 'Food' },
  { key: 'Artesanía', labelEs: 'Artesanía', labelEn: 'Crafts' },
  { key: 'Hoteles', labelEs: 'Hoteles', labelEn: 'Hotels' },
];

const VERIFIED_DIRECTORY = [
  {
    id: 'dir-tradicion-shilica',
    categoria: 'Gastronomía',
    badge: 'Sabor Tradicional',
    rangoPrecio: 'S/ 25 - S/ 45',
    nombre: 'Restaurante Tradición Shilica',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Cuy Frito con Papa Picante & Cecina Shilica',
    direccion: 'Jr. José Gálvez 420 (A 1 cuadra de la Plaza)',
    telefono: '+51976412310',
    whatsapp: '51976412310',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    id: 'dir-chocolateria-eden',
    categoria: 'Gastronomía',
    badge: 'Clásico Celendino',
    rangoPrecio: 'S/ 10 - S/ 30',
    nombre: 'Chocolatería Artesanal "El Edén"',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Chocolate de Taza 100% Cacao & Quesillo con Miel',
    direccion: 'Jr. Cáceres 312, Portales de la Plaza de Armas',
    telefono: '+51976418822',
    whatsapp: '51976418822',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    id: 'dir-taller-toquilla',
    categoria: 'Artesanía',
    badge: 'Patrimonio Vivo',
    rangoPrecio: 'S/ 60 - S/ 350',
    nombre: 'Taller Maestros de Paja Toquilla',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Sombrero Shilico Fino Tejido a Mano & Hormado',
    direccion: 'Jr. Dos de Mayo cuadra 6, Centro de Celendín',
    telefono: '+51976420195',
    whatsapp: '51976420195',
    imagen: '/images/sombrero-shilico.jpg',
  },
  {
    id: 'dir-hotel-edendelnorte',
    categoria: 'Hoteles',
    badge: 'Hospedaje Céntrico',
    rangoPrecio: 'S/ 80 - S/ 160',
    nombre: 'Gran Hotel Edén de Celendín',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Habitaciones con Agua Caliente, Wi-Fi & Desayuno Shilico',
    direccion: 'Jr. Pardo 485, Frente al Parque Central',
    telefono: '+51976431044',
    whatsapp: '51976431044',
    imagen: '/images/plaza-armas.jpg',
  },
  {
    id: 'dir-posada-san-isidro',
    categoria: 'Hoteles',
    badge: 'Vista Panorámica',
    rangoPrecio: 'S/ 70 - S/ 130',
    nombre: 'Posada Mirador San Isidro',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Alojamiento Ecológico & Tours al Cañón del Marañón',
    direccion: 'Av. San Isidro 218, Mirador Oeste de Celendín',
    telefono: '+51976455209',
    whatsapp: '51976455209',
    imagen: '/images/mirador-san-isidro.jpg',
  },
];

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { darkMode, language } = useSavedPlaces();
  const C = getColors(darkMode);
  const isEn = language === 'en';
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [directoryItems, setDirectoryItems] = useState(VERIFIED_DIRECTORY);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );

  useEffect(() => {
    let active = true;
    getDirectory()
      .then((res) => {
        if (active && Array.isArray(res) && res.length > 0) {
          setDirectoryItems(res);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filteredDirectory = useMemo(() => {
    if (selectedCategory === 'Todos') return directoryItems;
    return directoryItems.filter(
      (item) => item.categoria === selectedCategory
    );
  }, [selectedCategory, directoryItems]);

  const handleCall = async (item) => {
    const url = `tel:${item.telefono}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        item.nombre,
        `${isEn ? 'Phone' : 'Teléfono'}: ${item.telefono}`
      );
    }
  };

  const handleWhatsApp = async (item) => {
    const msg = encodeURIComponent(
      `Hola ${item.nombre}, vengo desde la app Celendín Explore y deseo consultar disponibilidad.`
    );
    const url = `https://wa.me/${item.whatsapp}?text=${msg}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'WhatsApp',
        `${isEn ? 'Contact number' : 'Número de contacto'}: +${item.whatsapp}`
      );
    }
  };

  const submitDirectoryRating = async (stars) => {
    if (!ratingTarget) return;
    if ((ratingTarget.resenasCount ?? 0) >= MAX_REVIEWS_PER_ITEM) return;
    const itemId = ratingTarget.id;
    setSelectedStars(stars);

    const prevSnapshot = directoryItems;
    setDirectoryItems((prev) =>
      prev.map((d) => {
        if (d.id !== itemId) return d;
        const count = Number(d.resenasCount ?? 0);
        const prevSum = Number(d.ratingSum ?? Number(d.rating || 0) * count);
        const nextCount = count + 1;
        const nextSum = prevSum + stars;
        return {
          ...d,
          resenasCount: nextCount,
          ratingSum: nextSum,
          rating: (nextSum / nextCount).toFixed(1),
        };
      })
    );

    try {
      const updated = await addDirectoryReview(itemId, { rating: stars });
      if (updated && updated.id) {
        setDirectoryItems((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
      }
    } catch (err) {
      if (err?.status === 409 || err?.status === 429) {
        setDirectoryItems(prevSnapshot);
        Alert.alert(ratingTarget.nombre, err.message);
      }
    }

    setTimeout(() => {
      setRatingTarget(null);
      setSelectedStars(0);
    }, 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F5C41" />

      {/* Emerald Notch Safe Area */}
      <View style={[styles.notchBar, { height: topInset }]} />

      {/* White Directory Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.border },
        ]}
      >
        <Text style={styles.eyebrow}>
          {isEn
            ? 'OFFICIAL VERIFIED DIRECTORY'
            : 'DIRECTORIO OFICIAL VERIFICADO'}
        </Text>
        <Text style={[styles.headerTitle, { color: C.text }]}>
          {isEn ? 'Flavors & Shilico Craft' : 'Sabores & Arte Shilico'}
        </Text>
        <Text style={[styles.headerSub, { color: C.textSecondary }]}>
          {isEn
            ? 'Traditional restaurants, chocolate shops, toquilla straw workshops and hotels.'
            : 'Restaurantes tradicionales, chocolaterías, talleres de paja toquilla y hoteles.'}
        </Text>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {DIRECTORY_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.chip,
                  active
                    ? styles.chipActive
                    : {
                        backgroundColor: C.card,
                        borderColor: C.border,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#FFFFFF' : C.text },
                  ]}
                >
                  {isEn ? cat.labelEn : cat.labelEs}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Directory Cards */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDirectory.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            {/* Card Cover Image */}
            <View style={styles.cardImageWrap}>
              <Image
                source={getPlaceImageSource(item.imagen)}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.amberBadge}>
                <Text style={styles.amberBadgeText}>{item.badge}</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{item.rangoPrecio}</Text>
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <View style={styles.nameCheckWrap}>
                  <Text style={[styles.cardTitle, { color: C.text }]}>
                    {item.nombre}
                  </Text>
                  {item.verificado && (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={17}
                      color={C.primaryLight}
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
                <Pressable
                  style={styles.ratingWrap}
                  onPress={() => {
                    setSelectedStars(0);
                    setRatingTarget(item);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={[styles.ratingText, { color: C.text }]}>
                    {item.rating || '0.0'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.specialtyText, { color: C.primaryLight }]}>
                {item.especialidad}
              </Text>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={C.textMuted}
                />
                <Text style={[styles.addressText, { color: C.textSecondary }]}>
                  {item.direccion}
                </Text>
              </View>

              {/* Llamar + WhatsApp Actions */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.callBtn,
                    { backgroundColor: C.card, borderColor: C.border },
                  ]}
                  onPress={() => handleCall(item)}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={C.primaryLight}
                  />
                  <Text style={[styles.callBtnText, { color: C.text }]}>
                    {isEn ? 'Call' : 'Llamar'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.whatsappBtn}
                  onPress={() => handleWhatsApp(item)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Rate Directory Modal */}
      <Modal
        visible={!!ratingTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: C.text }]}>
              {isEn ? 'Rate this place' : 'Calificar establecimiento'}
            </Text>
            <Text style={[styles.modalSub, { color: C.textSecondary }]}>
              {ratingTarget?.nombre} ({ratingTarget?.resenasCount ?? 0} /{' '}
              {MAX_REVIEWS_PER_ITEM} {isEn ? 'votes' : 'votos'})
            </Text>

            {(ratingTarget?.resenasCount ?? 0) >= MAX_REVIEWS_PER_ITEM ? (
              <Text style={[styles.modalSub, { color: '#E11D48', fontWeight: '700' }]}>
                {isEn
                  ? `Limit of ${MAX_REVIEWS_PER_ITEM} votes reached.`
                  : `Límite máximo de ${MAX_REVIEWS_PER_ITEM} votos alcanzado.`}
              </Text>
            ) : (
              <View style={styles.modalStarsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => submitDirectoryRating(star)}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={star <= selectedStars ? 'star' : 'star-outline'}
                      size={32}
                      color="#F5A623"
                    />
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              style={[styles.modalCancelBtn, { borderColor: C.border }]}
              onPress={() => setRatingTarget(null)}
            >
              <Text style={[styles.modalCancelText, { color: C.textSecondary }]}>
                {isEn ? 'Close' : 'Cerrar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notchBar: {
    backgroundColor: '#0F5C41',
    width: '100%',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  eyebrow: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  chipsRow: {
    gap: 8,
    paddingTop: 14,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardImageWrap: {
    position: 'relative',
    height: 155,
    width: '100%',
    backgroundColor: '#1F2937',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  amberBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F5A623',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  amberBadgeText: {
    color: '#111827',
    fontSize: 11.5,
    fontWeight: '800',
  },
  priceBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cardBody: {
    padding: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  nameCheckWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  addressText: {
    fontSize: 12.5,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  callBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  callBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  whatsappBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#128C63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalStarsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  modalCancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
