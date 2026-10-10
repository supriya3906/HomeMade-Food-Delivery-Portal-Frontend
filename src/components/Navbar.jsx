import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu as MenuIcon,
  X,
  LogOut,
  Settings as SettingsIcon,
  ClipboardList
} from 'lucide-react';
import { OffersBell } from './OffersBell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useT } from '../i18n/useT';

const NAV_LINKS = [
  { to: '/home', key: 'nav.home' },
  { to: '/menu', key: 'nav.menu' },
  { to: '/chefs', key: 'nav.chefs' },
  { to: '/orders', key: 'nav.orders' },
  { to: '/favorites', key: 'nav.favorites' }
];

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();

  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(location.pathname === '/menu' ? params.get('q') || '' : '');
  }, [location]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // On the menu page the search box filters live (and clearing it resets the list);
  // elsewhere it waits for Enter and then opens the menu.
  const handleQueryChange = (value) => {
    setQuery(value);
    if (location.pathname !== '/menu') return;
    const params = new URLSearchParams(location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    const qs = params.toString();
    navigate(`/menu${qs ? `?${qs}` : ''}`, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/menu?q=${encodeURIComponent(trimmed)}` : '/menu');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/signin', { replace: true });
  };

  if (!isAuthenticated) return null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/home" className="brand">
          <span className="brand-mark">
            <UtensilsCrossed size={20} />
          </span>
          <span className="brand-name">
            Ras<span>oi</span>
          </span>
        </Link>

        <nav className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <form className="nav-search" onSubmit={handleSearch} role="search">
          <Search size={16} />
          <input
            type="search"
            placeholder={t('nav.search')}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            aria-label={t('nav.searchAria')}
          />
        </form>

        <div className="nav-actions">
          {isAuthenticated && <OffersBell user={user} />}
          <Link to="/cart" className="icon-btn nav-cart" aria-label={t('nav.cartAria')}>
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </Link>

          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="icon-btn account-trigger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t('nav.accountAria')}
            >
              <User size={20} />
            </button>
            {menuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-header">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <User size={15} /> {t('nav.profile')}
                </Link>
                <Link to="/orders" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <ClipboardList size={15} /> {t('nav.orders')}
                </Link>
                <Link to="/favorites" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Heart size={15} /> {t('nav.favorites')}
                </Link>
                <Link to="/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <SettingsIcon size={15} /> {t('nav.settings')}
                </Link>
                {isAdmin && (
                  <Link to="/admin" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <SettingsIcon size={15} /> {t('nav.admin')}
                  </Link>
                )}
                <button type="button" role="menuitem" className="logout-item" onClick={handleLogout}>
                  <LogOut size={15} /> {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-btn mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t('nav.toggleAria')}
          >
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-panel">
          <form className="nav-search" onSubmit={handleSearch} role="search">
            <Search size={16} />
            <input
              type="search"
              placeholder={t('nav.searchShort')}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
          </form>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="mobile-link">
              {t(link.key)}
            </Link>
          ))}
          <Link to="/profile" className="mobile-link">{t('nav.profile')}</Link>
          <Link to="/settings" className="mobile-link">{t('nav.settings')}</Link>
          <button type="button" className="mobile-link logout-item" onClick={handleLogout}>
            <LogOut size={16} /> {t('nav.signOut')}
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
