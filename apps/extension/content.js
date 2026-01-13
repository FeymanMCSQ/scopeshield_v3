(() => {
  const TAG = '[ScopeShield]';
  const PLATFORM = detectPlatform();

  console.log(`${TAG} loaded`, { platform: PLATFORM, href: location.href });

  injectStyles();

  let lastHighlight = null;

  // Capture on mouseup (selection made)
  document.addEventListener('mouseup', () => {
    // Defer: some apps adjust selection on mouseup
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      const selectedText = normalizeText(sel.toString());
      if (!selectedText) return;

      // Try to highlight selection (best effort)
      clearLastHighlight();
      lastHighlight = tryHighlightSelection(sel);

      // Build evidence object
      const evidence = buildEvidence({ sel, selectedText, platform: PLATFORM });

      // Win condition: log correct evidence object
      console.log(`${TAG} EVIDENCE`, evidence);
    }, 0);
  });

  // Optional: also capture with Ctrl+Shift+S (more deliberate)
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const selectedText = normalizeText(sel.toString());
    if (!selectedText) return;

    clearLastHighlight();
    lastHighlight = tryHighlightSelection(sel);

    const evidence = buildEvidence({ sel, selectedText, platform: PLATFORM });
    console.log(`${TAG} EVIDENCE (hotkey)`, evidence);
  });

  function detectPlatform() {
    const h = location.hostname;
    if (h === 'web.whatsapp.com') return 'whatsapp';
    if (h.endsWith('.slack.com')) return 'slack';
    return 'unknown';
  }

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
    `;
    document.documentElement.appendChild(style);
  }

  function normalizeText(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function clearLastHighlight() {
    if (!lastHighlight) return;
    try {
      // unwrap highlight span
      const span = lastHighlight;
      if (span && span.parentNode) {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize?.();
      }
    } catch (_) {}
    lastHighlight = null;
  }

  function tryHighlightSelection(sel) {
    try {
      if (!sel.rangeCount) return null;
      const range = sel.getRangeAt(0);

      // Avoid highlighting across multiple block containers (can throw)
      const span = document.createElement('span');
      span.className = 'scopeshield-highlight';
      range.surroundContents(span);
      return span;
    } catch (e) {
      // If surround fails (common), do nothing; selection highlight is enough visually anyway.
      return null;
    }
  }

  function buildEvidence({ sel, selectedText, platform }) {
    // Default evidence object (always valid)
    const base = {
      platform,
      text: selectedText,
      evidenceAt: new Date().toISOString(), // fallback if we can't parse message time
      evidenceUrl: location.href,
      // Optional enrichments:
      messageAuthor: null,
      messageAt: null, // message timestamp if extracted
      messagePermalink: null,
      channelOrThread: null,
      raw: {},
    };

    // Find an anchor node to walk upward
    const anchorNode =
      sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel.anchorNode;

    const el = anchorNode && anchorNode.closest ? anchorNode : document.body;

    if (platform === 'whatsapp') return enrichWhatsApp(base, el);
    if (platform === 'slack') return enrichSlack(base, el);
    return base;
  }

  // -----------------------------
  // WhatsApp Web enrichment
  // -----------------------------
  function enrichWhatsApp(base, startEl) {
    // WhatsApp message containers often carry data-pre-plain-text like:
    // "[12:34 PM, 1/2/2026] Name: message"
    const msgEl =
      startEl.closest?.('[data-pre-plain-text]') ||
      startEl.closest?.("div[role='row']") ||
      startEl.closest?.('div.message-in, div.message-out') ||
      null;

    if (!msgEl) return base;

    const pre = msgEl.getAttribute('data-pre-plain-text') || '';
    const parsed = parseWhatsAppPrePlain(pre);

    const out = { ...base };
    out.raw.whatsapp = { dataPrePlainText: pre };

    if (parsed.messageAt) {
      out.messageAt = parsed.messageAt;
      out.evidenceAt = parsed.messageAt; // prefer message time
    }
    if (parsed.author) out.messageAuthor = parsed.author;

    // Try to locate chat title (contact/group name)
    const chatTitle =
      document.querySelector("header span[dir='auto']")?.textContent?.trim() ||
      null;

    out.channelOrThread = chatTitle;
    return out;
  }

  // Best-effort parse for WhatsApp's data-pre-plain-text
  function parseWhatsAppPrePlain(s) {
    // Example: "[12:34 PM, 1/2/2026] John Doe: "
    const res = { author: null, messageAt: null };

    const m = s.match(/^\[(.+?)\]\s*(.*?):\s*$/);
    if (!m) return res;

    const whenRaw = m[1];
    const author = m[2]?.trim() || null;
    res.author = author;

    // We can't reliably parse locale-specific date formats without the user locale,
    // so we keep it as a string ISO-ish fallback:
    // Store as "whenRaw" rather than risking wrong Date parsing.
    res.messageAt = whenRaw; // keep as string
    return res;
  }

  // -----------------------------
  // Slack enrichment
  // -----------------------------
  function enrichSlack(base, startEl) {
    // Slack messages commonly live under elements with data-qa="message_container"
    // or a11y roles. We search upward and then look for timestamp/permalink.
    const msgEl =
      startEl.closest?.('[data-qa="message_container"]') ||
      startEl.closest?.('[data-qa="virtual-list-item"]') ||
      startEl.closest?.('ts-message') ||
      null;

    if (!msgEl) return base;

    const out = { ...base };

    // Author (best-effort)
    const author =
      msgEl
        .querySelector('[data-qa="message_sender_name"]')
        ?.textContent?.trim() ||
      msgEl.querySelector('.c-message__sender')?.textContent?.trim() ||
      null;

    if (author) out.messageAuthor = author;

    // Timestamp/permalink (best-effort)
    // Many Slack DOMs have a timestamp link with href containing "/archives/"
    const tsLink =
      msgEl.querySelector('a.c-timestamp') ||
      msgEl.querySelector('a[href*="/archives/"]') ||
      null;

    if (tsLink) {
      const href = tsLink.getAttribute('href');
      if (href) {
        // Slack often uses relative links
        out.messagePermalink = href.startsWith('http')
          ? href
          : `${location.origin}${href}`;
      }
      const tsText = tsLink.textContent?.trim();
      if (tsText) out.messageAt = tsText;
    }

    // Channel name (best-effort)
    const channel =
      document.querySelector('[data-qa="channel_name"]')?.textContent?.trim() ||
      document
        .querySelector('h1[aria-label*="Channel"]')
        ?.textContent?.trim() ||
      null;

    out.channelOrThread = channel;
    out.raw.slack = {
      hasMessageContainer: true,
      hasTimestampLink: !!tsLink,
    };

    // evidenceAt: prefer messageAt if it looks like an ISO timestamp (rare in UI text),
    // otherwise keep base evidenceAt which is "now".
    return out;
  }
})();
