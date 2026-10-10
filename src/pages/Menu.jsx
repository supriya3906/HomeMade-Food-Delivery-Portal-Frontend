import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORY_IDS } from '../data/categories';
import FoodCard from '../components/FoodCard';
import { useT } from '../i18n/useT';
import { api } from '../api/client';
import { trackView } from '../api/recent';
import { useCatalog } from '../context/CatalogContext';

const dietOptions = ['all', 'veg', 'vegan', 'non-veg'];
const sortOptions = ['popular', 'rating', 'price-low', 'price-high'];

// The menu list is fetched from the backend search API: GET /api/foods?q=&category=&diet=&maxPrice=&sort=
const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useT();
  const { foods: allFoods, status } = useCatalog();

  const requested = searchParams.get('category');
  const category = CATEGORY_IDS.includes(requested) ? requested : 'all';
  const query = searchParams.get('q') || '';
  const maxPrice = Number(searchParams.get('maxPrice')) || 0;
  const diet = dietOptions.includes(searchParams.get('diet')) ? searchParams.get('diet') : 'all';
  const [sort, setSort] = useState('popular');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const update = (changes, replace = false) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace });
  };

  useEffect(() => {
    if (category !== 'all') trackView('category', category);
  }, [category]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category !== 'all') params.set('category', category);
    if (diet !== 'all') params.set('diet', diet);
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    params.set('sort', sort);
    const timer = setTimeout(() => {
      api(`/foods?${params}`)
        .then((list) => { if (!cancelled) { setResults(list.map((f) => allFoods.find((x) => x.id === f.id) || f)); setError(''); } })
        .catch(() => { if (!cancelled) setError(t('menu.loadError')); });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, category, diet, maxPrice, sort, allFoods]); // eslint-disable-line react-hooks/exhaustive-deps

  const count = results?.length ?? 0;

  return (
    <div className="page-container">
      <div className="menu-head">
        <h1>{t('menu.title')}</h1>
        <form className="menu-search" onSubmit={(e) => e.preventDefault()} role="search">
          <Search size={16} />
          <input
            type="search"
            placeholder={t('menu.searchPh')}
            value={query}
            onChange={(e) => update({ q: e.target.value }, true)}
            aria-label={t('menu.searchAria')}
          />
          <button type="submit" className="btn btn-secondary btn-sm">{t('menu.search')}</button>
        </form>
      </div>

      <div className="category-row scrollable">
        {['all', ...CATEGORY_IDS].map((id) => (
          <button
            key={id}
            type="button"
            className={`category-chip ${category === id ? 'active' : ''}`}
            onClick={() => update({ category: id })}
          >
            {t(`cat.${id}`)}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          {dietOptions.map((id) => (
            <button
              key={id}
              type="button"
              className={`pill ${diet === id ? 'active' : ''}`}
              onClick={() => update({ diet: id })}
            >
              {t(`diet.${id}`)}
            </button>
          ))}
          {maxPrice > 0 && (
            <button type="button" className="pill active" onClick={() => update({ maxPrice: '' })} title={t('menu.clearPrice')}>
              {t('menu.maxPrice', { n: maxPrice })} <X size={12} />
            </button>
          )}
        </div>
        <label className="sort-select">
          <SlidersHorizontal size={15} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('menu.sortAria')}>
            {sortOptions.map((id) => (
              <option key={id} value={id}>{t(`sort.${id}`)}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {results && !error && (
        <p className="results-count">
          {t(count === 1 ? 'menu.foundOne' : 'menu.found', { n: count })}
          {query ? t('menu.foundFor', { q: query }) : ''}
        </p>
      )}

      {(results === null && !error) || status === 'loading' ? (
        <p className="muted">{t('common.loading')}</p>
      ) : results && results.length === 0 ? (
        <div className="empty-state">
          <p>{t('menu.noMatch')}</p>
          <button type="button" className="btn btn-secondary" onClick={() => setSearchParams({})}>
            {t('menu.reset')}
          </button>
        </div>
      ) : (
        <div className="food-grid">
          {(results || []).map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
