// screens/HikeDetailsScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
  ScrollView, View, Text, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, StatusBar, Modal, FlatList, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsContext } from '../context/SettingsContext';

const SCREEN_W = Dimensions.get('window').width;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

async function fetchWeather(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current_weather=true&forecast_days=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

function weatherIcon(code) {
  if (code === 0) return { icon: 'sunny',        label: 'Bezchmurnie' };
  if (code <= 2)  return { icon: 'partly-sunny', label: 'Częściowe zachmurzenie' };
  if (code <= 3)  return { icon: 'cloud',        label: 'Zachmurzenie' };
  if (code <= 67) return { icon: 'rainy',        label: 'Deszcz' };
  if (code <= 77) return { icon: 'snow',         label: 'Śnieg' };
  if (code <= 82) return { icon: 'thunderstorm', label: 'Burza' };
  return                  { icon: 'cloud',        label: 'Zmienna pogoda' };
}

function StatBadge({ icon, label, value, s }) {
  return (
    <View style={[statStyles.wrap, { backgroundColor: s.card }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: s.background }]}>
        <Ionicons name={icon} size={20} color={s.buttonActive} />
      </View>
      <Text style={[statStyles.label, { color: s.secondaryText }]}>{label}</Text>
      <Text style={[statStyles.value, { color: s.text }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  wrap: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '700' },
});

export default function HikeDetailsScreen({ route, navigation }) {
  const { hike } = route.params;
  const { theme, themeStyles: s, translations } = useContext(SettingsContext);

  // Obsługa wielu zdjęć — wsteczna kompatybilność z photoUri
  const photos = hike.photos?.length
    ? hike.photos
    : hike.photoUri ? [hike.photoUri] : [];

  const [modalPhoto, setModalPhoto] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    if (!hike.location) return;
    setWeatherLoading(true);
    fetchWeather(hike.location.latitude, hike.location.longitude)
      .then(data => { setWeather(data.current_weather); setWeatherLoading(false); })
      .catch(() => { setWeatherError(translations.weatherError); setWeatherLoading(false); });
  }, [hike.location]);

  const wIcon = weather ? weatherIcon(weather.weathercode) : null;
  const hasStats = hike.distance != null || hike.duration != null;

  return (
    <View style={{ flex: 1, backgroundColor: s.background }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: s.background, borderBottomColor: s.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={s.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Galeria zdjęć */}
        {photos.length > 0 ? (
          <View>
            {/* Główne zdjęcie */}
            <TouchableOpacity onPress={() => setModalPhoto(photos[0])} activeOpacity={0.95}>
              <Image source={{ uri: photos[0] }} style={styles.mainPhoto} resizeMode="cover" />
            </TouchableOpacity>

            {/* Miniaturki jeśli > 1 zdjęcie */}
            {photos.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.thumbRow, { backgroundColor: s.card }]}
                contentContainerStyle={styles.thumbRowContent}
              >
                {photos.map((uri, idx) => (
                  <TouchableOpacity key={uri} onPress={() => setModalPhoto(uri)}>
                    <Image
                      source={{ uri }}
                      style={[
                        styles.thumb,
                        { borderColor: s.buttonActive },
                        uri === photos[0] && styles.thumbActive,
                      ]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: s.card }]}>
            <Ionicons name="trail-sign-outline" size={56} color={s.border} />
            <Text style={[styles.photoPlaceholderText, { color: s.secondaryText }]}>Brak zdjęcia</Text>
          </View>
        )}

        {/* Tytuł i data */}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: s.text }]}>{hike.title}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={s.secondaryText} />
            <Text style={[styles.date, { color: s.secondaryText }]}>{`  ${hike.date}`}</Text>
          </View>
        </View>

        {/* Statystyki */}
        {hasStats && (
          <View style={styles.statsGrid}>
            {hike.distance != null && (
              <StatBadge icon="map-outline" label="Dystans" value={`${hike.distance.toFixed(2)} km`} s={s} />
            )}
            {hike.duration != null && (
              <StatBadge icon="time-outline" label="Czas" value={formatTime(hike.duration)} s={s} />
            )}
          </View>
        )}

        {/* GPS */}
        {hike.location && (
          <View style={[styles.infoRow, { backgroundColor: s.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: s.background }]}>
              <Ionicons name="location" size={18} color={s.buttonActive} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: s.secondaryText }]}>Lokalizacja GPS</Text>
              <Text style={[styles.infoValue, { color: s.text }]}>
                {`${hike.location.latitude.toFixed(5)}, ${hike.location.longitude.toFixed(5)}`}
              </Text>
            </View>
          </View>
        )}

        {/* Pogoda */}
        <View style={[styles.weatherCard, { backgroundColor: s.card }]}>
          <View style={styles.weatherHeader}>
            <View style={[styles.infoIcon, { backgroundColor: s.background }]}>
              <Ionicons name="partly-sunny-outline" size={18} color={s.buttonActive} />
            </View>
            <Text style={[styles.weatherTitle, { color: s.text }]}>{translations.weather}</Text>
          </View>
          {!hike.location && (
            <Text style={[styles.weatherNote, { color: s.secondaryText }]}>{translations.weatherNoLocation}</Text>
          )}
          {hike.location && weatherLoading && (
            <View style={styles.weatherRow}>
              <ActivityIndicator color={s.buttonActive} size="small" />
              <Text style={[styles.weatherNote, { color: s.secondaryText }]}>{`  ${translations.weatherLoading}`}</Text>
            </View>
          )}
          {weatherError && (
            <Text style={[styles.weatherNote, { color: '#f87171' }]}>{weatherError}</Text>
          )}
          {weather && wIcon && (
            <View style={styles.weatherData}>
              <View style={[styles.weatherIconBig, { backgroundColor: s.background }]}>
                <Ionicons name={`${wIcon.icon}-outline`} size={36} color={s.buttonActive} />
              </View>
              <View style={styles.weatherInfo}>
                <Text style={[styles.weatherCondition, { color: s.text }]}>{wIcon.label}</Text>
                <Text style={[styles.weatherStat, { color: s.secondaryText }]}>🌡 {weather.temperature}°C</Text>
                <Text style={[styles.weatherStat, { color: s.secondaryText }]}>💨 {weather.windspeed} km/h</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.backBtnBottom, { backgroundColor: s.card, borderColor: s.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={18} color={s.text} />
          <Text style={[styles.backBtnText, { color: s.text }]}>{translations.back}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal — pełnoekranowe zdjęcie */}
      <Modal visible={!!modalPhoto} transparent animationType="fade" onRequestClose={() => setModalPhoto(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setModalPhoto(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {modalPhoto && (
            <Image source={{ uri: modalPhoto }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 52, paddingBottom: 8, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:        { padding: 8, width: 44, alignItems: 'center' },
  content:        { paddingBottom: 40 },
  mainPhoto:      { width: '100%', height: 260 },
  thumbRow:       { maxHeight: 76 },
  thumbRowContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive:    { borderWidth: 2 },
  photoPlaceholder: {
    height: 180, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  photoPlaceholderText: { fontSize: 14 },
  titleWrap:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 6 },
  title:          { fontSize: 24, fontWeight: '800' },
  dateRow:        { flexDirection: 'row', alignItems: 'center' },
  date:           { fontSize: 13 },
  statsGrid:      { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 12,
    marginHorizontal: 16, marginTop: 10,
  },
  infoIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText:       { flex: 1 },
  infoLabel:      { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:      { fontSize: 14, fontWeight: '600', marginTop: 2 },
  weatherCard:    { borderRadius: 14, padding: 16, gap: 12, marginHorizontal: 16, marginTop: 10 },
  weatherHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTitle:   { fontSize: 16, fontWeight: '700' },
  weatherRow:     { flexDirection: 'row', alignItems: 'center' },
  weatherNote:    { fontSize: 13 },
  weatherData:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherIconBig: {
    width: 68, height: 68, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  weatherInfo:    { gap: 4 },
  weatherCondition: { fontSize: 15, fontWeight: '700' },
  weatherStat:    { fontSize: 14 },
  backBtnBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, padding: 14, gap: 4,
    borderWidth: 1, marginHorizontal: 16, marginTop: 14,
  },
  backBtnText:    { fontSize: 15, fontWeight: '600' },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalClose: {
    position: 'absolute', top: 52, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  modalImage:     { width: '100%', height: '80%' },
});
