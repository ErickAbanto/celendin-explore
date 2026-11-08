import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants/theme';
import { getImageUrl } from '../services/api';

function obtenerSrcDelIframe(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const texto = raw.trim();
  const srcMatch = texto.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : texto;
}

function obtenerDestinoParaRuta(embedSrc, nombreLugar) {
  if (embedSrc) {
    const lngMatch = embedSrc.match(/!2d(-?\d+(?:\.\d+)?)/);
    const latMatch = embedSrc.match(/!3d(-?\d+(?:\.\d+)?)/);
    if (latMatch && lngMatch) {
      return `${latMatch[1]},${lngMatch[1]}`;
    }
  }
  return encodeURIComponent(`${nombreLugar}, Celendín, Cajamarca, Perú`);
}

export default function PlaceDetailScreen({ lugar, onBack }) {
  // Permite que el botón físico "Atrás" de Android regrese a la lista
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  if (!lugar) return null;

  const imgUri = lugar.imagenUrl || getImageUrl(lugar.imagen);
  const embedSrc = obtenerSrcDelIframe(lugar.mapEmbedUrl);

  const iframeHtml = embedSrc
    ? `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: #07070F; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: 0; }
          </style>
        </head>
        <body>
          <iframe
            src="${embedSrc}"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin">
          </iframe>
        </body>
      </html>`
    : '';

  const abrirComoLlegar = () => {
    const destination = obtenerDestinoParaRuta(embedSrc, lugar.nombre);
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    );
  };

  const abrirVerEnMapa = () => {
    const query = obtenerDestinoParaRuta(embedSrc, lugar.nombre);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View style={styles.screen}>
      {/* Barra superior para volver a la lista */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="#FFF" />
          <Text style={styles.backBtnText}>Volver a Atractivos</Text>
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{lugar.categoria}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
        {/* Imagen principal completa sin recortar */}
        <View style={styles.heroImageBox}>
          <Image source={{ uri: imgUri }} style={styles.heroImage} resizeMode="contain" />
        </View>

        {/* Título y datos rápidos */}
        <Text style={styles.title}>{lugar.nombre}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={[styles.iconBox, { backgroundColor: '#2A1458' }]}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Ubicación y Altitud</Text>
              <Text style={styles.infoValue}>{lugar.ubicacion}</Text>
            </View>
          </View>

          {!!lugar.distancia && (
            <View style={styles.infoItem}>
              <View style={[styles.iconBox, { backgroundColor: '#14264F' }]}>
                <Ionicons name="car" size={18} color="#60A5FA" />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={[styles.infoLabel, { color: '#60A5FA' }]}>
                  Distancia / Acceso desde Celendín
                </Text>
                <Text style={styles.infoValue}>{lugar.distancia}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <View style={[styles.iconBox, { backgroundColor: '#0F2A22' }]}>
              <Ionicons name="time" size={18} color={COLORS.success} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoLabel, { color: COLORS.success }]}>
                Horario e Ingreso
              </Text>
              <Text style={styles.infoValue}>{lugar.horario}</Text>
            </View>
          </View>
        </View>

        {/* Mapa interactivo embebido de Google Maps (si ya tiene su iframe en data.js) */}
        {embedSrc ? (
          <>
            <View style={styles.embedMapCard}>
              <View style={styles.embedMapHeader}>
                <Ionicons name="map" size={17} color={COLORS.primary} />
                <Text style={styles.embedMapTitle}>Mapa Satelital en Vivo (Google Maps)</Text>
              </View>
              <View style={styles.embedMapBox}>
                {Platform.OS === 'web' ? (
                  <iframe
                    src={embedSrc}
                    style={{ width: '100%', height: '100%', border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: iframeHtml }}
                    style={styles.webview}
                    javaScriptEnabled
                    domStorageEnabled
                    nestedScrollEnabled
                  />
                )}
              </View>
            </View>

            <View style={styles.mapsSection}>
              <TouchableOpacity style={styles.primaryMapBtn} onPress={abrirComoLlegar}>
                <Ionicons name="navigate" size={18} color="#FFF" />
                <Text style={styles.primaryMapBtnText}>Cómo llegar en Google Maps (Ruta GPS)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryMapBtn} onPress={abrirVerEnMapa}>
                <Ionicons name="map-outline" size={17} color={COLORS.primary} />
                <Text style={styles.secondaryMapBtnText}>Abrir en la App de Google Maps</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.pendingMapBox}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.pendingMapText}>
              Espacio libre para ubicación de Google Maps (pega tu {'<iframe>'} en mapEmbedUrl dentro de backend/data.js)
            </Text>
          </View>
        )}

        {/* Secciones informativas completas */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Descripción del Atractivo</Text>
          </View>
          <Text style={styles.bodyText}>{lugar.desc}</Text>
        </View>

        {!!lugar.historia && (
          <View style={[styles.sectionCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 3 }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="book" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Reseña Histórica y Cultural</Text>
            </View>
            <Text style={styles.bodyText}>{lugar.historia}</Text>
          </View>
        )}

        {!!lugar.actividades && (
          <View style={[styles.sectionCard, { borderLeftColor: '#60A5FA', borderLeftWidth: 3 }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="walk" size={18} color="#60A5FA" />
              <Text style={styles.sectionTitle}>Qué hacer y Actividades Recomendadas</Text>
            </View>
            <Text style={styles.bodyText}>{lugar.actividades}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardActive,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  categoryBadge: {
    backgroundColor: '#2A1458',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.button,
  },
  categoryBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 34 },
  heroImageBox: {
    width: '100%',
    height: 270,
    backgroundColor: '#05050A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 14,
  },
  infoGrid: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: COLORS.textMain,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  embedMapCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  embedMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  embedMapTitle: {
    color: COLORS.textMain,
    fontSize: 13.5,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  embedMapBox: {
    width: '100%',
    height: 250,
    backgroundColor: '#05050A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#05050A',
  },
  mapsSection: {
    marginBottom: 18,
    gap: 10,
  },
  primaryMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: COLORS.button,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  primaryMapBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161625',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryMapBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pendingMapBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131122',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  pendingMapText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bodyText: {
    color: '#D4D4E8',
    fontSize: 13.5,
    lineHeight: 21,
  },
});
