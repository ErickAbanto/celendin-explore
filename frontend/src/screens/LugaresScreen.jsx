import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getColors } from '../constants/theme';
import {
  getPlaceImageSource,
  getStarIconNames,
  IMAGE_PRESETS,
  openGoogleMapsLocation,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import PlaceDetailScreen from './PlaceDetailScreen';
import { localizePlace, tr } from '../constants/i18n';

const FILTER_TABS = ['Todos', 'Naturaleza', 'Cultura', 'Artesanía', 'Aventura'];
const PLACE_CATEGORIES = ['Naturaleza', 'Cultura', 'Artesanía', 'Aventura'];

const INITIAL_PLACE_FORM = {
  nombre: '',
  categoria: 'Naturaleza',
  ubicacion: '',
  distanciaCorta: 'Centro',
  precioTexto: 'Libre',
  desc: '',
  imagenPreset: '/images/celendin-hero.jpg',
  imagenCustomUrl: '',
};

export default function LugaresScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const {
    places,
    refreshing,
    syncPlaces,
    toggleSaved,
    isSaved,
    openAdminPanel,
    darkMode,
    language,
  } = useSavedPlaces();

  const C = getColors(darkMode);
  const isEn = language === 'en';

  const [lugarDetalle, setLugarDetalle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const secretTapRef = useRef({ count: 0, lastTap: 0 });

  const handleSecretHeaderTap = () => {
    const now = Date.now();
    const diff = now - secretTapRef.current.lastTap;
    const nextCount = diff < 650 ? secretTapRef.current.count + 1 : 1;
    if (nextCount >= 5) {
      secretTapRef.current = { count: 0, lastTap: 0 };
      openAdminPanel('places');
    } else {
      secretTapRef.current = { count: nextCount, lastTap: now };
    }
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

  useEffect(() => {
    if (!navigation?.addListener) return undefined;
    const unsubTabPress = navigation.addListener('tabPress', () => {
      setLugarDetalle(null);
      syncPlaces();
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setLugarDetalle(null);
    });
    return () => {
      unsubTabPress?.();
      unsubBlur?.();
    };
  }, [navigation]);

  const filteredPlaces = useMemo(() => {
    const base =
      selectedCategory === 'Todos'
        ? places
        : places.filter(
            (item) =>
              item.categoria === selectedCategory ||
              item.categoriaFiltro === selectedCategory
          );
    return base.map((item) => localizePlace(item, language));
  }, [places, selectedCategory, language]);

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

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.notchBar, { height: topInset }]} />

      {/* Cabecera limpia */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: C.card, borderBottomColor: C.border },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            {isEn ? 'Tourist Places' : 'Lugares Turísticos'}
          </Text>
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
                style={[
                  styles.chip,
                  active
                    ? styles.chipActive
                    : { backgroundColor: C.card, borderColor: C.border },
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#FFFFFF' : C.text },
                  ]}
                >
                  {tr(cat, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista limpia de lugares */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPlaces.map((item) => {
          const saved = isSaved(item.id);
          const imgSource = getPlaceImageSource(item);

          return (
            <View
              key={item.id}
              style={[
                styles.placeCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              {/* Contenedor de imagen aislado arriba (estático) */}
              <View
                style={[
                  styles.cardImgBox,
                  { backgroundColor: C.cardAlt || '#E5E7EB' },
                ]}
              >
                {imgSource ? (
                  <Image
                    source={imgSource}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={30}
                      color={C.textMuted}
                    />
                    <Text
                      style={[styles.noImageText, { color: C.textMuted }]}
                    >
                      {isEn ? 'No image uploaded' : 'Sin imagen subida'}
                    </Text>
                  </View>
                )}
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

              {/* Contenedor sólido aparte al pie de la imagen */}
              <View style={[styles.cardBody, { backgroundColor: C.card }]}>
                <View style={styles.cardTopMetaRow}>
                  <View
                    style={[
                      styles.catBadgeClean,
                      { backgroundColor: C.primarySoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardCategoryText,
                        { color: C.primaryLight },
                      ]}
                    >
                      {item.categoria}
                    </Text>
                  </View>
                  <View style={styles.starWrap}>
                    {getStarIconNames(item.rating).map((iconName, sIdx) => (
                      <Ionicons
                        key={sIdx}
                        name={iconName}
                        size={12}
                        color={
                          Number(item.rating || 0) > 0
                            ? '#F59E0B'
                            : C.textMuted
                        }
                      />
                    ))}
                    <Text style={[styles.starText, { color: C.text }]}>
                      {item.rating || '0.0'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.cardTitleText, { color: C.text }]}
                  numberOfLines={2}
                >
                  {item.nombre}
                </Text>

                <Text
                  style={[styles.cardDesc, { color: C.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.desc}
                </Text>

                <View style={styles.metaPillsRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={C.primaryLight}
                  />
                  <Text style={[styles.metaChip, { color: C.textSecondary }]}>
                    {item.direccionCorta || item.ubicacion}
                  </Text>
                  <Text style={[styles.metaDot, { color: C.textMuted }]}>•</Text>
                  <Text style={[styles.metaChip, { color: C.primaryLight }]}>
                    {item.distanciaCorta || tr('Centro', language)}
                  </Text>
                  <Text style={[styles.metaDot, { color: C.textMuted }]}>•</Text>
                  <Text style={[styles.metaChip, { color: '#D97706' }]}>
                    {item.precioTexto || tr('Libre', language)}
                  </Text>
                </View>

                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.detailsBtn,
                      { backgroundColor: C.cardAlt, borderColor: C.border },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setLugarDetalle(item)}
                  >
                    <Text style={[styles.detailsBtnText, { color: C.text }]}>
                      {isEn ? 'View details' : 'Ver detalle'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.googleMapsBtn}
                    activeOpacity={0.85}
                    onPress={() => openGoogleMapsLocation(item)}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={styles.googleMapsBtnText}>Google Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  notchBar: {
    backgroundColor: '#0F5C41',
    width: '100%',
  },
  headerCard: {
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
    paddingTop: 14,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
  },
  placeCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardImgBox: {
    width: '100%',
    height: 155,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: 155,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  noImageText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heartCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    width: '100%',
    padding: 14,
  },
  cardTopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catBadgeClean: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardCategoryText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  starWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  cardTitleText: {
    fontSize: 16.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  metaChip: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 12,
  },
  buttonsRow: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  googleMapsBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.58)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 26 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17.5,
    fontWeight: '800',
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    marginTop: 6,
  },
  modalFormContent: {
    paddingBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  formChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formCatChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  formCatChipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  formCatChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formTwoCols: {
    flexDirection: 'row',
    gap: 8,
  },
  formCol: {
    flex: 1,
  },
  presetImagesRow: {
    gap: 8,
    paddingVertical: 4,
  },
  presetImageCard: {
    width: 84,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  presetImageThumb: {
    width: '100%',
    height: 48,
  },
  presetImageLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 3,
  },
  formErrorText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cancelModalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveModalBtn: {
    flex: 1.3,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0F5C41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
