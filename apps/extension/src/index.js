(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});
  const platform = SS.detectPlatform?.() || 'unknown';

  SS.ui.injectStyles();
  SS.ui.ensureBadge();

  const overlayRoot = SS.ui.createOverlay();
  const button = overlayRoot.querySelector('#scopeshield-overlay-btn');

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hide() {
    SS.ui.hideOverlay(overlayRoot);
  }

  function showAtSelection(sel) {
    const txt = SS.selection.normalizeText(sel.toString());
    if (!txt) return hide();

    const rect = SS.selection.getSelectionRect(sel);
    if (!rect) {
      SS.ui.showOverlay(
        overlayRoot,
        window.innerWidth - 180,
        window.innerHeight - 80
      );
      return;
    }

    const x = clamp(rect.right + 10, 10, window.innerWidth - 180);
    const y = clamp(rect.bottom + 10, 10, window.innerHeight - 80);
    SS.ui.showOverlay(overlayRoot, x, y);
  }

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return hide();
    showAtSelection(sel);
  });

  document.addEventListener('mousedown', (e) => {
    if (e.composedPath().includes(overlayRoot)) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (
        !sel ||
        sel.isCollapsed ||
        !SS.selection.normalizeText(sel.toString())
      )
        hide();
    }, 0);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide();
      SS.selection.clearLastHighlight();
    }
  });

  button.addEventListener('click', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const selectedText = SS.selection.normalizeText(sel.toString());
    if (!selectedText) return;

    SS.selection.clearLastHighlight();
    SS.selection.tryHighlightSelection(sel);

    const evidence = SS.buildEvidence({ sel, selectedText, platform });

    // Map to what your API expects (keep it strict)
    const payload = {
      platform: evidence.platform,
      text: evidence.text,
      evidenceAt: new Date().toISOString(), // safe fallback; you can improve later
      evidenceUrl: evidence.evidenceUrl,
    };

    chrome.runtime.sendMessage({ type: 'SS_CREATE_TICKET', payload }, (resp) => {
      if (chrome.runtime.lastError) {
        console.log(`${SS.TAG} API error`, chrome.runtime.lastError.message);
        return;
      }

      if (!resp?.ok) {
        console.log(`${SS.TAG} create failed`, resp);
        return;
      }

      console.log(`${SS.TAG} ticket created`, resp);
      // Open share url in a new tab
      window.open(resp.shareUrl, '_blank', 'noopener,noreferrer');
    });
  });

  console.log(`${SS.TAG} boot ok`, { platform, href: location.href });
})();
