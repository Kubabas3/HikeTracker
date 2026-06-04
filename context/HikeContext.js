// context/HikeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HikeContext = createContext();

export const HikeProvider = ({ children }) => {
  const [hikes, setHikes] = useState([]);

  useEffect(() => {
    const loadHikes = async () => {
      try {
        const data = await AsyncStorage.getItem('hikes');
        if (data !== null) setHikes(JSON.parse(data));
      } catch (error) {
        console.error('Error loading hikes:', error);
      }
    };
    loadHikes();
  }, []);

  // photos: string[] — tablica URI zdjęć
  const addHike = async (title, photos, location, extra = {}) => {
    const trimmed = title.trim();
    if (trimmed.length < 3) throw new Error('Nazwa nie może być krótsza niż 3 znaki.');

    const newHike = {
      id: Date.now().toString(),
      title: trimmed,
      photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
      location: location || null,
      date: new Date().toLocaleString(),
      duration: extra.duration || null,
      distance: extra.distance || null,
      trackPoints: extra.trackPoints || [],
    };

    const updated = [...hikes, newHike];
    setHikes(updated);
    try {
      await AsyncStorage.setItem('hikes', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving hike:', error);
    }
  };

  const removeHike = async id => {
    const updated = hikes.filter(h => h.id !== id);
    setHikes(updated);
    try {
      await AsyncStorage.setItem('hikes', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing hike:', error);
    }
  };

  return (
    <HikeContext.Provider value={{ hikes, addHike, removeHike }}>
      {children}
    </HikeContext.Provider>
  );
};

export const useHikeContext = () => useContext(HikeContext);
