import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TITLES = {
  '/signin': 'Sign in',
  '/home': 'Home',
  '/menu': 'Menu',
  '/chefs': 'Our chefs',
  '/cart': 'Your cart',
  '/checkout': 'Checkout',
  '/orders': 'My orders',
  '/favorites': 'Favorites',
  '/profile': 'Profile',
  '/settings': 'Settings'
};

export const MainLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  useDocumentTitle(TITLES[location.pathname]);
  if (location.pathname.startsWith('/admin')) return <div className="app-shell admin-app"><main className="main-container">{children}</main></div>;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-container">{children}</main>
      <Footer />
      {isAuthenticated && <Chatbot />}
    </div>
  );
};

export default MainLayout;
