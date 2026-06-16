// screens/AddHikeScreen.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Image, Alert, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { HikeContext } from '../context/HikeContext';
import { SettingsContext } from '../context/SettingsContext';

// Formuła Haversine — oblicza dystans między dwoma punktami GPS uwzględniając krzywiznę Ziemi
// Bez tej formuły dystans byłby błędny bo Ziemia nie jest płaska
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // promień Ziemi w km
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

export default function AddHikeScreen({ navigation }) {
  // useContext — pobieramy dane z globalnego stanu bez przekazywania propsów przez każdy ekran
  const { addHike } = useContext(HikeContext);
  const { themeStyles: s, translations } = useContext(SettingsContext);

  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('idle'); // idle / tracking / paused
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(null);
  const [trackPoints, setTrackPoints] = useState([]);

  // useRef — przechowuje wartości między renderami bez wywoływania ponownego renderowania
  const timerRef = useRef(null);
  const locationRef = useRef(null);
  const lastPointRef = useRef(null); // ostatni punkt GPS — potrzebny do obliczania dystansu

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (locationRef.current) locationRef.current.remove();
    };
  }, []);

  const takePhoto = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') { Alert.alert('', translations.cameraDenied); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.length) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (uri) => setPhotos(prev => prev.filter(p => p !== uri));

  const startTracking = async () => {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') { Alert.alert('', translations.locationDenied); return; }

    setStatus('tracking');
    setElapsed(0); setDistance(0); setSpeed(0);
    setTrackPoints([]); lastPointRef.current = null;

    // Timer — aktualizuje czas co sekundę
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    // watchPositionAsync — subskrybuje aktualizacje GPS
    // timeInterval: 3000ms lub distanceInterval: 5m — co nastąpi pierwsze
    locationRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      loc => {
        const { latitude, longitude, altitude: alt, speed: spd } = loc.coords;
        setAltitude(alt ? Math.round(alt) : null);
        setSpeed(spd ? Math.max(0, spd * 3.6) : 0); // konwersja m/s → km/h
        setTrackPoints(prev => [...prev, { latitude, longitude }]);

        // Obliczamy dystans od poprzedniego punktu i dodajemy do sumy
        if (lastPointRef.current) {
          setDistance(prev => prev + haversine(
            lastPointRef.current.latitude, lastPointRef.current.longitude,
            latitude, longitude
          ));
        }
        lastPointRef.current = { latitude, longitude };
      }
    );
  };

  const stopTracking = () => {
    clearInterval(timerRef.current);
    if (locationRef.current) { locationRef.current.remove(); locationRef.current = null; }
    setStatus('paused');
  };

  const resetTracking = () => {
    setStatus('idle'); setElapsed(0); setDistance(0);
    setSpeed(0); setAltitude(null); setTrackPoints([]);
  };

  const save = () => {
    if (title.trim().length < 3) { Alert.alert('', translations.nameTooShort); return; }
    const location = trackPoints.length > 0 ? trackPoints[0] : null;
    addHike(title.trim(), photos, location, {
      duration: elapsed > 0 ? elapsed : null,
      distance: distance > 0 ? distance : null,
      trackPoints,
    });
    navigation.goBack();
  };

  const hasData = status === 'paused' || status === 'tracking';

  return (
    <ScrollView style={{ backgroundColor: s.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.label, { color: s.text }]}>{translations.hikeName}</Text>
      <TextInput
        style={[styles.input, { borderColor: s.border, color: s.text, backgroundColor: s.card }]}
        placeholder={translations.namePlaceholder}
        placeholderTextColor={s.secondaryText}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: s.text }]}>
        {`${translations.photos} (${photos.length})`}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
        <TouchableOpacity
          style={[styles.addPhotoTile, { backgroundColor: s.card, borderColor: s.border }]}
          onPress={takePhoto}
        >
          <Ionicons name="camera-outline" size={28} color={s.icon} />
          <Text style={[styles.addPhotoText, { color: s.secondaryText }]}>
            {translations.addPhoto}
          </Text>
        </TouchableOpacity>
        {photos.map((uri) => (
          <View key={uri} style={styles.photoTileWrap}>
            <Image source={{ uri }} style={styles.photoTile} resizeMode="cover" />
            <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)}>
              <Ionicons name="close-circle" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {hasData && (
        <View style={[styles.statsCard, { backgroundColor: s.card }]}>
          <Text style={[styles.sectionTitle, { color: s.text }]}>{translations.liveStats}</Text>
          <View style={styles.statsGrid}>
            <StatItem icon="time-outline"        label={translations.time}     value={formatTime(elapsed)}                       s={s} />
            <StatItem icon="map-outline"         label={translations.distance} value={`${distance.toFixed(3)} km`}              s={s} />
            <StatItem icon="speedometer-outline" label={translations.speed}    value={`${speed.toFixed(1)} km/h`}               s={s} />
            <StatItem icon="trending-up-outline" label={translations.altitude} value={altitude != null ? `${altitude} m` : '—'} s={s} />
          </View>
          <View style={styles.pointsRow}>
            <Ionicons name="navigate-outline" size={14} color={s.icon} />
            <Text style={[styles.pointsText, { color: s.secondaryText }]}>
              {`  ${translations.trackPoints}: ${trackPoints.length}`}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.ctrlRow}>
        {status === 'idle' && (
          <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: s.buttonActive }]} onPress={startTracking}>
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.ctrlBtnText}>{translations.startTracking}</Text>
          </TouchableOpacity>
        )}
        {status === 'tracking' && (
          <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: '#e57373' }]} onPress={stopTracking}>
            <Ionicons name="stop" size={18} color="#fff" />
            <Text style={styles.ctrlBtnText}>{translations.stopTracking}</Text>
          </TouchableOpacity>
        )}
        {status === 'paused' && (
          <>
            <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: s.buttonActive }]} onPress={startTracking}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.ctrlBtnText}>{translations.resumeTracking}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: s.buttonInactive }]} onPress={resetTracking}>
              <Ionicons name="refresh" size={18} color={s.text} />
              <Text style={[styles.ctrlBtnText, { color: s.text }]}>{translations.reset}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: s.buttonActive }]} onPress={save}>
        <Text style={styles.saveBtnText}>{translations.addButton}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.backBtn, { backgroundColor: s.buttonInactive }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.backBtnText, { color: s.text }]}>{translations.back}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatItem({ icon, label, value, s }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={s.buttonActive} />
      <Text style={[styles.statLabel, { color: s.secondaryText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: s.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, paddingBottom: 40 },
  label:        { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: 10,
    padding: 12, marginBottom: 16, fontSize: 15,
  },
  photoRow:     { marginBottom: 16 },
  addPhotoTile: {
    width: 90, height: 90, borderRadius: 12,
    borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, gap: 4,
  },
  addPhotoText: { fontSize: 11 },
  photoTileWrap: { marginRight: 10, position: 'relative' },
  photoTile:    { width: 90, height: 90, borderRadius: 12 },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 11,
  },
  statsCard:    { borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  statItem:     { width: '45%', alignItems: 'center', gap: 4, paddingVertical: 6 },
  statLabel:    { fontSize: 12 },
  statValue:    { fontSize: 15, fontWeight: '600' },
  pointsRow:    { flexDirection: 'row', alignItems: 'center' },
  pointsText:   { fontSize: 13 },
  ctrlRow:      { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 10, gap: 8,
  },
  ctrlBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
  saveBtn:      { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  saveBtnText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn:      { padding: 14, borderRadius: 12, alignItems: 'center' },
  backBtnText:  { fontSize: 15 },
});
