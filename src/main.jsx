import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { OrdersProvider } from './context/OrdersContext';
import { CatalogProvider } from './context/CatalogContext';
import PreferencesSync from './components/PreferencesSync';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <PreferencesSync />
          <CatalogProvider>
            <CartProvider>
              <FavoritesProvider>
                <OrdersProvider>
                  <App />
                </OrdersProvider>
              </FavoritesProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
