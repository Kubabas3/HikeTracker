// screens/SettingsScreen.js
import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SettingsContext } from '../context/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const { theme, changeTheme, locale, changeLocale, translations, themeStyles: s } =
    useContext(SettingsContext);

  return (
    <View style={[styles.container, { backgroundColor: s.background }]}>
      <Text style={[styles.title, { color: s.text }]}>{translations.settings}</Text>

      {/* Motyw */}
      <Text style={[styles.label, { color: s.secondaryText }]}>{translations.themeLabel}</Text>
      <View style={styles.switchRow}>
        {['light', 'dark'].map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.themeButton,
              { backgroundColor: s.card },
              theme === t && { backgroundColor: s.buttonActive },
            ]}
            onPress={() => changeTheme(t)}
          >
            <Text style={[
              styles.themeText, { color: s.text },
              theme === t && { color: '#fff' },
            ]}>
              {translations[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Język */}
      <Text style={[styles.label, { color: s.secondaryText, marginTop: 24 }]}>
        {translations.langLabel}
      </Text>
      <View style={[styles.pickerWrapper, { borderColor: s.border, backgroundColor: s.card }]}>
        <Picker
          selectedValue={locale}
          onValueChange={changeLocale}
          style={[styles.picker, { color: s.text }]}
          dropdownIconColor={s.text}
        >
          <Picker.Item label="Polski" value="pl" />
          <Picker.Item label="English" value="en" />
        </Picker>
      </View>

      {/* Powrót */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: s.buttonActive }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>{translations.back}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, padding: 20 },
  title: {
    fontSize: 22, fontWeight: 'bold',
    textAlign: 'center', marginVertical: 20,
  },
  label:        { fontSize: 15, marginBottom: 10 },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  themeButton: {
    flex: 1, paddingVertical: 12,
    borderRadius: 10, alignItems: 'center',
  },
  themeText:    { fontSize: 15, fontWeight: '500' },
  pickerWrapper: {
    borderWidth: 1, borderRadius: 10,
    overflow: 'hidden', marginBottom: 16,
  },
  picker: {
    height: 50, width: '100%',
    marginVertical: Platform.OS === 'android' ? 0 : -4,
  },
  backButton: {
    marginTop: 'auto',
    padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 30,
  },
  backText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
