import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, User, Phone, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SettingsDrawer from '../components/settings/SettingsDrawer';
import ForgotPasswordForm from '../components/settings/ForgotPasswordForm';
import GoogleButton from '../components/GoogleButton';
import { useT } from '../i18n/useT';

const SignIn = () => {
  const { login, register, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ identifier: '', name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState('auth'); // 'auth' | 'forgot'

  const from = location.state?.from?.pathname || '/home';

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : from} replace />;
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        navigate(from, { replace: true });
      } else {
        const loggedUser = await login(form.identifier, form.password);
        if (loggedUser?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || t('auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button type="button" className="auth-settings-btn" onClick={() => setSettingsOpen(true)} aria-label={t('auth.openSettings')}>
        <SettingsIcon size={18} /> <span>{t('nav.settings')}</span>
      </button>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <UtensilsCrossed size={26} />
          </span>
          <h1>
            Ras<span>oi</span>
          </h1>
          <p>{view === 'forgot' ? t('auth.subReset') : mode === 'signup' ? t('auth.subSignup') : t('auth.subSignin')}</p>
        </div>

        {view === 'forgot' ? (
          <>
            <ForgotPasswordForm
              defaultEmail={/^\S+@\S+\.\S+$/.test(form.identifier.trim()) ? form.identifier.trim() : ''}
              onDone={() => setView('auth')}
            />
            <p className="auth-switch">
              <button type="button" onClick={() => setView('auth')}>&larr; {t('auth.back')}</button>
            </p>
          </>
        ) : (
          <>
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="name">{t('auth.fullName')}</label>
                <div className="input-icon">
                  <User size={16} />
                  <input id="name" type="text" required placeholder={t('auth.namePh')} value={form.name} onChange={update('name')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('auth.email')}</label>
                <div className="input-icon">
                  <Mail size={16} />
                  <input id="email" type="email" required placeholder="you@example.com" value={form.email} onChange={update('email')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">{t('auth.phoneOpt')}</label>
                <div className="input-icon">
                  <Phone size={16} />
                  <input id="phone" type="tel" placeholder={t('auth.phonePh')} value={form.phone} onChange={update('phone')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                <div className="input-icon">
                  <Lock size={16} />
                  <input id="password" type="password" required placeholder={t('auth.pwNewPh')} value={form.password} onChange={update('password')} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="identifier">{t('auth.email')}</label>
                <div className="input-icon">
                  <Mail size={16} />
                  <input id="identifier" type="text" required placeholder="you@example.com" value={form.identifier} onChange={update('identifier')} />
                </div>
              </div>
              <div className="form-group">
                <div className="label-row">
                  <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                  <button type="button" className="link-btn" onClick={() => { setError(''); setView('forgot'); }}>{t('auth.forgot')}</button>
                </div>
                <div className="input-icon">
                  <Lock size={16} />
                  <input id="password" type="password" required placeholder={t('auth.pwPh')} value={form.password} onChange={update('password')} />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? t('auth.wait') : mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-divider"><span>{t('auth.or')}</span></div>
        <GoogleButton onSuccess={() => navigate(from, { replace: true })} onError={setError} />

        <p className="auth-switch">
          {mode === 'signup' ? (
            <>{t('auth.already')}{' '}
              <button type="button" onClick={() => { setMode('signin'); setError(''); }}>{t('auth.signIn')}</button>
            </>
          ) : (
            <>{t('auth.newHere')}{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(''); }}>{t('auth.createAnAccount')}</button>
            </>
          )}
        </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignIn;
