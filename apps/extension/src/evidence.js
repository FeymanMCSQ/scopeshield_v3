(() => {
  const SS = (globalThis.ScopeShield = globalThis.ScopeShield || {});

  SS.buildEvidence = function buildEvidence({ sel, selectedText, platform }) {
    const base = {
      platform,
      text: selectedText,
      evidenceAt: new Date().toISOString(),
      evidenceUrl: location.href,
      messageAuthor: null,
      messageAt: null,
      messagePermalink: null,
      channelOrThread: null,
      raw: {},
    };

    const anchor =
      sel?.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : sel?.anchorNode;

    const startEl = anchor && anchor.closest ? anchor : document.body;

    if (platform === 'whatsapp') return enrichWhatsApp(base, startEl);
    if (platform === 'slack') return enrichSlack(base, startEl);
    return base;
  };

  function enrichWhatsApp(base, startEl) {
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
    if (parsed.messageAt) out.messageAt = parsed.messageAt;
    if (parsed.author) out.messageAuthor = parsed.author;

    out.channelOrThread =
      document.querySelector("header span[dir='auto']")?.textContent?.trim() ||
      null;

    return out;
  }

  function parseWhatsAppPrePlain(s) {
    const res = { author: null, messageAt: null };
    const m = s.match(/^\[(.+?)\]\s*(.*?):\s*$/);
    if (!m) return res;
    res.messageAt = m[1];
    res.author = m[2]?.trim() || null;
    return res;
  }

  function enrichSlack(base, startEl) {
    const msgEl =
      startEl.closest?.('[data-qa="message_container"]') ||
      startEl.closest?.('[data-qa="virtual-list-item"]') ||
      startEl.closest?.('ts-message') ||
      null;

    if (!msgEl) return base;

    const out = { ...base };

    out.messageAuthor =
      msgEl
        .querySelector('[data-qa="message_sender_name"]')
        ?.textContent?.trim() ||
      msgEl.querySelector('.c-message__sender')?.textContent?.trim() ||
      null;

    const tsLink =
      msgEl.querySelector('a.c-timestamp') ||
      msgEl.querySelector('a[href*="/archives/"]') ||
      null;

    if (tsLink) {
      const href = tsLink.getAttribute('href');
      if (href)
        out.messagePermalink = href.startsWith('http')
          ? href
          : `${location.origin}${href}`;
      out.messageAt = tsLink.textContent?.trim() || null;
    }

    out.channelOrThread =
      document.querySelector('[data-qa="channel_name"]')?.textContent?.trim() ||
      null;

    out.raw.slack = { hasTimestampLink: !!tsLink };
    return out;
  }
})();
