import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useT } from '../i18n/useT';
import { useLocalize } from '../context/CatalogContext';
import FoodCard from './FoodCard';

// "Recently accessed": what this signed-in user last opened — dishes, chefs and menu sections —
// read from GET /api/recent (stored per user in the database).
const RecentlyAccessed = () => {
  const { t } = useT();
  const { chefName } = useLocalize();
  const [items, setItems] = useState(null);

  const load = useCallback(() => api('/recent?limit=12').then(setItems).catch(() => setItems([])), []);
  useEffect(() => { load(); }, [load]);

  if (!items || items.length === 0) return null;
  const dishes = items.filter((i) => i.type === 'food').slice(0, 4);
  const others = items.filter((i) => i.type !== 'food').slice(0, 6);

  const clear = async () => {
    await api('/recent', { method: 'DELETE' }).catch(() => {});
    setItems([]);
  };

  return (
    <section className="section" data-testid="recently-accessed">
      <div className="section-head">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Clock size={18} /> {t("home.recent")}</h2>
        <button type="button" className="section-link link-btn" onClick={clear}>
          <Trash2 size={14} /> {t('home.recentClear')}
        </button>
      </div>
      {others.length > 0 && (
        <div className="category-row">
          {others.map((i) =>
            i.type === 'chef' ? (
              <Link key={`c${i.id}`} to={`/chefs/${i.id}`} className="category-chip">
                {t('home.recentChef')}: {chefName(i.chef)}
              </Link>
            ) : (
              <Link key={`s${i.id}`} to={`/menu?category=${i.id}`} className="category-chip">
                {t(`cat.${i.id}`)}
              </Link>
            )
          )}
        </div>
      )}
      {dishes.length > 0 && (
        <div className="food-grid">
          {dishes.map((i) => <FoodCard key={i.id} food={{ ...i.food, prepTime: `${i.food.prepMinutes} min` }} />)}
        </div>
      )}
    </section>
  );
};

export default RecentlyAccessed;
