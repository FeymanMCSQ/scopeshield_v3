const API_ORIGIN = 'http://localhost:3000'; // dev only; later replace with prod domain

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'SS_CREATE_TICKET') return;

  (async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <-- sends ss_session cookie for API_ORIGIN
        body: JSON.stringify(msg.payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      const data = isJson
        ? await res.json()
        : { ok: false, error: await res.text() };

      if (!res.ok || !data.ok) {
        sendResponse({
          ok: false,
          status: res.status,
          error: data.error || 'REQUEST_FAILED',
        });
        return;
      }

      sendResponse({
        ok: true,
        ticketId: data.ticket.id,
        shareUrl: data.shareUrl, // server should return this
      });
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();

  return true; // async response
});
