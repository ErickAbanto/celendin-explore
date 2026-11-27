import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';

export function useReturnOrigin(route, navigation, blocked = false) {
  const returnToTab = route?.params?.returnTo;

  const handleReturnOrigin = useCallback(() => {
    const origin = route?.params?.returnTo;
    navigation?.setParams?.({ returnTo: undefined });
    if (origin) {
      navigation?.navigate?.(origin);
      return true;
    }
    return false;
  }, [route?.params?.returnTo, navigation]);

  useEffect(() => {
    if (!returnToTab || blocked) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', handleReturnOrigin);
    return () => sub.remove();
  }, [returnToTab, blocked, handleReturnOrigin]);

  return { returnToTab, handleReturnOrigin };
}
