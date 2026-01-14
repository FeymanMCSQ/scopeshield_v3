(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});

  let shadow = null;

  function ensureShadow() {
    if (shadow) return shadow;
    let host = document.getElementById('scopeshield-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'scopeshield-host';
      host.style.cssText =
        'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 2147483647;';
      document.documentElement.appendChild(host);
    }
    if (!host.shadowRoot) {
      shadow = host.attachShadow({ mode: 'open' });
    } else {
      shadow = host.shadowRoot;
    }
    return shadow;
  }

  function injectStyles() {
    const s = ensureShadow();
    if (s.querySelector('#scopeshield-style')) return;
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
        pointer-events: auto;
      }
      #scopeshield-badge {
        position: fixed;
        bottom: 16px;
        right: 16px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: rgba(0,0,0,0.75);
        color: white;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        pointer-events: auto;
      }
      #scopeshield-overlay-root {
        position: fixed;
        left: 0; top: 0;
        display: none;
        pointer-events: none;
      }
    `;
    s.appendChild(style);
  }

  function ensureBadge() {
    const s = ensureShadow();
    if (s.getElementById('scopeshield-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'scopeshield-badge';
    badge.textContent = 'ScopeShield ON';
    s.appendChild(badge);
  }

  function createOverlay() {
    const s = ensureShadow();
    const existing = s.getElementById('scopeshield-overlay-root');
    if (existing) return existing;

    const root = document.createElement('div');
    root.id = 'scopeshield-overlay-root';

    const btn = document.createElement('button');
    btn.id = 'scopeshield-overlay-btn';
    btn.type = 'button';
    btn.textContent = '🛡 Shield This Request';

    root.appendChild(btn);
    s.appendChild(root);
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
