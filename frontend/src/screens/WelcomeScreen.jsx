import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HIGHLIGHTS = [
  { value: '25+', label: 'Rutas y Destinos' },
  { value: '100%', label: 'Mapa Offline' },
  { value: 'Guía', label: 'Gastronómica' },
];

export default function WelcomeScreen({ onStart }) {
  const insets = useSafeAreaInsets();

  const topPadding =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 16
    ) + 12;
  const bottomPadding =
    Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 20) + 12;

  return (
    <View style={styles.root}>
      {/* Fondo panorámico de Celendín con capas oscuras verde esmeralda */}
      <Image
        source={require('../../assets/images/celendin-hero.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.topTint} pointerEvents="none" />
      <View style={styles.midTint} pointerEvents="none" />
      <View style={styles.bottomSolid} pointerEvents="none" />

      <View
        style={[
          styles.container,
          { paddingTop: topPadding, paddingBottom: bottomPadding },
        ]}
      >
        {/* Badge superior respetando el notch */}
        <View style={styles.topRow}>
          <View style={styles.locationPill}>
            <Text style={styles.locationPillText}>
              Cajamarca, Perú • 2,625 m.s.n.m.
            </Text>
          </View>
        </View>

        {/* Bloque principal */}
        <View style={styles.bottomSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="compass-outline" size={32} color="#111827" />
          </View>

          <Text style={styles.eyebrow}>
            CUNA DEL SOMBRERO DE PAJA TOQUILLA
          </Text>

          <Text style={styles.title}>
            Celendín <Text style={styles.titleAccent}>Explore</Text>
          </Text>

          <Text style={styles.description}>
            Descubre el <Text style={styles.descriptionBold}>Edén del Norte</Text>
            : cataratas cristalinas, aguas termales, el imponente Cañón del
            Marañón y la mejor tradición shilica en tu bolsillo.
          </Text>

          <View style={styles.cardsRow}>
            {HIGHLIGHTS.map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <Text style={styles.infoCardValue}>{item.value}</Text>
                <Text style={styles.infoCardLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => onStart?.()}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Comenzar a Explorar"
          >
            <Text style={styles.ctaText}>Comenzar a Explorar</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#111827"
              style={styles.ctaIcon}
            />
          </Pressable>

          <Text style={styles.footerNote}>
            Funciona con y sin conexión a internet en rutas rurales
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05271E',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '62%',
  },
  topTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 38, 34, 0.45)',
  },
  midTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '32%',
    bottom: 0,
    backgroundColor: 'rgba(5, 39, 30, 0.78)',
  },
  bottomSolid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '56%',
    bottom: 0,
    backgroundColor: '#05271E',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  topRow: {
    alignItems: 'flex-start',
  },
  locationPill: {
    backgroundColor: 'rgba(98, 92, 50, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(229, 200, 100, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  locationPillText: {
    color: '#F5E7B2',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: '100%',
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F5A623',
    borderWidth: 1,
    borderColor: 'rgba(255, 232, 165, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  eyebrow: {
    marginTop: 18,
    color: '#F5B82E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  title: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#FBBF24',
  },
  description: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14.5,
    lineHeight: 21,
  },
  descriptionBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardValue: {
    color: '#F5B82E',
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoCardLabel: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 20,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F5A623',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  ctaIcon: {
    marginLeft: 8,
    marginTop: 1,
  },
  footerNote: {
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    textAlign: 'center',
  },
});
