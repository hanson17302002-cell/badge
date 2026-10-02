/**
 * 서버(구글 Apps Script) 공개 기능 호출 — 등록 폼·참가자 카드 공용
 * 브라우저의 구글 로그인 쿠키를 보내지 않으므로(credentials: 'omit') 로그인 상태와 상관없이 동작한다.
 */
(function (global) {
  async function call(url, opts) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(url, Object.assign({ credentials: 'omit', signal: ctrl.signal, cache: 'no-store' }, opts));
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '서버 오류');
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('서버 응답이 늦습니다. 잠시 후 다시 시도해 주세요.');
      if (e instanceof TypeError) throw new Error('인터넷 연결을 확인해 주세요.');
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  global.BadgeAPI = {
    get(action, params) {
      const q = Object.entries(Object.assign({ action }, params || {})).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
      return call(global.BADGE_API + '?' + q);
    },
    // text/plain 으로 보내야 CORS 사전요청 없이 Apps Script에 전달됨
    post(action, body) {
      return call(global.BADGE_API, { method: 'POST', body: JSON.stringify(Object.assign({ action }, body)) });
    },
  };
  global.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})(window);
