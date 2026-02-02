(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});

  function normalizeText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function getSelectionRect(sel) {
    try {
      if (!sel || !sel.rangeCount) return null;
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect) return null;
      if (rect.width === 0 && rect.height === 0) return null;
      return rect;
    } catch {
      return null;
    }
  }

  let lastHighlight = null;

  function clearLastHighlight() {
    if (!lastHighlight) return;
    try {
      const span = lastHighlight;
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize?.();
    } catch {}
    lastHighlight = null;
  }

  function tryHighlightSelection(sel) {
    try {
      if (!sel || !sel.rangeCount) return null;
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'scopeshield-highlight';
      range.surroundContents(span);
      lastHighlight = span;
      return span;
    } catch {
      return null;
    }
  }

  SS.selection = {
    normalizeText,
    getSelectionRect,
    clearLastHighlight,
    tryHighlightSelection,
  };
})();
