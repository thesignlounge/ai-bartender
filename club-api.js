/* THE SIGN CLUB – Google Sheets API configuration
   1) Deploy GOOGLE_APPS_SCRIPT_CLUB.gs as a Google Apps Script Web App.
   2) Paste the /exec URL below.
*/
window.THE_SIGN_CLUB_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzj5yFNySABV7lnqT0nv_Io-DOsXYFFqb1oP-Ffb69-wv33bG_G4zMMieI_utj4nS5EMw/exec',
  REQUEST_TIMEOUT_MS: 15000
};

window.TheSignClubApi = (() => {
  const cfg = window.THE_SIGN_CLUB_CONFIG || {};
  const configured = () => /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(String(cfg.API_URL || ''));

  async function call(action, payload = {}) {
    if (!configured()) throw new Error('API_NOT_CONFIGURED');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.REQUEST_TIMEOUT_MS || 15000);
    try {
      const response = await fetch(cfg.API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({action, ...payload}),
        redirect: 'follow',
        signal: controller.signal
      });
      const result = await response.json();
      if (!result.success) {
        const err = new Error(result.error || 'API_ERROR');
        err.code = result.code || 'API_ERROR';
        throw err;
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  return {configured, call};
})();
