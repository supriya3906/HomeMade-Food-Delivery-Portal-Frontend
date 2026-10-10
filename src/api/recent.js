import { api, getToken } from './client';

// "Recently accessed": tell the server which dish / chef / menu section the signed-in user just opened.
// Fire-and-forget: a failure here must never break the page.
export const trackView = (type, id) => {
  if (!getToken() || !id) return;
  api('/recent', { method: 'POST', body: { type, id } }).catch(() => {});
};
