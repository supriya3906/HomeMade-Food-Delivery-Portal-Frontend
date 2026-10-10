import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Smartphone, Banknote, CreditCard, Landmark, Info, MapPin,
  Check, ShieldCheck, QrCode, Award, Sparkles, ChevronRight, Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { DELIVERY_FEE, TAX_PERCENT, UPI_APPS, POPULAR_BANKS, MEMBERSHIP_TIERS } from '../config/pricing';
import FoodImage from '../components/FoodImage';
import CheckoutStepper from '../components/CheckoutStepper';
import PaymentFlow from '../components/PaymentFlow';
import { useT } from '../i18n/useT';

const money = (n) => `₹${n}`;
const addressComplete = (u) => !!(u?.name && u?.phone && u?.address && u?.city && u?.pincode);

const ALL_OTHER_BANKS = [
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'IndusInd Bank',
  'IDFC FIRST Bank', 'Federal Bank', 'Yes Bank', 'Central Bank of India',
  'Indian Bank', 'Bank of India', 'RBL Bank', 'AU Small Finance Bank'
];

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { placeOrder, addOrder } = useOrders();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const { getFoodById, getChefById } = useCatalog();
  const { foodName, chefName } = useLocalize();
  const finished = useRef(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    notes: ''
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [step, setStep] = useState(() => (addressComplete(user) ? 2 : 1));

  // Automatically resolved customer membership loyalty tier (no manual selection)
  const userTier = user?.tier || {
    id: 'silver',
    tier: 'silver',
    name: 'Silver Card',
    badge: '🥈 Silver',
    discountPct: 5,
    color: '#94a3b8',
    freeDelivery: false
  };
  const membershipTier = userTier.id || userTier.tier || 'silver';

  // Payment method: 'upi' | 'card' | 'netbanking' | 'cod'
  const [method, setMethod] = useState('upi');

  // UPI sub-options: 'apps' | 'qr' | 'id'
  const [upiMode, setUpiMode] = useState('apps');
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net banking details
  const [bankId, setBankId] = useState('hdfc');
  const [otherBank, setOtherBank] = useState('');

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState(null);

  const selectedTier = MEMBERSHIP_TIERS.find((t) => t.id === membershipTier) || MEMBERSHIP_TIERS[1];
  const app = UPI_APPS.find((a) => a.id === upiApp) || UPI_APPS[0];

  // Card brand detection
  const cleanCardNum = cardNumber.replace(/\s+/g, '');
  const cardBrand = cleanCardNum.startsWith('4')
    ? 'Visa'
    : /^5[1-5]/.test(cleanCardNum)
    ? 'Mastercard'
    : cleanCardNum.startsWith('6') || cleanCardNum.startsWith('508')
    ? 'RuPay'
    : 'Card';

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    setCardExpiry(val);
  };

  // The server calculates the exact cart quote with the active membership award card discount
  useEffect(() => {
    if (items.length === 0) return undefined;
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError('');
    api('/pricing/quote', {
      method: 'POST',
      body: {
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        paymentMethod: method,
        membershipTier
      }
    })
      .then((q) => !cancelled && setQuote(q))
      .catch((err) => !cancelled && setQuoteError(err.message))
      .finally(() => !cancelled && setQuoteLoading(false));
    return () => { cancelled = true; };
  }, [items, method, membershipTier]);

  if (items.length === 0) {
    return finished.current ? null : <Navigate to="/cart" replace />;
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const continueToPayment = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      return setError(t('checkout.errFill'));
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) return setError(t('checkout.errPhone'));
    if (!/^\d{4,6}$/.test(form.pincode.trim())) return setError(t('checkout.errPin'));
    if (saveAddress) {
      updateProfile({ phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim(), pincode: form.pincode.trim() }).catch(() => {});
    }
    setStep(2);
  };

  const addressBody = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    pincode: form.pincode.trim(),
    notes: form.notes.trim()
  });

  const validatePayment = () => {
    if (method === 'upi') {
      if (upiMode === 'id' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        return 'Please enter a valid UPI ID (e.g. yourname@oksbi, phone@ybl)';
      }
    } else if (method === 'card') {
      if (cleanCardNum.length < 15) return 'Please enter a valid 16-digit card number.';
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return 'Please enter a valid expiry date (MM/YY).';
      if (cardCvv.length < 3) return 'Please enter a valid 3-digit CVV.';
      if (!cardName.trim()) return 'Please enter the name on your card.';
    }
    return '';
  };

  const finishOrder = (order) => {
    finished.current = true;
    addOrder(order);
    clearCart();
    navigate(`/order-confirmation/${order.id}`, { replace: true });
  };

  const startPayment = async () => {
    setError('');
    const problem = validatePayment();
    if (problem) return setError(problem);
    if (!quote) return;

    setSubmitting(true);
    try {
      if (method === 'cod') {
        const order = await placeOrder({
          items,
          address: addressBody(),
          paymentMethod: 'cod',
          membershipTier
        });
        finishOrder(order);
        return;
      }

      const body = {
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        address: addressBody(),
        paymentMethod: method,
        membershipTier
      };

      if (method === 'upi') {
        body.upi = {
          app: upiApp,
          vpa: upiMode === 'qr' ? 'scan.qr@rasoi' : upiMode === 'id' ? upiId.trim() : `${user?.email?.split('@')[0] || 'user'}${app.suffix}`,
          qr: upiMode === 'qr'
        };
      } else if (method === 'card') {
        body.card = {
          number: cardNumber,
          name: cardName.trim(),
          expiry: cardExpiry,
          cvv: cardCvv,
          brand: cardBrand
        };
      } else if (method === 'netbanking') {
        const selectedBankObj = POPULAR_BANKS.find((b) => b.id === bankId);
        body.netbanking = {
          bank: bankId === 'other' ? (otherBank || 'Other Bank') : (selectedBankObj?.name || 'HDFC Bank')
        };
      }

      const session = await api('/payments', { method: 'POST', body });
      setPayment(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => (step === 2 ? setStep(1) : navigate('/cart'));

  return (
    <div className="page-container checkout-page">
      {payment && (
        <PaymentFlow
          key={payment.id}
          payment={payment}
          onPaid={finishOrder}
          onClose={() => setPayment(null)}
          onRetry={() => { setPayment(null); startPayment(); }}
          onChangeMethod={() => setPayment(null)}
        />
      )}

      <div className="checkout-head">
        <button type="button" className="round-btn" onClick={goBack} aria-label={step === 2 ? t('checkout.backAddr') : t('checkout.backCart')}>
          <ArrowLeft size={18} />
        </button>
        <h1>{t('checkout.title')}</h1>
      </div>
      <CheckoutStepper step={step} />

      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 1 && (
            <form className="form-section" onSubmit={continueToPayment} noValidate>
              <h2>{t('checkout.address')}</h2>
              <p className="muted section-sub">{t('checkout.whereDeliver')}</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">{t('checkout.recipient')}</label>
                  <input id="name" className="form-input" value={form.name} onChange={update('name')} placeholder={t('checkout.fullName')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">{t('checkout.phone')}</label>
                  <input id="phone" className="form-input" inputMode="tel" value={form.phone} onChange={update('phone')} placeholder={t('checkout.phonePh')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="address">{t('checkout.addr')}</label>
                <input id="address" className="form-input" value={form.address} onChange={update('address')} placeholder={t('checkout.addrPh')} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="city">{t('checkout.city')}</label>
                  <input id="city" className="form-input" value={form.city} onChange={update('city')} placeholder={t('checkout.cityPh')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pincode">{t('checkout.pin')}</label>
                  <input id="pincode" className="form-input" inputMode="numeric" value={form.pincode} onChange={update('pincode')} placeholder={t('checkout.pinPh')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="notes">{t('checkout.notes')}</label>
                <input id="notes" className="form-input" value={form.notes} onChange={update('notes')} placeholder={t('checkout.notesPh')} />
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                {t('checkout.saveAddr')}
              </label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" className="btn btn-primary btn-lg btn-block">{t('checkout.continue')}</button>
            </form>
          )}

          {step === 2 && (
            <section className="form-section pay-section">
              <div className="deliver-strip">
                <MapPin size={16} />
                <p>
                  <strong>{form.name}</strong> · {form.phone}<br />
                  <span className="muted">{form.address}, {form.city} - {form.pincode}</span>
                </p>
                <button type="button" className="link-btn" onClick={() => setStep(1)}>{t('checkout.change')}</button>
              </div>

              <h2>Payment Options</h2>
              <p className="muted section-sub">Choose your preferred online or offline payment method</p>

              {/* 1. UPI */}
              <div className={`pm ${method === 'upi' ? 'active' : ''}`}>
                <label className="pm-head">
                  <input type="radio" name="pm" checked={method === 'upi'} onChange={() => setMethod('upi')} />
                  <span className="pm-icon"><Smartphone size={20} /></span>
                  <span className="pm-title">
                    <strong>UPI <em className="tag-rec">Fastest & Free</em></strong>
                    <small>Google Pay, PhonePe, Paytm, CRED or Scan QR</small>
                  </span>
                  <span className="pm-badges">
                    <span className="badge-app gpay">GPay</span>
                    <span className="badge-app phonepe">PhonePe</span>
                    <span className="badge-app paytm">Paytm</span>
                  </span>
                </label>
                {method === 'upi' && (
                  <div className="pm-body">
                    {/* UPI Subtabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${upiMode === 'apps' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setUpiMode('apps')}
                      >
                        UPI Apps
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${upiMode === 'qr' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setUpiMode('qr')}
                      >
                        <QrCode size={14} style={{ marginRight: '4px' }} /> Dynamic QR Code
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${upiMode === 'id' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setUpiMode('id')}
                      >
                        Enter UPI ID
                      </button>
                    </div>

                    {upiMode === 'apps' && (
                      <div>
                        <p className="form-label" style={{ marginBottom: '8px' }}>Select your UPI App:</p>
                        <div className="upi-apps" role="radiogroup">
                          {UPI_APPS.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              className={`upi-app ${upiApp === a.id ? 'active' : ''}`}
                              onClick={() => setUpiApp(a.id)}
                            >
                              <span className="upi-app-logo" style={{ background: a.color }}>{a.label[0]}</span>
                              <span className="upi-app-name">{a.label}</span>
                              {upiApp === a.id && <Check size={14} className="upi-app-tick" />}
                            </button>
                          ))}
                        </div>
                        <p className="payment-note" style={{ marginTop: '10px' }}>
                          <Info size={13} /> You will be prompted to approve the payment in {app.label}.
                        </p>
                      </div>
                    )}

                    {upiMode === 'qr' && (
                      <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <QrCode size={24} style={{ color: 'var(--color-primary)' }} />
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>Scan Dynamic QR Code on next screen</strong>
                            <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
                              Compatible with any UPI app on your mobile device. Instant payment verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {upiMode === 'id' && (
                      <div>
                        <label className="form-label" htmlFor="upi">Enter Virtual Payment Address (VPA):</label>
                        <input
                          id="upi"
                          className="form-input"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. mobile@oksbi or username@ybl"
                          autoComplete="off"
                          autoCapitalize="none"
                        />
                        <p className="payment-note" style={{ marginTop: '8px' }}>
                          <Info size={13} /> A collect request of {quote ? money(quote.total) : 'amount'} will be sent to this VPA.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. CREDIT / DEBIT CARDS */}
              <div className={`pm ${method === 'card' ? 'active' : ''}`}>
                <label className="pm-head">
                  <input type="radio" name="pm" checked={method === 'card'} onChange={() => setMethod('card')} />
                  <span className="pm-icon"><CreditCard size={20} /></span>
                  <span className="pm-title">
                    <strong>Credit / Debit Card</strong>
                    <small>Visa, Mastercard, RuPay, Maestro with 3D Secure</small>
                  </span>
                  <span className="pm-badges">
                    <span className="badge-net visa">VISA</span>
                    <span className="badge-net mc"><i></i><i></i></span>
                    <span className="badge-net rupay">RuPay</span>
                  </span>
                </label>
                {method === 'card' && (
                  <div className="pm-body">
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label className="form-label" htmlFor="cardNum">Card Number</label>
                        {cleanCardNum.length >= 4 && (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {cardBrand}
                          </span>
                        )}
                      </div>
                      <input
                        id="cardNum"
                        className="form-input"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 8920 1204 8821"
                        maxLength={19}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardExp">Valid Thru</label>
                        <input
                          id="cardExp"
                          className="form-input"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          inputMode="numeric"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardCvv">CVV / CVC</label>
                        <input
                          id="cardCvv"
                          className="form-input"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="cardName">Cardholder Name</label>
                      <input
                        id="cardName"
                        className="form-input"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name as printed on card"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <Lock size={12} style={{ color: '#16a34a' }} />
                      <span>Secured with RBI 3D-Secure 2.0 & 256-Bit SSL Bank Encryption</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. NET BANKING */}
              <div className={`pm ${method === 'netbanking' ? 'active' : ''}`}>
                <label className="pm-head">
                  <input type="radio" name="pm" checked={method === 'netbanking'} onChange={() => setMethod('netbanking')} />
                  <span className="pm-icon"><Landmark size={20} /></span>
                  <span className="pm-title">
                    <strong>Net Banking</strong>
                    <small>All Indian Banks Supported</small>
                  </span>
                  <span className="pm-badges">
                    <span className="badge-plain">HDFC / SBI / ICICI</span>
                  </span>
                </label>
                {method === 'netbanking' && (
                  <div className="pm-body">
                    <p className="form-label" style={{ marginBottom: '8px' }}>Popular Banks:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className={`btn btn-sm ${bankId === b.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.5rem 0.3rem' }}
                          onClick={() => setBankId(b.id)}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginBottom: '4px' }}>
                      <label className="form-label" htmlFor="otherBankSelect">Other Banks:</label>
                      <select
                        id="otherBankSelect"
                        className="form-input"
                        value={bankId === 'other' ? otherBank : ''}
                        onChange={(e) => {
                          setBankId('other');
                          setOtherBank(e.target.value);
                        }}
                      >
                        <option value="">Select another bank...</option>
                        {ALL_OTHER_BANKS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. CASH ON DELIVERY */}
              <div className={`pm ${method === 'cod' ? 'active' : ''}`}>
                <label className="pm-head">
                  <input type="radio" name="pm" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                  <span className="pm-icon"><Banknote size={20} /></span>
                  <span className="pm-title">
                    <strong>{t('checkout.cod')}</strong>
                    <small>{t('checkout.codNote', { n: DELIVERY_FEE })}</small>
                  </span>
                  <span className="pm-badges">
                    <span className="badge-plain">
                      {selectedTier.freeDelivery ? 'Free with VIP Card' : `+${money(DELIVERY_FEE)} delivery`}
                    </span>
                  </span>
                </label>
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}
              {quoteError && !error && <div className="form-error" role="alert">{quoteError}</div>}

              <button
                type="button"
                className="btn btn-primary btn-lg btn-block pay-btn"
                onClick={startPayment}
                disabled={submitting || quoteLoading || !quote}
              >
                {submitting ? 'Please wait...' : quote ? (method === 'cod' ? `Place Cash Order · ${money(quote.total)}` : `Pay ${money(quote.total)} Online`) : 'Calculating Total...'}
              </button>
            </section>
          )}
        </div>

        {/* ORDER SUMMARY SIDEBAR WITH AWARD CARD DISCOUNTS */}
        <aside className="cart-summary order-summary">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('checkout.summary')}</h2>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{items.length} items</span>
          </div>

          {/* Membership Award Card Box */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} style={{ color: selectedTier.color }} />
                <strong style={{ fontSize: '0.88rem', letterSpacing: '0.02em' }}>{selectedTier.name}</strong>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '99px',
                background: selectedTier.color,
                color: selectedTier.id === 'silver' ? '#0f172a' : '#ffffff'
              }}>
                {selectedTier.discountPct}% DISCOUNT
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.74rem', color: '#94a3b8' }}>
              Customer Award Cardholder: <strong>{user?.name || 'Valued Member'}</strong>
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#cbd5e1',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span>{selectedTier.badge || '🥈 Silver Member'}</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>Auto-Applied at Checkout</span>
            </div>
          </div>

          <div className="os-items">
            {items.map((item) => {
              const chef = getChefById(item.chefId);
              return (
                <div className="os-item" key={item.id}>
                  <FoodImage food={getFoodById(item.id) || item} variant="thumb" />
                  <div className="os-item-info">
                    <strong>{foodName(getFoodById(item.id)) || item.name}</strong>
                    <small>× {item.quantity}{chef ? ` · ${t('cart.by', { chef: chefName(chef) })}` : ''}</small>
                  </div>
                  <span className="os-item-price">{money(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <hr />

          <div className="summary-row">
            <span>{t('checkout.subtotal')}</span>
            <span>{money(subtotal)}</span>
          </div>

          {/* Food Offer Savings */}
          {quote && quote.foodOfferSavings > 0 && (
            <div className="summary-row" style={{ color: '#ea580c', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} /> Food Offer Savings
              </span>
              <span>- {money(quote.foodOfferSavings)}</span>
            </div>
          )}

          {/* Membership Discount Row */}
          {quote && quote.membershipDiscount > 0 && (
            <div className="summary-row" style={{ color: '#16a34a', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} /> {selectedTier.name} ({selectedTier.discountPct}%)
              </span>
              <span>- {money(quote.membershipDiscount)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>
              {t('checkout.deliveryFee')}
              {method === 'cod' ? ` ${t('checkout.codTag')}` : ''}
            </span>
            <span>
              {!quote ? '…' : quote.deliveryFee === 0 ? (
                <strong style={{ color: '#16a34a', fontSize: '0.8rem' }}>FREE</strong>
              ) : (
                money(quote.deliveryFee)
              )}
            </span>
          </div>

          <div className="summary-row">
            <span>GST & Service Tax ({TAX_PERCENT}%)</span>
            <span>{quote ? money(quote.tax) : '…'}</span>
          </div>

          <div className="summary-row total">
            <span>{t('checkout.total')}</span>
            <span>{quote ? money(quote.total) : '…'}</span>
          </div>

          {quote && quote.discount > 0 && (
            <div style={{
              marginTop: '10px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              🎉 You save {money(quote.discount)} with your membership award card!
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
