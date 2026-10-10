// Dates and times in the language chosen in Settings.
const locale = (language) => (language === 'ta' ? 'ta-IN' : 'en-IN');
export const formatDate = (iso, language, withYear = true) =>
  new Date(iso).toLocaleString(locale(language), { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), hour: '2-digit', minute: '2-digit' });
export const formatClock = (iso, language) =>
  new Date(iso).toLocaleTimeString(locale(language), { hour: 'numeric', minute: '2-digit' });
