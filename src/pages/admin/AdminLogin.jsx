import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useT } from '../../i18n/useT';

const AdminLogin = () => {
  const { adminLogin, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated && isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminLogin(form.identifier, form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark"><ShieldCheck size={26} /></span>
          <h1>Ras<span>oi</span> {t('admin.badge')}</h1>
          <p>{t('admin.loginSub')}</p>
        </div>
        {isAuthenticated && !isAdmin && (
          <div className="form-error" role="alert">
            {t('admin.notAdmin')} <button type="button" className="link-btn" onClick={logout}>{t('nav.signOut')}</button>
          </div>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={submit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">{t('auth.email')}</label>
            <div className="input-icon"><Mail size={16} />
              <input id="admin-email" type="email" required autoComplete="username" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">{t('auth.password')}</label>
            <div className="input-icon"><Lock size={16} />
              <input id="admin-password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? t('auth.wait') : t('admin.signIn')}</button>
        </form>
        <p className="auth-switch"><Link to="/signin">&larr; {t('admin.toCustomer')}</Link></p>
      </div>
    </div>
  );
};

export default AdminLogin;
