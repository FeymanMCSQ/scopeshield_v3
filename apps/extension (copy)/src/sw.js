// apps/extension/src/sw.js

importScripts('config.js');

const API_ORIGIN = getApiUrl();

// Helper to get token
async function getAuthToken() {
  try {
    const { session } = await chrome.storage.local.get(['session']);
    return session?.token || null;
  } catch (err) {
    console.error('Error reading token:', err);
    return null;
  }
}

// 1. Listen for Handshake from Web App
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'SS_HANDSHAKE') {
    const { token, user } = msg;
    if (token && user) {
      chrome.storage.local.set({
        session: {
          token,
          user,
          timestamp: Date.now()
        }
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          sendResponse({ ok: false, error: 'STORAGE_ERROR' });
        } else {
          sendResponse({ ok: true });
        }
      });
    } else {
      sendResponse({ ok: false, error: 'Invalid payload' });
    }
    return true; // async
  }
});

// 2. Main Message Listener (Popup -> SW)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  switch (msg.type) {
    case 'SS_CHECK_AUTH':
      handleCheckAuth(sendResponse);
      return true; // Keep channel open

    case 'SS_CREATE_TICKET':
      handleCreateTicket(msg.payload, sendResponse);
      return true; // Keep channel open

    case 'SS_OPEN_DRAFT':
      handleOpenDraft(msg.payload, sendResponse);
      return true;

    default:
      // Unknown message
      return false;
  }
});

async function handleCheckAuth(sendResponse) {
  try {
    const { session } = await chrome.storage.local.get(['session']);
    // Verify structure
    if (session && session.user && session.token) {
      sendResponse({ ok: true, user: session.user });
    } else {
      sendResponse({ ok: false });
    }
  } catch (err) {
    console.error('Auth check error:', err);
    sendResponse({ ok: false, error: err.message });
  }
}

async function handleCreateTicket(payload, sendResponse) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return sendResponse({ ok: false, error: 'UNAUTHORIZED' });
    }

    const res = await fetch(`${API_ORIGIN}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      // Token expired or invalid
      await chrome.storage.local.remove('session');
      return sendResponse({ ok: false, error: 'UNAUTHORIZED' });
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const data = isJson
      ? await res.json().catch(() => ({ ok: false, error: 'BAD_JSON' }))
      : { ok: false, error: await res.text().catch(() => 'NON_JSON_ERROR') };

    if (!res.ok || !data || data.ok !== true) {
      sendResponse({
        ok: false,
        status: res.status,
        error: (data && data.error) || (data && data.message) || 'REQUEST_FAILED',
      });
      return;
    }

    const ticketId = data?.ticket?.id || data?.ticketId || null;
    const shareUrl = data?.shareUrl || (ticketId ? `${API_ORIGIN}/t/${ticketId}` : null);

    if (!ticketId) {
      sendResponse({ ok: false, status: res.status, error: 'MISSING_TICKET_ID' });
      return;
    }

    sendResponse({ ok: true, ticketId, shareUrl });

  } catch (e) {
    console.error('Create ticket error:', e);
    sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

async function handleOpenDraft(payload, sendResponse) {
  try {
    await chrome.storage.local.set({ draft_ticket: payload });
    // Create popup window
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 360,
      height: 600
    }, (win) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true });
      }
    });
  } catch (e) {
    console.error('Draft error:', e);
    sendResponse({ ok: false, error: e.message });
  }
}
