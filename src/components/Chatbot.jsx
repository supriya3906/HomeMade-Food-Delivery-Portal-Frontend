import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { useT } from '../i18n/useT';
import FoodImage from './FoodImage';
import { api } from '../api/client';
import { readJSON, writeJSON } from '../utils/storage';

const SPEAK_KEY = 'hmf_chat_speak';
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
// Speech recognition and the spoken reply always use the website language (Settings -> Language).
export const VOICE_LOCALE = { en: 'en-IN', ta: 'ta-IN' };

// Says the reply out loud with a voice for the current language. Returns false if none is installed.
const speak = (text, lang) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === VOICE_LOCALE[lang].toLowerCase())
    || voices.find((v) => v.lang?.toLowerCase().startsWith(lang)) || null;
  if (lang === 'ta' && !voice) return false; // never read Tamil with an English voice
  const clean = text.replace(/₹\s*(\d+)/g, lang === 'ta' ? '$1 ரூபாய்' : '$1 rupees').replace(/[★🍛🍽️😊]/g, '');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = VOICE_LOCALE[lang];
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
};

const DishRow = ({ food, onNavigate }) => {
  const { getQuantity, addItem } = useCart();
  const { foodName } = useLocalize();
  const { t } = useT();
  const qty = getQuantity(food.id);
  return (
    <div className="chat-dish" data-testid="chat-dish">
      <FoodImage food={food} variant="thumb" />
      <div className="chat-dish-info">
        <Link to={`/food/${food.id}`} onClick={onNavigate}>{foodName(food)}</Link>
        <span className="muted">₹{food.price} · {Number(food.rating).toFixed(1)}★</span>
        <Link to={`/food/${food.id}`} className="chat-details" onClick={onNavigate}>{t('chat.details')}</Link>
      </div>
      <button type="button" className={`chat-add ${qty ? 'added' : ''}`} onClick={() => addItem(food)} aria-label={t('chat.addDish', { name: foodName(food) })}>
        {qty ? <><Check size={13} /> {qty}</> : <><Plus size={13} /> {t('chat.add')}</>}
      </button>
    </div>
  );
};

