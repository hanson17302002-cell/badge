/**
 * 운영진 로그인 — 출력 스테이션·디자이너·대시보드 공용
 * 소속·성명·비밀번호를 받아 서버에서 확인하고, 서버 '사용기록' 시트에 누가 언제 어떤 화면을 열었는지 남긴다.
 * 비밀번호는 서버(Code.gs)에만 있고 이 파일에는 없다.
 * 로그인하면 서버가 24시간짜리 통행증(token)을 주고, 화면은 서버에 요청할 때마다 이것을 같이 보낸다.
 * 같은 탭에서 새로고침하면 다시 묻지 않는다(탭을 닫으면 다시 로그인).
 */
(function (global) {
  const store = {
    get(s, k) { try { return JSON.parse(s.getItem('badge.gate.' + k) || 'null'); } catch (e) { return null; } },
    set(s, k, v) { try { s.setItem('badge.gate.' + k, JSON.stringify(v)); } catch (e) {} },
    del(s, k) { try { s.removeItem('badge.gate.' + k); } catch (e) {} },
  };
  const ss = (() => { try { return global.sessionStorage; } catch (e) { return null; } })();
  const ls = (() => { try { return global.localStorage; } catch (e) { return null; } })();

  function server() {
    let c = {};
    try { c = JSON.parse(global.localStorage.getItem('badge.cfg') || '{}'); } catch (e) {}
    const b = global.BADGE_SERVER || {};
    return { apiUrl: c.apiUrl || b.apiUrl || '', key: c.key || b.key || '' };
  }

  const CSS = `
  #gate { position:fixed; inset:0; z-index:9999; background:rgba(15,20,27,.92); display:flex; align-items:center; justify-content:center; font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif; }
  #gate form { background:#fff; color:#1d232b; width:min(380px, 92vw); border-radius:16px; padding:26px 24px; box-shadow:0 20px 60px rgba(0,0,0,.4); }
  #gate h2 { margin:0 0 4px; font-size:20px; }
  #gate p { margin:0 0 18px; color:#6b7580; font-size:13px; line-height:1.5; }
  #gate label { display:block; font-size:13px; font-weight:600; margin:12px 0 5px; }
  #gate input { width:100%; box-sizing:border-box; font:inherit; font-size:16px; padding:11px 12px; border:1px solid #cfd6de; border-radius:9px; }
  #gate input:focus { outline:2px solid #2f6fed; border-color:#2f6fed; }
  #gate button { width:100%; margin-top:18px; font:inherit; font-size:16px; font-weight:700; padding:13px; border:0; border-radius:10px; background:#2f6fed; color:#fff; cursor:pointer; }
  #gate button:disabled { opacity:.6; }
  #gate .err { color:#dc2626; font-size:14px; min-height:1.2em; margin-top:10px; }
  #gate-who { position:fixed; right:10px; bottom:10px; z-index:50; background:rgba(29,35,43,.85); color:#fff; font:12px "Malgun Gothic",sans-serif; padding:5px 10px; border-radius:999px; }
  #gate-who a { color:#9cc3ff; margin-left:6px; cursor:pointer; text-decoration:underline; }
  /* 환영 모션 */
  #gate { transition:opacity .5s ease, backdrop-filter .5s ease; }
  #gate.bye { opacity:0; }
  #gate form.leave { animation:gate-leave .35s ease forwards; }
  #gate .welcome { text-align:center; color:#fff; }
  #gate .welcome svg { width:84px; height:84px; display:block; margin:0 auto 18px; }
  #gate .welcome circle { fill:none; stroke:#34c47c; stroke-width:4; stroke-dasharray:252; stroke-dashoffset:252; animation:gate-draw .6s ease-out forwards; }
  #gate .welcome path { fill:none; stroke:#34c47c; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:60; stroke-dashoffset:60; animation:gate-draw .35s .5s ease-out forwards; }
  #gate .welcome .hi { font-size:17px; color:#9fb0c3; opacity:0; animation:gate-up .5s .55s ease-out forwards; }
  #gate .welcome .nm { font-size:44px; font-weight:800; letter-spacing:.02em; margin:6px 0 4px; opacity:0; animation:gate-up .55s .7s ease-out forwards; }
  #gate .welcome .og { font-size:18px; color:#cfd8e3; opacity:0; animation:gate-up .5s .85s ease-out forwards; }
  #gate .welcome .pg { display:inline-block; margin-top:20px; font-size:14px; color:#9cc3ff; border:1px solid rgba(156,195,255,.4); border-radius:999px; padding:6px 14px; opacity:0; animation:gate-up .5s 1.05s ease-out forwards; }
  #gate .welcome .skip { margin-top:26px; font-size:12px; color:#6b7a8c; opacity:0; animation:gate-up .4s 1.4s ease-out forwards; }
  @keyframes gate-leave { to { opacity:0; transform:translateY(-12px) scale(.96); } }
  @keyframes gate-draw { to { stroke-dashoffset:0; } }
  @keyframes gate-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  @media (prefers-reduced-motion: reduce) {
    #gate .welcome *, #gate form.leave { animation-duration:.01s !important; animation-delay:0s !important; }
  }
  @media print { #gate, #gate-who { display:none !important; } }`;

  function ensureCss() {
    if (document.getElementById('gate-css')) return;
    const st = document.createElement('style');
    st.id = 'gate-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return '좋은 아침입니다';
    if (h >= 11 && h < 17) return '오늘도 반갑습니다';
    if (h >= 17 && h < 22) return '수고 많으십니다';
    return '늦은 시간까지 수고 많으십니다';
  }
  const escHtml = v => String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  /** 로그인 직후 환영 화면 → 사라지면서 본 화면이 드러남. 클릭·키 입력으로 건너뛸 수 있음 */
  function welcome(wrap, form, page, user) {
    return new Promise(done => {
      const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      form.classList.add('leave');
      setTimeout(() => {
        form.remove();
        const w = document.createElement('div');
        w.className = 'welcome';
        w.innerHTML = `<svg viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="40"/><path d="M27 46 l12 12 l24 -26"/></svg>
          <div class="hi">${greeting()}</div>
          <div class="nm">${escHtml(user.name)} 님</div>
          <div class="og">${escHtml(user.org)}</div>
          <div class="pg">${escHtml(page)} 입장</div>
          <div class="skip">아무 곳이나 누르면 바로 시작합니다</div>`;
        wrap.appendChild(w);
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          document.removeEventListener('keydown', finish);
          wrap.classList.add('bye');
          setTimeout(() => { wrap.remove(); done(); }, reduced ? 0 : 500);
        };
        wrap.addEventListener('click', finish);
        document.addEventListener('keydown', finish);
        setTimeout(finish, reduced ? 900 : 2300);
      }, reduced ? 0 : 330);
    });
  }

  function showWho(page, user) {
    let el = document.getElementById('gate-who');
    if (!el) { el = document.createElement('div'); el.id = 'gate-who'; document.body.appendChild(el); }
    el.innerHTML = '';
    el.append('👤 ' + user.org + ' ' + user.name);
    const a = document.createElement('a');
    a.textContent = '로그아웃';
    a.onclick = () => { if (ss) store.del(ss, page); location.reload(); };
    el.appendChild(a);
  }

  let curPage = '', reloginP = null;
  const valid = u => !!(u && u.name && u.token && (!u.exp || u.exp > Date.now()));

  /** page: 화면 이름 (예: '출력 스테이션'). 로그인되면 {org, name, token} 으로 끝나는 Promise */
  function require(page) {
    curPage = page;
    const srv = server();
    if (!srv.apiUrl) return Promise.resolve({ org: '', name: '데모' }); // 데모 모드는 로그인 없음
    ensureCss();
    const saved = ss && store.get(ss, page);
    if (valid(saved)) { showWho(page, saved); return Promise.resolve(saved); }
    return showLogin(page, false);
  }

  /** 서버에 보낼 통행증 (로그인하면 24시간 유효) */
  function token() {
    const u = ss && store.get(ss, curPage);
    return (u && u.token) || '';
  }

  /** 통행증이 만료됐을 때: 로그인 창을 다시 띄우고, 로그인하면 끝남 (여러 요청이 동시에 불러도 창은 하나) */
  function relogin() {
    if (!reloginP) {
      if (ss) store.del(ss, curPage);
      reloginP = showLogin(curPage, true).finally(() => { reloginP = null; });
    }
    return reloginP;
  }

  function showLogin(page, again) {
    const srv = server();
    return new Promise(resolve => {
      const last = (ls && store.get(ls, 'last')) || {};
      const wrap = document.createElement('div');
      wrap.id = 'gate';
      wrap.innerHTML = `<form autocomplete="off">
        <h2>🔒 운영진 로그인</h2>
        <p>${again ? '로그인 시간이 지났습니다. 다시 로그인하면 하던 작업을 이어서 합니다.' : page + ' 화면입니다. 사용 기록을 위해 소속과 성명을 입력하세요.'}</p>
        <label>소속</label><input name="org" maxlength="40" required>
        <label>성명</label><input name="name" maxlength="20" required>
        <label>비밀번호</label><input name="password" type="password" required>
        <div class="err"></div>
        <button type="submit">입장</button>
      </form>`;
      document.body.appendChild(wrap);
      const f = wrap.querySelector('form'), err = wrap.querySelector('.err'), btn = wrap.querySelector('button');
      f.org.value = last.org || '';
      f.name.value = last.name || '';
      (last.org ? f.password : f.org).focus();
      f.addEventListener('submit', async e => {
        e.preventDefault();
        const org = f.org.value.trim(), name = f.name.value.trim();
        if (!org || !name) { err.textContent = '소속과 성명을 입력하세요.'; return; }
        btn.disabled = true; btn.textContent = '확인 중…'; err.textContent = '';
        try {
          const r = await fetch(srv.apiUrl, { method: 'POST', body: JSON.stringify({
            action: 'login', page, org, name, password: f.password.value, ua: navigator.userAgent }) });
          const j = await r.json();
          if (!j.ok) throw new Error(j.error || '로그인하지 못했습니다.');
          if (!j.token) throw new Error('서버가 예전 버전입니다. 관리자에게 서버 업데이트를 요청하세요.');
          const user = { org: j.org, name: j.name, token: j.token, exp: Date.now() + ((j.hours || 24) - 0.5) * 3600 * 1000, at: new Date().toISOString() };
          if (ss) store.set(ss, page, user);
          if (ls) store.set(ls, 'last', { org: j.org, name: j.name });
          (document.activeElement || {}).blur && document.activeElement.blur();
          if (again) wrap.remove(); else await welcome(wrap, f, page, user);
          showWho(page, user);
          resolve(user);
        } catch (ex) {
          err.textContent = ex instanceof TypeError ? '서버에 연결하지 못했습니다. 인터넷을 확인하세요.' : ex.message;
          f.password.value = '';
          f.password.focus();
        } finally {
          btn.disabled = false; btn.textContent = '입장';
        }
      });
    });
  }

  /** 서버 오류가 '로그인 만료'인지 */
  const isAuthError = e => /로그인이 (만료|필요)/.test(String(e && e.message));

  global.BadgeGate = { require, token, relogin, isAuthError };
})(window);
