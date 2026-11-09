/** 운영진 화면 공통 아이콘 — <i data-ic="print"></i> 자리에 선 아이콘을 그려 넣는다 (인터넷 없이도 보임) */
(function (global) {
  const circle = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z';
  const P = {
    print: 'M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2M17 9V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4M9 13h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z',
    list: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M11 3h2a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4zM9 14l2 2 4-4',
    box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
    palette: 'M12 21a9 9 0 0 1 0-18c5 0 9 3.6 9 8a4 4 0 0 1-4 4h-2a2 2 0 0 0-1.5 3.3c.6.9-.2 2.7-1.5 2.7zM8 12h.01M9.5 8h.01M14.5 8h.01',
    chart: 'M4 20h16M7 20v-6M12 20V8M17 20v-10',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
    pause: 'M8 5v14M16 5v14',
    check: circle + 'M8.5 12l2.5 2.5 4.5-5',
    alert: 'M12 4L2.5 20h19zM12 10v4M12 17h.01',
    scissors: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.1 8.1L20 20M8.1 15.9L20 4',
    info: circle + 'M12 11v5M12 8h.01',
    badge: 'M6 4h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 4V2h4v2M12 9a2.2 2.2 0 1 0 0 4.4A2.2 2.2 0 0 0 12 9zM8 18c.6-1.4 2-2.1 4-2.1s3.4.7 4 2.1',
    label: 'M5 3h14a2 2 0 0 1 2 2v9l-7 7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 21v-5a2 2 0 0 1 2-2h5',
    form: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 9h8M8 13h8M8 17h4',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 20h2M18 18h2v2',
    help: circle + 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01',
    pointer: 'M5 4l14 6-6 2-2 6z',
    lock: 'M6 11h12v9H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
    user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 20c1-3.5 3.6-5 7-5s6 1.5 7 5',
  };
  const icon = name => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[name] || ''}"/></svg>`;
  function paint(root) {
    (root || document).querySelectorAll('i[data-ic]').forEach(el => { el.outerHTML = icon(el.dataset.ic); });
  }
  global.UI = { icon, paint };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => paint());
  else paint();
})(window);
