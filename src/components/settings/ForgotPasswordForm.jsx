import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, Info } from 'lucide-react';
import { api } from '../../api/client';
import { useT } from '../../i18n/useT';

// Forgot-password flow: email -> 6-digit code -> new password.
// Works signed in or signed out. With no email service connected, the backend
// hands the code back in development so the flow can be tried end to end.
const ForgotPasswordForm = ({ defaultEmail = '', onDone }) => {
  const { t } = useT();
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      if (res.demo && !res.devCode) {
        setError(t('fp.noAccount')); // only said in demo mode
        return;
      }
      setDevCode(res.devCode || '');
      setCooldown(res.resendIn || 30);
      setCode('');
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError(t('fp.errCode'));
    if (password.length < 6) return setError(t('fp.errLen'));
    if (password !== confirm) return setError(t('fp.errMatch'));
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { email, code, newPassword: password } });
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="forgot-done">
        <CheckCircle2 size={36} />
        <h3>{t('fp.updated')}</h3>
        <p className="muted">{t('fp.updatedText')}</p>
        {onDone && <button type="button" className="btn btn-primary" onClick={onDone}>{t('fp.back')}</button>}
      </div>
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={requestCode} noValidate>
        <p className="muted forgot-intro">{t('fp.intro')}</p>
        <div className="form-group">
          <label className="form-label" htmlFor="fp-email">{t('fp.email')}</label>
          <div className="input-icon">
            <Mail size={16} />
            <input id="fp-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !email.trim()}>
          {busy ? t('fp.sending') : t('fp.send')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitReset} noValidate>
      <p className="muted forgot-intro">{t('fp.sentTo')} <strong>{email}</strong>. {t('fp.valid')}</p>
      {devCode && (
        <div className="info-note">
          <Info size={15} />
          <span>{t('fp.demo')} <strong className="info-code">{devCode}</strong></span>
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="fp-code">{t('fp.code')}</label>
        <div className="input-icon">
          <KeyRound size={16} />
          <input id="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="fp-new">{t('fp.newPw')}</label>
        <div className="input-icon">
          <Lock size={16} />
          <input id="fp-new" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder={t('fp.newPwPh')} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t('fp.hide') : t('fp.show')}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="fp-confirm">{t('fp.confirm')}</label>
        <div className="input-icon">
          <Lock size={16} />
          <input id="fp-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder={t('fp.confirmPh')} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? t('fp.updating') : t('fp.reset')}
      </button>
      <div className="forgot-links">
        <button type="button" className="link-btn" onClick={requestCode} disabled={cooldown > 0 || busy}>
          {cooldown > 0 ? t('fp.resendIn', { n: cooldown }) : t('fp.resend')}
        </button>
        <button type="button" className="link-btn" onClick={() => { setStep('email'); setError(''); }}>{t('fp.otherEmail')}</button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
