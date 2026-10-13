/**
 * 명찰 렌더링 공용 모듈 — station.html(출력)과 designer.html(디자인 편집)이 함께 사용
 *
 * 디자인(JSON) 구조
 * {
 *   w, h,                         명찰 크기(mm)
 *   bg: { color, fit, posX, posY, overlay, overlayOpacity }   배경 (이미지는 별도 저장)
 *   elements: [{ id, field, text, x, y, w, h, size, weight, color, font, align, valign, wrap, spacing }]
 *       field: 'event'(행사명) | 'org'(소속) | 'name'(성명) | 'title'(직책) | 'text'(고정 문구)
 *       x, y, w, h, size 는 mm 단위
 * }
 */
(function (global) {
  const FONTS = [
    { id: 'malgun', label: '맑은 고딕 (PC 기본)', css: '"Malgun Gothic","Apple SD Gothic Neo",sans-serif' },
    { id: 'pretendard', label: 'Pretendard', css: '"Pretendard","Malgun Gothic",sans-serif' },
    { id: 'noto', label: 'Noto Sans KR (본고딕)', css: '"Noto Sans KR","Malgun Gothic",sans-serif' },
    { id: 'notoserif', label: 'Noto Serif KR (본명조)', css: '"Noto Serif KR",serif' },
    { id: 'nanumgothic', label: '나눔고딕', css: '"Nanum Gothic","Malgun Gothic",sans-serif' },
    { id: 'nanummyeongjo', label: '나눔명조', css: '"Nanum Myeongjo",serif' },
    { id: 'gowun', label: '고운돋움', css: '"Gowun Dodum","Malgun Gothic",sans-serif' },
    { id: 'blackhan', label: '검은고딕 (Black Han Sans)', css: '"Black Han Sans","Malgun Gothic",sans-serif' },
    { id: 'dohyeon', label: '도현', css: '"Do Hyeon","Malgun Gothic",sans-serif' },
    { id: 'jua', label: '주아', css: '"Jua","Malgun Gothic",sans-serif' },
  ];
  const FONT_LINKS = [
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@400;700;900' +
      '&family=Nanum+Gothic:wght@400;700;800&family=Nanum+Myeongjo:wght@400;700;800&family=Gowun+Dodum' +
      '&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&display=swap',
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
  ];
  const FIELDS = { event: '행사명', org: '소속', name: '성명', title: '직책', text: '고정 문구', qr: '개인 QR' };
  const PERSON_FIELDS = ['org', 'name', 'title', 'qr'];
  /** 참가자마다 달라지는 요소 (라벨 방식에서는 라벨에 인쇄, 배경 미리 출력에서는 빠짐) — 추가 항목(f:…)도 포함 */
  const isPersonField = e => PERSON_FIELDS.includes(e.field) || String(e.field).startsWith('f:');
  /**
   * 폼텍 A4 라벨지 규격 (mm)
   * 출처: MS Word 라벨 정의 PGLBL010.XML ("copyright 2012, Formtec Korea Ltd.") + 폼텍 카탈로그(코드·용도)
   * [id, 코드, 용도, 열, 행, 가로, 세로, 왼쪽여백, 위쪽여백, 칸사이 가로, 칸사이 세로]
   */
  const FORMTEC = [
    ['nl2308', 'NL-2308', '이름표 라벨 (옷에 붙였다 떼기 쉬움)', 2, 4, 90, 60, 7.5, 13.5, 15, 10],
    ['ls3510', 'LS-3510', '분류표기용 · 명함 크기', 2, 5, 88.85, 51.86, 11.9, 17.5, 8.5, 0],
    ['ls3615', 'LS-3615', '분류표기용', 2, 5, 69.8, 51.9, 31.2, 18.5, 8, 0],
    ['qr3610', 'QR-3610', 'QR 전용 (정사각)', 2, 4, 69.8, 69.8, 31.2, 7, 8, 2],
    ['ls3114', 'LS-3114', '물류관리용', 2, 4, 99.1, 67.55, 4.65, 13, 2.5, 0],
    ['ls3116', 'LS-3116', '물류관리용', 2, 3, 99.1, 92.93, 4.65, 7, 2.5, 0],
    ['ls3118', 'LS-3118', '물류관리용', 2, 2, 99, 139.8, 5, 7, 2, 0],
    ['ls3112', 'LS-3112', '물류관리용', 3, 4, 63.66, 69.82, 7, 7.9, 2.5, 0],
    ['ls3203', 'LS-3203', '물류관리용', 1, 3, 200, 93, 5, 9, 0, 0],
    ['ls3120', 'LS-3120', '물류관리용', 1, 2, 200, 139.75, 5, 7, 0, 0],
    ['ls3212', 'LS-3212', '주소용', 2, 6, 100, 45, 3.72, 10, 2.5, 0],
    ['ls3620', 'LS-3620', '주소용', 1, 6, 119.3, 42.75, 45.35, 19, 0, 0],
    ['ls3218', 'LS-3218', '주소용', 3, 6, 63.5, 45, 7.25, 10, 2.5, 0],
    ['ls3108', 'LS-3108', '주소용', 2, 7, 99.05, 38.07, 4.7, 13.8, 2.5, 0],
    ['ls3105', 'LS-3105', '주소용', 3, 7, 63.53, 38.1, 7.2, 15.8, 2.5, 0],
    ['ls3107', 'LS-3107', '주소용', 2, 8, 99.05, 33.85, 4.7, 14.2, 2.5, 0],
    ['ls3106', 'LS-3106', '주소용', 3, 8, 64, 34, 6.5, 12.5, 2.5, 0],
    ['ls3109', 'LS-3109', '주소용', 2, 9, 99.9, 29.9, 3.72, 13.5, 2.5, 0],
    ['ls3219', 'LS-3219', '주소용', 2, 11, 100, 24.5, 4, 13, 2, 0],
    ['ls3130', 'LS-3130', 'A4 전지 (통 스티커)', 1, 1, 210, 297, 0, 0, 0, 0],
  ];
  const LABEL_STOCKS = {};
  FORMTEC.forEach(([id, code, use, cols, rows, w, h, marginL, marginT, gapX, gapY]) => {
    LABEL_STOCKS[id] = {
      code, use, w, h, cols, rows,
      label: `폼텍 ${code} · ${w}×${h}mm · ${cols * rows}칸 · ${use}`,
      layout: { cols, rows, labelW: w, labelH: h, marginL, marginT, gapX, gapY, offX: 0, offY: 0 },
    };
  });
  /** 라벨지 칸 배치 (PC별 보정값 override 적용) */
  const stockLayout = (id, override) => Object.assign({}, (LABEL_STOCKS[id] || LABEL_STOCKS.ls3510).layout, override || {});

  const CSS = `
  .bx { position:relative; overflow:hidden; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .bx-bg { position:absolute; inset:0; width:100%; height:100%; display:block; }
  .bx-ov { position:absolute; inset:0; }
  .bx-el { position:absolute; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; }
  .bx-t { width:100%; line-height:1.25; }
  .bx-t.nowrap { white-space:nowrap; }
  .bx-t.wrap { white-space:normal; word-break:keep-all; overflow-wrap:anywhere; }
  .page { position:relative; width:210mm; height:297mm; overflow:hidden; background:#fff; break-after:page; page-break-after:always; }
  .page:last-child { break-after:auto; page-break-after:auto; }
  .slot { position:absolute; overflow:hidden; }
  .slot-in { position:absolute; transform-origin:0 0; }
  .slot.cut { outline:0.2mm solid #bbb; }
  .slot.test { outline:0.3mm dashed #000; display:flex; align-items:center; justify-content:center; flex-direction:column; font-size:5mm; color:#000; }`;

  let uid = 0;
  const newId = () => 'el' + Date.now().toString(36) + (uid++).toString(36);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const fontCss = id => (FONTS.find(f => f.id === id) || FONTS[0]).css;

  function el(field, x, y, w, h, size, extra) {
    return Object.assign({ id: newId(), field, text: '', x, y, w, h, size, weight: 400, color: '#111111',
      font: 'malgun', align: 'center', valign: 'middle', wrap: false, spacing: 0 }, extra || {});
  }

  /** 새 행사 기본 디자인 (흰 배경, 세로형 100×120mm) */
  function defaultDesign() {
    return {
      w: 100, h: 120,
      bg: { color: '#ffffff', fit: 'cover', posX: 50, posY: 50, overlay: '#000000', overlayOpacity: 0 },
      elements: [
        el('event', 6, 7, 88, 16, 4.5, { weight: 700, wrap: true }),
        el('org', 6, 40, 88, 15, 6.5, { wrap: true }),
        el('name', 6, 57, 88, 22, 16, { weight: 800, spacing: 0.06 }),
        el('title', 6, 81, 88, 10, 6.5),
      ],
    };
  }

  /** 저장된 디자인에 빠진 값을 기본값으로 채움 (옛 버전 디자인도 안전하게 열리도록) */
  function normalize(d) {
    const base = defaultDesign();
    if (!d || typeof d !== 'object') return base;
    const out = { w: num(d.w, base.w), h: num(d.h, base.h), bg: Object.assign({}, base.bg, d.bg || {}) };
    out.elements = Array.isArray(d.elements)
      ? d.elements.map(e => Object.assign(el(e.field || 'text', 0, 0, 20, 10, 5), e, { id: e.id || newId() }))
      : base.elements;
    out.label = Object.assign(defaultLabel(out), d.label || {});
    // 등록 폼 항목 / 현장 운영 설정 (행사마다)
    out.form = Object.assign({ org: 'required', title: 'optional', fields: [] }, d.form || {});
    out.form.fields = Array.isArray(out.form.fields) ? out.form.fields : [];
    out.ops = Object.assign({ sessions: [], pin: '' }, d.ops || {});
    const s = LABEL_STOCKS[out.label.stock];
    if (s) { out.label.w = s.w; out.label.h = s.h; } // 라벨 크기는 항상 라벨지 규격을 따른다
    return out;
  }

  /** 라벨 부착 방식 기본값: LS-3510, 명찰 아래쪽 가운데 */
  function defaultLabel(d) {
    const s = LABEL_STOCKS.ls3510;
    return { enabled: false, stock: 'ls3510', w: s.w, h: s.h, x: Math.round((d.w - s.w) / 2 * 100) / 100, y: Math.max(0, d.h - s.h - 8) };
  }

  const isLabelMode = d => !!(d && d.label && d.label.enabled);
  const inLabel = (e, lb) => {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    return cx >= lb.x && cx <= lb.x + lb.w && cy >= lb.y && cy <= lb.y + lb.h;
  };

  /** 라벨 출력용 디자인: 라벨 영역 안 요소만, 라벨 크기의 흰 바탕으로 옮긴다 */
  function labelDesign(d) {
    const lb = d.label;
    return {
      w: lb.w, h: lb.h,
      bg: { color: '#ffffff', fit: 'cover', posX: 50, posY: 50, overlay: '#000000', overlayOpacity: 0 },
      elements: d.elements.filter(e => inLabel(e, lb)).map(e => Object.assign({}, e, { x: e.x - lb.x, y: e.y - lb.y })),
    };
  }

  /** 배경 미리 출력용 디자인: 라벨 영역 밖의 고정 요소(행사명·고정 문구)만 남긴다 */
  function backgroundDesign(d) {
    return Object.assign({}, d, { elements: d.elements.filter(e => !inLabel(e, d.label) && !isPersonField(e)) });
  }

  /** 라벨 밖에 놓인 참가자 정보 요소 (미리 인쇄할 수 없으므로 경고용) */
  function personFieldsOutside(d) {
    return d.elements.filter(e => isPersonField(e) && !inLabel(e, d.label));
  }

  function textFor(e, person, eventName, design) {
    if (e.field === 'text') return e.text || '';
    if (e.field === 'event') return eventName || '';
    if (String(e.field).startsWith('f:')) { // 등록 폼 추가 항목 (예: 소속 구분)
      const f = ((design && design.form && design.form.fields) || []).find(x => 'f:' + x.id === e.field);
      return f && person && person.extra ? (person.extra[f.label] || '') : '';
    }
    return (person && person[e.field]) || '';
  }

  /** 명찰 1개 HTML (design.w × design.h mm) */
  function badgeHTML(design, bgUrl, person, eventName) {
    const d = design, b = d.bg || {};
    const justify = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
    let html = `<div class="bx" style="width:${d.w}mm;height:${d.h}mm;background:${esc(b.color || '#fff')}">`;
    if (bgUrl) {
      const fit = b.fit === 'fill' ? 'fill' : (b.fit === 'contain' ? 'contain' : 'cover');
      html += `<img class="bx-bg" src="${bgUrl}" style="object-fit:${fit};object-position:${num(b.posX, 50)}% ${num(b.posY, 50)}%" alt="">`;
    }
    if (b.overlayOpacity > 0) html += `<div class="bx-ov" style="background:${esc(b.overlay)};opacity:${b.overlayOpacity}"></div>`;
    for (const e of d.elements) {
      html += `<div class="bx-el" data-id="${esc(e.id)}" style="left:${e.x}mm;top:${e.y}mm;width:${e.w}mm;height:${e.h}mm;` +
        `justify-content:${justify[e.valign] || 'center'};text-align:${esc(e.align)};font-family:${esc(fontCss(e.font))};` +
        `font-size:${e.size}mm;font-weight:${e.weight};color:${esc(e.color)};letter-spacing:${num(e.spacing, 0)}em">` +
        (e.field === 'qr'
          ? `<div class="bx-t qr" style="height:100%;display:flex;align-items:center;justify-content:${e.align === 'left' ? 'flex-start' : e.align === 'right' ? 'flex-end' : 'center'}">${qrSync(person && person.qrUrl)}</div></div>`
          : `<div class="bx-t ${e.wrap ? 'wrap' : 'nowrap'}">${esc(textFor(e, person, eventName, d))}</div></div>`);
    }
    return html + '</div>';
  }

  /** 상자를 넘치는 글자는 들어갈 때까지 줄인다 (긴 소속·이름 대비) */
  function fitAll(root) {
    root.querySelectorAll('.bx-el').forEach(box => {
      const t = box.firstElementChild;
      if (!t || t.classList.contains('qr')) return;
      t.style.fontSize = '';
      let fs = parseFloat(getComputedStyle(t).fontSize), guard = 80;
      while (guard-- > 0 && fs > 5 && (t.scrollWidth > box.clientWidth + 1 || t.offsetHeight > box.clientHeight + 1)) {
        fs *= 0.94;
        t.style.fontSize = fs + 'px';
      }
    });
  }

  /** 라벨지 칸 위치 계산 (layout: cols, rows, labelW, labelH, marginL, marginT, gapX, gapY, offX, offY) */
  function slotRect(L, i) {
    const c = i % L.cols, r = Math.floor(i / L.cols);
    return {
      left: L.marginL + (L.offX || 0) + c * (L.labelW + L.gapX),
      top: L.marginT + (L.offY || 0) + r * (L.labelH + L.gapY),
      w: L.labelW, h: L.labelH,
    };
  }

  /** 칸 안에 명찰을 비율 유지로 맞춰 넣는다 (디자인 크기와 라벨 칸 크기가 조금 달라도 안전) */
  function slotHTML(L, i, inner, design, cls) {
    const r = slotRect(L, i);
    let body = inner;
    if (design) {
      const s = Math.min(r.w / design.w, r.h / design.h);
      const ox = (r.w - design.w * s) / 2, oy = (r.h - design.h * s) / 2;
      body = `<div class="slot-in" style="left:${ox}mm;top:${oy}mm;transform:scale(${s})">${inner}</div>`;
    }
    return `<div class="slot ${cls || ''}" style="left:${r.left}mm;top:${r.top}mm;width:${r.w}mm;height:${r.h}mm">${body}</div>`;
  }

  /** pages: [[{slot, html, cls?}], ...] → A4 페이지들 */
  function pagesHTML(L, pages, design) {
    return pages.map(cells => '<div class="page">' +
      cells.map(c => slotHTML(L, c.slot, c.html, c.cls === 'test' ? null : design, c.cls)).join('') + '</div>').join('');
  }

  function injectAssets() {
    if (document.getElementById('bx-style')) return;
    const st = document.createElement('style');
    st.id = 'bx-style';
    st.textContent = CSS;
    document.head.appendChild(st);
    FONT_LINKS.forEach(href => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    });
  }

  /** 인쇄 전에 이 디자인이 쓰는 글꼴을 미리 받아둔다 (최대 5초 대기) */
  async function loadFonts(design, texts) {
    if (!document.fonts) return;
    const sample = (texts || []).join('') + '가나다ABC123';
    const jobs = design.elements.map(e => document.fonts.load(`${e.weight} 16px ${fontCss(e.font)}`, sample).catch(() => {}));
    await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 5000))]);
    await document.fonts.ready;
  }

  /* ---------- QR 코드 (화면·인쇄 모두 선명하도록 SVG/정수 픽셀로 그림) ---------- */
  let qrLib;
  function loadQR() {
    if (!qrLib) {
      qrLib = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
        s.onload = res;
        s.onerror = () => { qrLib = null; rej(new Error('QR 라이브러리를 불러오지 못했습니다 (인터넷 연결 확인)')); };
        document.head.appendChild(s);
      });
    }
    return qrLib;
  }

  /** QR 모듈 배열 + 둘레 여백(quiet zone) 4칸 */
  async function qrMatrix(text) {
    await loadQR();
    const q = global.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return { q, n: q.getModuleCount(), m: 4 };
  }

  /**
   * 명찰 안 개인 QR (동기) — 인쇄 전에 loadQR()로 라이브러리를 받아 둬야 그려진다.
   * 정사각형으로 상자 높이·너비 중 작은 쪽에 맞춤. 주소가 없으면(미리보기) 예시 주소로 그림
   */
  function qrSync(text) {
    if (!global.qrcode) return '<div style="width:100%;height:100%;border:0.3mm dashed #999;display:flex;align-items:center;justify-content:center;font-size:3mm;color:#999">QR</div>';
    const q = global.qrcode(0, 'M');
    q.addData(text || 'https://example.com/badge-qr-preview');
    q.make();
    const n = q.getModuleCount(), m = 2, t = n + m * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m},${r + m}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" style="height:100%;max-width:100%;aspect-ratio:1/1" shape-rendering="crispEdges">` +
      `<rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  const hasQR = d => !!(d && d.elements.some(e => e.field === 'qr'));

  /** 크기를 마음대로 키워도 흐려지지 않는 SVG */
  async function qrSVG(text, cssSize) {
    const { q, n, m } = await qrMatrix(text);
    const t = n + m * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m},${r + m}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${cssSize}" height="${cssSize}" shape-rendering="crispEdges">` +
      `<rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  /** 이미지 저장용 PNG (한 칸 = 정수 픽셀이라 경계가 선명) */
  async function qrPNG(text, minPx) {
    const { q, n, m } = await qrMatrix(text);
    const t = n + m * 2, cell = Math.max(4, Math.ceil((minPx || 1000) / t));
    const c = document.createElement('canvas');
    c.width = c.height = t * cell;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + m) * cell, (r + m) * cell, cell, cell);
    return c.toDataURL('image/png');
  }

  global.BadgeRender = { qrSVG, qrPNG, loadQR, hasQR, isPersonField, FONTS, FIELDS, LABEL_STOCKS, stockLayout, isLabelMode, labelDesign, backgroundDesign, personFieldsOutside, defaultLabel, defaultDesign, normalize, newElement: el, badgeHTML, fitAll, slotRect, slotHTML, pagesHTML, injectAssets, loadFonts, esc };
})(window);
