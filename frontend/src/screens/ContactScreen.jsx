import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const EMERGENCY_NUMBERS = [
  {
    id: 'pnp',
    titulo: 'Comisaría PNP Celendín',
    numero: '105',
    tel: '105',
    detalle: 'Seguridad Ciudadana y Auxilio Vial 24h',
  },
  {
    id: 'hospital',
    titulo: 'Hospital de Apoyo Celendín',
    numero: '(076) 555-120',
    tel: '076555120',
    detalle: 'Emergencias Médicas · Av. José Gálvez',
  },
  {
    id: 'samu',
    titulo: 'SAMU / Ambulancia Nacional',
    numero: '106',
    tel: '106',
    detalle: 'Atención prehospitalaria gratuita',
  },
];

const BUS_TERMINALS = [
  {
    empresa: 'Transportes Virgen del Carmen',
    ruta: 'Celendín ↔ Cajamarca',
    salidas: '4:00 AM, 6:00 AM, 9:00 AM, 1:00 PM, 4:00 PM',
    terminal: 'Jr. Pardo cuadra 9, Celendín',
  },
  {
    empresa: 'Expreso Shilico / Combis',
    ruta: 'Celendín ↔ Cajamarca (Vía La Encañada)',
    salidas: 'Salidas cada 45 min de 4:30 AM a 5:30 PM',
    terminal: 'Terminal Terrestre Municipal Celendín',
  },
  {
    empresa: 'Ruta Nororiental Chachapoyas',
    ruta: 'Celendín → Balsas → Leymebamba → Chachapoyas',
    salidas: '5:00 AM y 12:30 PM (cruce Cañón del Marañón)',
    terminal: 'Paradero Av. Circunvalación Este',
  },
];

