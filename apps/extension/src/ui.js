(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});

  function injectStyles() {
    if (document.getElementById('scopeshield-style')) return;
    const style = document.createElement('style');
    style.id = 'scopeshield-style';
    style.textContent = `
      .scopeshield-highlight {
        background: rgba(255, 230, 0, 0.55) !important;
        border-radius: 4px;
        padding: 0.05em 0.15em;
      }
      #scopeshield-overlay-btn {
        border: 0;
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 12px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: rgba(0,0,0,0.82);
        color: white;
        box-shadow: 0 6px 22px rgba(0,0,0,0.25);
        cursor: pointer;
      }
      #scopeshield-badge {
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 2147483647;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: rgba(0,0,0,0.75);
        color: white;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      }
      #scopeshield-overlay-root {
        position: fixed;
        left: 0; top: 0;
        z-index: 2147483647;
        display: none;
        pointer-events: none;
      }
      #scopeshield-overlay-root > * {
        pointer-events: auto;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function ensureBadge() {
    if (document.getElementById('scopeshield-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'scopeshield-badge';
    badge.textContent = 'ScopeShield ON';
    document.documentElement.appendChild(badge);
  }

  function createOverlay() {
    const existing = document.getElementById('scopeshield-overlay-root');
    if (existing) return existing;

    const root = document.createElement('div');
    root.id = 'scopeshield-overlay-root';

    const btn = document.createElement('button');
    btn.id = 'scopeshield-overlay-btn';
    btn.type = 'button';
    btn.textContent = '🛡 Shield This Request';

    root.appendChild(btn);
    document.documentElement.appendChild(root);
    return root;
  }

  function showOverlay(root, x, y) {
    root.style.display = 'block';
    root.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function hideOverlay(root) {
    root.style.display = 'none';
  }

  SS.ui = {
    injectStyles,
    ensureBadge,
    createOverlay,
    showOverlay,
    hideOverlay,
  };
})();
