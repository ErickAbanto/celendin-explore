import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LugaresScreen from '../screens/LugaresScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import ContactScreen from '../screens/ContactScreen';
import { COLORS } from '../constants/theme';
import { useSavedPlaces } from '../context/SavedPlacesContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { savedPlaces, darkMode, language } = useSavedPlaces();
  const isEn = language === 'en';
  const bottomPad = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 16 : 10
  );
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 0
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStatusBarHeight: topInset,
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '800',
          fontSize: 17,
        },
        headerTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: darkMode ? '#0B1411' : '#FFFFFF',
          borderTopColor: darkMode ? '#1D2D27' : '#E5E7EB',
          borderTopWidth: 1,
          height: 62 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: darkMode ? 0.35 : 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarActiveTintColor: darkMode ? '#34D399' : COLORS.primary,
        tabBarInactiveTintColor: darkMode ? '#9CA3AF' : '#6B7280',
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'compass-outline';
          if (route.name === 'Inicio') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Lugares') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Directorio') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Perfil / Offline') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: darkMode
                    ? 'rgba(52, 211, 153, 0.18)'
                    : '#E6F4EE',
                },
              ]}
            >
              <Ionicons name={iconName} size={21} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          headerShown: false,
          title: isEn ? 'Home' : 'Inicio',
          tabBarLabel: isEn ? 'Home' : 'Inicio',
        }}
      />
      <Tab.Screen
        name="Lugares"
        component={LugaresScreen}
        options={{
          headerShown: false,
          title: isEn ? 'Places' : 'Lugares',
          tabBarLabel: isEn ? 'Places' : 'Lugares',
        }}
      />
      <Tab.Screen
        name="Directorio"
        component={PortfolioScreen}
        options={{
          headerShown: false,
          title: isEn ? 'Directory' : 'Directorio Cultural',
          tabBarLabel: isEn ? 'Directory' : 'Directorio',
        }}
      />
      <Tab.Screen
        name="Perfil / Offline"
        component={ContactScreen}
        options={{
          headerShown: false,
          title: isEn ? 'Profile' : 'Perfil',
          tabBarLabel: isEn ? 'Profile' : 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primarySoft,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '800',
  },
});
