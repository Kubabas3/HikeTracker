// components/StatItem.js
// Wielokrotnie używany komponent — wyświetla pojedynczą statystykę (ikona + etykieta + wartość)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatItem({ icon, label, value, s }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={s.buttonActive} />
      <Text style={[styles.statLabel, { color: s.secondaryText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: s.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statItem:  { width: '45%', alignItems: 'center', gap: 4, paddingVertical: 6 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 15, fontWeight: '600' },
});
