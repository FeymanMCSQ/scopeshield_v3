const $ = (id) => document.getElementById(id);

const MAX_ASSET_BYTES = 1_000_000; // ~1MB cap. Tune. Prevents DB bloat.
let currentScreenshotFile = null;

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

// UI: Handle Screenshot Preview
function updateScreenshotPreview() {
  const empty = $('upload-empty');
  const preview = $('upload-preview');
  const img = $('preview-img');

  if (currentScreenshotFile) {
    fileToDataUrl(currentScreenshotFile).then(url => {
      img.src = url;
      empty.style.display = 'none';
      preview.style.display = 'block';
    }).catch(e => {
      console.error('Preview error', e);
      setMsg('err', 'Failed to read image');
    });
  } else {
    img.src = '';
    preview.style.display = 'none';
    empty.style.display = 'block';
  }
}

// Listeners for Upload
const uploadZone = $('upload-zone');
const fileInput = $('shot');
const removeBtn = $('remove-shot');

if (uploadZone) {
  // Click -> Open File Dialog
  uploadZone.addEventListener('click', (e) => {
    // Find if click wasn't on the remove button
    if (e.target.closest('#remove-shot')) return;
    fileInput.click();
  });
}

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files && fileInput.files[0]) {
      currentScreenshotFile = fileInput.files[0];
      updateScreenshotPreview();
    }
  });
}

if (removeBtn) {
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent triggering upload
    currentScreenshotFile = null;
    fileInput.value = ''; // clear input
    updateScreenshotPreview();
  });
}

// Paste Listener
document.addEventListener('paste', (e) => {
  if (!e.clipboardData) return;
  const items = e.clipboardData.items;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        currentScreenshotFile = blob;
        updateScreenshotPreview();
      }
      break;
    }
  }
});


async function buildPayload() {
  const text = $('text').value;
  if (!nonEmptyText(text)) throw new Error('EVIDENCE_TEXT_REQUIRED');

  const currencyRaw = $('currency').value || 'USD';
  const currency = currencyRaw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('BAD_CURRENCY');

  const priceCents = dollarsToCents($('price').value);

  let assetUrl = null;
  // Use our tracked file variable tracking both paste and upload
  const f = currentScreenshotFile;
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

    // Show success view instead of opening tab
    if (res.shareUrl) {
      showSuccess(res.shareUrl);
    }

    // Reset form after success
    $('text').value = '';
    $('price').value = '';
    currentScreenshotFile = null;
    updateScreenshotPreview();

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

// Auth Flow
const viewLoading = $('view-loading');
const viewSignin = $('view-signin');
const viewMain = $('view-main');
const signinBtn = $('signin-btn');

function showView(viewId) {
  [viewLoading, viewSignin, viewMain, viewSuccess].forEach((el) => {
    if (el) el.style.display = el.id === viewId ? 'block' : 'none';
  });
}

async function checkAuth() {
  showView('view-loading');
  try {
    const res = await chrome.runtime.sendMessage({ type: 'SS_CHECK_AUTH' });
    if (res && res.ok) {
      showView('view-main');
    } else {
      showView('view-signin');
    }
  } catch (e) {
    console.error('Auth check failed', e);
    showView('view-signin');
  }
}

signinBtn.addEventListener('click', () => {
  // Open the handoff page with our extension ID
  const extId = chrome.runtime.id;
  chrome.tabs.create({ url: `http://localhost:3000/extension/connect?ext_id=${extId}` });
});

// Boot
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();

  // Check for draft
  try {
    const { draft_ticket } = await chrome.storage.local.get(['draft_ticket']);
    if (draft_ticket && draft_ticket.text) {
      $('text').value = draft_ticket.text;
      // Clear it so it doesn't persist
      await chrome.storage.local.remove('draft_ticket');
    }
  } catch (e) {
    console.error('Draft load error', e);
  }
});

// Success Flow
const viewSuccess = $('view-success');
const shareInput = $('share-link');
const copyBtn = $('copy-link-btn');
const resetBtn = $('reset-btn');

function showSuccess(url) {
  shareInput.value = url;
  showView('view-success');
}

if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    shareInput.select();
    navigator.clipboard.writeText(shareInput.value).then(() => {
      // Visual feedback
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      setTimeout(() => {
        copyBtn.innerHTML = original;
      }, 1000);
    });
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    showView('view-main');
    setMsg('', ''); // Clear any old messages
  });
}
