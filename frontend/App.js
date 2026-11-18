import React from 'react';
import { StatusBar } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import WelcomeScreen from './src/screens/WelcomeScreen';
import {
  SavedPlacesProvider,
  useSavedPlaces,
} from './src/context/SavedPlacesContext';
import { getColors } from './src/constants/theme';

function AppContent() {
  const { showWelcome, setShowWelcome, darkMode } = useSavedPlaces();
  const C = getColors(darkMode);
  const baseTheme = darkMode ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: C.background,
      card: C.card,
      text: C.textMain,
      border: C.border,
      primary: C.primary,
    },
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {showWelcome ? (
        <WelcomeScreen onStart={() => setShowWelcome(false)} />
      ) : (
        <NavigationContainer theme={navTheme}>
          <TabNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SavedPlacesProvider>
        <AppContent />
      </SavedPlacesProvider>
    </SafeAreaProvider>
  );
}
