// screens/ActiveHikeScreen.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, TextInput
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { HikeContext } from '../context/HikeContext';
import { SettingsContext } from '../context/SettingsContext';

// Haversine — dystans między dwoma punktami GPS w km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function ActiveHikeScreen({ navigation }) {
  const { addHike } = useContext(HikeContext);
  const { themeStyles: s, translations } = useContext(SettingsContext);

  const [status, setStatus] = useState('idle'); // idle | tracking | paused
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(null);
  const [trackPoints, setTrackPoints] = useState([]);
  const [hikeName, setHikeName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const timerRef = useRef(null);
  const locationRef = useRef(null);
  const lastPointRef = useRef(null);

  // Czyszczenie przy odmontowaniu
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (locationRef.current) locationRef.current.remove();
    };
  }, []);

  const startTracking = async () => {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Błąd', translations.locationDenied);
      return;
    }

    setStatus('tracking');
    setElapsed(0);
    setDistance(0);
    setSpeed(0);
    setTrackPoints([]);
    lastPointRef.current = null;

    // Timer co sekundę
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // GPS co 3 sekundy
    locationRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      loc => {
        const { latitude, longitude, altitude: alt, speed: spd } = loc.coords;

        setAltitude(alt ? Math.round(alt) : null);
        setSpeed(spd ? Math.max(0, spd * 3.6) : 0); // m/s → km/h

        setTrackPoints(prev => [...prev, { latitude, longitude }]);

        if (lastPointRef.current) {
          const d = haversine(
            lastPointRef.current.latitude,
            lastPointRef.current.longitude,
            latitude,
            longitude
          );
          setDistance(prev => prev + d);
        }
        lastPointRef.current = { latitude, longitude };
      }
    );
  };

  const stopTracking = () => {
    clearInterval(timerRef.current);
    if (locationRef.current) {
      locationRef.current.remove();
      locationRef.current = null;
    }
    setStatus('paused');
    setShowSave(true);
  };

  const saveHike = () => {
    const name = hikeName.trim();
    if (name.length < 3) {
      Alert.alert('Błąd', translations.nameTooShort);
      return;
    }

    const location = trackPoints.length > 0 ? trackPoints[0] : null;

    // Zapisujemy z dodatkowymi danymi
    addHike(name, null, location, {
      duration: elapsed,
      distance: distance,
      trackPoints: trackPoints,
    });

    navigation.navigate('Home');
  };

  const reset = () => {
    setStatus('idle');
    setElapsed(0);
    setDistance(0);
    setSpeed(0);
    setAltitude(null);
    setTrackPoints([]);
    setShowSave(false);
    setHikeName('');
  };

  return (
    <ScrollView
      style={{ backgroundColor: s.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.pageTitle, { color: s.text }]}>
        Aktywna wędrówka 🥾
      </Text>

      {/* Statystyki */}
      <View style={[styles.statsCard, { backgroundColor: s.card }]}>
        <Text style={[styles.statsTitle, { color: s.text }]}>Statystyki na żywo</Text>
        <View style={styles.statsGrid}>
          <StatItem icon="time-outline" label="Czas" value={formatTime(elapsed)} color={s.buttonActive} s={s} />
          <StatItem icon="map-outline" label="Dystans" value={`${distance.toFixed(3)} km`} color={s.buttonActive} s={s} />
          <StatItem icon="speedometer-outline" label="Prędkość" value={`${speed.toFixed(1)} km/h`} color={s.buttonActive} s={s} />
          <StatItem
            icon="trending-up-outline"
            label="Wysokość"
            value={altitude !== null ? `${altitude} m n.p.m.` : '— m n.p.m.'}
            color={s.buttonActive}
            s={s}
          />
        </View>
      </View>

      {/* Punkty trasy */}
      <View style={[styles.statsCard, { backgroundColor: s.card }]}>
        <View style={styles.pointsRow}>
          <Ionicons name="navigate-outline" size={18} color={s.icon} />
          <Text style={[styles.pointsText, { color: s.secondaryText }]}>
            {`  Punkty trasy: ${trackPoints.length}`}
          </Text>
        </View>
      </View>

      {/* Sterowanie */}
      <View style={[styles.controlCard, { backgroundColor: s.card }]}>
        <Text style={[styles.statsTitle, { color: s.text }]}>Sterowanie</Text>
        <View style={styles.buttonsRow}>
          {status !== 'tracking' && (
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: s.buttonActive }]}
              onPress={startTracking}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.ctrlBtnText}>
                {status === 'paused' ? 'Wznów' : 'Rozpocznij śledzenie'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'tracking' && (
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: '#e57373' }]}
              onPress={stopTracking}
            >
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={styles.ctrlBtnText}>Zatrzymaj</Text>
            </TouchableOpacity>
          )}

          {status === 'paused' && (
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: s.buttonInactive }]}
              onPress={reset}
            >
              <Ionicons name="refresh" size={18} color={s.text} />
              <Text style={[styles.ctrlBtnText, { color: s.text }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Zapis wędrówki */}
      {showSave && (
        <View style={[styles.saveCard, { backgroundColor: s.card, borderColor: s.buttonActive }]}>
          <Text style={[styles.statsTitle, { color: s.text }]}>Zapisz wędrówkę</Text>
          <TextInput
            style={[styles.input, { borderColor: s.border, color: s.text, backgroundColor: s.background }]}
            placeholder={translations.namePlaceholder}
            placeholderTextColor={s.secondaryText}
            value={hikeName}
            onChangeText={setHikeName}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: s.buttonActive }]}
            onPress={saveHike}
          >
            <Text style={styles.saveBtnText}>{translations.addButton}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function StatItem({ icon, label, value, color, s }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statLabel, { color: s.secondaryText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: s.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 16, paddingBottom: 40 },
  pageTitle:    { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  statsCard: {
    borderRadius: 12, padding: 16,
    marginBottom: 12,
  },
  statsTitle:   { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '45%', alignItems: 'center',
    gap: 4, paddingVertical: 8,
  },
  statLabel:    { fontSize: 12 },
  statValue:    { fontSize: 15, fontWeight: '600' },
  pointsRow:    { flexDirection: 'row', alignItems: 'center' },
  pointsText:   { fontSize: 14 },
  controlCard: {
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  buttonsRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, gap: 8,
  },
  ctrlBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
  saveCard: {
    borderRadius: 12, padding: 16,
    borderWidth: 1.5, marginBottom: 12,
  },
  input: {
    borderWidth: 1, borderRadius: 10,
    padding: 12, marginBottom: 12, fontSize: 15,
  },
  saveBtn: {
    padding: 14, borderRadius: 10, alignItems: 'center',
  },
  saveBtnText:  { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
