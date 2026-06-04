// screens/WelcomeScreen.js
import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsContext } from '../context/SettingsContext';

export default function WelcomeScreen({ navigation }) {
  const { themeStyles: s, translations } = useContext(SettingsContext);
  const { height } = useWindowDimensions();

  return (
    <View style={[styles.container, { backgroundColor: s.background }]}>
      {/* Ikona górska */}
      <View style={[styles.iconCircle, { backgroundColor: s.card }]}>
        <Ionicons name="trail-sign-outline" size={80} color={s.buttonActive} />
      </View>

      <Text style={[styles.title, { color: s.buttonActive }]}>HikeTracker</Text>
      <Text style={[styles.subtitle, { color: s.secondaryText }]}>
        {translations.appSubtitle}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: s.buttonActive }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
        <Text style={styles.buttonText}>{translations.welcome}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
