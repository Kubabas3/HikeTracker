// screens/HomeScreen.js
import React, { useContext, useCallback, useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HikeContext } from '../context/HikeContext';
import { SettingsContext } from '../context/SettingsContext';

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HomeScreen({ navigation }) {
  const { hikes, removeHike } = useContext(HikeContext);
  const { theme, themeStyles: s, translations } = useContext(SettingsContext);
  const [query, setQuery] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const filtered = hikes.filter(h =>
    (h.title || '').toLowerCase().includes(query.trim().toLowerCase())
  );

  const renderHike = useCallback(({ item, index }) => {
    const hasStats = item.distance || item.duration;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: s.card }]}
        onPress={() => navigation.navigate('HikeDetails', { hike: item })}
        activeOpacity={0.85}
      >
        {/* Lewy akcent kolorowy */}
        <View style={[styles.cardAccent, { backgroundColor: s.buttonActive }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="trail-sign" size={18} color={s.buttonActive} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardTitle, { color: s.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.cardDate, { color: s.secondaryText }]}>
                {item.date}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeHike(item.id)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme === 'dark' ? '#f87171' : '#dc2626'} />
            </TouchableOpacity>
          </View>

          {/* Badges ze statystykami */}
          {hasStats && (
            <View style={styles.badges}>
              {item.distance != null && (
                <View style={[styles.badge, { backgroundColor: s.background }]}>
                  <Ionicons name="map-outline" size={12} color={s.buttonActive} />
                  <Text style={[styles.badgeText, { color: s.secondaryText }]}>
                    {` ${item.distance.toFixed(2)} km`}
                  </Text>
                </View>
              )}
              {item.duration != null && (
                <View style={[styles.badge, { backgroundColor: s.background }]}>
                  <Ionicons name="time-outline" size={12} color={s.buttonActive} />
                  <Text style={[styles.badgeText, { color: s.secondaryText }]}>
                    {` ${formatDuration(item.duration)}`}
                  </Text>
                </View>
              )}
              {item.location && (
                <View style={[styles.badge, { backgroundColor: s.background }]}>
                  <Ionicons name="location-outline" size={12} color={s.buttonActive} />
                  <Text style={[styles.badgeText, { color: s.secondaryText }]}> GPS</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [navigation, removeHike, s, theme]);

  return (
    <View style={[styles.root, { backgroundColor: s.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: s.background, borderBottomColor: s.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={s.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: s.text }]}>Moje Wędrówki</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
          <Ionicons name="settings-outline" size={22} color={s.icon} />
        </TouchableOpacity>
      </View>

      {/* Wyszukiwarka */}
      <View style={[styles.searchWrap, { backgroundColor: s.card, borderColor: s.border }]}>
        <Ionicons name="search-outline" size={18} color={s.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: s.text }]}
          placeholder={translations.searchPlaceholder}
          placeholderTextColor={s.secondaryText}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={s.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Licznik */}
      {filtered.length > 0 && (
        <Text style={[styles.countText, { color: s.secondaryText }]}>
          {`${filtered.length} wędrówk${filtered.length === 1 ? 'a' : filtered.length < 5 ? 'i' : 'i'}`}
        </Text>
      )}

      {/* Pusta lista */}
      {filtered.length === 0 && (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconCircle, { backgroundColor: s.card }]}>
            <Ionicons name="map-outline" size={48} color={s.border} />
          </View>
          <Text style={[styles.emptyTitle, { color: s.text }]}>Brak wędrówek</Text>
          <Text style={[styles.emptySubtitle, { color: s.secondaryText }]}>
            Dodaj swoją pierwszą przygodę!
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderHike}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: s.buttonActive }]}
        onPress={() => navigation.navigate('AddHike')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn:      { padding: 8, width: 44, alignItems: 'center' },
  headerTitle:    { flex: 1, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
    gap: 8,
  },
  searchInput:    { flex: 1, fontSize: 15, padding: 0 },
  countText:      { fontSize: 12, marginHorizontal: 20, marginBottom: 8, marginTop: 4 },
  listContent:    { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardAccent:     { width: 4 },
  cardBody:       { flex: 1, padding: 14 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  cardTextWrap:   { flex: 1 },
  cardTitle:      { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardDate:       { fontSize: 12 },
  deleteBtn:      { padding: 4 },
  badges:         { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText:      { fontSize: 11, fontWeight: '500' },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle:     { fontSize: 18, fontWeight: '700' },
  emptySubtitle:  { fontSize: 14 },
  fab: {
    position: 'absolute', right: 24, bottom: 32,
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});
