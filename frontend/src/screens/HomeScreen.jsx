import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
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
import { COLORS } from '../constants/theme';
import {
  getPlaceImageSource,
  openGoogleMapsRoute,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SAVED_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const SAVED_CARD_GAP = 12;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    places,
    savedPlaces,
    refreshing,
    syncPlaces,
    toggleSaved,
    isSaved,
  } = useSavedPlaces();

  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSavedIndex, setActiveSavedIndex] = useState(0);
  const [infoModal, setInfoModal] = useState(null); // 'safety' | 'alerts' | 'weather' | null

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 16
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesFilter = (item, ignoreSavedFilter = false) => {
    const matchesSearch =
      !normalizedQuery ||
      item.nombre.toLowerCase().includes(normalizedQuery) ||
      item.desc.toLowerCase().includes(normalizedQuery) ||
      item.categoria.toLowerCase().includes(normalizedQuery) ||
      item.ubicacion.toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) return false;
    if (ignoreSavedFilter) return true;
    if (selectedCategory === 'Todo') return true;
    if (selectedCategory === 'Guardados') return isSaved(item.id);
    return item.categoriaFiltro === selectedCategory || item.categoria === selectedCategory;
  };

  const filteredSavedPlaces = useMemo(
    () =>
      savedPlaces.filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.nombre.toLowerCase().includes(normalizedQuery) ||
          item.desc.toLowerCase().includes(normalizedQuery) ||
          item.categoria.toLowerCase().includes(normalizedQuery)
        );
      }),
    [savedPlaces, normalizedQuery]
  );

  const featuredPlaces = useMemo(
    () => places.filter((item) => matchesFilter(item)),
    [places, selectedCategory, normalizedQuery, savedPlaces]
  );

  const todayExperiences = useMemo(() => {
    const base = places.filter((item) => item.esExperienciaHoy);
    const list = base.length ? base : places.slice(0, 3);
    return list.filter((item) => matchesFilter(item));
  }, [places, selectedCategory, normalizedQuery, savedPlaces]);

  const openPlaceDetail = (item) => {
    navigation.navigate('Lugares', { lugarElegido: item.nombre });
  };

  const categories = [
    { key: 'Todo', label: 'Todo' },
    { key: 'Guardados', label: `Guardados (${savedPlaces.length})`, hasHeart: true },
    { key: 'Naturaleza', label: 'Naturaleza' },
    { key: 'Cultura', label: 'Cultura' },
  ];

  const showSavedSection =
    (selectedCategory === 'Todo' || selectedCategory === 'Guardados') &&
    filteredSavedPlaces.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
        {/* Cabecera verde esmeralda */}
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.greetingCol}>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#D9E86F" />
                <Text style={styles.locationText}>Celendín, Cajamarca</Text>
              </View>
              <Text style={styles.greetingTitle}>{'¡Hola,\nExplorador!'}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.weatherPill}
                activeOpacity={0.85}
                onPress={() => setInfoModal('weather')}
              >
                <Ionicons name="sunny-outline" size={18} color="#FBBF24" />
                <View style={styles.weatherTextWrap}>
                  <Text style={styles.weatherTemp}>19°C</Text>
                  <Text style={styles.weatherDesc}>Soleado</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleActionBtn}
                activeOpacity={0.85}
                onPress={() => setInfoModal('safety')}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#E5E7EB" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleActionBtn}
                activeOpacity={0.85}
                onPress={() => setInfoModal('alerts')}
              >
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={19} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cataratas, sombrero, chocolate..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chips de filtro horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(cat.key)}
              >
                {cat.hasHeart && (
                  <Ionicons
                    name="heart"
                    size={13}
                    color={active ? '#FFE4E6' : COLORS.pink}
                    style={styles.chipHeart}
                  />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sección: Mis Lugares Guardados */}
        {showSavedSection && (
          <View style={styles.sectionBlock}>
            <View style={styles.savedSectionHeader}>
              <View style={styles.savedTitleRow}>
                <Ionicons name="heart" size={15} color={COLORS.pink} />
                <Text style={styles.savedTitleText}>
                  MIS LUGARES GUARDADOS ({filteredSavedPlaces.length})
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {filteredSavedPlaces.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      idx === activeSavedIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SAVED_CARD_WIDTH + SAVED_CARD_GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.savedCarouselContent}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x /
                    (SAVED_CARD_WIDTH + SAVED_CARD_GAP)
                );
                setActiveSavedIndex(
                  Math.max(0, Math.min(idx, filteredSavedPlaces.length - 1))
                );
              }}
            >
              {filteredSavedPlaces.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.savedHeroCard}
                  activeOpacity={0.92}
                  onPress={() => openPlaceDetail(item)}
                >
                  <Image
                    source={getPlaceImageSource(item)}
                    style={styles.savedHeroImg}
                    resizeMode="cover"
                  />
                  <View style={styles.savedHeroGradient} pointerEvents="none" />
                  <View style={styles.bottomScrim} pointerEvents="none" />

                  <View style={styles.savedCardTop}>
                    <View style={styles.savedPillsRow}>
                      <View style={styles.savedBadgePink}>
                        <Ionicons name="heart" size={10} color="#FFF" />
                        <Text style={styles.savedBadgePinkText}>GUARDADO</Text>
                      </View>
                      <View style={styles.savedBadgeAmber}>
                        <Text style={styles.savedBadgeAmberText}>
                          {item.categoria}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.heartCircleBtn}
                      activeOpacity={0.8}
                      onPress={() => toggleSaved(item.id)}
                    >
                      <Ionicons name="heart" size={17} color="#EC2D5B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.savedCardBottom}>
                    <View style={styles.savedBottomTextCol}>
                      <Text style={styles.savedCardName} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <View style={styles.savedMetaRow}>
                        <Ionicons
                          name="location-outline"
                          size={13}
                          color={COLORS.accentLight}
                        />
                        <Text style={styles.savedMetaText}>
                          {item.distanciaCorta} • {item.precioTexto}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.mapsPillBtn}
                      activeOpacity={0.85}
                      onPress={() => openGoogleMapsRoute(item)}
                    >
                      <Ionicons name="paper-plane-outline" size={13} color="#FFF" />
                      <Text style={styles.mapsPillBtnText}>Ir con Maps</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sección: Destacados de Celendín */}
        {featuredPlaces.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                {'Destacados de\nCelendín'}
              </Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Lugares')}
              >
                <Text style={styles.seeAllText}>
                  {'Ver todos con Google\nMaps'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={COLORS.primaryLight}
                  style={styles.seeAllArrow}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredCarouselContent}
            >
              {featuredPlaces.map((item) => {
                const saved = isSaved(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.featuredCard}
                    activeOpacity={0.9}
                    onPress={() => openPlaceDetail(item)}
                  >
                    <View style={styles.featuredImgBox}>
                      <Image
                        source={getPlaceImageSource(item)}
                        style={styles.featuredImg}
                        resizeMode="cover"
                      />
                      <View style={styles.featuredImgGradient} pointerEvents="none" />
                      <View style={styles.bottomScrim} pointerEvents="none" />

                      <View style={styles.featuredImgTop}>
                        <View style={styles.amberTag}>
                          <Text style={styles.amberTagText} numberOfLines={1}>
                            {item.etiquetaDestacado || item.categoria}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.smallHeartBtn}
                          activeOpacity={0.8}
                          onPress={() => toggleSaved(item.id)}
                        >
                          <Ionicons
                            name={saved ? 'heart' : 'heart-outline'}
                            size={15}
                            color={saved ? '#EC2D5B' : '#FFFFFF'}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.featuredImgBottom}>
                        <View style={styles.featuredDistRow}>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={COLORS.accentLight}
                          />
                          <Text style={styles.featuredDistText} numberOfLines={1}>
                            {item.distanciaCorta}
                          </Text>
                        </View>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color="#FBBF24" />
                          <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.featuredCardBody}>
                      <Text style={styles.featuredMetaUpper} numberOfLines={1}>
                        {item.categoria.toUpperCase()} • {item.precioTexto.toUpperCase()}
                      </Text>
                      <Text style={styles.featuredTitle} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={styles.featuredDesc} numberOfLines={2}>
                        {item.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Banner destacado: Orgullo Shilico */}
        {selectedCategory !== 'Guardados' && !normalizedQuery && (
          <TouchableOpacity
            style={styles.promoBanner}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('Directorio')}
          >
            <View style={styles.promoSparkle} pointerEvents="none">
              <Ionicons
                name="sparkles-outline"
                size={84}
                color="rgba(255, 255, 255, 0.25)"
              />
            </View>

            <View style={styles.promoBadge}>
              <Ionicons name="ribbon-outline" size={12} color="#FBBF24" />
              <Text style={styles.promoBadgeText}>ORGULLO SHILICO</Text>
            </View>

            <Text style={styles.promoTitle}>
              Ruta del Sombrero de Paja Toquilla
            </Text>
            <Text style={styles.promoDesc}>
              Visita a los maestros artesanos y conoce cómo se teje el sombrero más fino del norte peruano.
            </Text>
          </TouchableOpacity>
        )}

        {/* Sección: Experiencias Imperdibles Hoy */}
        {todayExperiences.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.experiencesHeading}>
              Experiencias Imperdibles Hoy
            </Text>

            {todayExperiences.map((item) => (
              <TouchableOpacity
                key={`exp-${item.id}`}
                style={styles.expCard}
                activeOpacity={0.88}
                onPress={() => openPlaceDetail(item)}
              >
                <Image
                  source={getPlaceImageSource(item)}
                  style={styles.expThumb}
                  resizeMode="cover"
                />
                <View style={styles.expBody}>
                  <Text style={styles.expMetaTop} numberOfLines={1}>
                    <Text style={styles.expCategory}>{item.categoria}</Text>
                    <Text style={styles.expDot}> • </Text>
                    <Text style={styles.expDist}>{item.distanciaCorta}</Text>
                  </Text>
                  <Text style={styles.expTitle} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <View style={styles.expRatingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.expRatingNum}>{item.rating}</Text>
                    <Text style={styles.expPriceText}> • {item.precioTexto}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Estado vacío si la búsqueda no encuentra resultados */}
        {featuredPlaces.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="compass-outline" size={38} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyDesc}>
              No encontramos destinos que coincidan con tu filtro o búsqueda actual.
            </Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Todo');
              }}
            >
              <Text style={styles.clearFilterText}>Mostrar todo Celendín</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal informativo para Clima, Seguridad y Novedades */}
      <Modal
        visible={infoModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {infoModal === 'weather'
                  ? 'Clima en Celendín'
                  : infoModal === 'safety'
                  ? 'Seguridad y Asistencia'
                  : 'Agenda y Novedades Shilicas'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {infoModal === 'weather' && (
              <Text style={styles.modalBody}>
                Celendín ("El Cielo Azul del Edén") se encuentra a 2,625 m s.n.m. con clima templado seco entre 14 °C y 22 °C. Lleva bloqueador solar durante el día y abrigo ligero para el atardecer.
              </Text>
            )}
            {infoModal === 'safety' && (
              <Text style={styles.modalBody}>
                • Comisaría PNP Celendín: 105{'\n'}
                • Emergencias Médicas / SAMU: 106{'\n'}
                • Hospital de Apoyo Celendín: Jr. Dos de Mayo{'\n'}
                • Todas las rutas principales cuentan con ficha y guía offline.
              </Text>
            )}
            {infoModal === 'alerts' && (
              <Text style={styles.modalBody}>
                • Feria Dominical de Sombreros de Paja Toquilla: domingos desde las 7:00 am en las inmediaciones de la Plaza de Armas.{'\n'}
                • Fiesta Patronal Virgen del Carmen: del 15 de julio al 4 de agosto.
              </Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setInfoModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    backgroundColor: '#0F5C41',
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingCol: {
    flex: 1,
    paddingRight: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#D9E86F',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 5,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 31,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weatherTextWrap: {
    marginLeft: 6,
  },
  weatherTemp: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 14,
  },
  weatherDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    lineHeight: 12,
  },
  circleActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
    borderWidth: 1,
    borderColor: '#0F5C41',
  },
  searchBar: {
    marginTop: 18,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: COLORS.textMain,
    paddingVertical: 0,
  },
  chipsRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipHeart: {
    marginRight: 6,
  },
  chipText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionBlock: {
    marginTop: 16,
  },
  savedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  savedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedTitleText: {
    marginLeft: 6,
    color: '#D61F4D',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#E11D48',
  },
  savedCarouselContent: {
    paddingHorizontal: 18,
    gap: SAVED_CARD_GAP,
  },
  savedHeroCard: {
    width: SAVED_CARD_WIDTH,
    height: 176,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    justifyContent: 'space-between',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  savedHeroImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  savedHeroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    backgroundImage:
      'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.34) 48%, rgba(0, 0, 0, 0.88) 100%)',
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedBadgePink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC2D5B',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  savedBadgePinkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  savedBadgeAmber: {
    backgroundColor: '#F5B82E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savedBadgeAmberText: {
    color: '#111827',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heartCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  savedBottomTextCol: {
    flex: 1,
    marginRight: 10,
  },
  savedCardName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  savedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  savedMetaText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mapsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    gap: 5,
  },
  mapsPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionHeading: {
    color: COLORS.textMain,
    fontSize: 17.5,
    fontWeight: '800',
    lineHeight: 22,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: COLORS.primaryLight,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 16,
  },
  seeAllArrow: {
    marginLeft: 4,
  },
  featuredCarouselContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  featuredCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImgBox: {
    height: 126,
    backgroundColor: '#111827',
    justifyContent: 'space-between',
    padding: 10,
    overflow: 'hidden',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  featuredImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featuredImgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    backgroundImage:
      'linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.18) 55%, rgba(0, 0, 0, 0.72) 100%)',
  },
  featuredImgTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amberTag: {
    backgroundColor: '#F5B82E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 145,
  },
  amberTagText: {
    color: '#111827',
    fontSize: 10.5,
    fontWeight: '800',
  },
  smallHeartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImgBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  featuredDistText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  featuredCardBody: {
    padding: 12,
  },
  featuredMetaUpper: {
    color: COLORS.primaryLight,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  featuredTitle: {
    marginTop: 4,
    color: COLORS.textMain,
    fontSize: 14.5,
    fontWeight: '800',
  },
  featuredDesc: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  promoBanner: {
    marginTop: 20,
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#F59E0B',
    backgroundImage:
      'linear-gradient(135deg, #FBBF24 0%, #F59E0B 60%, #E08206 100%)',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  promoSparkle: {
    position: 'absolute',
    right: -6,
    bottom: -10,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  promoTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
  },
  promoDesc: {
    marginTop: 6,
    color: '#3D2704',
    fontSize: 13.5,
    lineHeight: 19,
    paddingRight: 28,
  },
  experiencesHeading: {
    paddingHorizontal: 18,
    marginBottom: 12,
    color: COLORS.textMain,
    fontSize: 17.5,
    fontWeight: '800',
  },
  expCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  expThumb: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  expBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  expMetaTop: {
    fontSize: 11.5,
  },
  expCategory: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  expDot: {
    color: '#9CA3AF',
  },
  expDist: {
    color: '#6B7280',
    fontWeight: '500',
  },
  expTitle: {
    marginTop: 3,
    color: COLORS.textMain,
    fontSize: 14.5,
    fontWeight: '800',
  },
  expRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  expRatingNum: {
    marginLeft: 4,
    color: '#D97706',
    fontSize: 12.5,
    fontWeight: '800',
  },
  expPriceText: {
    color: '#4B5563',
    fontSize: 12.5,
    fontWeight: '500',
  },
  emptyBox: {
    margin: 22,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  clearFilterBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '800',
  },
  modalBody: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 21,
  },
  modalCloseBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
