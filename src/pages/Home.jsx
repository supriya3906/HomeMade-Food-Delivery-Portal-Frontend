import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_IDS } from '../data/categories';
import { useT } from '../i18n/useT';
import FoodCard from '../components/FoodCard';
import ChefCard from '../components/ChefCard';
import RecentlyAccessed from '../components/RecentlyAccessed';
import { useCatalog } from '../context/CatalogContext';
import { api } from '../api/client';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const { foods, chefs } = useCatalog();
  const [picks, setPicks] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Personalised picks come from the backend (GET /api/assistant/recommendations).
  useEffect(() => {
    api('/assistant/recommendations?limit=4').then(setPicks).catch(() => setPicks(null));
  }, []);
  const recommended = useMemo(
    () => (picks?.items || []).map((p) => foods.find((f) => f.id === p.id)).filter(Boolean),
    [picks, foods]
  );

  const popular = useMemo(
    () => [...foods].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 8),
    [foods]
  );

  const TIFFIN_REGEX = /\b(idli|dosa|dosai|vada|vadai|pongal|upma|paniyaram|pesarattu|thepla|chilla|poha|appam|poori|puri|bhel|sev|chaat|samosa|pakora|bhaji|pav|roll|uttapam|tikki)\b/i;

  const featuredMenu = useMemo(() => {
    if (activeTab === 'all') return foods.slice(0, 8);
    if (activeTab === 'lunch') {
      return foods.filter((f) => (f.category === 'lunch' || (f.meals || []).includes('lunch')) && !TIFFIN_REGEX.test(f.name)).slice(0, 8);
    }
    return foods.filter((f) => f.category === activeTab).slice(0, 8);
  }, [foods, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.elements.heroSearch.value.trim();
    navigate(value ? `/menu?q=${encodeURIComponent(value)}` : '/menu');
  };

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.hi', { name: user?.name?.split(' ')[0] || t('home.there') })}</h1>
          <p className="hero-sub">{t('home.sub')}</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={18} />
            <input name="heroSearch" type="search" placeholder={t('home.searchPh')} />
            <button type="submit" className="btn btn-primary">{t('common.search')}</button>
          </form>
        </div>
      </section>

      <RecentlyAccessed />

      {recommended.length > 0 && (
        <section className="section" data-testid="recommended">
          <div className="section-head">
            <h2>{picks?.personalised ? t('home.forYou') : t('home.topRated')}</h2>
            {picks?.personalised && <span className="muted">{t('home.forYouWhy')}</span>}
          </div>
          <div className="food-grid">
            {recommended.map((food) => <FoodCard key={food.id} food={food} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{t('home.browseCat')}</h2>
        </div>
        <div className="category-row">
          {CATEGORY_IDS.map((id) => (
            <Link key={id} to={`/menu?category=${id}`} className="category-chip">
              {t(`cat.${id}`)}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Handcrafted Food Menu with Live Tabs */}
      <section className="section home-menu-showcase">
        <div className="section-head">
          <div>
            <h2>Classy Homemade Food Menu</h2>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>Authentic dishes slow-cooked by passionate neighborhood home chefs</p>
          </div>
          <Link to={`/menu${activeTab !== 'all' ? `?category=${activeTab}` : ''}`} className="section-link">
            {t('home.viewMenu')} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="menu-tabs-row" style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
          {[
            { id: 'all', label: t('cat.all') || 'All Dishes', icon: '🍽️' },
            { id: 'lunch', label: t('cat.lunch') || 'Lunch', icon: '🍛' },
            { id: 'dinner', label: t('cat.dinner') || 'Dinner', icon: '🍲' },
            { id: 'breakfast', label: t('cat.breakfast') || 'Breakfast', icon: '🥞' },
            { id: 'snacks', label: t('cat.snacks') || 'Snacks', icon: '🥟' },
            { id: 'sweets', label: t('cat.sweets') || 'Sweets', icon: '🍮' },
            { id: 'drinks', label: t('cat.drinks') || 'Drinks', icon: '🥤' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pill ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', padding: '0.45rem 1rem' }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="food-grid">
          {featuredMenu.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t('home.popular')}</h2>
          <Link to="/menu" className="section-link">
            {t('home.viewMenu')} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="food-grid">
          {popular.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t('home.meetChefs')}</h2>
          <Link to="/chefs" className="section-link">
            {t('home.allChefs')} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="chef-grid compact">
          {chefs.slice(0, 3).map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
