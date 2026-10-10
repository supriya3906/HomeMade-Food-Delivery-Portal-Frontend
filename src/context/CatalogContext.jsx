import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import { photos } from '../data/photos';
import { useSettings } from './SettingsContext';

// The menu and the chefs come from the backend (MySQL) — nothing is hard-coded in the browser.
const CatalogContext = createContext(null);

const CATEGORY_DEFAULT_PHOTOS = {
  breakfast: '/images/foods/f12.jpg',
  lunch: '/images/foods/f01.jpg',
  dinner: '/images/foods/f04.jpg',
  snacks: '/images/foods/f15.jpg',
  sweets: '/images/foods/f17.jpg',
  drinks: '/images/foods/f21.jpg',
  brunch: '/images/foods/f02.jpg'
};

const prep = (f) => ({
  ...f,
  prepTime: `${f.prepMinutes || 20} min`,
  photo: f.photo || photos[f.id]?.src || (f.id === 'f75' ? '/images/foods/f75.png' : `/images/foods/${f.id}.jpg`) || CATEGORY_DEFAULT_PHOTOS[f.category] || '/images/foods/f01.jpg',
  photoCredit: f.photoCredit || photos[f.id] || null
});

const prepChef = (c) => ({
  ...c,
  color: c.color || '#C1531B',
  orders: c.orders != null ? Number(c.orders) : 0,
  photo: `/images/chefs/${c.id}.jpg`
});

export const CatalogProvider = ({ children }) => {
  const [foods, setFoods] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([api('/foods'), api('/chefs')]);
      setFoods(f.map(prep));
      setChefs(c.map(prepChef));
      setStatus('ready');
      setError('');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const value = useMemo(() => ({
    foods, chefs, status, error, reload: load,
    getFoodById: (id) => foods.find((f) => String(f.id) === String(id)),
    getChefById: (id) => chefs.find((c) => String(c.id) === String(id))
  }), [foods, chefs, status, error, load]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
};

// Shows dish / chef text in the language chosen in Settings (English or Tamil).
export const useLocalize = () => {
  const { language } = useSettings();
  const ta = language === 'ta';
  return useMemo(() => ({
    language,
    foodName: (f) => (f ? (ta && f.nameTa) || f.name : ''),
    foodDesc: (f) => (f ? (ta && f.descriptionTa) || f.description : ''),
    chefName: (c) => (c ? (ta && c.nameTa) || c.name : ''),
    chefCity: (c) => (c ? (ta && c.cityTa) || c.city : ''),
    chefCuisine: (c) => (c ? (ta && c.cuisineTa) || c.cuisine : ''),
    chefSpeciality: (c) => (c ? (ta && c.specialityTa) || c.speciality : ''),
    chefBio: (c) => (c ? (ta && c.bioTa) || c.bio : '')
  }), [language, ta]);
};
