// apps/extension/src/sw.js

const API_ORIGIN = 'http://localhost:3000'; // dev only; later replace with prod domain

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'SS_CREATE_TICKET') return;

  (async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends ss_session cookie for API_ORIGIN
        body: JSON.stringify(msg.payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      const data = isJson
        ? await res.json().catch(() => ({ ok: false, error: 'BAD_JSON' }))
        : { ok: false, error: await res.text().catch(() => 'NON_JSON_ERROR') };

      // Normalize error handling: either HTTP failure or { ok:false } from server
      if (!res.ok || !data || data.ok !== true) {
        sendResponse({
          ok: false,
          status: res.status,
          error:
            (data && data.error) || (data && data.message) || 'REQUEST_FAILED',
        });
        return;
      }

      // Normalize success shape defensively
      const ticketId = data?.ticket?.id || data?.ticketId || null;
      const shareUrl =
        data?.shareUrl || (ticketId ? `${API_ORIGIN}/t/${ticketId}` : null);

      if (!ticketId) {
        sendResponse({
          ok: false,
          status: res.status,
          error: 'MISSING_TICKET_ID',
        });
        return;
      }

      sendResponse({
        ok: true,
        ticketId,
        shareUrl,
      });
    } catch (e) {
      sendResponse({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  })();

  return true; // async response
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'SS_CHECK_AUTH') return;

  (async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      // api/auth/me returns 401 if not logged in, 200 if logged in
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        sendResponse({ ok: true, user: data.user });
      } else {
        // 401 or other error
        sendResponse({ ok: false });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  return true; // async response
});
