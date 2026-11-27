import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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
  openGoogleMapsRoute,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import { localizeEmergency, localizePlace, tr } from '../constants/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SAVED_CARD_WIDTH = Math.min(SCREEN_WIDTH - 36, 370);
const SAVED_CARD_GAP = 12;

function describeWeatherCode(code) {
  if (code === 0) return { desc: 'Soleado', icon: 'sunny-outline' };
  if (code === 1 || code === 2)
    return { desc: 'Soleado', icon: 'partly-sunny-outline' };
  if (code === 3 || code === 45 || code === 48)
    return { desc: 'Nublado', icon: 'cloud-outline' };
  if (code >= 51 && code <= 67)
    return { desc: 'Lluvia ligera', icon: 'rainy-outline' };
  if (code >= 80 && code <= 82)
    return { desc: 'Lluvia', icon: 'rainy-outline' };
  if (code >= 95) return { desc: 'Tormenta', icon: 'thunderstorm-outline' };
  return { desc: 'Soleado', icon: 'sunny-outline' };
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    places,
    savedPlaces,
    emergencyNumbers,
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

  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSavedIndex, setActiveSavedIndex] = useState(0);
  const [infoModal, setInfoModal] = useState(null); // 'safety' | 'weather' | null
  const [liveWeather, setLiveWeather] = useState({
    temp: 19,
    desc: 'Soleado',
    icon: 'sunny-outline',
    windspeed: 10,
  });

  const secretTapRef = useRef({ count: 0, lastTap: 0 });
  const savedTranslateX = useRef(new Animated.Value(0)).current;
  const savedStepRef = useRef(0);

  const handleSecretTap = () => {
    const now = Date.now();
    const diff = now - secretTapRef.current.lastTap;
    const nextCount = diff < 750 ? secretTapRef.current.count + 1 : 1;
    if (nextCount >= 10) {
      secretTapRef.current = { count: 0, lastTap: 0 };
      openAdminPanel('places');
    } else {
      secretTapRef.current = { count: nextCount, lastTap: now };
    }
  };

  useEffect(() => {
    let active = true;
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-6.8659&longitude=-78.1449&current_weather=true&timezone=America%2FLima'
    )
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.current_weather) {
          const cw = data.current_weather;
          const mapped = describeWeatherCode(Number(cw.weathercode));
          setLiveWeather({
            temp: Math.round(Number(cw.temperature)),
            desc: mapped.desc,
            icon: mapped.icon,
            windspeed: Math.round(Number(cw.windspeed) || 0),
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 16
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const localizedPlaces = useMemo(
    () => places.map((p) => localizePlace(p, language)),
    [places, language]
  );
  const localizedSaved = useMemo(
    () => savedPlaces.map((p) => localizePlace(p, language)),
    [savedPlaces, language]
  );

  const textMatches = (item) => {
    if (!normalizedQuery) return true;
    return [item.nombre, item.desc, item.categoria, item.ubicacion].some((v) =>
      String(v || '').toLowerCase().includes(normalizedQuery)
    );
  };

  const matchesFilter = (item) => {
    if (!textMatches(item)) return false;
    if (selectedCategory === 'Todo') return true;
    if (selectedCategory === 'Guardados') return isSaved(item.id);
    return (
      item.categoriaFiltro === selectedCategory ||
      item.categoriaRaw === selectedCategory
    );
  };

  const filteredSavedPlaces = useMemo(
    () => localizedSaved.filter((item) => textMatches(item)),
    [localizedSaved, normalizedQuery]
  );

  const featuredPlaces = useMemo(
    () => localizedPlaces.filter((item) => matchesFilter(item)),
    [localizedPlaces, selectedCategory, normalizedQuery, savedPlaces]
  );

  const categories = [
    { key: 'Todo', label: isEn ? 'All' : 'Todo' },
    { key: 'Guardados', label: isEn ? 'Saved' : 'Guardados', hasHeart: true },
    { key: 'Naturaleza', label: isEn ? 'Nature' : 'Naturaleza' },
    { key: 'Cultura', label: isEn ? 'Culture' : 'Cultura' },
  ];

  const showSavedSection = filteredSavedPlaces.length > 0;

  const savedLoopItems = useMemo(() => {
    if (filteredSavedPlaces.length <= 1) return filteredSavedPlaces;
    return [...filteredSavedPlaces, filteredSavedPlaces[0]];
  }, [filteredSavedPlaces]);

  // Auto-carrusel continuo hacia adelante cada 4 segundos (sin rebobinar hacia atrás)
  useEffect(() => {
    const total = filteredSavedPlaces.length;
    savedStepRef.current = 0;
    savedTranslateX.setValue(0);
    setActiveSavedIndex(0);

    if (!showSavedSection || total <= 1) return undefined;

    const stepWidth = SAVED_CARD_WIDTH + SAVED_CARD_GAP;

    const interval = setInterval(() => {
      const nextStep = savedStepRef.current + 1;
      savedStepRef.current = nextStep;
      setActiveSavedIndex(nextStep % total);

      Animated.timing(savedTranslateX, {
        toValue: -nextStep * stepWidth,
        duration: 850,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && nextStep >= total) {
          savedStepRef.current = 0;
          savedTranslateX.setValue(0);
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [showSavedSection, filteredSavedPlaces]);

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.notchBar, { height: topInset }]} />

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
        {/* Cabecera verde esmeralda refinada */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={styles.greetingCol}
              onPress={handleSecretTap}
              hitSlop={8}
            >
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="#D9E86F" />
                <Text style={styles.locationText}>Celendín, Cajamarca</Text>
              </View>
              <Text style={styles.greetingTitle}>
                {isEn ? 'Explore Celendín' : 'Explora Celendín'}
              </Text>
            </Pressable>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.weatherPill}
                activeOpacity={0.85}
                onPress={() => setInfoModal('weather')}
              >
                <Ionicons name={liveWeather.icon} size={17} color="#FBBF24" />
                <View style={styles.weatherTextWrap}>
                  <Text style={styles.weatherTemp}>{liveWeather.temp}°C</Text>
                  <Text style={styles.weatherDesc}>
                    {tr(liveWeather.desc, language)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleActionBtn}
                activeOpacity={0.85}
                onPress={() => setInfoModal('safety')}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#E5E7EB"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Buscador limpio */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: darkMode ? C.cardAlt : '#FFFFFF' },
            ]}
          >
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: C.text }]}
              placeholder={
                isEn
                  ? 'Search waterfalls, hats, chocolate...'
                  : 'Buscar cataratas, sombrero, chocolate...'
              }
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

        {/* Chips de filtro equilibrados */}
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
                style={[
                  styles.chip,
                  active
                    ? styles.chipActive
                    : { backgroundColor: C.card, borderColor: C.border },
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(cat.key)}
              >
                {cat.hasHeart && (
                  <Ionicons
                    name="heart"
                    size={12}
                    color={active ? '#FFE4E6' : COLORS.pink}
                    style={styles.chipHeart}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#FFFFFF' : C.text },
                    active && styles.chipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sección: Mis Lugares Favoritos (carrusel 100% informativo sin botones ni clics) */}
        {showSavedSection && (
          <View style={styles.sectionBlock}>
            <View style={styles.savedSectionHeader}>
              <Text style={[styles.sectionTitleText, { color: C.text }]}>
                {isEn ? 'My Favorite Places' : 'Mis Lugares Favoritos'}
              </Text>
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

            <View style={styles.savedViewport} pointerEvents="none">
              <Animated.View
                style={[
                  styles.savedCarouselTrack,
                  { transform: [{ translateX: savedTranslateX }] },
                ]}
              >
                {savedLoopItems.map((item, idx) => {
                  const imgSource = getPlaceImageSource(item);
                  return (
                  <View
                    key={`${item.id}-loop-${idx}`}
                    style={[
                      styles.savedHeroCard,
                      { backgroundColor: C.card, borderColor: C.border },
                    ]}
                  >
                    {imgSource ? (
                      <Image
                        source={imgSource}
                        style={styles.savedThumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.savedThumbImg,
                          styles.noImgCenter,
                          { backgroundColor: C.primarySoft },
                        ]}
                      >
                        <Ionicons
                          name="image-outline"
                          size={22}
                          color={C.primaryLight}
                        />
                      </View>
                    )}

                    <View style={styles.savedCardContent}>
                      <View style={styles.savedTopMetaRow}>
                        <Text
                          style={[
                            styles.savedCatLabel,
                            { color: C.primaryLight },
                          ]}
                        >
                          {item.categoria}
                        </Text>
                        <Ionicons name="heart" size={16} color="#EC2D5B" />
                      </View>

                      <Text
                        style={[styles.savedCardTitle, { color: C.text }]}
                        numberOfLines={1}
                      >
                        {item.nombre}
                      </Text>

                      <Text
                        style={[
                          styles.savedDistText,
                          { color: C.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.direccionCorta || item.ubicacion} •{' '}
                        {item.distanciaCorta}
                      </Text>
                    </View>
                  </View>
                  );
                })}
              </Animated.View>
            </View>
          </View>
        )}

        {/* Sección: Destacados de Celendín (misma estructura para Todo, Guardados, Naturaleza y Cultura) */}
        {featuredPlaces.length > 0 ? (
          <View key="destacados-static-only" style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: C.text }]}>
                {isEn ? 'Featured in Celendín' : 'Destacados de Celendín'}
              </Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Lugares')}
              >
                <Text style={[styles.seeAllText, { color: C.primaryLight }]}>
                  {isEn ? 'See all' : 'Ver todos'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={C.primaryLight}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              key="destacados-carousel-static"
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredCarouselContent}
            >
              {featuredPlaces.map((item) => {
                const saved = isSaved(item.id);
                const imgSource = getPlaceImageSource(item);
                return (
                  <View
                    key={`static-card-${item.id}`}
                    style={[
                      styles.featuredCard,
                      { backgroundColor: C.card, borderColor: C.border },
                    ]}
                  >
                    {/* Contenedor de imagen aislado arriba con overflow hidden */}
                    <View
                      style={[
                        styles.featuredImgBox,
                        { backgroundColor: C.cardAlt || '#E5E7EB' },
                      ]}
                    >
                      {imgSource ? (
                        <Image
                          source={imgSource}
                          style={styles.featuredImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.featuredImg, styles.noImgCenter]}>
                          <Ionicons
                            name="image-outline"
                            size={26}
                            color={C.textMuted}
                          />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.smallHeartBtn}
                        activeOpacity={0.8}
                        onPress={() => toggleSaved(item.id)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={saved ? 'heart' : 'heart-outline'}
                          size={15}
                          color={saved ? '#EC2D5B' : '#FFFFFF'}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Contenedor sólido aparte al pie de la imagen */}
                    <View
                      style={[
                        styles.featuredCardBody,
                        { backgroundColor: C.card },
                      ]}
                    >
                      <View style={styles.featuredMetaTopRow}>
                        <View
                          style={[
                            styles.catPillClean,
                            { backgroundColor: C.primarySoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.featuredCatText,
                              { color: C.primaryLight },
                            ]}
                            numberOfLines={1}
                          >
                            {item.categoria}
                          </Text>
                        </View>
                        <View style={styles.ratingRow}>
                          {getStarIconNames(item.rating).map((iconName, sIdx) => (
                            <Ionicons
                              key={sIdx}
                              name={iconName}
                              size={11}
                              color={
                                Number(item.rating || 0) > 0
                                  ? '#F59E0B'
                                  : C.textMuted
                              }
                            />
                          ))}
                          <Text
                            style={[styles.ratingText, { color: C.text }]}
                          >
                            {item.rating || '0.0'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[styles.featuredTitle, { color: C.text }]}
                        numberOfLines={1}
                      >
                        {item.nombre}
                      </Text>

                      <View style={styles.featuredFooterMeta}>
                        <View style={styles.featuredDistRow}>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={C.primaryLight}
                          />
                          <Text
                            style={[
                              styles.featuredDistText,
                              { color: C.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.distanciaCorta}
                          </Text>
                        </View>
                        <Text style={styles.featuredPriceText}>
                          {item.precioTexto}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Ionicons
              name={
                selectedCategory === 'Guardados'
                  ? 'heart-outline'
                  : 'compass-outline'
              }
              size={34}
              color={C.primaryLight}
            />
            <Text style={[styles.emptyTitle, { color: C.text }]}>
              {selectedCategory === 'Guardados'
                ? isEn
                  ? 'No saved places yet'
                  : 'Aún no tienes lugares guardados'
                : isEn
                  ? 'No results'
                  : 'Sin resultados'}
            </Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Todo');
              }}
            >
              <Text style={styles.clearFilterText}>
                {isEn ? 'Show all' : 'Mostrar todo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal informativo para Clima y Emergencias */}
      <Modal
        visible={infoModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>
                {infoModal === 'weather'
                  ? isEn
                    ? 'Weather in Celendín'
                    : 'Clima en Celendín'
                  : isEn
                    ? 'Celendín Emergencies'
                    : 'Emergencias Celendín'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {infoModal === 'weather' && (
              <Text style={[styles.modalBody, { color: C.textSecondary }]}>
                {liveWeather.temp} °C • {tr(liveWeather.desc, language)} •{' '}
                {isEn ? 'Wind' : 'Viento'} {liveWeather.windspeed} km/h.{'\n'}
                {isEn ? 'Altitude: 2,625 m a.s.l.' : 'Altitud: 2,625 m s.n.m.'}
              </Text>
            )}
            {infoModal === 'safety' && (
              <Text style={[styles.modalBody, { color: C.textSecondary }]}>
                {emergencyNumbers
                  .map((e) => localizeEmergency(e, language))
                  .map((e) => `• ${e.titulo}: ${e.numero}`)
                  .join('\n')}
              </Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setInfoModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>
                {isEn ? 'Close' : 'Cerrar'}
              </Text>
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
  },
  notchBar: {
    backgroundColor: '#0F5C41',
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#0F5C41',
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingCol: {
    flex: 1,
    paddingRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  locationText: {
    color: '#D9E86F',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 10,
    lineHeight: 12,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: 14,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  chipsRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipHeart: {
    marginRight: 5,
  },
  chipText: {
    fontSize: 12.5,
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
    gap: 8,
  },
  sectionAccentBar: {
    width: 4,
    height: 17,
    borderRadius: 2,
    backgroundColor: '#0F5C41',
  },
  sectionTitleText: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    width: 16,
    backgroundColor: '#0F5C41',
  },
  savedViewport: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  savedCarouselTrack: {
    flexDirection: 'row',
    gap: SAVED_CARD_GAP,
  },
  savedHeroCard: {
    width: SAVED_CARD_WIDTH,
    borderRadius: 18,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedThumbImg: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  noImgCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  savedTopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCatLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  savedCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  savedBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  savedDistText: {
    flex: 1,
    fontSize: 12,
  },
  mapsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F5C41',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  mapsPillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  savedFullList: {
    paddingHorizontal: 18,
    gap: 14,
  },
  savedFullCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  savedFullImg: {
    width: '100%',
    height: 145,
    backgroundColor: '#E5E7EB',
  },
  savedFullBody: {
    padding: 14,
  },
  savedFullActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  featuredCarouselContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  featuredCard: {
    width: 232,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImgBox: {
    width: '100%',
    height: 132,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  featuredImg: {
    width: '100%',
    height: 132,
  },
  smallHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCardBody: {
    width: '100%',
    padding: 13,
  },
  featuredMetaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catPillClean: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  featuredCatText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  featuredDescText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  featuredFooterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  featuredDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  featuredDistText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  featuredPriceText: {
    color: '#D97706',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyBox: {
    margin: 18,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  clearFilterBtn: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  modalCloseBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
