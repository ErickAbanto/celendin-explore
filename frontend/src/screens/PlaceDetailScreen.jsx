import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getColors } from '../constants/theme';
import {
  buildMapIframeHtml,
  getGoogleMapsEmbedUrl,
  getPlaceImageSource,
  getStarIconNames,
  openGoogleMapsLocation,
  openGoogleMapsRoute,
} from '../constants/placesCatalog';
import {
  MAX_REVIEWS_PER_ITEM,
  useSavedPlaces,
} from '../context/SavedPlacesContext';
import { localizePlace, tr } from '../constants/i18n';

const DETAIL_TABS = [
  { key: 'resumen', labelEs: 'Información', labelEn: 'Overview' },
  { key: 'mapa', labelEs: 'Mapa', labelEn: 'Map' },
  { key: 'resenas', labelEs: 'Reseñas', labelEn: 'Reviews' },
];

export default function PlaceDetailScreen({ place: placeProp, lugar, onBack }) {
  const insets = useSafeAreaInsets();
  const {
    isSaved,
    toggleSaved,
    submitPlaceReview,
    refreshing,
    syncPlaces,
    darkMode,
    language,
  } = useSavedPlaces();
  const place = localizePlace(placeProp || lugar, language);
  const C = getColors(darkMode);
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState('resumen');
  const [userRating, setUserRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const saved = place ? isSaved(place.id) : false;
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 16
  );
  const bottomPad = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 16 : 14
  );

  const handleBackToLugares = () => {
    syncPlaces();
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackToLugares();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  useEffect(() => {
    setActiveTab('resumen');
    setUserRating(0);
    setReviewerName('');
    setReviewText('');
    setReviewStatus(null);
  }, [place?.id, place?.nombre]);

  if (!place) return null;

  const iframeSrc = getGoogleMapsEmbedUrl(place);
  const imageSource = getPlaceImageSource(place);
  const reviews = Array.isArray(place.resenas) ? place.resenas : [];
  const totalReviews = place.resenasCount ?? 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place.nombre} — ${place.ubicacion || 'Celendín, Cajamarca'}.`,
      });
    } catch {}
  };

  const defaultHorario = '8:00 am – 5:00 pm';
  const defaultLlevar = tr('Calzado cómodo, agua y cámara.', language);

  return (
    <View style={[styles.container, { backgroundColor: C.card }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3B2A" translucent />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleBackToLugares}
            tintColor="#0F5C41"
            colors={['#0F5C41']}
          />
        }
      >
        {/* Cabecera de imagen limpia (sin textos ni sombras encima) */}
        <View style={[styles.heroWrap, { height: 195 + topInset }]}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noHeroPlaceholder}>
              <Ionicons
                name="image-outline"
                size={36}
                color="rgba(255,255,255,0.55)"
              />
              <Text style={styles.noHeroText}>
                {isEn ? 'No image uploaded' : 'Sin imagen subida'}
              </Text>
            </View>
          )}

          <View style={[styles.heroTopBar, { paddingTop: topInset + 8 }]}>
            <TouchableOpacity
              style={styles.circleBtn}
              activeOpacity={0.8}
              hitSlop={12}
              onPress={handleBackToLugares}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.heroTopRight}>
              <Pressable
                style={styles.circleBtn}
                onPress={() => toggleSaved(place.id)}
              >
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={saved ? '#F43F5E' : '#FFFFFF'}
                />
              </Pressable>
              <Pressable style={styles.circleBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Título y categoría afuera/debajo de la imagen */}
        <View
          style={[
            styles.titleSectionClean,
            { backgroundColor: C.card, borderBottomColor: C.border },
          ]}
        >
          <View
            style={[
              styles.categoryPill,
              { backgroundColor: C.primarySoft },
            ]}
          >
            <Text style={[styles.categoryPillText, { color: C.primaryLight }]}>
              {place.categoria}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: C.text }]}>
            {place.nombre}
          </Text>
        </View>

        {/* 3 métricas clave */}
        <View
          style={[
            styles.metricsStrip,
            { backgroundColor: C.background, borderBottomColor: C.border },
          ]}
        >
          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.metricValueRow}>
              {getStarIconNames(place.rating).map((iconName, sIdx) => (
                <Ionicons
                  key={sIdx}
                  name={iconName}
                  size={11}
                  color={
                    Number(place.rating || 0) > 0 ? '#F5A623' : C.textMuted
                  }
                />
              ))}
              <Text style={[styles.metricValue, { color: C.text, marginLeft: 4 }]}>
                {place.rating || '0.0'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]}>
              {isEn ? 'Rating' : 'Calificación'}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={[styles.metricValue, { color: C.primaryLight }]}>
              {place.distanciaCorta || tr('Centro', language)}
            </Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]}>
              {isEn ? 'Distance' : 'Distancia'}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={[styles.metricValue, { color: '#D97706' }]}>
              {place.precioTexto || tr('Libre', language)}
            </Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]}>
              {isEn ? 'Entry' : 'Entrada'}
            </Text>
          </View>
        </View>

        {/* 3 Pestañas limpias */}
        <View
          style={[
            styles.tabsBar,
            { backgroundColor: C.card, borderBottomColor: C.border },
          ]}
        >
          {DETAIL_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabBtn,
                  active && {
                    borderBottomColor: C.primaryLight,
                    borderBottomWidth: 2.5,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: active ? C.primaryLight : C.textSecondary },
                  ]}
                >
                  {isEn ? tab.labelEn : tab.labelEs}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Contenido de pestaña */}
        <View style={styles.tabBody}>
          {activeTab === 'resumen' && (
            <View style={styles.sectionGap}>
              <Text style={[styles.descText, { color: C.text }]}>
                {place.desc}
              </Text>

              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View style={styles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={C.primaryLight}
                  />
                  <Text style={[styles.infoText, { color: C.textSecondary }]}>
                    {place.ubicacion}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#D97706" />
                  <Text style={[styles.infoText, { color: C.textSecondary }]}>
                    {place.horario || defaultHorario}
                  </Text>
                </View>

                {!!place.tiempoEstimado &&
                  place.tiempoEstimado !== place.horario && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="hourglass-outline"
                        size={16}
                        color={C.primaryLight}
                      />
                      <Text
                        style={[styles.infoText, { color: C.textSecondary }]}
                      >
                        {isEn ? 'Estimated time: ' : 'Tiempo estimado: '}
                        {place.tiempoEstimado}
                      </Text>
                    </View>
                  )}

                {!!place.altitudTexto && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="trending-up-outline"
                      size={16}
                      color="#D97706"
                    />
                    <Text style={[styles.infoText, { color: C.textSecondary }]}>
                      {isEn ? 'Altitude: ' : 'Altitud: '}
                      {place.altitudTexto}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={16}
                    color={C.primaryLight}
                  />
                  <Text style={[styles.infoText, { color: C.textSecondary }]}>
                    {place.tips?.llevar || defaultLlevar}
                  </Text>
                </View>

                {!!place.tips?.mejorHorario &&
                  place.tips.mejorHorario !== place.horario && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="sunny-outline"
                        size={16}
                        color="#D97706"
                      />
                      <Text
                        style={[styles.infoText, { color: C.textSecondary }]}
                      >
                        {isEn ? 'Best time: ' : 'Mejor horario: '}
                        {place.tips.mejorHorario}
                      </Text>
                    </View>
                  )}

                {!!place.tips?.dificultad && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="walk-outline"
                      size={16}
                      color={C.primaryLight}
                    />
                    <Text style={[styles.infoText, { color: C.textSecondary }]}>
                      {isEn ? 'Difficulty: ' : 'Dificultad: '}
                      {place.tips.dificultad}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'mapa' && (
            <View style={styles.sectionGap}>
              {iframeSrc ? (
                <View
                  style={[
                    styles.mapFrameWrap,
                    { borderColor: C.border, backgroundColor: C.cardAlt },
                  ]}
                >
                  {Platform.OS === 'web' ? (
                    <iframe
                      src={iframeSrc}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <WebView
                      source={{ html: buildMapIframeHtml(iframeSrc) }}
                      style={styles.mapWebView}
                      javaScriptEnabled
                      domStorageEnabled
                    />
                  )}
                </View>
              ) : null}

              <Pressable
                style={styles.routeBtn}
                onPress={() => openGoogleMapsRoute(place)}
              >
                <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
                <Text style={styles.routeBtnText}>
                  {isEn ? 'Directions in Google Maps' : 'Cómo llegar con Google Maps'}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'resenas' && (
            <View style={styles.sectionGap}>
              <View
                style={[
                  styles.reviewSummaryCard,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View>
                  <Text style={[styles.reviewScoreBig, { color: C.text }]}>
                    {place.rating || '0.0'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                    {getStarIconNames(place.rating).map((iconName, sIdx) => (
                      <Ionicons
                        key={sIdx}
                        name={iconName}
                        size={13}
                        color={
                          Number(place.rating || 0) > 0
                            ? '#F5A623'
                            : C.textMuted
                        }
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.starsTapRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      disabled={totalReviews >= MAX_REVIEWS_PER_ITEM}
                      onPress={() => {
                        setUserRating(star);
                        setReviewStatus(null);
                      }}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={star <= userRating ? 'star' : 'star-outline'}
                        size={22}
                        color="#F5A623"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {userRating > 0 && totalReviews < MAX_REVIEWS_PER_ITEM && (
                <View
                  style={[
                    styles.reviewFormCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        color: C.text,
                        borderColor: C.border,
                        backgroundColor: C.card,
                      },
                    ]}
                    placeholder={isEn ? 'Your name (optional)' : 'Tu nombre (opcional)'}
                    placeholderTextColor={C.textMuted}
                    value={reviewerName}
                    onChangeText={setReviewerName}
                    maxLength={35}
                  />
                  <TextInput
                    style={[
                      styles.reviewInput,
                      {
                        color: C.text,
                        borderColor: C.border,
                        backgroundColor: C.card,
                      },
                    ]}
                    placeholder={isEn ? 'Short comment...' : 'Comentario breve...'}
                    placeholderTextColor={C.textMuted}
                    value={reviewText}
                    onChangeText={setReviewText}
                    maxLength={160}
                    multiline
                  />
                  <Pressable
                    style={styles.publishReviewBtn}
                    disabled={submittingReview}
                    onPress={async () => {
                      setSubmittingReview(true);
                      const result = await submitPlaceReview(
                        place.id,
                        userRating,
                        reviewText,
                        reviewerName
                      );
                      setSubmittingReview(false);
                      if (result?.ok) {
                        setReviewStatus({
                          ok: true,
                          message: isEn ? 'Review saved!' : '¡Reseña guardada!',
                        });
                        setUserRating(0);
                        setReviewerName('');
                        setReviewText('');
                      }
                    }}
                  >
                    <Text style={styles.publishReviewText}>
                      {submittingReview
                        ? '...'
                        : isEn
                        ? 'Publish'
                        : 'Publicar'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {!!reviewStatus && (
                <Text style={{ color: C.primaryLight, fontSize: 12.5, fontWeight: '700' }}>
                  {reviewStatus.message}
                </Text>
              )}

              {reviews.map((rev, idx) => (
                <View
                  key={`${rev.autor}-${idx}`}
                  style={[
                    styles.reviewCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <View style={styles.reviewTopRow}>
                    <Text style={[styles.reviewAuthor, { color: C.text }]}>
                      {rev.autor}
                    </Text>
                    <View style={styles.reviewStarsRow}>
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Ionicons key={i} name="star" size={12} color="#F5A623" />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewBody, { color: C.textSecondary }]}>
                    {rev.comentario}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Barra inferior */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: bottomPad,
            backgroundColor: C.card,
            borderTopColor: C.border,
          },
        ]}
      >
        <Pressable
          style={[
            styles.saveBottomBtn,
            {
              backgroundColor: saved
                ? darkMode
                  ? '#33151E'
                  : '#FFF1F2'
                : C.cardAlt,
              borderColor: saved ? '#FECDD3' : C.border,
            },
          ]}
          onPress={() => toggleSaved(place.id)}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? '#E11D48' : C.textSecondary}
          />
          <Text
            style={[
              styles.saveBottomText,
              { color: saved ? '#E11D48' : C.text },
            ]}
          >
            {saved
              ? isEn
                ? 'Saved'
                : 'Guardado'
              : isEn
              ? 'Save'
              : 'Guardar'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.mapsBottomBtn}
          onPress={() => openGoogleMapsLocation(place)}
        >
          <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
          <Text style={styles.mapsBottomText}>Google Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#0A2E20',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  noHeroPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noHeroText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSectionClean: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10.5,
    marginTop: 2,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBody: {
    padding: 18,
  },
  sectionGap: {
    gap: 12,
  },
  descText: {
    fontSize: 14,
    lineHeight: 21,
  },
  infoBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  mapFrameWrap: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapWebView: {
    flex: 1,
  },
  routeBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  routeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  reviewSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewScoreBig: {
    fontSize: 22,
    fontWeight: '900',
  },
  starsTapRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reviewFormCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 56,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  publishReviewBtn: {
    backgroundColor: '#0F5C41',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishReviewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  saveBottomBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBottomText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  mapsBottomBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mapsBottomText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
