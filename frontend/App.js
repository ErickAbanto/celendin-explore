import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/constants/theme';

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.textMain,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={AppTheme}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.card}
          translucent={false}
        />
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
