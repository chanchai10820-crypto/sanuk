/*
 * ตัวช่วยที่ใช้ร่วมกันระหว่างเนื้อหา เกม และหน้าเว็บ
 */
(function () {
  'use strict';

  const ARROW = { U: '⬆', D: '⬇', L: '⬅', R: '➡' };
  const MOVE = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const DIR_TH = { U: 'ขึ้น', D: 'ลง', L: 'ซ้าย', R: 'ขวา' };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* บล็อกคำสั่งแบบ Scratch (HTML) */
  const block = (cat, html, extra) => `<div class="sb-b sb-${cat}${extra ? ' ' + extra : ''}">${html}</div>`;
  const input = (v) => `<span class="sb-in">${v}</span>`;
  const FLAG = `<span class="sb-flag" aria-label="ธงเขียว">⚑</span>`;
  const hat = (extra) => block('event', `เมื่อคลิก ${FLAG}`, 'sb-hat' + (extra ? ' ' + extra : ''));
  const loop = (head, inner, extra) =>
    `<div class="sb-c${extra ? ' ' + extra : ''}"><div class="sb-chead">${head}</div><div class="sb-cbody">${inner}</div><div class="sb-cfoot"></div></div>`;
  const script = (...blocks) => `<div class="sb" role="img" aria-label="ตัวอย่างบล็อกคำสั่ง Scratch">${blocks.join('')}</div>`;

  /* ตารางเดิน: g = { size:[w,h], start:[x,y], goal:[x,y], rocks:[[x,y]], hero, target } */
  function boardHTML(g, pos, trail, crash, arrows) {
    const [w, h] = g.size;
    const rocks = g.rocks || [];
    const isRock = (x, y) => rocks.some((r) => r[0] === x && r[1] === y);
    const p = pos || g.start;
    const hero = g.hero || '🐱';
    const target = g.target || '🐟';
    let cells = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isHero = p[0] === x && p[1] === y;
        const isGoal = g.goal[0] === x && g.goal[1] === y;
        const inTrail = trail && trail.some((c) => c[0] === x && c[1] === y);
        let cls = 'cell';
        let content = '';
        if (isRock(x, y)) { cls += ' rock'; content = '🪨'; }
        if (inTrail) cls += ' trail';
        if (arrows && arrows[`${x},${y}`]) content = `<span class="arw">${arrows[`${x},${y}`]}</span>`;
        if (isGoal) content = target;
        if (isHero) content = hero;
        if (crash && crash[0] === x && crash[1] === y) { cls += ' crash'; content = '💥'; }
        if (isHero && isGoal) { cls += ' win'; content = hero; }
        cells += `<div class="${cls}">${content}</div>`;
      }
    }
    const desc = `ตาราง ${w} คอลัมน์ ${h} แถว ตัวละครอยู่คอลัมน์ ${p[0] + 1} แถว ${p[1] + 1} เป้าหมายอยู่คอลัมน์ ${g.goal[0] + 1} แถว ${g.goal[1] + 1}`;
    return `<div class="board" style="--cols:${w}" role="img" aria-label="${desc}">${cells}</div>`;
  }

  /* จำลองการเดินตามโปรแกรม prog = [{d:'R', n:2}] คืนค่าแต่ละก้าวและผลลัพธ์ */
  function simulate(g, prog) {
    const steps = [];
    prog.forEach((b, k) => { for (let n = 0; n < b.n; n++) steps.push({ d: b.d, k }); });
    let p = g.start.slice();
    const path = [];
    for (const st of steps) {
      const nx = p[0] + MOVE[st.d][0];
      const ny = p[1] + MOVE[st.d][1];
      const out = nx < 0 || ny < 0 || nx >= g.size[0] || ny >= g.size[1];
      const hit = !out && (g.rocks || []).some((r) => r[0] === nx && r[1] === ny);
      if (out || hit) {
        path.push({ pos: p.slice(), k: st.k, fail: out ? 'out' : 'hit', at: [nx, ny] });
        return { path, end: p, fail: path[path.length - 1] };
      }
      p = [nx, ny];
      path.push({ pos: p.slice(), k: st.k });
    }
    return { path, end: p, fail: null };
  }

  /* จำนวนคำสั่งน้อยที่สุดที่พาไปถึงเป้าหมาย (maxRepeat = 1 คือไม่มีทำซ้ำ) */
  function minBlocks(g, maxRepeat) {
    const [w, h] = g.size;
    const key = (x, y) => `${x},${y}`;
    const blocked = new Set((g.rocks || []).map((r) => key(r[0], r[1])));
    const dist = { [key(g.start[0], g.start[1])]: 0 };
    const queue = [g.start];
    while (queue.length) {
      const [x, y] = queue.shift();
      const d0 = dist[key(x, y)];
      if (x === g.goal[0] && y === g.goal[1]) return d0;
      for (const m of Object.values(MOVE)) {
        for (let n = 1; n <= maxRepeat; n++) {
          const nx = x + m[0] * n;
          const ny = y + m[1] * n;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || blocked.has(key(nx, ny))) break;
          if (dist[key(nx, ny)] === undefined) {
            dist[key(nx, ny)] = d0 + 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
    return Infinity;
  }

  window.Kit = { ARROW, MOVE, DIR_TH, esc, shuffle, reduceMotion, block, input, FLAG, hat, loop, script, boardHTML, simulate, minBlocks };
})();
