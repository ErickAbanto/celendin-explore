import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AdminPanelModal from './src/screens/AdminPanelModal';
import {
  SavedPlacesProvider,
  useSavedPlaces,
} from './src/context/SavedPlacesContext';
import { getColors } from './src/constants/theme';

function AppContent() {
  const { showWelcome, setShowWelcome, darkMode } = useSavedPlaces();
  const C = getColors(darkMode);
  const baseTheme = darkMode ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'celendin-clean-web-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
          * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          *:focus, *:focus-visible { outline: none !important; }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

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
          <AdminPanelModal />
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
