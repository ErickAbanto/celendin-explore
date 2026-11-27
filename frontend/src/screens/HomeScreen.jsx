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
import {
  localizeDirectoryItem,
  localizeEmergency,
  localizePlace,
  localizeTransport,
  tr,
} from '../constants/i18n';
import PlaceDetailScreen from './PlaceDetailScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SAVED_CARD_WIDTH = Math.min(SCREEN_WIDTH - 36, 370);
const SAVED_CARD_GAP = 12;

// Coordenadas y altitud exacta de la ciudad de Celendín, Cajamarca (-6.8659, -78.1449 · elevation=2625 m s.n.m.)
// Se especifica elevation=2625 y models=ecmwf_ifs025 para obtener la temperatura real de la meseta de Celendín
// (y no la del fondo cálido del Cañón del Marañón) además de máxima/mínima diaria (ej. 14°C · Nublado · 18°/7°).
const CELENDIN_WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-6.8659&longitude=-78.1449&elevation=2625&models=ecmwf_ifs025&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,wind_speed_10m&hourly=precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=America%2FLima';

const CELENDIN_WTTR_BACKUP_URL = 'https://wttr.in/Celendin,Peru?format=j1';

function classifyCelendinWeather({
  code,
  isDay = 1,
  precipitation = 0,
  cloudCover = 0,
  nextHourRainProb = 0,
  nextHourCode = 0,
}) {
  // 1. Descargas eléctricas / Tormenta eléctrica (WMO 95, 96, 99)
  if (code >= 95 || nextHourCode >= 95) {
    return {
      desc: 'Descargas eléctricas',
      detailEs: 'Tormenta activa con actividad eléctrica en la provincia de Celendín',
      detailEn: 'Active thunderstorm with lightning in Celendín province',
      icon: 'thunderstorm',
      iconColor: '#F59E0B',
    };
  }

  // 2. Lloviendo en este momento (precipitación > 0 o códigos WMO 51..86)
  if (
    precipitation > 0.05 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 86)
  ) {
    return {
      desc: 'Lloviendo',
      detailEs: 'Precipitación pluvial registrada actualmente en Celendín',
      detailEn: 'Rainfall currently recorded in Celendín',
      icon: 'rainy',
      iconColor: '#38BDF8',
    };
  }

  // 3. Está por llover (alta probabilidad de lluvia próxima o nubosidad densa pre-lluvia)
  if (
    nextHourRainProb >= 60 ||
    (nextHourCode >= 51 && nextHourCode <= 86) ||
    (cloudCover >= 88 && nextHourRainProb >= 40)
  ) {
    return {
      desc: 'Por llover',
      detailEs: `Cielo cargado con ${nextHourRainProb}% de probabilidad de lluvia próxima`,
      detailEn: `Heavy clouds with ${nextHourRainProb}% chance of upcoming rain`,
      icon: 'umbrella',
      iconColor: '#60A5FA',
    };
  }

  // 4. Nublado (cielo parcial o totalmente nublado sobre Celendín: códigos WMO 1, 2, 3, 45, 48 o nubosidad >= 25%)
  if (
    code === 1 ||
    code === 2 ||
    code === 3 ||
    code === 45 ||
    code === 48 ||
    cloudCover >= 25
  ) {
    return {
      desc: 'Nublado',
      detailEs: `Cielo nublado sobre la provincia de Celendín (${cloudCover}% nubosidad)`,
      detailEn: `Cloudy sky over Celendín province (${cloudCover}% cloud cover)`,
      icon: 'cloud',
      iconColor: '#E2E8F0',
    };
  }

  // 5. Soleado / Despejado
  if (isDay === 0) {
    return {
      desc: 'Soleado',
      detailEs: 'Cielo despejado en la provincia de Celendín',
      detailEn: 'Clear sky in Celendín province',
      icon: 'sunny',
      iconColor: '#FBBF24',
    };
  }

  return {
    desc: 'Soleado',
    detailEs: 'Cielo despejado y soleado en la provincia de Celendín',
    detailEn: 'Clear and sunny sky in Celendín province',
    icon: 'sunny',
    iconColor: '#FBBF24',
  };
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    places,
    directoryItems,
    savedPlaces,
    emergencyNumbers,
    busAgencies,
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
  const [lugarDetalleHome, setLugarDetalleHome] = useState(null);
  const [liveWeather, setLiveWeather] = useState({
    temp: 14,
    tempMax: 18,
    tempMin: 7,
    feelsLike: 14,
    humidity: 74,
    cloudCover: 65,
    precipitation: 0,
    rainProb: 20,
    desc: 'Nublado',
    detailEs: 'Cielo nublado sobre la provincia de Celendín (2,625 m s.n.m.)',
    detailEn: 'Cloudy sky over Celendín province (2,625 m a.s.l.)',
    icon: 'cloud',
    iconColor: '#E2E8F0',
    windspeed: 11,
    updatedAt: 'En vivo',
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

  const fetchCelendinWeather = async () => {
    try {
      const res = await fetch(CELENDIN_WEATHER_URL);
      const data = await res.json();
      const cur = data?.current;
      if (!cur) throw new Error('Sin datos ECMWF');

      const currentHourIso = String(cur.time || '').slice(0, 13);
      const hourlyTimes = data?.hourly?.time || [];
      const hourlyProbs = data?.hourly?.precipitation_probability || [];
      const hourlyCodes = data?.hourly?.weather_code || [];
      let hIdx = hourlyTimes.findIndex((t) =>
        String(t).startsWith(currentHourIso)
      );
      if (hIdx < 0) hIdx = new Date().getHours();

      const nextHourRainProb = Math.max(
        Number(hourlyProbs[hIdx] || 0),
        Number(hourlyProbs[hIdx + 1] || 0)
      );
      const nextHourCode = Number(hourlyCodes[hIdx + 1] ?? cur.weather_code ?? 0);

      const classified = classifyCelendinWeather({
        code: Number(cur.weather_code ?? 2),
        isDay: Number(cur.is_day ?? 1),
        precipitation:
          Number(cur.precipitation || 0) +
          Number(cur.rain || 0) +
          Number(cur.showers || 0),
        cloudCover: Number(cur.cloud_cover ?? 60),
        nextHourRainProb,
        nextHourCode,
      });

      const maxArr = data?.daily?.temperature_2m_max;
      const minArr = data?.daily?.temperature_2m_min;
      const tempMax =
        Array.isArray(maxArr) && maxArr.length > 0
          ? Math.round(Number(maxArr[0]))
          : 18;
      const tempMin =
        Array.isArray(minArr) && minArr.length > 0
          ? Math.round(Number(minArr[0]))
          : 7;

      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setLiveWeather({
        temp: Math.round(Number(cur.temperature_2m)),
        tempMax,
        tempMin,
        feelsLike: Math.round(
          Number(cur.apparent_temperature ?? cur.temperature_2m)
        ),
        humidity: Math.round(Number(cur.relative_humidity_2m ?? 74)),
        cloudCover: Math.round(Number(cur.cloud_cover ?? 60)),
        precipitation: Number(cur.precipitation || 0),
        rainProb: Math.round(nextHourRainProb),
        desc: classified.desc,
        detailEs: classified.detailEs,
        detailEn: classified.detailEn,
        icon: classified.icon,
        iconColor: classified.iconColor,
        windspeed: Math.round(Number(cur.wind_speed_10m) || 0),
        updatedAt: nowTime,
      });
    } catch {
      // Respaldo con estación directa de Celendín, Perú (wttr.in)
      try {
        const resBackup = await fetch(CELENDIN_WTTR_BACKUP_URL);
        const wData = await resBackup.json();
        const cc = wData?.current_condition?.[0];
        const today = wData?.weather?.[0];
        if (cc) {
          const cloud = Number(cc.cloudcover || 60);
          const precip = Number(cc.precipMM || 0);
          const classified = classifyCelendinWeather({
            code: precip > 0.1 ? 61 : cloud >= 25 ? 2 : 0,
            isDay: 1,
            precipitation: precip,
            cloudCover: cloud,
            nextHourRainProb: precip > 0 ? 75 : 20,
            nextHourCode: 2,
          });
          setLiveWeather((prev) => ({
            ...prev,
            temp: Math.round(Number(cc.temp_C ?? 14)),
            tempMax: Math.round(Number(today?.maxtempC ?? 18)),
            tempMin: Math.round(Number(today?.mintempC ?? 7)),
            feelsLike: Math.round(Number(cc.FeelsLikeC ?? cc.temp_C ?? 14)),
            humidity: Math.round(Number(cc.humidity ?? 74)),
            cloudCover: cloud,
            desc: classified.desc,
            detailEs: classified.detailEs,
            detailEn: classified.detailEn,
            icon: classified.icon,
            iconColor: classified.iconColor,
            windspeed: Math.round(Number(cc.windspeedKmph ?? 11)),
          }));
        }
      } catch {
        // Conserva lectura actual de Celendín
      }
    }
  };

  useEffect(() => {
    fetchCelendinWeather();
    const timer = setInterval(fetchCelendinWeather, 180000); // Actualiza cada 3 minutos en tiempo real
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigation?.addListener) return undefined;
    const unsubTabPress = navigation.addListener('tabPress', () => {
      setLugarDetalleHome(null);
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setLugarDetalleHome(null);
    });
    return () => {
      unsubTabPress?.();
      unsubBlur?.();
    };
  }, [navigation]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 16
  );

  // Respeta tildes (á, é, í, ó, ú), la letra ñ/Ñ y signos; además permite coincidencia flexible
  const cleanExact = (str) => String(str || '').toLowerCase().trim();
  // Quita tildes vocales pero CONSERVA intacta la letra ñ
  const cleanKeepEnye = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/ñ/g, '__ENYE__')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/__ENYE__/g, 'ñ')
      .trim();

  const rawQueryLower = cleanExact(searchQuery);
  const flexQueryLower = cleanKeepEnye(searchQuery);
  const isSearching = rawQueryLower.length > 0;
  // Si el usuario escribió explícitamente una tilde o ñ, exige coincidencia exacta con esa tilde/ñ
  const hasExplicitAccentOrEnye = /[áéíóúüñ]/i.test(searchQuery);

  const valueMatchesQuery = (val) => {
    if (!isSearching) return true;
    const text = String(val || '');
    if (!text) return false;
    if (hasExplicitAccentOrEnye) {
      return cleanExact(text).includes(rawQueryLower);
    }
    return (
      cleanExact(text).includes(rawQueryLower) ||
      cleanKeepEnye(text).includes(flexQueryLower)
    );
  };

  const localizedPlaces = useMemo(
    () => places.map((p) => localizePlace(p, language)),
    [places, language]
  );
  const localizedSaved = useMemo(
    () => savedPlaces.map((p) => localizePlace(p, language)),
    [savedPlaces, language]
  );
  const localizedDirectory = useMemo(
    () => (directoryItems || []).map((d) => localizeDirectoryItem(d, language)),
    [directoryItems, language]
  );
  const localizedTransport = useMemo(
    () => (busAgencies || []).map((b) => localizeTransport(b, language)),
    [busAgencies, language]
  );
  const localizedEmergencies = useMemo(
    () => (emergencyNumbers || []).map((e) => localizeEmergency(e, language)),
    [emergencyNumbers, language]
  );

  const textMatches = (item) => {
    if (!isSearching) return true;
    return [
      item.nombre,
      item.titulo,
      item.empresa,
      item.desc,
      item.especialidad,
      item.categoria,
      item.categoriaRaw,
      item.badge,
      item.ubicacion,
      item.direccionCorta,
      item.direccion,
      item.distanciaCorta,
      item.precioTexto,
      item.rangoPrecio,
      item.horario,
      item.tiempoEstimado,
      item.altitudTexto,
      item.ruta,
      item.terminal,
      item.detalle,
      item.numero,
      item.telefono,
      item.tips?.llevar,
      item.tips?.dificultad,
      item.tips?.mejorHorario,
    ].some((v) => valueMatchesQuery(v));
  };

  const matchesFilter = (item) => {
    if (!textMatches(item)) return false;
    // Cuando el usuario está escribiendo en el buscador, no ocultamos ningún resultado por chip de categoría
    if (isSearching) return true;
    if (selectedCategory === 'Todo') return true;
    if (selectedCategory === 'Guardados') return isSaved(item.id);
    return (
      item.categoriaFiltro === selectedCategory ||
      item.categoriaRaw === selectedCategory ||
      item.categoria === selectedCategory
    );
  };

  const filteredSavedPlaces = useMemo(
    () => localizedSaved.filter((item) => textMatches(item)),
    [localizedSaved, searchQuery]
  );

  // Cuando el buscador está activo, busca en TODA la app:
  // 1) Todos los Lugares Turísticos (Naturaleza, Cultura, Artesanía, Aventura)
  // 2) Todo el Directorio (Restaurantes, Gastronomía, Chocolaterías, Artesanía, Hoteles)
  // 3) Transporte (Buses, Combis, Autos) y Emergencias
  // Cuando el buscador está vacío, muestra únicamente los Lugares Destacados por el Administrador.
  const featuredPlaces = useMemo(() => {
    if (!isSearching) {
      return localizedPlaces.filter(
        (item) => matchesFilter(item) && item.esExperienciaHoy === true
      );
    }

    const matchedPlaces = localizedPlaces
      .filter((item) => textMatches(item))
      .map((item) => ({ ...item, _searchKind: 'place' }));

    const matchedDirectory = localizedDirectory
      .filter((d) => textMatches(d))
      .map((d) => ({
        ...d,
        id: `search-dir-${d.id}`,
        _rawId: d.id,
        _rawCategoria: d.categoriaRaw || d.categoria,
        _searchKind: 'directory',
        categoria: d.badge || d.categoria || 'Directorio',
        distanciaCorta: d.direccion || 'Celendín',
        precioTexto: d.rangoPrecio || d.telefono || '',
        desc: d.especialidad || '',
      }));

    const matchedTransport = localizedTransport
      .filter((b) => textMatches(b))
      .map((b) => ({
        ...b,
        id: `search-bus-${b.id}`,
        _rawId: b.id,
        _rawTipo: b.tipo || 'buses',
        _searchKind: 'transport',
        nombre: b.empresa,
        categoria:
          b.tipo === 'combis'
            ? 'Combis'
            : b.tipo === 'autos'
            ? 'Autos'
            : 'Buses',
        distanciaCorta: b.terminal || 'Celendín',
        precioTexto: b.ruta || '',
        rating: '5.0',
      }));

    const matchedEmergencies = localizedEmergencies
      .filter((e) => textMatches(e))
      .map((e) => ({
        ...e,
        id: `search-sos-${e.id}`,
        _rawId: e.id,
        _searchKind: 'emergency',
        nombre: e.titulo,
        categoria: 'Emergencia SOS',
        distanciaCorta: e.detalle || 'Celendín',
        precioTexto: e.numero || '',
        rating: '5.0',
      }));

    return [
      ...matchedPlaces,
      ...matchedDirectory,
      ...matchedTransport,
      ...matchedEmergencies,
    ];
  }, [
    localizedPlaces,
    localizedDirectory,
    localizedTransport,
    localizedEmergencies,
    selectedCategory,
    searchQuery,
    isSearching,
    savedPlaces,
  ]);

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

  if (lugarDetalleHome) {
    const currentPlace =
      places.find((p) => p.id === lugarDetalleHome.id) || lugarDetalleHome;
    return (
      <PlaceDetailScreen
        lugar={currentPlace}
        onBack={() => setLugarDetalleHome(null)}
      />
    );
  }

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
                onPress={() => {
                  fetchCelendinWeather();
                  setInfoModal('weather');
                }}
              >
                <Ionicons
                  name={liveWeather.icon}
                  size={17}
                  color={liveWeather.iconColor || '#FBBF24'}
                />
                <View style={styles.weatherTextWrap}>
                  <Text style={styles.weatherTemp}>{liveWeather.temp}°C</Text>
                  <Text style={styles.weatherDesc} numberOfLines={1}>
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

        {/* Sección: Destacados de Celendín o Resultados del Buscador */}
        {featuredPlaces.length > 0 ? (
          <View key="destacados-static-only" style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: C.text }]}>
                {isSearching
                  ? isEn
                    ? `Search results (${featuredPlaces.length})`
                    : `Resultados de búsqueda (${featuredPlaces.length})`
                  : isEn
                  ? 'Featured in Celendín'
                  : 'Destacados de Celendín'}
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
                const imgSource = getPlaceImageSource(item);
                return (
                  <Pressable
                    key={`static-card-${item.id}`}
                    style={[
                      styles.featuredCard,
                      { backgroundColor: C.card, borderColor: C.border },
                    ]}
                    onPress={() => {
                      if (item._searchKind === 'directory') {
                        navigation.navigate('Directorio', {
                          returnTo: 'Inicio',
                          targetDirectoryId: item._rawId,
                          targetCategory: item._rawCategoria,
                          targetNonce: Date.now(),
                        });
                      } else if (item._searchKind === 'transport') {
                        navigation.navigate('Perfil / Offline', {
                          returnTo: 'Inicio',
                          targetSection: 'transport',
                          targetTransportType: item._rawTipo || item.tipo || 'buses',
                          targetTransportId: item._rawId,
                          targetNonce: Date.now(),
                        });
                      } else if (item._searchKind === 'emergency') {
                        navigation.navigate('Perfil / Offline', {
                          returnTo: 'Inicio',
                          targetSection: 'sos',
                          targetEmergencyId: item._rawId,
                          targetNonce: Date.now(),
                        });
                      } else if (isSearching) {
                        navigation.navigate('Lugares', {
                          returnTo: 'Inicio',
                          targetPlaceId: item.id,
                          targetPlaceName: item.nombre,
                          targetCategory: item.categoriaRaw || item.categoria,
                          targetNonce: Date.now(),
                        });
                      } else {
                        const targetPlace =
                          places.find((p) => p.id === item.id) || item;
                        setLugarDetalleHome(targetPlace);
                      }
                    }}
                  >
                    {/* Contenedor de imagen aislado arriba con overflow hidden (sin botón de corazón) */}
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
                  </Pressable>
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
              <View style={styles.weatherModalContent}>
                <View
                  style={[
                    styles.weatherHeroBox,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <View style={styles.weatherHeroLeft}>
                    <Ionicons
                      name={liveWeather.icon}
                      size={36}
                      color={liveWeather.iconColor || '#F59E0B'}
                    />
                    <View>
                      <Text style={[styles.weatherHeroTemp, { color: C.text }]}>
                        {liveWeather.temp}°C
                      </Text>
                      <Text
                        style={[
                          styles.weatherHeroCondition,
                          { color: C.primaryLight },
                        ]}
                      >
                        {tr(liveWeather.desc, language)} · {liveWeather.tempMax}°/{liveWeather.tempMin}°
                      </Text>
                    </View>
                  </View>
                  <View style={styles.weatherLiveBadge}>
                    <View style={styles.weatherLiveDot} />
                    <Text style={styles.weatherLiveText}>
                      {isEn ? 'LIVE' : 'EN VIVO'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.weatherDetailSub, { color: C.textSecondary }]}
                >
                  {isEn ? liveWeather.detailEn : liveWeather.detailEs}
                </Text>

                <View style={styles.weatherGrid}>
                  <View
                    style={[
                      styles.weatherMetricItem,
                      { backgroundColor: C.cardAlt, borderColor: C.border },
                    ]}
                  >
                    <Ionicons
                      name="thermometer-outline"
                      size={16}
                      color={C.primaryLight}
                    />
                    <Text
                      style={[
                        styles.weatherMetricVal,
                        { color: C.text },
                      ]}
                    >
                      {liveWeather.feelsLike}°C
                    </Text>
                    <Text
                      style={[
                        styles.weatherMetricLbl,
                        { color: C.textSecondary },
                      ]}
                    >
                      {isEn ? 'Feels like' : 'Sensación'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.weatherMetricItem,
                      { backgroundColor: C.cardAlt, borderColor: C.border },
                    ]}
                  >
                    <Ionicons
                      name="rainy-outline"
                      size={16}
                      color="#38BDF8"
                    />
                    <Text
                      style={[
                        styles.weatherMetricVal,
                        { color: C.text },
                      ]}
                    >
                      {liveWeather.rainProb}%
                    </Text>
                    <Text
                      style={[
                        styles.weatherMetricLbl,
                        { color: C.textSecondary },
                      ]}
                    >
                      {isEn ? 'Rain prob.' : 'Prob. lluvia'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.weatherMetricItem,
                      { backgroundColor: C.cardAlt, borderColor: C.border },
                    ]}
                  >
                    <Ionicons
                      name="water-outline"
                      size={16}
                      color="#0284C7"
                    />
                    <Text
                      style={[
                        styles.weatherMetricVal,
                        { color: C.text },
                      ]}
                    >
                      {liveWeather.humidity}%
                    </Text>
                    <Text
                      style={[
                        styles.weatherMetricLbl,
                        { color: C.textSecondary },
                      ]}
                    >
                      {isEn ? 'Humidity' : 'Humedad'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.weatherMetricItem,
                      { backgroundColor: C.cardAlt, borderColor: C.border },
                    ]}
                  >
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color="#D97706"
                    />
                    <Text
                      style={[
                        styles.weatherMetricVal,
                        { color: C.text },
                      ]}
                    >
                      {liveWeather.windspeed} km/h
                    </Text>
                    <Text
                      style={[
                        styles.weatherMetricLbl,
                        { color: C.textSecondary },
                      ]}
                    >
                      {isEn ? 'Wind' : 'Viento'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.weatherCoordsFoot, { color: C.textMuted }]}>
                  {isEn
                    ? `Celendín Province, Cajamarca (-6.8659, -78.1449) · 2,625 m a.s.l. · Updated: ${liveWeather.updatedAt}`
                    : `Provincia de Celendín, Cajamarca (-6.8659, -78.1449) · 2,625 m s.n.m. · Actualizado: ${liveWeather.updatedAt}`}
                </Text>
              </View>
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
  weatherModalContent: {
    gap: 10,
  },
  weatherHeroBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherHeroTemp: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  weatherHeroCondition: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  weatherLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  weatherLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  weatherLiveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  weatherDetailSub: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherMetricItem: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },
  weatherMetricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  weatherMetricLbl: {
    fontSize: 11,
  },
  weatherCoordsFoot: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 2,
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