export default function ContactScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    savedPlaces,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    offlineReady,
    setOfflineReady,
    setShowWelcome,
    syncPlaces,
  } = useSavedPlaces();

  const C = getColors(darkMode);
  const isEn = language === 'en';
  const [downloading, setDownloading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [busModalVisible, setBusModalVisible] = useState(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );

  const savedCardWidth = Math.max(width - 32, 260);
  const savedCardStep = savedCardWidth + 12;

  const handleDownloadOffline = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await Promise.all([
        syncPlaces(),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      setOfflineReady(true);
    } finally {
      setDownloading(false);
    }
  };

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
      Alert.alert('Emergencia', `Marca el número ${tel}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F5C41" />

      {/* Emerald Notch Safe Area */}
      <View style={[styles.notchBar, { height: topInset }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Explorer Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>VE</Text>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.explorerBadge}>
              <Text style={styles.explorerBadgeText}>EXPLORADOR SHILICO</Text>
            </View>
            <Text style={styles.profileName}>
              {isEn ? 'Explorer Traveler' : 'Viajero Explorador'}
            </Text>
            <Text style={styles.profileSub}>
              {savedPlaces.length}{' '}
              {isEn
                ? 'places in your Favorites'
                : 'atractivos en tus Favoritos'}
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

        {/* Offline Map Package Card */}
        <View
          style={[
            styles.offlineCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          <View style={styles.offlineTopRow}>
            <View
              style={[
                styles.offlineIconCircle,
                {
                  backgroundColor: offlineReady
                    ? '#DCFCE7'
                    : darkMode
                    ? '#123327'
                    : '#E6F4EE',
                },
              ]}
            >
              <Ionicons
                name={
                  offlineReady ? 'checkmark-circle-outline' : 'download-outline'
                }
                size={21}
                color={darkMode ? '#34D399' : '#0F5C41'}
              />
            </View>

            <View style={styles.offlineTextCol}>
              <Text style={[styles.offlineTitle, { color: C.text }]}>
                {isEn
                  ? 'Celendín Offline Package'
                  : 'Paquete Offline de Celendín'}
              </Text>
              <Text style={[styles.offlineDesc, { color: C.textSecondary }]}>
                {isEn
                  ? 'GPS maps, routes to Langascocha, Llanguat & Marañón without mobile data (42 MB).'
                  : 'Mapas GPS, rutas a Langascocha, Llanguat y Marañón sin gastar datos (42 MB).'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.downloadBtn,
              offlineReady && styles.downloadBtnDone,
            ]}
            onPress={handleDownloadOffline}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={offlineReady ? 'checkmark-done' : 'download-outline'}
                size={18}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.downloadBtnText}>
              {downloading
                ? isEn
                  ? 'Downloading offline routes...'
                  : 'Descargando mapas y rutas...'
                : offlineReady
                ? isEn
                  ? 'Offline Maps Ready (42 MB)'
                  : 'Mapa Offline Listo para Uso sin Internet'
                : isEn
                ? 'Download Map for Offline Use'
                : 'Descargar Mapa para Uso sin Internet'}
            </Text>
          </Pressable>
        </View>

        {/* Saved Places Carousel Header */}
        <View style={styles.savedSection}>
          <View style={styles.savedHeader}>
            <View style={styles.savedTitleRow}>
              <Ionicons name="heart" size={14} color="#E11D48" />
              <Text style={styles.savedTitle}>
                {isEn ? 'MY SAVED PLACES' : 'MIS LUGARES GUARDADOS'} (
                {savedPlaces.length})
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
                  ? 'Save places from Inicio or Lugares to keep quick offline access here.'
                  : 'Guarda destinos desde Inicio o Lugares para tener acceso rápido sin conexión.'}
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
              {savedPlaces.map((place) => (
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
                  onPress={() =>
                    navigation?.navigate('Lugares', {
                      lugarElegido: place.nombre,
                    })
                  }
                >
                  <Image
                    source={getPlaceImageSource(place.imagen)}
                    style={styles.savedThumb}
                    resizeMode="cover"
                  />

                  <View style={styles.savedCenter}>
                    <View style={styles.savedCatPill}>
                      <Text style={styles.savedCatText}>
                        {place.categoria || 'Destino'}
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
                        style={[styles.savedMetaText, { color: C.textSecondary }]}
                        numberOfLines={2}
                      >
                        {place.distanciaCorta || 'Centro'} •{' '}
                        {place.precioTexto || 'Ingreso Libre'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.savedGoBtn}
                    onPress={() => openGoogleMapsLocation(place)}
                    accessibilityLabel={`Abrir ${place.nombre} en Google Maps`}
                  >
                    <Ionicons
                      name="paper-plane-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Preferences Card */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          {/* Dark Mode Row */}
          <View
            style={[styles.settingRow, { borderBottomColor: C.border }]}
          >
            <Text style={[styles.settingLabel, { color: C.text }]}>
              {isEn
                ? 'Dark Mode (OLED battery saver)'
                : 'Tema Oscuro (Ahorro de batería OLED)'}
            </Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#CBD5E1', true: '#107C53' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Language Row */}
          <View
            style={[styles.settingRow, { borderBottomColor: C.border }]}
          >
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

          {/* Bus Terminals Row */}
          <Pressable
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={() => setBusModalVisible(true)}
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
        </View>

        {/* Replay Welcome / Onboarding */}
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
              ? 'View Welcome Screen Again (Onboarding)'
              : 'Volver a ver Pantalla de Bienvenida (Onboarding)'}
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

            {EMERGENCY_NUMBERS.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.modalItem,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
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
            ))}
          </View>
        </View>
      </Modal>

      {/* Bus Terminals Modal */}
      <Modal
        visible={busModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBusModalVisible(false)}
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
                <Ionicons name="bus" size={20} color="#F5A623" />
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  {isEn
                    ? 'Terminals & Bus Schedules'
                    : 'Terminales y Salidas'}
                </Text>
              </View>
              <Pressable onPress={() => setBusModalVisible(false)}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            {BUS_TERMINALS.map((bus) => (
              <View
                key={bus.empresa}
                style={[
                  styles.busModalItem,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <Text style={[styles.modalItemTitle, { color: C.text }]}>
                  {bus.empresa}
                </Text>
                <Text style={[styles.busRouteText, { color: C.primaryLight }]}>
                  {bus.ruta}
                </Text>
                <Text style={[styles.modalItemSub, { color: C.textSecondary }]}>
                  {bus.salidas}
                </Text>
                <Text style={[styles.busTerminalAddr, { color: C.textMuted }]}>
                  {bus.terminal}
                </Text>
              </View>
            ))}
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
  profileCard: {
    backgroundColor: '#0E4B37',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111827',
    fontSize: 19,
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
  profileSub: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 2,
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
  offlineCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  offlineTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  offlineIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextCol: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  offlineDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  downloadBtn: {
    marginTop: 14,
    backgroundColor: '#0F5C41',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnDone: {
    backgroundColor: '#128C63',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    fontSize: 14.5,
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
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0E8F64',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySavedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptySavedText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  settingsCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    gap: 12,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  langSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
  },
  busSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  onboardingBtn: {
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
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
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
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
    fontSize: 12,
    marginTop: 2,
  },
  modalCallBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingHorizontal: 10,
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
    marginTop: 2,
  },
});
