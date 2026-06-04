// context/SettingsContext.js
import React, { createContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import pl from '../locales/pl.json';
import lightStyles from '../theme/light';
import darkStyles from '../theme/dark';

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [locale, setLocale] = useState('pl');

  useEffect(() => {
    AsyncStorage.getItem('theme').then(t => t && setTheme(t));
    AsyncStorage.getItem('locale').then(l => l && setLocale(l));
  }, []);

  const changeTheme = async newTheme => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const changeLocale = async newLocale => {
    setLocale(newLocale);
    await AsyncStorage.setItem('locale', newLocale);
  };

  const translations = useMemo(
    () => (locale === 'pl' ? pl : en),
    [locale]
  );
  const themeStyles = useMemo(
    () => (theme === 'light' ? lightStyles : darkStyles),
    [theme]
  );

  return (
    <SettingsContext.Provider
      value={{ theme, locale, changeTheme, changeLocale, translations, themeStyles }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
