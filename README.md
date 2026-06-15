# HikeTracker

Aplikacja mobilna do rejestrowania górskich wędrówek, napisana w React Native z Expo.

**Autor:** Nikita Kononov, nr indeksu: 47014  
**Przedmiot:** Wprowadzenie do Systemów Mobilnych  
**Uczelnia:** Uniwersytet Vizja (AEH), Warszawa

---

## O projekcie

Aplikacja pozwala użytkownikowi zapisywać swoje wędrówki — dodawać zdjęcia z trasy, śledzić dystans i czas w czasie rzeczywistym oraz sprawdzać aktualną pogodę w miejscu wędrówki na podstawie współrzędnych GPS. Dane są przechowywane lokalnie na urządzeniu.

---

## Użyte technologie

- React Native 0.79.6 + Expo SDK 54
- React Navigation — nawigacja między ekranami
- expo-location — geolokalizacja i śledzenie GPS
- expo-image-picker — dostęp do aparatu
- AsyncStorage — lokalne przechowywanie danych
- Open-Meteo API — dane pogodowe (nie wymaga klucza API)
- Context API — zarządzanie stanem globalnym

---

## Uruchomienie

Wymagania: Node.js v18+, aplikacja Expo Go na telefonie (SDK 54).

```bash
git clone https://github.com/Kubabas3/HikeTracker.git
cd HikeTracker
npm install
npx expo start
```

Następnie zeskanuj QR kod w aplikacji Expo Go.

---

## Struktura ekranów

```
WelcomeScreen
    └── HomeScreen
            ├── AddHikeScreen
            ├── HikeDetailsScreen
            └── SettingsScreen
```

---

## Struktura projektu

```
├── App.js
├── navigation/AppNavigator.js
├── context/
│   ├── HikeContext.js
│   └── SettingsContext.js
├── screens/
│   ├── WelcomeScreen.js
│   ├── HomeScreen.js
│   ├── AddHikeScreen.js
│   ├── HikeDetailsScreen.js
│   └── SettingsScreen.js
├── theme/
│   ├── light.js
│   └── dark.js
└── locales/
    ├── pl.json
    └── en.json
```

---

## Funkcjonalności

- Lista zapisanych wędrówek z wyszukiwarką
- Dodawanie wędrówki z nazwą, zdjęciami i lokalizacją GPS
- Aktywne śledzenie trasy — timer, dystans, prędkość, wysokość n.p.m.
- Podgląd szczegółów wędrówki z aktualną pogodą (Open-Meteo API)
- Galeria zdjęć z podglądem pełnoekranowym
- Jasny i ciemny motyw
- Interfejs w języku polskim i angielskim