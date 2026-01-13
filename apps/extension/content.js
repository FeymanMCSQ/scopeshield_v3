(() => {
  const TAG = '[ScopeShield]';
  console.log(`${TAG} content script loaded on`, location.href);

  // Visible proof without UI complexity
  const badgeId = 'scopeshield-badge';
  if (document.getElementById(badgeId)) return;

  const badge = document.createElement('div');
  badge.id = badgeId;
  badge.textContent = 'ScopeShield ON';
  badge.style.position = 'fixed';
  badge.style.bottom = '16px';
  badge.style.right = '16px';
  badge.style.zIndex = '2147483647';
  badge.style.padding = '8px 10px';
  badge.style.borderRadius = '10px';
  badge.style.fontSize = '12px';
  badge.style.fontFamily =
    'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  badge.style.background = 'rgba(0,0,0,0.75)';
  badge.style.color = 'white';
  badge.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';

  document.documentElement.appendChild(badge);
})();
