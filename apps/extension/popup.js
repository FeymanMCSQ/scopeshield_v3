const $ = (id) => document.getElementById(id);

const MAX_ASSET_BYTES = 1_000_000; // ~1MB cap. Tune. Prevents DB bloat.

function dollarsToCents(v) {
  // v is string/number; return int cents
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error('BAD_PRICE');
  return Math.round(n * 100);
}

function nonEmptyText(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('FILE_READ_FAILED'));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

function setMsg(kind, text) {
  const el = $('msg');
  el.className = `msg ${kind}`;
  el.textContent = text;
}

async function buildPayload() {
  const text = $('text').value;
  if (!nonEmptyText(text)) throw new Error('EVIDENCE_TEXT_REQUIRED');

  const currencyRaw = $('currency').value || 'USD';
  const currency = currencyRaw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('BAD_CURRENCY');

  const priceCents = dollarsToCents($('price').value);

  let assetUrl = null;
  const f = $('shot').files && $('shot').files[0];
  if (f) {
    if (f.size > MAX_ASSET_BYTES) throw new Error('SCREENSHOT_TOO_LARGE');
    assetUrl = await fileToDataUrl(f); // data:... base64
  }

  // evidenceAt/evidenceUrl: for manual tickets, use now + active tab URL (best-effort)
  let evidenceUrl = null;
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    evidenceUrl = tab?.url || null;
  } catch {
    evidenceUrl = null;
  }

  const nowIso = new Date().toISOString();

  return {
    platform: 'manual',
    text: text.trim(),
    evidenceAt: nowIso,
    evidenceUrl: evidenceUrl || 'manual://popup',
    assetUrl, // optional
    pricing: {
      priceCents,
      currency,
    },
  };
}

async function createTicket() {
  const btn = $('submit');
  btn.disabled = true;
  setMsg('', '');

  try {
    const payload = await buildPayload();

    const res = await chrome.runtime.sendMessage({
      type: 'SS_CREATE_TICKET',
      payload,
    });

    // Expect SW response shape: { ok: true, ticketId, shareUrl } or { ok:false, error }
    if (!res || res.ok !== true) {
      const err = res?.error || 'CREATE_FAILED';
      throw new Error(err);
    }

    const dollars = (payload.pricing.priceCents / 100).toFixed(2);
    setMsg(
      'ok',
      `No worries, it will be ${payload.pricing.currency} ${dollars}.`
    );

    // Optional: open the public ticket page
    if (res.shareUrl) {
      // open in new tab without blocking
      chrome.tabs.create({ url: res.shareUrl });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
    setMsg('err', msg);
  } finally {
    btn.disabled = false;
  }
}

$('submit').addEventListener('click', () => {
  createTicket();
});
