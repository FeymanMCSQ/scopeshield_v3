(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});
  SS.TAG = '[ScopeShield]';

  SS.detectPlatform = function detectPlatform() {
    const h = location.hostname;
    if (h === 'web.whatsapp.com') return 'whatsapp';
    if (h.endsWith('.slack.com')) return 'slack';
    return 'unknown';
  };
})();
