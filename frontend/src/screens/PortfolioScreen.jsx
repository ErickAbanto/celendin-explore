import React, { useMemo, useRef, useState } from 'react';
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
import {
  getPlaceImageSource,
  getStarIconNames,
} from '../constants/placesCatalog';
import {
  MAX_REVIEWS_PER_ITEM,
  useSavedPlaces,
} from '../context/SavedPlacesContext';
import { localizeDirectoryItem } from '../constants/i18n';

const DIRECTORY_CATEGORIES = [
  { key: 'Todos', labelEs: 'Todos', labelEn: 'All' },
  { key: 'Gastronomía', labelEs: 'Gastronomía', labelEn: 'Food' },
  { key: 'Artesanía', labelEs: 'Artesanía', labelEn: 'Crafts' },
  { key: 'Hoteles', labelEs: 'Hoteles', labelEn: 'Hotels' },
];

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const {
    directoryItems,
    rateDirectoryItem,
    openAdminPanel,
    darkMode,
    language,
  } = useSavedPlaces();

  const C = getColors(darkMode);
  const isEn = language === 'en';
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [ratingTarget, setRatingTarget] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const secretTapRef = useRef({ count: 0, lastTap: 0 });

  const handleSecretHeaderTap = () => {
    const now = Date.now();
    const diff = now - secretTapRef.current.lastTap;
    const nextCount = diff < 650 ? secretTapRef.current.count + 1 : 1;
    if (nextCount >= 5) {
      secretTapRef.current = { count: 0, lastTap: 0 };
      openAdminPanel('directory');
    } else {
      secretTapRef.current = { count: nextCount, lastTap: now };
    }
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );

  const filteredDirectory = useMemo(() => {
    const base =
      selectedCategory === 'Todos'
        ? directoryItems
        : directoryItems.filter((item) => item.categoria === selectedCategory);
    return base.map((item) => localizeDirectoryItem(item, language));
  }, [selectedCategory, directoryItems, language]);

  const handleCall = async (item) => {
    try {
      await Linking.openURL(`tel:${item.telefono}`);
    } catch {
      Alert.alert(item.nombre, `${isEn ? 'Phone' : 'Tel'}: ${item.telefono}`);
    }
  };

  const handleWhatsApp = async (item) => {
    const msg = encodeURIComponent(
      isEn
        ? `Hello ${item.nombre}, I'm contacting you from the Celendín Explore app.`
        : `Hola ${item.nombre}, consulto desde la app Celendín Explore.`
    );
    try {
      await Linking.openURL(`https://wa.me/${item.whatsapp}?text=${msg}`);
    } catch {
      Alert.alert('WhatsApp', `+${item.whatsapp}`);
    }
  };

  const submitDirectoryRating = async (stars) => {
    if (!ratingTarget) return;
    if ((ratingTarget.resenasCount ?? 0) >= MAX_REVIEWS_PER_ITEM) return;
    setSelectedStars(stars);
    await rateDirectoryItem(ratingTarget.id, stars);

    setTimeout(() => {
      setRatingTarget(null);
      setSelectedStars(0);
    }, 250);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F5C41" />
      <View style={[styles.notchBar, { height: topInset }]} />

      {/* Cabecera limpia */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.border },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            {isEn ? 'Directory' : 'Directorio'}
          </Text>
        </View>

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
                    : { backgroundColor: C.card, borderColor: C.border },
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

      {/* Tarjetas limpias del directorio */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredDirectory.map((item) => {
          const imgSource = getPlaceImageSource(item);
          return (
          <View
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            {/* Imagen 100% limpia sin etiquetas encima */}
            <View
              style={[
                styles.cardImageWrap,
                { backgroundColor: C.cardAlt || '#E5E7EB' },
              ]}
            >
              {imgSource ? (
                <Image
                  source={imgSource}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={C.textMuted}
                  />
                  <Text style={[styles.noImageText, { color: C.textMuted }]}>
                    {isEn ? 'No image uploaded' : 'Sin imagen subida'}
                  </Text>
                </View>
              )}
            </View>

            {/* Información y descripción afuera/debajo de la imagen */}
            <View style={styles.cardBody}>
              <View style={styles.topMetaRow}>
                <View
                  style={[
                    styles.catPillClean,
                    { backgroundColor: C.primarySoft },
                  ]}
                >
                  <Text style={[styles.catPillText, { color: C.primaryLight }]}>
                    {item.badge || item.categoria}
                  </Text>
                </View>

                <View style={styles.metaRightRow}>
                  <Text style={styles.priceCleanText}>{item.rangoPrecio}</Text>
                  <Pressable
                    style={styles.ratingWrap}
                    onPress={() => {
                      setSelectedStars(0);
                      setRatingTarget(item);
                    }}
                    hitSlop={8}
                  >
                    {getStarIconNames(item.rating).map((iconName, sIdx) => (
                      <Ionicons
                        key={sIdx}
                        name={iconName}
                        size={12}
                        color={
                          Number(item.rating || 0) > 0
                            ? '#F5A623'
                            : C.textMuted
                        }
                      />
                    ))}
                    <Text style={[styles.ratingText, { color: C.text }]}>
                      {item.rating || '0.0'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text
                style={[styles.cardTitle, { color: C.text }]}
                numberOfLines={1}
              >
                {item.nombre}
              </Text>

              <Text
                style={[styles.specialtyText, { color: C.textSecondary }]}
                numberOfLines={2}
              >
                {item.especialidad}
              </Text>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={C.textMuted}
                />
                <Text
                  style={[styles.addressText, { color: C.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.direccion}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.callBtn,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                  onPress={() => handleCall(item)}
                >
                  <Ionicons
                    name="call-outline"
                    size={15}
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
                    name="logo-whatsapp"
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          </View>
          );
        })}
      </ScrollView>

      {/* Modal de calificación */}
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
              {ratingTarget?.nombre}
            </Text>
            <View style={styles.modalStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => submitDirectoryRating(star)}
                  hitSlop={6}
                >
                  <Ionicons
                    name={star <= selectedStars ? 'star' : 'star-outline'}
                    size={30}
                    color="#F5A623"
                  />
                </Pressable>
              ))}
            </View>
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
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleAccentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#0F5C41',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  chipsRow: {
    gap: 8,
    paddingTop: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#1F2937',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  noImageText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  amberBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#F5A623',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amberBadgeText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  priceBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catPillClean: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  catPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceCleanText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
  },
  specialtyText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  addressText: {
    fontSize: 12,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 11,
  },
  callBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  whatsappBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#128C63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalStarsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  modalCancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
