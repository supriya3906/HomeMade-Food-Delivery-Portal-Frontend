import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, XCircle, Loader2, Smartphone, CreditCard, Landmark, Lock, ShieldCheck, QrCode, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useT } from '../i18n/useT';
import { translateServerMessage } from '../i18n/serverMessages';

const pad = (n) => String(n).padStart(2, '0');
const mmss = (ms) => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const when = (iso, lang) => (iso ? new Date(iso).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');

const STEP_KEYS = ['pf.s.initiated', 'pf.s.processing', 'pf.s.verifying', 'pf.s.success', 'pf.s.confirmed'];

// Pure SVG stylized QR Code for instant offline/online rendering
const DynamicUpiQr = ({ amount, upiId = 'rasoi.foods@upi' }) => (
  <div className="upi-qr-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.8rem 0' }}>
    <div style={{
      background: '#ffffff',
      padding: '14px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '2px solid #e2e8f0',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Finder Pattern Top-Left */}
        <rect x="10" y="10" width="46" height="46" rx="6" stroke="#0f172a" strokeWidth="6" fill="#fff" />
        <rect x="22" y="22" width="22" height="22" rx="3" fill="#c1531b" />

        {/* Finder Pattern Top-Right */}
        <rect x="124" y="10" width="46" height="46" rx="6" stroke="#0f172a" strokeWidth="6" fill="#fff" />
        <rect x="136" y="22" width="22" height="22" rx="3" fill="#c1531b" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="10" y="124" width="46" height="46" rx="6" stroke="#0f172a" strokeWidth="6" fill="#fff" />
        <rect x="22" y="136" width="22" height="22" rx="3" fill="#c1531b" />

        {/* Dynamic Pattern Matrix Dots */}
        {[
          [68, 14], [80, 14], [92, 14], [104, 26], [68, 38], [80, 38], [104, 38],
          [22, 68], [34, 80], [46, 68], [68, 68], [80, 80], [92, 68], [104, 80],
          [124, 68], [140, 80], [152, 68], [164, 80],
          [22, 92], [34, 104], [46, 92], [68, 104], [80, 92], [92, 104], [104, 92],
          [124, 104], [140, 92], [152, 104], [164, 92],
          [68, 124], [80, 140], [92, 124], [104, 140], [124, 124], [140, 140], [152, 124], [164, 140],
          [68, 156], [80, 164], [104, 156], [124, 164], [140, 156], [160, 160]
        ].map(([x, y], idx) => (
          <rect key={idx} x={x} y={y} width="9" height="9" rx="2" fill="#1e293b" />
        ))}

        {/* Center UPI Badge */}
        <circle cx="90" cy="90" r="19" fill="#c1531b" />
        <text x="90" y="95" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="sans-serif">₹</text>
      </svg>
      <div style={{ marginTop: '8px', fontSize: '0.74rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <QrCode size={13} style={{ color: '#c1531b' }} /> Scan with any UPI App
      </div>
    </div>
    <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
      Accepted on Google Pay, PhonePe, Paytm, CRED & BHIM
    </div>
  </div>
);

const PaymentFlow = ({ payment, onPaid, onClose, onRetry, onChangeMethod }) => {
  const { t, language } = useT();
  const [p, setP] = useState(payment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [cardOtp, setCardOtp] = useState('749201');
  const paidRef = useRef(false);

  const pending = p.status === 'pending';
  const working = p.status === 'processing';
  const failed = p.status === 'failed' || p.status === 'cancelled';
  const remaining = Math.max(0, new Date(p.expiresAt).getTime() - now);
  const money = `₹${p.amount}`;

  // Step tracker (0..4)
  const current = p.status === 'success' ? 5 : working ? (p.phase === 'verifying' ? 2 : 1) : failed ? ((p.events || []).some((e) => e.status === 'processing') ? 1 : 0) : 0;
  const stepState = (i) => (i < current ? 'done' : i === current ? (failed ? 'fail' : 'current') : 'todo');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const sync = useCallback(async () => {
    try { setP(await api(`/payments/${payment.id}`)); } catch { /* keep showing the last known state */ }
  }, [payment.id]);

  useEffect(() => {
    if (!pending) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(sync, 3500);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [pending, sync]);

  useEffect(() => { if (pending && remaining === 0) sync(); }, [pending, remaining, sync]);

  useEffect(() => {
    if (!working) return undefined;
    const poll = setInterval(sync, 1000);
    return () => clearInterval(poll);
  }, [working, sync]);

  // Success: forward to order confirmation
  useEffect(() => {
    if (p.status !== 'success' || paidRef.current) return undefined;
    paidRef.current = true;
    const timer = setTimeout(() => onPaid(p.order), 1600);
    return () => clearTimeout(timer);
  }, [p, onPaid]);

  const confirm = async (body) => {
    setError('');
    setBusy(true);
    try {
      setP(await api(`/payments/${p.id}/confirm`, { method: 'POST', body }));
    } catch (err) {
      await wait(400);
      setError(err.message);
      await sync();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try { await api(`/payments/${p.id}/cancel`, { method: 'POST' }); } catch { /* ignore */ }
    onClose();
  };

  return (
    <div className="pay-backdrop">
      <div className="pay-sheet" role="dialog" aria-modal="true" aria-label={t('pf.dialog')} style={{ maxWidth: p.method === 'card' ? '460px' : '440px' }}>
        <header className="pay-head">
          <span className="pay-secure"><Lock size={14} /> 256-Bit SSL Encrypted Payment</span>
          <strong className="pay-amount">{money}</strong>
          {pending && !busy && (
            <button type="button" className="icon-btn" onClick={cancel} aria-label={t('pf.cancelAria')}><X size={18} /></button>
          )}
        </header>

        <ol className="pay-progress five" aria-label={t('pf.progress')}>
          {STEP_KEYS.map((key, i) => (
            <li key={key} className={`ps ${stepState(i)}`}>
              <i>{stepState(i) === 'done' ? <Check size={12} strokeWidth={3} /> : stepState(i) === 'fail' ? <X size={12} strokeWidth={3} /> : i + 1}</i>
              {t(key)}
            </li>
          ))}
        </ol>

        {/* Processing overlay */}
        {pending && busy && !working && (
          <div className="pay-body center">
            <Loader2 size={44} className="spin pay-spinner" />
            <h3>Authorizing with Gateway...</h3>
            <p className="muted">{t('pf.noBack')}</p>
          </div>
        )}

        {/* Working / Verifying state */}
        {working && (
          <div className="pay-body center" aria-live="polite">
            <Loader2 size={44} className="spin pay-spinner" />
            <h3>{p.phase === 'verifying' ? 'Verifying with Bank Switch...' : 'Processing Payment Gateway...'}</h3>
            <p className="muted">{p.phase === 'verifying' ? 'Verifying 3D-Secure authentication and settlement token.' : 'Contacting issuing bank network (Visa/Mastercard/NPCI)...'}</p>
            <p className="muted pay-safe">{t('pf.noBack')}</p>
          </div>
        )}

        {/* PENDING: CREDIT/DEBIT CARD 3D-SECURE VIEW */}
        {pending && !busy && p.method === 'card' && (
          <div className="pay-body" style={{ textAlign: 'left', padding: '1.25rem 1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} style={{ color: '#16a34a' }} />
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>Verified by {p.cardBrand || 'Card'} · 3D Secure 2.0</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>RBI Mandated Multi-Factor Authentication</span>
                </div>
              </div>
              <span className="badge-net visa" style={{ fontSize: '0.75rem', fontWeight: 800 }}>{p.cardBrand || 'CARD'}</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="muted">Merchant:</span>
                <strong>Rasoi Food Delivery Ops</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="muted">Card Number:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>•••• •••• •••• {p.cardLast4 || '8821'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Total Payable:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>{money}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Please enter the 6-digit One Time Password (OTP) sent to your registered mobile number ending in <strong>••••921</strong>:
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                maxLength={6}
                value={cardOtp}
                onChange={(e) => setCardOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="form-input otp-input"
                style={{ width: '100%', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.35em', fontWeight: 700 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.76rem' }}>
                <span className="muted">Expires in: <strong>{mmss(remaining)}</strong></span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setCardOtp('749201')}
                  style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Resend / Auto-fill OTP
                </button>
              </div>
            </div>

            {error && <div className="form-error" role="alert" style={{ marginBottom: '0.8rem' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700 }}
                onClick={() => confirm({ result: 'approve' })}
                disabled={cardOtp.length < 4}
              >
                Authorize & Pay {money}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                onClick={() => confirm({ result: 'decline' })}
              >
                Cancel Authentication
              </button>
            </div>
          </div>
        )}

        {/* PENDING: NET BANKING PORTAL VIEW */}
        {pending && !busy && p.method === 'netbanking' && (
          <div className="pay-body" style={{ textAlign: 'left', padding: '1.25rem 1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div className="pm-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <Landmark size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.92rem', display: 'block' }}>{p.bankName || 'State Bank / HDFC'} NetBanking</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct Account Debit Authorization</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="muted">Account Type:</span>
                <strong>Savings Account (•••• 3492)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="muted">Payee:</span>
                <strong>Rasoi Food Delivery</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Amount:</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>{money}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Click below to simulate approving the secure internet banking debit request. Your account will be debited <strong>{money}</strong>.
            </p>

            {error && <div className="form-error" role="alert" style={{ marginBottom: '0.8rem' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700 }}
                onClick={() => confirm({ result: 'approve' })}
              >
                Confirm & Debit Account ({money})
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                onClick={() => confirm({ result: 'decline' })}
              >
                Decline & Return to Rasoi
              </button>
            </div>
          </div>
        )}

        {/* PENDING: UPI (DYNAMIC QR OR APP VPA) VIEW */}
        {pending && !busy && p.method === 'upi' && (
          <div className="pay-body">
            {p.flow === 'upi_qr' ? (
              <>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem' }}>Scan QR to Pay</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}>Open any UPI app on your phone and scan below</p>
                <DynamicUpiQr amount={p.amount} upiId={p.vpa} />
                <p className="pay-timer">{t('pf.expires')} <strong>{mmss(remaining)}</strong></p>
                {error && <div className="form-error" role="alert">{error}</div>}
                <div className="test-box" style={{ marginTop: '0.8rem' }}>
                  <p style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                    <strong>UPI Sandbox Simulation</strong>: Click below to simulate scanning and paying via UPI app.
                  </p>
                  <div className="test-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => confirm({ result: 'approve' })}>
                      Simulate App Paid ({money})
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => confirm({ result: 'decline' })}>
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pay-icon"><Smartphone size={30} /></div>
                <h3>{t('pf.approveIn', { app: p.upiAppLabel || 'UPI App' })}</h3>
                <p className="muted">
                  {t('pf.sentRequest', { app: p.upiAppLabel || 'UPI App' })} <strong>{money}</strong> → <strong>{p.vpa}</strong>. Open your UPI app and accept the collect prompt.
                </p>
                <p className="pay-timer">{t('pf.expires')} <strong>{mmss(remaining)}</strong></p>
                {error && <div className="form-error" role="alert">{error}</div>}
                <div className="test-box" style={{ marginTop: '0.8rem' }}>
                  <p style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                    <strong>UPI App Simulator</strong>: Test payment approval directly
                  </p>
                  <div className="test-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => confirm({ result: 'approve' })}>
                      {t('pf.payInApp', { amount: money })}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => confirm({ result: 'decline' })}>
                      {t('pf.decline')}
                    </button>
                  </div>
                </div>
              </>
            )}
            <button type="button" className="link-btn pay-cancel" onClick={cancel}>{t('pf.cancel')}</button>
          </div>
        )}

        {/* SUCCESS VIEW */}
        {p.status === 'success' && (
          <div className="pay-body center">
            <div className="result-badge success"><Check size={38} strokeWidth={3} /></div>
            <h3>Payment Received Successfully!</h3>
            <p className="pay-big">{money}</p>
            <dl className="pay-receipt" style={{ width: '100%', textAlign: 'left', background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
              <div><dt>{t('pf.txn')}</dt><dd style={{ fontFamily: 'monospace' }}>{p.transactionId}</dd></div>
              <div><dt>{t('pf.orderId')}</dt><dd>{p.order ? `#${p.order.id}` : 'Confirmed'}</dd></div>
              <div><dt>{t('pf.method')}</dt><dd style={{ textTransform: 'capitalize' }}>{p.method} · {p.cardBrand ? `${p.cardBrand} (•••• ${p.cardLast4})` : p.upiAppLabel || p.bankName || 'Online'}</dd></div>
              <div><dt>{t('pf.time')}</dt><dd>{when(p.paidAt, language)}</dd></div>
            </dl>
            <p className="pay-timer" style={{ marginTop: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <Loader2 size={15} className="spin" /> Confirming kitchen order & assigning delivery...
            </p>
          </div>
        )}

        {/* FAILED VIEW */}
        {failed && (
          <div className="pay-body center">
            <div className="result-badge fail"><XCircle size={40} /></div>
            <h3>{p.status === 'cancelled' ? t('pf.cancelled') : t('pf.failed')}</h3>
            <p className="muted">{p.reason ? translateServerMessage(p.reason, language) : t('pf.genericFail')}</p>
            <p className="muted pay-safe">{t('pf.refundNote')}</p>
            <div className="pay-result-actions">
              <button type="button" className="btn btn-primary btn-block" onClick={onRetry}>{t('pf.retry')}</button>
              <button type="button" className="btn btn-secondary btn-block" onClick={onChangeMethod}>{t('pf.another')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentFlow;
