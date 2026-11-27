// Coordenadas y altitud exacta de la ciudad de Celendín, Cajamarca (-6.8659, -78.1449 · elevation=2625 m s.n.m.)
export const CELENDIN_WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-6.8659&longitude=-78.1449&elevation=2625&models=ecmwf_ifs025&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,wind_speed_10m&hourly=precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=America%2FLima';

export const CELENDIN_WTTR_BACKUP_URL = 'https://wttr.in/Celendin,Peru?format=j1';

export const DEFAULT_CELENDIN_WEATHER = {
  temp: 14,
  tempMax: 18,
  tempMin: 7,
  feelsLike: 14,
  humidity: 74,
  cloudCover: 65,
  precipitation: 0,
  rainProb: 20,
  desc: 'Nublado',
  detailEs: 'Cielo nublado sobre la provincia de Celendín (2,625 m s.n.m.)',
  detailEn: 'Cloudy sky over Celendín province (2,625 m a.s.l.)',
  icon: 'cloud',
  iconColor: '#E2E8F0',
  windspeed: 11,
  updatedAt: 'En vivo',
};

export function classifyCelendinWeather({
  code,
  isDay = 1,
  precipitation = 0,
  cloudCover = 0,
  nextHourRainProb = 0,
  nextHourCode = 0,
}) {
  if (code >= 95 || nextHourCode >= 95) {
    return {
      desc: 'Descargas eléctricas',
      detailEs: 'Tormenta activa con actividad eléctrica en la provincia de Celendín',
      detailEn: 'Active thunderstorm with lightning in Celendín province',
      icon: 'thunderstorm',
      iconColor: '#F59E0B',
    };
  }

  if (
    precipitation > 0.05 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 86)
  ) {
    return {
      desc: 'Lloviendo',
      detailEs: 'Precipitación pluvial registrada actualmente en Celendín',
      detailEn: 'Rainfall currently recorded in Celendín',
      icon: 'rainy',
      iconColor: '#38BDF8',
    };
  }

  if (
    nextHourRainProb >= 60 ||
    (nextHourCode >= 51 && nextHourCode <= 86) ||
    (cloudCover >= 88 && nextHourRainProb >= 40)
  ) {
    return {
      desc: 'Por llover',
      detailEs: `Cielo cargado con ${nextHourRainProb}% de probabilidad de lluvia próxima`,
      detailEn: `Heavy clouds with ${nextHourRainProb}% chance of upcoming rain`,
      icon: 'umbrella',
      iconColor: '#60A5FA',
    };
  }

  if (
    code === 1 ||
    code === 2 ||
    code === 3 ||
    code === 45 ||
    code === 48 ||
    cloudCover >= 25
  ) {
    return {
      desc: 'Nublado',
      detailEs: `Cielo nublado sobre la provincia de Celendín (${cloudCover}% nubosidad)`,
      detailEn: `Cloudy sky over Celendín province (${cloudCover}% cloud cover)`,
      icon: 'cloud',
      iconColor: '#E2E8F0',
    };
  }

  if (isDay === 0) {
    return {
      desc: 'Soleado',
      detailEs: 'Cielo despejado en la provincia de Celendín',
      detailEn: 'Clear sky in Celendín province',
      icon: 'sunny',
      iconColor: '#FBBF24',
    };
  }

  return {
    desc: 'Soleado',
    detailEs: 'Cielo despejado y soleado en la provincia de Celendín',
    detailEn: 'Clear and sunny sky in Celendín province',
    icon: 'sunny',
    iconColor: '#FBBF24',
  };
}

export async function fetchCelendinWeatherData() {
  try {
    const res = await fetch(CELENDIN_WEATHER_URL);
    const data = await res.json();
    const cur = data?.current;
    if (!cur) throw new Error('Sin datos ECMWF');

    const currentHourIso = String(cur.time || '').slice(0, 13);
    const hourlyTimes = data?.hourly?.time || [];
    const hourlyProbs = data?.hourly?.precipitation_probability || [];
    const hourlyCodes = data?.hourly?.weather_code || [];
    let hIdx = hourlyTimes.findIndex((t) =>
      String(t).startsWith(currentHourIso)
    );
    if (hIdx < 0) hIdx = new Date().getHours();

    const nextHourRainProb = Math.max(
      Number(hourlyProbs[hIdx] || 0),
      Number(hourlyProbs[hIdx + 1] || 0)
    );
    const nextHourCode = Number(hourlyCodes[hIdx + 1] ?? cur.weather_code ?? 0);

    const classified = classifyCelendinWeather({
      code: Number(cur.weather_code ?? 2),
      isDay: Number(cur.is_day ?? 1),
      precipitation:
        Number(cur.precipitation || 0) +
        Number(cur.rain || 0) +
        Number(cur.showers || 0),
      cloudCover: Number(cur.cloud_cover ?? 60),
      nextHourRainProb,
      nextHourCode,
    });

    const maxArr = data?.daily?.temperature_2m_max;
    const minArr = data?.daily?.temperature_2m_min;
    const tempMax =
      Array.isArray(maxArr) && maxArr.length > 0
        ? Math.round(Number(maxArr[0]))
        : 18;
    const tempMin =
      Array.isArray(minArr) && minArr.length > 0
        ? Math.round(Number(minArr[0]))
        : 7;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      temp: Math.round(Number(cur.temperature_2m)),
      tempMax,
      tempMin,
      feelsLike: Math.round(
        Number(cur.apparent_temperature ?? cur.temperature_2m)
      ),
      humidity: Math.round(Number(cur.relative_humidity_2m ?? 74)),
      cloudCover: Math.round(Number(cur.cloud_cover ?? 60)),
      precipitation: Number(cur.precipitation || 0),
      rainProb: Math.round(nextHourRainProb),
      desc: classified.desc,
      detailEs: classified.detailEs,
      detailEn: classified.detailEn,
      icon: classified.icon,
      iconColor: classified.iconColor,
      windspeed: Math.round(Number(cur.wind_speed_10m) || 0),
      updatedAt: nowTime,
    };
  } catch {
    const resBackup = await fetch(CELENDIN_WTTR_BACKUP_URL);
    const wData = await resBackup.json();
    const cc = wData?.current_condition?.[0];
    const today = wData?.weather?.[0];
    if (!cc) return null;

    const cloud = Number(cc.cloudcover || 60);
    const precip = Number(cc.precipMM || 0);
    const classified = classifyCelendinWeather({
      code: precip > 0.1 ? 61 : cloud >= 25 ? 2 : 0,
      isDay: 1,
      precipitation: precip,
      cloudCover: cloud,
      nextHourRainProb: precip > 0 ? 75 : 20,
      nextHourCode: 2,
    });

    return {
      temp: Math.round(Number(cc.temp_C ?? 14)),
      tempMax: Math.round(Number(today?.maxtempC ?? 18)),
      tempMin: Math.round(Number(today?.mintempC ?? 7)),
      feelsLike: Math.round(Number(cc.FeelsLikeC ?? cc.temp_C ?? 14)),
      humidity: Math.round(Number(cc.humidity ?? 74)),
      cloudCover: cloud,
      desc: classified.desc,
      detailEs: classified.detailEs,
      detailEn: classified.detailEn,
      icon: classified.icon,
      iconColor: classified.iconColor,
      windspeed: Math.round(Number(cc.windspeedKmph ?? 11)),
    };
  }
}
