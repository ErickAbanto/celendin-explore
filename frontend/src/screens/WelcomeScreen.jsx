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
import { getColors } from '../constants/theme';
import { useSavedPlaces } from '../context/SavedPlacesContext';

export default function WelcomeScreen({ onStart }) {
  const insets = useSafeAreaInsets();
  const { darkMode, language } = useSavedPlaces();
  const C = getColors(darkMode);
  const isEn = language === 'en';

  const bottomPadding =
    Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 18) + 8;

  return (
    <View style={[styles.root, { backgroundColor: C.card }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Imagen limpia en la parte superior sin textos encima */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/celendin-hero.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Información y descripción afuera, al pie de la imagen */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: bottomPadding, backgroundColor: C.card },
        ]}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.logoBadge, { backgroundColor: C.primarySoft }]}>
            <Ionicons name="compass-outline" size={24} color={C.primaryLight} />
          </View>
          <Text style={[styles.locationText, { color: C.primaryLight }]}>
            {isEn
              ? 'Celendín, Cajamarca • 2,625 m a.s.l.'
              : 'Celendín, Cajamarca • 2,625 m s.n.m.'}
          </Text>
        </View>

        <Text style={[styles.title, { color: C.text }]}>
          Celendín{' '}
          <Text style={{ color: C.primaryLight }}>Explore</Text>
        </Text>

        <Text style={[styles.description, { color: C.textSecondary }]}>
          {isEn
            ? 'Geolocated tourist guide and official directory of restaurants, chocolate shops, crafts and hotels in the province of Celendín.'
            : 'Guía turística geolocalizada y directorio oficial de restaurantes, chocolaterías, artesanía y hoteles en la provincia de Celendín.'}
        </Text>

        <Pressable
          onPress={() => onStart?.()}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Start exploring' : 'Comenzar a Explorar'}
        >
          <Text style={styles.ctaText}>
            {isEn ? 'Explore Celendín' : 'Explorar Celendín'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  imageContainer: {
    flex: 1.15,
    width: '100%',
    backgroundColor: '#0F5C41',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  ctaButton: {
    marginTop: 22,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonPressed: {
    opacity: 0.88,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
