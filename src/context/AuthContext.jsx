import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session from the saved token.
  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setInitializing(false);
      return undefined;
    }
    api('/auth/me')
      .then((data) => !cancelled && setUser(data.user))
      .catch((err) => {
        // Only drop the token if the server rejected it, not if it was unreachable.
        if (err.status === 401) setToken(null);
      })
      .finally(() => !cancelled && setInitializing(false));
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { identifier, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const data = await api('/auth/register', { method: 'POST', body: form });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // "Continue with Google": the access token Google's own account chooser returned; the server verifies it with Google.
  const googleLogin = useCallback(async (accessToken) => {
    const data = await api('/auth/google', { method: 'POST', body: { accessToken } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Administrator sign-in (separate endpoint; customer accounts are refused).
  const adminLogin = useCallback(async (identifier, password) => {
    const data = await api('/auth/admin-login', { method: 'POST', body: { identifier, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const data = await api('/auth/profile', { method: 'PATCH', body: updates });
    setUser(data.user);
    return data.user;
  }, []);

  const changePassword = useCallback(
    (currentPassword, newPassword) =>
      api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    []
  );

  const deleteAccount = useCallback(async () => {
    const email = user?.email;
    await api('/auth/account', { method: 'DELETE' });
    if (email) {
      try {
        localStorage.removeItem(`hmf_cart_${email}`);
        localStorage.removeItem(`hmf_favorites_${email}`);
      } catch { /* ignore */ }
    }
    setToken(null);
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, initializing, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, register, googleLogin, adminLogin, logout, updateProfile, changePassword, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
