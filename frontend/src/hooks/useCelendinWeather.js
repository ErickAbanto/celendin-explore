import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_CELENDIN_WEATHER,
  fetchCelendinWeatherData,
} from '../services/weatherApi';

export function useCelendinWeather(intervalMs = 180000) {
  const [liveWeather, setLiveWeather] = useState(DEFAULT_CELENDIN_WEATHER);

  const refreshWeather = useCallback(async () => {
    try {
      const next = await fetchCelendinWeatherData();
      if (next) {
        setLiveWeather((prev) => ({ ...prev, ...next }));
      }
    } catch {
      // Conserva lectura actual de Celendín
    }
  }, []);

  useEffect(() => {
    refreshWeather();
    const timer = setInterval(refreshWeather, intervalMs);
    return () => clearInterval(timer);
  }, [refreshWeather, intervalMs]);

  return { liveWeather, refreshWeather };
}
