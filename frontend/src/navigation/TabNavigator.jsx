import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import ContactScreen from '../screens/ContactScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: { color: COLORS.textMain, fontWeight: '800', fontSize: 17 },
        headerTintColor: COLORS.textMain,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Atractivos') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Cultura') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Guía') iconName = focused ? 'images' : 'images-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ headerShown: false, title: 'Inicio' }}
      />
      <Tab.Screen
        name="Atractivos"
        component={ServicesScreen}
        options={{ title: 'Atractivos y Mapa' }}
      />
      <Tab.Screen
        name="Cultura"
        component={PortfolioScreen}
        options={{ title: 'Cultura y Tradición' }}
      />
      <Tab.Screen
        name="Guía"
        component={ContactScreen}
        options={{ title: 'Guía y Galería' }}
      />
    </Tab.Navigator>
  );
}
