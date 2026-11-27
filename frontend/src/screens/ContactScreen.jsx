import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/theme';
import {
  getPlaceImageSource,
  openGoogleMapsLocation,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';
import {
  localizeEmergency,
  localizePlace,
  localizeTransport,
  tr,
} from '../constants/i18n';
import PlaceDetailScreen from './PlaceDetailScreen';

export default function ContactScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    places,
    savedPlaces: rawSavedPlaces,
    emergencyNumbers: rawEmergencyNumbers,
    busAgencies: rawBusAgencies,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    setShowWelcome,
  } = useSavedPlaces();

  const C = getColors(darkMode);
  const isEn = language === 'en';
  const savedPlaces = rawSavedPlaces.map((p) => localizePlace(p, language));
  const emergencyNumbers = rawEmergencyNumbers.map((e) =>
    localizeEmergency(e, language)
  );
  const busAgencies = rawBusAgencies.map((b) => localizeTransport(b, language));
  const [activeSlide, setActiveSlide] = useState(0);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [transportModalType, setTransportModalType] = useState(null); // 'buses' | 'combis' | 'autos' | null
  const [lugarDetallePerfil, setLugarDetallePerfil] = useState(null);
  const [pendingSosId, setPendingSosId] = useState(null);
  const [pendingTransportId, setPendingTransportId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const sosScrollRef = useRef(null);
  const sosYMapRef = useRef({});
  const transportScrollRef = useRef(null);
  const transportYMapRef = useRef({});
  const returnToTab = route?.params?.returnTo;

  const handleReturnOrigin = () => {
    const origin = route?.params?.returnTo;
    navigation?.setParams?.({ returnTo: undefined });
    if (origin) {
      navigation?.navigate?.(origin);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (
      !returnToTab ||
      lugarDetallePerfil ||
      sosModalVisible ||
      transportModalType !== null
    ) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return handleReturnOrigin();
    });
    return () => sub.remove();
  }, [returnToTab, lugarDetallePerfil, sosModalVisible, transportModalType]);

  useEffect(() => {
    const section = route?.params?.targetSection;
    if (!section) return;

    setLugarDetallePerfil(null);
    if (section === 'transport') {
      const nextType = route?.params?.targetTransportType || 'buses';
      const targetId = route?.params?.targetTransportId || null;
      setSosModalVisible(false);
      transportYMapRef.current = {};
      setTransportModalType(nextType);
      setPendingTransportId(targetId);
      setHighlightedId(targetId);
    } else if (section === 'sos') {
      const targetId = route?.params?.targetEmergencyId || null;
      setTransportModalType(null);
      sosYMapRef.current = {};
      setSosModalVisible(true);
      setPendingSosId(targetId);
      setHighlightedId(targetId);
    }

    navigation?.setParams?.({
      targetSection: undefined,
      targetTransportType: undefined,
      targetTransportId: undefined,
      targetEmergencyId: undefined,
      targetNonce: undefined,
    });
  }, [
    route?.params?.targetSection,
    route?.params?.targetTransportType,
    route?.params?.targetTransportId,
    route?.params?.targetEmergencyId,
    route?.params?.targetNonce,
    navigation,
  ]);

  useEffect(() => {
    if (!highlightedId) return undefined;
    const timer = setTimeout(() => setHighlightedId(null), 2800);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  useEffect(() => {
    if (!navigation?.addListener) return undefined;
    const unsubTabPress = navigation.addListener('tabPress', () => {
      setLugarDetallePerfil(null);
      setSosModalVisible(false);
      setTransportModalType(null);
      setPendingSosId(null);
      setPendingTransportId(null);
      setHighlightedId(null);
      navigation?.setParams?.({ returnTo: undefined });
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setLugarDetallePerfil(null);
      setSosModalVisible(false);
      setTransportModalType(null);
      setPendingSosId(null);
      setPendingTransportId(null);
      setHighlightedId(null);
      navigation?.setParams?.({ returnTo: undefined });
    });
    return () => {
      unsubTabPress?.();
      unsubBlur?.();
    };
  }, [navigation]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );

  const savedCardWidth = Math.max(width - 32, 260);
  const savedCardStep = savedCardWidth + 12;

  const handleSavedScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x || 0;
    const index = Math.round(x / savedCardStep);
    if (index !== activeSlide && index >= 0 && index < savedPlaces.length) {
      setActiveSlide(index);
    }
  };

  const callEmergency = async (tel) => {
    try {
      await Linking.openURL(`tel:${tel}`);
    } catch {
      Alert.alert(
        isEn ? 'Emergency' : 'Emergencia',
        isEn ? `Dial ${tel}` : `Marca el número ${tel}`
      );
    }
  };

  if (lugarDetallePerfil) {
    const currentPlace =
      places.find((p) => p.id === lugarDetallePerfil.id) || lugarDetallePerfil;
    return (
      <PlaceDetailScreen
        lugar={currentPlace}
        onBack={() => setLugarDetallePerfil(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F5C41" />
      <View style={[styles.notchBar, { height: topInset }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!!returnToTab && (
          <Pressable
            style={[
              styles.backOriginPill,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
            onPress={handleReturnOrigin}
          >
            <Ionicons name="arrow-back" size={16} color={C.primaryLight} />
            <Text style={[styles.backOriginText, { color: C.text }]}>
              {isEn ? 'Back to Search' : 'Volver a Inicio'}
            </Text>
          </Pressable>
        )}

        {/* 1. Tarjeta de Perfil Limpia (sin subtítulo de contador) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>VE</Text>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.explorerBadge}>
              <Text style={styles.explorerBadgeText}>
                {isEn ? 'SHILICO EXPLORER' : 'EXPLORADOR SHILICO'}
              </Text>
            </View>
            <Text style={styles.profileName}>
              {isEn ? 'Explorer Traveler' : 'Viajero Explorador'}
            </Text>
          </View>

          <Pressable
            style={styles.sosBtn}
            onPress={() => setSosModalVisible(true)}
          >
            <Ionicons name="shield-outline" size={14} color="#FFFFFF" />
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>
        </View>

        {/* 2. Carrusel Mis Lugares Guardados */}
        <View style={styles.savedSection}>
          <View style={styles.savedHeader}>
            <View style={styles.savedTitleRow}>
              <Ionicons name="heart" size={14} color="#E11D48" />
              <Text style={[styles.savedTitle, { color: C.primaryLight }]}>
                {isEn ? 'MY SAVED PLACES' : 'MIS LUGARES GUARDADOS'}
              </Text>
            </View>

            {savedPlaces.length > 0 && (
              <View style={styles.dotsRow}>
                {savedPlaces.map((p, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <View
                      key={p.id || p.nombre}
                      style={[
                        styles.dot,
                        isActive ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {savedPlaces.length === 0 ? (
            <View
              style={[
                styles.emptySavedCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <Text style={[styles.emptySavedText, { color: C.textSecondary }]}>
                {isEn
                  ? 'Save places from Home or Places to keep quick access here.'
                  : 'Guarda destinos desde Inicio o Lugares para tener acceso rápido aquí.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={savedCardStep}
              decelerationRate="fast"
              onMomentumScrollEnd={handleSavedScroll}
              contentContainerStyle={styles.savedCarouselContent}
            >
              {savedPlaces.map((place) => {
                const imgSource = getPlaceImageSource(place);
                return (
                <Pressable
                  key={place.id || place.nombre}
                  style={[
                    styles.savedCard,
                    {
                      width: savedCardWidth,
                      backgroundColor: C.card,
                      borderColor: C.border,
                    },
                  ]}
                  onPress={() => {
                    const target =
                      places.find((p) => p.id === place.id) || place;
                    setLugarDetallePerfil(target);
                  }}
                >
                  {imgSource ? (
                    <Image
                      source={imgSource}
                      style={styles.savedThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.savedThumb,
                        styles.savedThumbPlaceholder,
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

                  <View style={styles.savedCenter}>
                    <View
                      style={[
                        styles.savedCatPill,
                        darkMode && { backgroundColor: '#3A2A0B' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.savedCatText,
                          darkMode && { color: '#FBBF24' },
                        ]}
                      >
                        {place.categoria || tr('Destino', language)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.savedName, { color: C.text }]}
                      numberOfLines={1}
                    >
                      {place.nombre}
                    </Text>
                    <View style={styles.savedMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={C.primaryLight}
                      />
                      <Text
                        style={[
                          styles.savedMetaText,
                          { color: C.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {place.distanciaCorta || tr('Centro', language)} •{' '}
                        {place.precioTexto || tr('Libre', language)}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.savedGoBtn}
                    onPress={() => openGoogleMapsLocation(place)}
                  >
                    <Ionicons
                      name="paper-plane-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 3. Tarjeta de Preferencias y Terminales */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          <View style={[styles.settingRow, { borderBottomColor: C.border }]}>
            <Text style={[styles.settingLabel, { color: C.text }]}>
              {isEn ? 'Dark Mode' : 'Tema Oscuro'}
            </Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#CBD5E1', true: '#107C53' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: C.border }]}>
            <Text style={[styles.settingLabel, { color: C.text }]}>
              {isEn ? 'Guide Language' : 'Idioma de la Guía'}
            </Text>
            <View style={styles.langSwitchRow}>
              <Pressable
                style={[
                  styles.langBtn,
                  language === 'es'
                    ? styles.langBtnActive
                    : { backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' },
                ]}
                onPress={() => setLanguage('es')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        language === 'es'
                          ? '#FFFFFF'
                          : darkMode
                          ? '#D1D5DB'
                          : '#4B5563',
                    },
                  ]}
                >
                  ES
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.langBtn,
                  language === 'en'
                    ? styles.langBtnActive
                    : { backgroundColor: darkMode ? '#1F2937' : '#E5E7EB' },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        language === 'en'
                          ? '#FFFFFF'
                          : darkMode
                          ? '#D1D5DB'
                          : '#4B5563',
                    },
                  ]}
                >
                  EN
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.settingRow, { borderBottomColor: C.border }]}
            onPress={() => setTransportModalType('buses')}
          >
            <View style={styles.busTextCol}>
              <Text style={[styles.settingLabel, { color: C.text }]}>
                {isEn
                  ? 'Bus Terminals to Cajamarca'
                  : 'Terminales de Buses a Cajamarca'}
              </Text>
              <Text style={[styles.busSub, { color: C.textSecondary }]}>
                {isEn
                  ? 'Daily departures from 4:00 AM (2h 30m paved road)'
                  : 'Salidas diarias desde las 4:00 AM (2h 30m vía asfaltada)'}
              </Text>
            </View>
            <Ionicons name="bus-outline" size={22} color="#F5A623" />
          </Pressable>

          <Pressable
            style={[styles.settingRow, { borderBottomColor: C.border }]}
            onPress={() => setTransportModalType('combis')}
          >
            <View style={styles.busTextCol}>
              <Text style={[styles.settingLabel, { color: C.text }]}>
                {isEn
                  ? 'Combi Terminal to Cajamarca'
                  : 'Terminal de Combis a Cajamarca'}
              </Text>
              <Text style={[styles.busSub, { color: C.textSecondary }]}>
                {isEn
                  ? 'Frequent departures from 5:00 AM · Jr. Cáceres & Av. Amazonas'
                  : 'Salidas continuas desde las 5:00 AM · Jr. Cáceres y Av. Amazonas'}
              </Text>
            </View>
            <Ionicons name="car-outline" size={22} color="#107C53" />
          </Pressable>

          <Pressable
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={() => setTransportModalType('autos')}
          >
            <View style={styles.busTextCol}>
              <Text style={[styles.settingLabel, { color: C.text }]}>
                {isEn
                  ? 'Car Stand to Cajamarca'
                  : 'Paradero de Autos a Cajamarca'}
              </Text>
              <Text style={[styles.busSub, { color: C.textSecondary }]}>
                {isEn
                  ? 'Direct shared cars (~2h via paved road)'
                  : 'Autos colectivos directos (~2h vía asfaltada PE-08B)'}
              </Text>
            </View>
            <Ionicons name="car-sport-outline" size={22} color="#0284C7" />
          </Pressable>
        </View>

        {/* 4. Botón Volver a ver Pantalla de Bienvenida */}
        <Pressable
          style={[
            styles.onboardingBtn,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
          onPress={() => setShowWelcome(true)}
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={C.textSecondary}
          />
          <Text style={[styles.onboardingBtnText, { color: C.textSecondary }]}>
            {isEn
              ? 'View Welcome Screen Again'
              : 'Volver a ver Pantalla de Bienvenida'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* SOS Emergency Modal */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#F43F5E" />
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  {isEn ? 'Emergency Celendín SOS' : 'Emergencias Celendín SOS'}
                </Text>
              </View>
              <Pressable onPress={() => setSosModalVisible(false)}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              ref={sosScrollRef}
              style={styles.modalListScroll}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {emergencyNumbers.map((item) => {
                const isHighlighted = highlightedId === item.id;
                return (
                  <View
                    key={item.id}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      sosYMapRef.current[item.id] = y;
                      if (pendingSosId === item.id) {
                        setTimeout(() => {
                          sosScrollRef.current?.scrollTo({
                            y: Math.max(0, y - 8),
                            animated: true,
                          });
                          setPendingSosId(null);
                        }, 80);
                      }
                    }}
                    style={[
                      styles.modalItem,
                      {
                        backgroundColor: C.cardAlt,
                        borderColor: isHighlighted ? C.primaryLight : C.border,
                        borderWidth: isHighlighted ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.modalItemText}>
                      <Text style={[styles.modalItemTitle, { color: C.text }]}>
                        {item.titulo}
                      </Text>
                      <Text
                        style={[styles.modalItemSub, { color: C.textSecondary }]}
                      >
                        {item.detalle}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.modalCallBtn}
                      onPress={() => callEmergency(item.tel)}
                    >
                      <Ionicons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.modalCallText}>{item.numero}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transport Modal (Buses, Combis, Autos) */}
      <Modal
        visible={transportModalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTransportModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={
                    transportModalType === 'autos'
                      ? 'car-sport'
                      : transportModalType === 'combis'
                      ? 'car'
                      : 'bus'
                  }
                  size={20}
                  color={
                    transportModalType === 'autos'
                      ? '#0284C7'
                      : transportModalType === 'combis'
                      ? '#107C53'
                      : '#F5A623'
                  }
                />
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  {transportModalType === 'combis'
                    ? isEn
                      ? 'Combi Terminal to Cajamarca'
                      : 'Terminal de Combis a Cajamarca'
                    : transportModalType === 'autos'
                    ? isEn
                      ? 'Car Stand to Cajamarca'
                      : 'Paradero de Autos a Cajamarca'
                    : isEn
                    ? 'Bus Terminals to Cajamarca'
                    : 'Terminales de Buses a Cajamarca'}
                </Text>
              </View>
              <Pressable onPress={() => setTransportModalType(null)}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              ref={transportScrollRef}
              style={styles.modalListScroll}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {busAgencies
                .filter((bus) => (bus.tipo || 'buses') === transportModalType)
                .map((bus) => {
                  const busKey = bus.id || bus.empresa;
                  const isHighlighted = highlightedId === busKey;
                  return (
                    <View
                      key={busKey}
                      onLayout={(event) => {
                        const { y } = event.nativeEvent.layout;
                        transportYMapRef.current[busKey] = y;
                        if (pendingTransportId === busKey) {
                          setTimeout(() => {
                            transportScrollRef.current?.scrollTo({
                              y: Math.max(0, y - 8),
                              animated: true,
                            });
                            setPendingTransportId(null);
                          }, 80);
                        }
                      }}
                      style={[
                        styles.busModalItem,
                        {
                          backgroundColor: C.cardAlt,
                          borderColor: isHighlighted ? C.primaryLight : C.border,
                          borderWidth: isHighlighted ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.modalItemTitle, { color: C.text }]}>
                        {bus.empresa}
                      </Text>
                      <Text style={[styles.busRouteText, { color: C.primaryLight }]}>
                        {bus.ruta}
                      </Text>
                      <Text style={[styles.busTerminalAddr, { color: C.textMuted }]}>
                        {bus.terminal}
                      </Text>
                    </View>
                  );
                })}
            </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  backOriginPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  backOriginText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#0E4B37',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  explorerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 166, 35, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 4,
  },
  explorerBadgeText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  sosBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  savedSection: {
    marginTop: 18,
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  savedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedTitle: {
    color: '#0F5C41',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#128C63',
  },
  dotInactive: {
    width: 5,
    backgroundColor: '#CBD5E1',
  },
  savedCarouselContent: {
    gap: 12,
  },
  savedCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedThumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  savedThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCenter: {
    flex: 1,
  },
  savedCatPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savedCatText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  savedName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  savedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  savedMetaText: {
    fontSize: 12,
    flex: 1,
  },
  savedGoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#128C63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySavedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptySavedText: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  settingsCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
    paddingRight: 10,
  },
  langSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langBtn: {
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  langBtnActive: {
    backgroundColor: '#0F5C41',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  busTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  busSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  onboardingBtn: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  onboardingBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    maxHeight: '80%',
  },
  modalListScroll: {
    maxHeight: 380,
  },
  modalListContent: {
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '900',
  },
  modalItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalItemSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  modalCallBtn: {
    backgroundColor: '#0F5C41',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalCallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  busModalItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  busRouteText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  busTerminalAddr: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
