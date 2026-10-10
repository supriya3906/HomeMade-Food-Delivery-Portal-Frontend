import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { readJSON, writeJSON } from '../utils/storage';

const FavoritesContext = createContext(null);

const favKey = (email) => `hmf_favorites_${email}`;

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Keyed on the email (a stable primitive), not the `user` object identity,
  // so a profile edit elsewhere doesn't reset this state from localStorage.
  const userEmail = user?.email || null;

  useEffect(() => {
    setFavoriteIds(userEmail ? readJSON(favKey(userEmail), []) : []);
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) writeJSON(favKey(userEmail), favoriteIds);
  }, [favoriteIds, userEmail]);

  const isFavorite = useCallback((foodId) => favoriteIds.includes(foodId), [favoriteIds]);

  const toggleFavorite = useCallback((foodId) => {
    setFavoriteIds((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  }, []);

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};

export default FavoritesContext;