// Chat history lives in sessionStorage (per signed-in user) so it survives page changes and reloads
// in the same tab. Only dish ids are stored; names and prices are looked up again from the menu.
const HISTORY_KEY = (userId) => `hmf_chat_${userId}`;
const loadHistory = (userId) => {
  try {
    const rows = JSON.parse(sessionStorage.getItem(HISTORY_KEY(userId)) || 'null');
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch { return null; }
};

const QUICK = ['chat.q1', 'chat.q2', 'chat.q3', 'chat.q4', 'chat.q5'];

const Chatbot = () => {
  const { language, setLanguage } = useSettings();
  const { user } = useAuth();
  const { t } = useT();
  const { items } = useCart();
  const { foods } = useCatalog();

  const [open, setOpen] = useState(false);
  // Bot messages keep BOTH languages ({ texts: { en, ta } }) so switching the website language
  // re-words every earlier reply instantly. The welcome message is rendered from i18n.
  const [messages, setMessages] = useState(() => loadHistory(user?.id) || [{ role: 'bot', welcome: true, dishes: [], nav: [] }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [speakOn, setSpeakOn] = useState(() => readJSON(SPEAK_KEY, false));
  const recRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const langRef = useRef(language);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const slim = messages.map((m) => ({ ...m, dishes: (m.dishes || []).map((d) => (typeof d === 'string' ? d : d.id)) }));
      sessionStorage.setItem(HISTORY_KEY(user.id), JSON.stringify(slim.slice(-40)));
    } catch { /* storage unavailable */ }
  }, [messages, user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, open, language]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => () => { recRef.current?.abort?.(); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => { if (!open) window.speechSynthesis?.cancel(); }, [open]);

  // Language changed: stop listening/speaking in the old language right away. The next
  // microphone press and the next spoken reply use the new language.
  useEffect(() => {
    langRef.current = language;
    recRef.current?.abort?.();
    recRef.current = null;
    setListening(false);
    window.speechSynthesis?.cancel();
    setNotice('');
  }, [language]);

  const textOf = (m) => (m.welcome ? t('chat.welcome') : m.texts ? m.texts[language] || m.texts.en : m.text);

  const send = useCallback(async (raw, { voice = false } = {}) => {
    const text = raw.trim();
    if (!text || busy) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setNotice('');
    setBusy(true);
    const lang = langRef.current;
    try {
      const res = await api('/assistant/chat', {
        method: 'POST',
        body: { text, hour: new Date().getHours(), cart: items.map(({ id, quantity }) => ({ id, quantity })) }
      });
      const dishes = res.dishes.map((d) => foods.find((f) => f.id === d.id) || d);
      setMessages((prev) => [...prev, { role: 'bot', texts: res.texts, dishes: dishes.map((d) => d.id), nav: res.nav }]);
      if (speakOn || voice) {
        if (!speak(res.texts[lang] || res.texts.en, lang) && lang === 'ta') setNotice(t('chat.noVoice'));
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', error: true, dishes: [], nav: [] }]);
    } finally {
      setBusy(false);
    }
  }, [items, foods, speakOn, busy, t]);

  const toggleMic = () => {
    if (!SR) { setNotice(t('chat.noMic')); return; }
    if (listening) { recRef.current?.stop(); return; }
    window.speechSynthesis?.cancel();
    const rec = new SR();
    rec.lang = VOICE_LOCALE[language];
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onstart = () => { setListening(true); setNotice(''); };
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk; else interim += chunk;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setNotice(t('chat.micDenied'));
      else if (e.error === 'no-speech') setNotice(t('chat.noSpeech'));
    };
    rec.onend = () => {
      if (recRef.current !== rec) return; // aborted because the language changed
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) send(finalText, { voice: true });
    };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); recRef.current = null; }
  };

  const toggleSpeak = () => {
    setSpeakOn((on) => {
      writeJSON(SPEAK_KEY, !on);
      if (on) window.speechSynthesis?.cancel();
      return !on;
    });
  };

  const onSubmit = (e) => { e.preventDefault(); send(input); };

  return (
    <>
      {open && (
        <section className="chat-window" role="dialog" aria-label={t('chat.title')} data-lang={language}>
          <header className="chat-head">
            <div className="chat-head-title">
              <strong>{t('chat.title')}</strong>
              <span>{t('chat.online')}</span>
            </div>
            <div className="chat-head-actions">
              <div className="chat-lang" role="radiogroup" aria-label={t('chat.langAria')} data-testid="chat-lang">
                {['en', 'ta'].map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={language === l} className={language === l ? 'active' : ''} onClick={() => setLanguage(l)}>
                    {l === 'en' ? 'EN' : 'த'}
                  </button>
                ))}
              </div>
              <span className="chat-voice-lang" data-testid="voice-lang" data-locale={VOICE_LOCALE[language]}>
                {t(language === 'ta' ? 'chat.voiceTa' : 'chat.voiceEn')}
              </span>
              <button type="button" className="chat-icon" onClick={toggleSpeak} title={speakOn ? t('chat.speakOn') : t('chat.speakOff')} aria-label={speakOn ? t('chat.speakOn') : t('chat.speakOff')} aria-pressed={speakOn}>
                {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button type="button" className="chat-icon" onClick={() => setOpen(false)} aria-label={t('chat.close')}><X size={16} /></button>
            </div>
          </header>

          <div className="chat-body" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-bubble">{m.error ? t('chat.error') : textOf(m)}</div>
                {m.dishes?.length > 0 && (
                  <div className="chat-dishes">
                    {m.dishes.map((d) => { const f = typeof d === 'string' ? foods.find((x) => x.id === d) : d; return f ? <DishRow key={f.id} food={f} onNavigate={() => setOpen(false)} /> : null; })}
                  </div>
                )}
                {m.nav?.length > 0 && (
                  <div className="chat-nav">
                    {m.nav.map((n) => (
                      <Link key={n.to} to={n.to} className="chat-chip" onClick={() => setOpen(false)}>
                        {n.label[language] || n.label.en}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="chat-msg bot"><div className="chat-bubble muted">…</div></div>}
            <div ref={endRef} />
          </div>

          {notice && <p className="chat-notice" role="status">{notice}</p>}

          <div className="chat-nav suggestions" aria-label={t('chat.quick')}>
            {QUICK.map((key) => (
              <button key={key} type="button" className="chat-chip" onClick={() => send(t(key))} disabled={busy}>{t(key)}</button>
            ))}
          </div>

          <form className="chat-input" onSubmit={onSubmit}>
            <button type="button" className={`chat-mic ${listening ? 'on' : ''}`} onClick={toggleMic} aria-label={listening ? t('chat.stopListening') : t('chat.mic')} aria-pressed={listening} title={SR ? t('chat.mic') : t('chat.noMic')}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? t('chat.listening') : t('chat.placeholder')}
              aria-label={t('chat.placeholder')}
              autoComplete="off"
            />
            <button type="submit" className="chat-send" aria-label={t('chat.send')} disabled={!input.trim() || busy}><Send size={16} /></button>
          </form>
        </section>
      )}

      <button type="button" className={`chat-fab ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={open ? t('chat.close') : t('chat.open')} aria-expanded={open}>
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
};

export default Chatbot;
