import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Trash2, LogOut, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useOrders } from '../context/OrdersContext';
import AppearanceSection from '../components/settings/AppearanceSection';
import ForgotPasswordForm from '../components/settings/ForgotPasswordForm';
import { useT } from '../i18n/useT';

const Settings = () => {
  const { notifications, toggleNotifications } = useSettings();
  const { user, logout, changePassword, deleteAccount } = useAuth();
  const { clearFavorites } = useFavorites();
  const { clearOrders } = useOrders();
  const navigate = useNavigate();
  const { t } = useT();
  const [showForgot, setShowForgot] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' });

  const [confirmClear, setConfirmClear] = useState(null); // 'favorites' | 'orders' | 'account' | null

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage({ type: '', text: '' });
    if (pwForm.next !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: t('set.pwMismatch') });
      return;
    }
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwMessage({ type: 'success', text: t('set.pwUpdated') });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message });
    }
  };

  const [clearError, setClearError] = useState('');

  const handleClear = async (what) => {
    setClearError('');
    try {
      if (what === 'favorites') clearFavorites();
      if (what === 'orders') await clearOrders();
      if (what === 'account') {
        await deleteAccount();
        navigate('/signin', { replace: true });
      }
    } catch (err) {
      setClearError(err.message);
    }
    setConfirmClear(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="page-container narrow">
      <h1>{t('set.title')}</h1>

      <AppearanceSection />
      <section className="settings-section">
        <h2>{t('set.notifications')}</h2>
        <div className="settings-row">
          <div>
            <p className="settings-row-title"><Bell size={14} /> {t('set.orderUpdates')}</p>
            <p className="muted">{t('set.orderUpdatesDesc')}</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={notifications} onChange={toggleNotifications} />
            <span className="switch-track"><span className="switch-thumb" /></span>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2><Lock size={16} /> {t('set.changePw')}</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="cur-pw">{t('set.currentPw')}</label>
            <input
              id="cur-pw"
              type="password"
              className="form-input"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="new-pw">{t('set.newPw')}</label>
              <input
                id="new-pw"
                type="password"
                className="form-input"
                value={pwForm.next}
                onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pw">{t('set.confirmPw')}</label>
              <input
                id="confirm-pw"
                type="password"
                className="form-input"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
          </div>
          {pwMessage.text && (
            <p className={pwMessage.type === 'error' ? 'form-error' : 'save-confirm'}>
              {pwMessage.type === 'success' && <CheckCircle2 size={15} />} {pwMessage.text}
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{t('set.updatePw')}</button>
            <button type="button" className="link-btn" onClick={() => setShowForgot((v) => !v)}>
              {showForgot ? t('set.hideReset') : t('set.forgotLink')}
            </button>
          </div>
        </form>
        {showForgot && (
          <div className="forgot-inline">
            <h3><KeyRound size={15} /> {t('set.resetCode')}</h3>
            <ForgotPasswordForm defaultEmail={user?.email || ''} onDone={() => setShowForgot(false)} />
          </div>
        )}
      </section>

      <section className="settings-section danger">
        <h2><AlertTriangle size={16} /> {t('set.data')}</h2>

        <div className="settings-row">
          <div>
            <p className="settings-row-title">{t('set.clearFav')}</p>
            <p className="muted">{t('set.clearFavDesc')}</p>
          </div>
          {confirmClear === 'favorites' ? (
            <div className="confirm-inline">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleClear('favorites')}>{t('set.confirm')}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(null)}>{t('set.cancel')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear('favorites')}>
              <Trash2 size={14} /> {t('set.clear')}
            </button>
          )}
        </div>

        {clearError && <div className="form-error" role="alert">{clearError}</div>}
        <div className="settings-row">
          <div>
            <p className="settings-row-title">{t('set.clearOrders')}</p>
            <p className="muted">{t('set.clearOrdersDesc')}</p>
          </div>
          {confirmClear === 'orders' ? (
            <div className="confirm-inline">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleClear('orders')}>{t('set.confirm')}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(null)}>{t('set.cancel')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear('orders')}>
              <Trash2 size={14} /> {t('set.clear')}
            </button>
          )}
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row-title">{t('set.deleteAcc')}</p>
            <p className="muted">{t('set.deleteAccDesc')}</p>
          </div>
          {confirmClear === 'account' ? (
            <div className="confirm-inline">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleClear('account')}>{t('set.confirmDelete')}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(null)}>{t('set.cancel')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmClear('account')}>
              <Trash2 size={14} /> {t('set.deleteAcc')}
            </button>
          )}
        </div>
      </section>

      <button type="button" className="btn btn-secondary btn-block" onClick={handleLogout}>
        <LogOut size={16} /> {t('set.signOut')}
      </button>
    </div>
  );
};

export default Settings;
