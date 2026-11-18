import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  openGoogleMapsLocation,
  openGoogleMapsRoute,
} from '../constants/placesCatalog';
import {
  MAX_REVIEWS_PER_ITEM,
  useSavedPlaces,
} from '../context/SavedPlacesContext';

const DETAIL_TABS = [
  { key: 'descripcion', labelEs: 'Descripción', labelEn: 'Overview' },
  { key: 'comoLlegar', labelEs: 'Cómo llegar', labelEn: 'Directions' },
  { key: 'tips', labelEs: 'Tips', labelEn: 'Tips' },
  { key: 'resenas', labelEs: 'Reseñas', labelEn: 'Reviews' },
];

export default function PlaceDetailScreen({ place: placeProp, lugar, onBack }) {
  const place = placeProp || lugar;
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSaved, submitPlaceReview, darkMode, language } =
    useSavedPlaces();
  const C = getColors(darkMode);
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState('descripcion');
  const [userRating, setUserRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null); // { ok: boolean, message: string } | null
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

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  useEffect(() => {
    setActiveTab('descripcion');
    setUserRating(0);
    setReviewerName('');
    setReviewText('');
    setReviewStatus(null);
  }, [place?.id, place?.nombre]);

  if (!place) return null;

  const iframeSrc = getGoogleMapsEmbedUrl(place);
  const imageSource = getPlaceImageSource(place.imagen);
  const reviews = Array.isArray(place.resenas) ? place.resenas : [];
  const totalReviews = place.resenasCount ?? 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place.nombre} — ${place.ubicacion || 'Celendín, Cajamarca'}. Descubre este destino con Celendín Explore.`,
      });
    } catch {
      // Ignore user cancellation
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.card }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3B2A" translucent />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Header */}
        <View style={[styles.heroWrap, { height: 215 + topInset }]}>
          <Image
            source={imageSource}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroTopScrim} />
          <View style={styles.heroBottomScrim} />

          {/* Floating Back, Favorite & Share */}
          <View style={[styles.heroTopBar, { paddingTop: topInset + 8 }]}>
            <Pressable
              style={styles.circleBtn}
              onPress={onBack}
              accessibilityLabel={isEn ? 'Back' : 'Volver'}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.heroTopRight}>
              <Pressable
                style={styles.circleBtn}
                onPress={() => toggleSaved(place.id)}
                accessibilityLabel={isEn ? 'Favorite' : 'Guardar'}
              >
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={saved ? '#F43F5E' : '#FFFFFF'}
                />
              </Pressable>
              <Pressable
                style={styles.circleBtn}
                onPress={handleShare}
                accessibilityLabel={isEn ? 'Share' : 'Compartir'}
              >
                <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Hero Bottom Title & Pills */}
          <View style={styles.heroBottom}>
            <View style={styles.pillRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  {(place.categoria || 'NATURALEZA').toUpperCase()}
                </Text>
              </View>
              {!!place.etiquetaDestacado && (
                <View style={styles.featuredPill}>
                  <Text style={styles.featuredPillText}>
                    {place.etiquetaDestacado}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {place.nombre}
            </Text>
          </View>
        </View>

        {/* 4 Metric Cards Strip */}
        <View
          style={[
            styles.metricsStrip,
            {
              backgroundColor: C.background,
              borderBottomColor: C.border,
            },
          ]}
        >
          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.metricValueRow}>
              <Ionicons name="star" size={13} color="#F5A623" />
              <Text style={[styles.metricValueAmber, { marginLeft: 3 }]}>
                {place.rating || '0.0'}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]} numberOfLines={1}>
              {totalReviews} {isEn ? 'reviews' : 'reseñas'}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text
              style={[styles.metricValueGreen, { color: C.primaryLight }]}
              numberOfLines={1}
            >
              {place.altitudTexto || '2,625 m.s.n.m.'}
            </Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]} numberOfLines={1}>
              {isEn ? 'Altitude' : 'Altitud'}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={[styles.metricValueDark, { color: C.text }]} numberOfLines={1}>
              {place.distanciaCorta || 'Centro'}
            </Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]} numberOfLines={1}>
              {isEn ? 'Distance' : 'Distancia'}
            </Text>
          </View>

          <View
            style={[
              styles.metricCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={styles.metricValueAmber} numberOfLines={1}>
              {place.precioTexto || 'Libre'}
            </Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]} numberOfLines={1}>
              {isEn ? 'Entry' : 'Entrada'}
            </Text>
          </View>
        </View>

        {/* 4 Tabs Navigation */}
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
                    active && styles.tabBtnTextActive,
                  ]}
                >
                  {isEn ? tab.labelEn : tab.labelEs}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Body Content */}
        <View style={styles.tabBody}>
          {activeTab === 'descripcion' && (
            <View>
              <Text style={[styles.descText, { color: C.textSecondary }]}>
                {place.desc}
              </Text>

              {/* Estimated Experience Box */}
              <View
                style={[
                  styles.estimateCard,
                  {
                    backgroundColor: darkMode ? '#102920' : '#EBF7F1',
                    borderColor: darkMode ? '#1F4D3C' : '#C6E7D6',
                  },
                ]}
              >
                <View style={styles.estimateIconWrap}>
                  <Ionicons
                    name="time-outline"
                    size={21}
                    color={darkMode ? '#34D399' : COLORS_FALLBACK.primary}
                  />
                </View>
                <View style={styles.estimateTextCol}>
                  <Text
                    style={[
                      styles.estimateTitle,
                      { color: darkMode ? '#6EE7B7' : '#0F5C41' },
                    ]}
                  >
                    {isEn
                      ? 'Estimated experience time'
                      : 'Tiempo estimado de experiencia'}
                  </Text>
                  <Text
                    style={[
                      styles.estimateSub,
                      { color: darkMode ? '#D1FAE5' : '#4B5563' },
                    ]}
                  >
                    {place.tiempoEstimado || place.horario}
                  </Text>
                </View>
              </View>

              {!!place.historia && (
                <View
                  style={[
                    styles.extraCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <Text style={[styles.extraTitle, { color: C.text }]}>
                    {isEn ? 'Culture & History' : 'Valor Cultural e Historia'}
                  </Text>
                  <Text style={[styles.extraBody, { color: C.textSecondary }]}>
                    {place.historia}
                  </Text>
                </View>
              )}

              {!!place.actividades && (
                <View
                  style={[
                    styles.extraCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <Text style={[styles.extraTitle, { color: C.text }]}>
                    {isEn ? 'Recommended Activities' : 'Actividades y Horario'}
                  </Text>
                  <Text style={[styles.extraBody, { color: C.textSecondary }]}>
                    {place.actividades}
                  </Text>
                  {!!place.horario && (
                    <Text
                      style={[
                        styles.scheduleNote,
                        { color: C.primaryLight },
                      ]}
                    >
                      {place.horario}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'comoLlegar' && (
            <View style={styles.sectionGap}>
              <View
                style={[
                  styles.extraCard,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View style={styles.routeHeader}>
                  <Ionicons name="navigate-circle" size={22} color={C.primaryLight} />
                  <Text style={[styles.extraTitle, { color: C.text, marginBottom: 0 }]}>
                    {isEn ? 'Access & Coordinates' : 'Acceso y Ubicación'}
                  </Text>
                </View>
                <Text style={[styles.extraBody, { color: C.textSecondary, marginTop: 8 }]}>
                  {place.ubicacion}
                </Text>
                {!!place.distancia && (
                  <Text style={[styles.extraBody, { color: C.text, marginTop: 6, fontWeight: '600' }]}>
                    {place.distancia}
                  </Text>
                )}
              </View>

              {iframeSrc ? (
                <View
                  style={[
                    styles.mapFrameWrap,
                    { borderColor: C.border, backgroundColor: C.cardAlt },
                  ]}
                >
                  <WebView
                    source={{ html: buildMapIframeHtml(iframeSrc) }}
                    style={styles.mapWebView}
                    javaScriptEnabled
                    domStorageEnabled
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                  />
                </View>
              ) : null}

              <Pressable
                style={styles.routeBtn}
                onPress={() => openGoogleMapsRoute(place)}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <Text style={styles.routeBtnText}>
                  {isEn
                    ? 'Calculate route in Google Maps'
                    : 'Calcular ruta desde mi ubicación'}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'tips' && (
            <View style={styles.sectionGap}>
              <View
                style={[
                  styles.tipRowCard,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View style={[styles.tipIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="bag-handle-outline" size={19} color="#D97706" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipHeading, { color: C.text }]}>
                    {isEn ? 'What to bring' : 'Qué llevar'}
                  </Text>
                  <Text style={[styles.tipCopy, { color: C.textSecondary }]}>
                    {place.tips?.llevar ||
                      'Agua, calzado cómodo, bloqueador solar y abrigo ligero.'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.tipRowCard,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View style={[styles.tipIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="sunny-outline" size={19} color="#0F5C41" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipHeading, { color: C.text }]}>
                    {isEn ? 'Best time to visit' : 'Mejor horario de visita'}
                  </Text>
                  <Text style={[styles.tipCopy, { color: C.textSecondary }]}>
                    {place.tips?.mejorHorario || '8:00 am – 4:00 pm.'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.tipRowCard,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <View style={[styles.tipIconBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="walk-outline" size={19} color="#1D4ED8" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipHeading, { color: C.text }]}>
                    {isEn ? 'Difficulty level' : 'Nivel de dificultad'}
                  </Text>
                  <Text style={[styles.tipCopy, { color: C.textSecondary }]}>
                    {place.tips?.dificultad || 'Fácil – Moderada.'}
                  </Text>
                </View>
              </View>
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
                  <Text style={[styles.reviewCountText, { color: C.textSecondary }]}>
                    {totalReviews} / {MAX_REVIEWS_PER_ITEM}{' '}
                    {isEn ? 'reviews' : 'reseñas'}
                  </Text>
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
                        size={20}
                        color={
                          totalReviews >= MAX_REVIEWS_PER_ITEM
                            ? C.textMuted
                            : '#F5A623'
                        }
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {totalReviews >= MAX_REVIEWS_PER_ITEM ? (
                <View
                  style={[
                    styles.reviewCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <Text style={[styles.reviewBody, { color: C.textSecondary }]}>
                    {isEn
                      ? `Maximum limit of ${MAX_REVIEWS_PER_ITEM} reviews reached to protect database capacity.`
                      : `Se alcanzó el límite de ${MAX_REVIEWS_PER_ITEM} reseñas para este atractivo (protección de base de datos gratuita).`}
                  </Text>
                </View>
              ) : userRating > 0 ? (
                <View
                  style={[
                    styles.reviewFormCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <View style={styles.reviewFormHeader}>
                    <Text style={[styles.ratedHint, { color: C.primaryLight }]}>
                      {isEn
                        ? `Selected rating: ${userRating}/5`
                        : `Tu calificación: ${userRating}/5`}
                    </Text>
                    <Text style={[styles.charCount, { color: C.textMuted }]}>
                      {reviewText.length}/180
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        color: C.text,
                        borderColor: C.border,
                        backgroundColor: C.card,
                      },
                    ]}
                    placeholder={
                      isEn ? 'Your name (optional)' : 'Tu nombre (opcional)'
                    }
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
                    placeholder={
                      isEn
                        ? 'Write a short review (optional)...'
                        : 'Escribe un comentario breve (opcional)...'
                    }
                    placeholderTextColor={C.textMuted}
                    value={reviewText}
                    onChangeText={setReviewText}
                    maxLength={180}
                    multiline
                  />
                  <Pressable
                    style={[
                      styles.publishReviewBtn,
                      submittingReview && { opacity: 0.65 },
                    ]}
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
                          message: isEn
                            ? `Thanks! Your ${userRating}/5 review was saved.`
                            : `¡Gracias! Tu reseña de ${userRating}/5 quedó guardada.`,
                        });
                        setUserRating(0);
                        setReviewerName('');
                        setReviewText('');
                      } else {
                        setReviewStatus({
                          ok: false,
                          message:
                            result?.error ||
                            (isEn
                              ? 'Could not save review right now.'
                              : 'No se pudo guardar la reseña en este momento.'),
                        });
                      }
                    }}
                  >
                    <Text style={styles.publishReviewText}>
                      {submittingReview
                        ? isEn
                          ? 'Saving...'
                          : 'Guardando...'
                        : isEn
                        ? 'Publish Review'
                        : 'Publicar Reseña'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {!!reviewStatus && (
                <Text
                  style={[
                    styles.ratedHint,
                    {
                      color: reviewStatus.ok ? C.primaryLight : '#E11D48',
                    },
                  ]}
                >
                  {reviewStatus.message}
                </Text>
              )}

              {reviews.length === 0 && (
                <View
                  style={[
                    styles.reviewCard,
                    { backgroundColor: C.cardAlt, borderColor: C.border },
                  ]}
                >
                  <Text style={[styles.reviewBody, { color: C.textSecondary }]}>
                    {isEn
                      ? 'No reviews yet. Tap the stars above to be the first to rate this place!'
                      : 'Aún no hay reseñas escritas. ¡Toca las estrellas arriba para ser el primero en calificar este destino!'}
                  </Text>
                </View>
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
                    <Text style={[styles.reviewDate, { color: C.textMuted }]}>
                      {rev.fecha}
                    </Text>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#F5A623" />
                    ))}
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

      {/* Sticky Bottom Bar */}
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
            saved
              ? {
                  backgroundColor: darkMode ? '#33151E' : '#FFF1F2',
                  borderColor: darkMode ? '#7F1D1D' : '#FECDD3',
                }
              : {
                  backgroundColor: C.cardAlt,
                  borderColor: C.border,
                },
          ]}
          onPress={() => toggleSaved(place.id)}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
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
          <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
          <Text style={styles.mapsBottomText}>
            {isEn ? 'Open in Google Maps' : 'Abrir en Google Maps'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const COLORS_FALLBACK = {
  primary: '#0F5C41',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#0A2E20',
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
  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  heroBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 135,
    backgroundColor: 'rgba(7, 23, 17, 0.56)',
  },
  heroTopBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTopRight: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryPillText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  featuredPill: {
    backgroundColor: '#0F5C41',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValueAmber: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '800',
  },
  metricValueGreen: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  metricValueDark: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
  },
  tabBody: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  descText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  estimateCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estimateIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateTextCol: {
    flex: 1,
  },
  estimateTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  estimateSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  extraCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  extraTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  extraBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  scheduleNote: {
    marginTop: 8,
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionGap: {
    gap: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapFrameWrap: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  routeBtn: {
    backgroundColor: '#0F5C41',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tipRowCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  tipCopy: {
    fontSize: 13,
    lineHeight: 19,
  },
  reviewSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewScoreBig: {
    fontSize: 24,
    fontWeight: '900',
  },
  reviewCountText: {
    fontSize: 12,
  },
  starsTapRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratedHint: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewFormCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  reviewFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 62,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  publishReviewBtn: {
    backgroundColor: '#0F5C41',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  publishReviewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  reviewDate: {
    fontSize: 11.5,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  reviewBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBottomBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveBottomText: {
    fontSize: 14,
    fontWeight: '800',
  },
  mapsBottomBtn: {
    flex: 1,
    backgroundColor: '#0F5C41',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapsBottomText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
