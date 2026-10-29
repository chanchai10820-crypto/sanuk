/*
 * เกมฝึกทักษะ 8 เกม แต่ละเกมมี
 *   id, unit, title, desc, emoji
 *   mount(root, ctx)   วาดเกมลงใน root  ctx = { data (บันทึกได้), save(), leave(fn) }
 *   summary(data)      { stars, max } ใช้แสดงดาวในหน้ารวมเกม
 */
(function () {
  'use strict';

  const K = window.Kit;
  const { esc, shuffle, ARROW, DIR_TH } = K;

  const starRow = (n, max) => {
    max = max || 3;
    let h = '';
    for (let i = 0; i < max; i++) h += `<i class="${i < n ? 'on' : ''}">★</i>`;
    return `<span class="stars" role="img" aria-label="ได้ ${n} จาก ${max} ดาว">${h}</span>`;
  };
  const hearts = (n, max) => {
    let h = '';
    for (let i = 0; i < max; i++) h += `<i class="${i < n ? 'on' : ''}">♥</i>`;
    return `<span class="hearts" role="img" aria-label="เหลือหัวใจ ${n} ดวง">${h}</span>`;
  };
  // ผูกเหตุการณ์คลิกแบบ delegation บน root ครั้งเดียว
  function bind(root, handlers) {
    root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-g]');
      if (!el || !root.contains(el) || el.disabled || !handlers[el.dataset.g]) return;
      handlers[el.dataset.g](el, e);
    });
  }
  const sumLevels = (data, n) => {
    const lv = (data && data.lv) || {};
    let s = 0;
    for (let i = 0; i < n; i++) s += lv[i] || 0;
    return { stars: s, max: n * 3 };
  };
  const bestOf = (data) => ({ stars: (data && data.best) || 0, max: 3 });
  function keepBest(ctx, stars, extra) {
    const d = ctx.data;
    d.plays = (d.plays || 0) + 1;
    if (!d.best || stars > d.best) d.best = stars;
    Object.assign(d, extra || {});
    ctx.save();
  }
  function endScreen(title, sub, stars, again) {
    return `<div class="g-end">
  ${starRow(stars)}
  <h2>${title}</h2>
  <p>${sub}</p>
  <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-g="${again}">เล่นอีกครั้ง</button><a class="btn ghost" href="#games">เลือกเกมอื่น</a></div>
</div>`;
  }

  /* ════════ 1. แมวหาปลา ════════ */
  const CAT_LEVELS = [
    { size: [4, 3], start: [0, 1], goal: [3, 1], rocks: [], tip: 'เดินไปทางขวาให้ถึงปลา' },
    { size: [4, 4], start: [0, 0], goal: [3, 3], rocks: [[1, 1], [2, 2]], tip: 'อ้อมก้อนหินนะ' },
    { size: [5, 4], start: [0, 0], goal: [4, 0], rocks: [[2, 0], [2, 1], [2, 2]], tip: 'กำแพงหินขวางอยู่ ต้องลงไปอ้อมข้างล่าง' },
    { size: [5, 5], start: [0, 0], goal: [4, 4], rocks: [[1, 0], [1, 1], [1, 2], [3, 2], [3, 3], [3, 4]], tip: 'ทางคดเคี้ยว ค่อย ๆ นับช่อง' },
    { size: [6, 3], start: [0, 0], goal: [5, 2], rocks: [], loops: true, tip: 'ด่านนี้ใช้ทำซ้ำได้ ลองใช้ ×5' },
    { size: [6, 4], start: [0, 3], goal: [5, 0], rocks: [[1, 3], [1, 2], [1, 1]], loops: true, tip: 'ขึ้นไปก่อน แล้วค่อยไปทางขวา' },
    { size: [6, 5], start: [0, 0], goal: [5, 4], rocks: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 0]], loops: true, tip: 'หาช่องว่างของกำแพง' },
    { size: [7, 5], start: [0, 4], goal: [6, 4], rocks: [[1, 4], [1, 3], [1, 2], [1, 1], [3, 0], [3, 1], [3, 2], [3, 3], [5, 4], [5, 3], [5, 2], [5, 1]], loops: true, tip: 'เดินซิกแซกขึ้นลง' }
  ];
  CAT_LEVELS.forEach((l) => { l.par = K.minBlocks(l, l.loops ? 5 : 1); });

  function mountCat(root, ctx) {
    const d = ctx.data;
    d.lv = d.lv || {};
    let cur = Math.min(Object.keys(d.lv).length, CAT_LEVELS.length - 1);
    let g = { prog: [], times: 1, pos: null, trail: [], crash: null, runIdx: -1, running: false, fb: null, won: 0 };
    let timer = null;
    ctx.leave(() => clearTimeout(timer));
    const unlocked = (i) => i === 0 || d.lv[i - 1] > 0;

    function render() {
      const L = CAT_LEVELS[cur];
      const lv = CAT_LEVELS.map((x, i) => `<button type="button" class="g-lv${i === cur ? ' cur' : ''}" data-g="level" data-i="${i}"${unlocked(i) ? '' : ' disabled'} aria-label="ด่าน ${i + 1}${unlocked(i) ? '' : ' ล็อกอยู่'}"><b>${unlocked(i) ? i + 1 : '🔒'}</b>${starRow(d.lv[i] || 0)}</button>`).join('');
      const prog = g.prog.map((b, k) => `<button type="button" class="${b.n > 1 ? 'loop' : ''}${g.runIdx === k ? ' run' : ''}" data-g="del" data-k="${k}" aria-label="ลบคำสั่ง ${DIR_TH[b.d]} ${b.n} ครั้ง"${g.running || g.won ? ' disabled' : ''}>${ARROW[b.d]}${b.n > 1 ? `<small>×${b.n}</small>` : ''}</button>`).join('');
      const pad = ['U', 'L', 'D', 'R'].map((dd) => `<button type="button" data-g="add" data-d="${dd}" aria-label="เพิ่มคำสั่ง ${DIR_TH[dd]}"${g.running || g.won ? ' disabled' : ''}>${ARROW[dd]}</button>`).join('');
      const times = L.loops ? `<div class="times"><span>ทำซ้ำ</span>${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${g.times === n ? 'on' : ''}" data-g="times" data-n="${n}" aria-pressed="${g.times === n}">×${n}</button>`).join('')}</div>` : '';
      const fb = g.won
        ? `<div class="feedback ok g-win">${starRow(g.won)} <span>ถึงปลาแล้ว! ใช้ ${g.prog.length} คำสั่ง ${g.won === 3 ? 'สุดยอด ใช้คำสั่งน้อยที่สุด!' : `ลองใช้ให้น้อยลงเหลือ ${L.par} คำสั่ง จะได้ 3 ดาว`}</span></div>
           <div class="row">${cur < CAT_LEVELS.length - 1 ? `<button type="button" class="btn primary" data-g="level" data-i="${cur + 1}">ด่านถัดไป →</button>` : '<a class="btn primary" href="#games">ผ่านครบทุกด่านแล้ว!</a>'}<button type="button" class="btn ghost" data-g="retry">เล่นด่านนี้อีกครั้ง</button></div>`
        : g.fb ? `<p class="feedback ${g.fb.cls}">${g.fb.msg}</p>` : '';
      root.innerHTML = `
<div class="g-levels" aria-label="เลือกด่าน">${lv}</div>
<section class="panel g-stage">
  <div class="g-head"><h2>ด่าน ${cur + 1}</h2><span class="chip">${L.loops ? 'ใช้ทำซ้ำได้' : 'ไม่มีทำซ้ำ'} · 3 ดาวเมื่อใช้ ${L.par} คำสั่ง</span></div>
  <p class="muted">${L.tip}</p>
  <div class="gridex">
    ${K.boardHTML(L, g.pos, g.trail, g.crash)}
    <div class="ctrl">
      <div class="pad">${pad}</div>
      ${times}
      <div class="prog" aria-label="โปรแกรมของฉัน">${prog || '<span class="empty">กดลูกศรเพื่อเพิ่มคำสั่ง แตะคำสั่งเพื่อลบ</span>'}</div>
      <div class="row">
        <button type="button" class="btn primary" data-g="run"${g.prog.length && !g.running && !g.won ? '' : ' disabled'}>▶ เริ่มเดิน</button>
        <button type="button" class="btn ghost" data-g="clear"${g.prog.length && !g.running && !g.won ? '' : ' disabled'}>ล้างคำสั่ง</button>
      </div>
    </div>
  </div>
  <div aria-live="polite">${fb}</div>
</section>`;
    }
    function reset() { g = { prog: [], times: g.times, pos: null, trail: [], crash: null, runIdx: -1, running: false, fb: null, won: 0 }; }
    function run() {
      const L = CAT_LEVELS[cur];
      const sim = K.simulate(L, g.prog);
      g.pos = L.start.slice();
      g.trail = [L.start.slice()];
      g.crash = null;
      g.fb = null;
      g.running = true;
      let s = 0;
      const delay = K.reduceMotion ? 60 : 320;
      const tick = () => {
        if (s >= sim.path.length) return finish();
        const st = sim.path[s];
        g.runIdx = st.k;
        if (st.fail) {
          if (st.fail === 'hit') g.crash = st.at;
          return finish(st);
        }
        g.pos = st.pos;
        g.trail.push(st.pos);
        s++;
        render();
        timer = setTimeout(tick, delay);
      };
      const finish = (fail) => {
        g.running = false;
        if (fail) {
          g.fb = { cls: 'bad', msg: `${fail.fail === 'hit' ? 'โอ๊ะ! ชนก้อนหิน' : 'โอ๊ะ! เดินออกนอกตาราง'} ที่คำสั่งที่ ${fail.k + 1} (กรอบเหลือง) แตะคำสั่งนั้นเพื่อลบแล้วแก้ใหม่` };
        } else if (sim.end[0] !== L.goal[0] || sim.end[1] !== L.goal[1]) {
          g.runIdx = -1;
          g.fb = { cls: 'bad', msg: 'ยังไปไม่ถึงปลา เพิ่มคำสั่งต่อจากเดิม แล้วกดเริ่มเดินใหม่' };
        } else {
          g.runIdx = -1;
          const used = g.prog.length;
          g.won = used <= L.par ? 3 : used <= L.par + 2 ? 2 : 1;
          if (!d.lv[cur] || g.won > d.lv[cur]) d.lv[cur] = g.won;
          ctx.save();
        }
        render();
      };
      render();
      timer = setTimeout(tick, delay);
    }
    bind(root, {
      level(el) { cur = Number(el.dataset.i); clearTimeout(timer); reset(); render(); },
      retry() { reset(); render(); },
      add(el) { const L = CAT_LEVELS[cur]; g.prog.push({ d: el.dataset.d, n: L.loops ? g.times : 1 }); g.pos = null; g.trail = []; g.crash = null; g.fb = null; g.runIdx = -1; render(); },
      times(el) { g.times = Number(el.dataset.n); render(); },
      del(el) { g.prog.splice(Number(el.dataset.k), 1); g.pos = null; g.trail = []; g.crash = null; g.fb = null; g.runIdx = -1; render(); },
      clear() { reset(); render(); },
      run
    });
    render();
  }

  /* ════════ 2. ทายเลขในใจ ════════ */
  const GUESS = [
    { n: 20, label: 'ง่าย', opt: 5 },
    { n: 50, label: 'ปานกลาง', opt: 6 },
    { n: 100, label: 'ยาก', opt: 7 }
  ];
  function mountGuess(root, ctx) {
    const d = ctx.data;
    d.lv = d.lv || {};
    let li = 0;
    let st;
    const start = () => {
      const n = GUESS[li].n;
      st = { secret: 1 + Math.floor(Math.random() * n), lo: 1, hi: n, tries: [], done: 0 };
    };
    function render() {
      const G = GUESS[li];
      const cells = [];
      for (let i = 1; i <= G.n; i++) {
        const out = i < st.lo || i > st.hi;
        const tried = st.tries.find((t) => t.v === i);
        const win = st.done && i === st.secret;
        cells.push(`<button type="button" class="num-cell${out ? ' out' : ''}${tried ? ' tried' : ''}${win ? ' win' : ''}" data-g="guess" data-v="${i}"${out || st.done ? ' disabled' : ''} aria-label="ทาย ${i}">${i}</button>`);
      }
      const mid = Math.floor((st.lo + st.hi) / 2);
      const hist = st.tries.map((t) => `<span class="chip ${t.r === 0 ? 'ok' : ''}">${t.v} ${t.r > 0 ? '⬆ มากกว่านี้' : t.r < 0 ? '⬇ น้อยกว่านี้' : '✓ ถูกต้อง'}</span>`).join('');
      const end = st.done
        ? `<div class="feedback ok g-win">${starRow(st.done)} <span>ถูกต้อง! เลขในใจคือ ${st.secret} ใช้ ${st.tries.length} ครั้ง ${st.done === 3 ? 'เก่งมาก ทายแบบแบ่งครึ่งได้ดีเยี่ยม' : `ถ้าทายตรงกลางทุกครั้ง จะใช้ไม่เกิน ${G.opt} ครั้ง`}</span></div>
           <div class="row"><button type="button" class="btn primary" data-g="again">เล่นอีกครั้ง</button></div>`
        : '';
      root.innerHTML = `
<div class="g-levels">${GUESS.map((x, i) => `<button type="button" class="g-lv${i === li ? ' cur' : ''}" data-g="lvl" data-i="${i}"><b>${x.label} 1–${x.n}</b>${starRow(d.lv[i] || 0)}</button>`).join('')}</div>
<section class="panel g-stage">
  <div class="g-head"><h2>น้องสนุกคิดเลขไว้ระหว่าง 1 ถึง ${G.n}</h2><span class="chip">ทายแล้ว ${st.tries.length} ครั้ง</span></div>
  <p class="muted">แตะตัวเลขเพื่อทาย น้องสนุกจะบอกว่าเลขในใจมากกว่าหรือน้อยกว่า ตัวเลขที่ตัดทิ้งได้จะเป็นสีจาง</p>
  ${st.done ? '' : `<p class="g-hint">ช่วงที่เหลือ: <b>${st.lo}–${st.hi}</b> · ตรงกลางคือ <b>${mid}</b></p>`}
  <div class="num-grid" style="--cols:10">${cells.join('')}</div>
  <div class="row g-hist" aria-live="polite">${hist}</div>
  ${end}
</section>`;
    }
    bind(root, {
      lvl(el) { li = Number(el.dataset.i); start(); render(); },
      again() { start(); render(); },
      guess(el) {
        const v = Number(el.dataset.v);
        const r = v < st.secret ? 1 : v > st.secret ? -1 : 0;
        st.tries.push({ v, r });
        if (r > 0) st.lo = v + 1;
        if (r < 0) st.hi = v - 1;
        if (r === 0) {
          const n = st.tries.length;
          const opt = GUESS[li].opt;
          st.done = n <= opt ? 3 : n <= opt + 2 ? 2 : 1;
          if (!d.lv[li] || st.done > d.lv[li]) d.lv[li] = st.done;
          ctx.save();
        }
        render();
      }
    });
    start();
    render();
  }

  /* ════════ 3. เต่าวาดรูป ════════ */
  // ทิศ: 0 = ขึ้น, 90 = ขวา (หมุนตามเข็มนาฬิกาเหมือน Scratch)  พื้นที่วาด 8 × 6 ช่อง
  const TURTLE = [
    { name: 'เส้นตรง', start: [2, 3], dir: 90, loop: false, sol: { rep: 1, body: [['F', 4]] } },
    { name: 'ตัวแอล', start: [2, 1], dir: 180, loop: false, sol: { rep: 1, body: [['F', 3], ['L', 90], ['F', 3]] } },
    { name: 'สี่เหลี่ยมจัตุรัส', start: [3, 5], dir: 0, loop: false, sol: { rep: 1, body: [['F', 3], ['R', 90], ['F', 3], ['R', 90], ['F', 3], ['R', 90], ['F', 3]] } },
    { name: 'สี่เหลี่ยมด้วยทำซ้ำ', start: [3, 5], dir: 0, loop: true, sol: { rep: 4, body: [['F', 3], ['R', 90]] } },
    { name: 'สามเหลี่ยม', start: [2, 2], dir: 90, loop: true, sol: { rep: 3, body: [['F', 3], ['R', 120]] } },
    { name: 'สี่เหลี่ยมผืนผ้า', start: [2, 5], dir: 90, loop: true, sol: { rep: 2, body: [['F', 4], ['L', 90], ['F', 2], ['L', 90]] } },
    { name: 'บันได', start: [1, 5], dir: 90, loop: true, sol: { rep: 3, body: [['F', 1], ['L', 90], ['F', 1], ['R', 90]] } },
    { name: 'หกเหลี่ยม', start: [2, 4.7], dir: 90, loop: true, sol: { rep: 6, body: [['F', 2], ['L', 60]] } }
  ];
  const T_W = 8;
  const T_H = 6;
  function turtleRun(L, prog) {
    let x = L.start[0];
    let y = L.start[1];
    let h = L.dir;
    const pieces = [];
    const frames = [{ x, y, h }];
    for (let r = 0; r < prog.rep; r++) {
      for (const [c, v] of prog.body) {
        if (c === 'F') {
          for (let k = 0; k < v; k++) {
            const nx = x + Math.sin((h * Math.PI) / 180);
            const ny = y - Math.cos((h * Math.PI) / 180);
            pieces.push([x, y, nx, ny]);
            x = nx; y = ny;
            frames.push({ x, y, h, piece: pieces.length });
          }
        } else {
          h = (h + (c === 'R' ? v : -v) + 360) % 360;
          frames.push({ x, y, h, piece: pieces.length });
        }
      }
    }
    return { pieces, frames };
  }
  const pieceKey = (p) => {
    const a = `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    const b = `${p[2].toFixed(2)},${p[3].toFixed(2)}`;
    return a < b ? a + '|' + b : b + '|' + a;
  };
  const sameDrawing = (A, B) => {
    const sa = new Set(A.map(pieceKey));
    const sb = new Set(B.map(pieceKey));
    if (sa.size !== sb.size) return false;
    for (const k of sa) if (!sb.has(k)) return false;
    return true;
  };
  const blockCount = (p, loop) => p.body.length + (loop ? 1 : 0);

  function mountTurtle(root, ctx) {
    const d = ctx.data;
    d.lv = d.lv || {};
    let cur = Math.min(Object.keys(d.lv).length, TURTLE.length - 1);
    let prog = { rep: 1, body: [] };
    let state = { frame: null, won: 0, fb: null, running: false };
    let timer = null;
    ctx.leave(() => clearTimeout(timer));
    const unlocked = (i) => i === 0 || d.lv[i - 1] > 0;

    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
    function draw(canvas, L, upto) {
      const W = canvas.clientWidth || 400;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = (W * T_H / T_W) * dpr;
      const c = canvas.getContext('2d');
      const u = canvas.width / T_W;
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = css('--line');
      for (let i = 0; i <= T_W; i++) for (let j = 0; j <= T_H; j++) { c.beginPath(); c.arc(i * u, j * u, 1.6 * dpr, 0, 7); c.fill(); }
      const line = (ps, color, width, dash) => {
        c.strokeStyle = color; c.lineWidth = width * dpr; c.lineCap = 'round'; c.setLineDash(dash ? dash.map((v) => v * dpr) : []);
        c.beginPath();
        ps.forEach((p) => { c.moveTo(p[0] * u, p[1] * u); c.lineTo(p[2] * u, p[3] * u); });
        c.stroke();
      };
      line(turtleRun(L, L.sol).pieces, css('--muted'), 3, [6, 7]);
      if (upto) {
        const run = turtleRun(L, prog);
        line(run.pieces.slice(0, upto.piece || 0), css('--accent'), 6);
      }
      const f = upto || { x: L.start[0], y: L.start[1], h: L.dir };
      c.save();
      c.translate(f.x * u, f.y * u);
      c.rotate((f.h * Math.PI) / 180);
      c.setLineDash([]);
      c.fillStyle = css('--u4');
      c.strokeStyle = css('--ink');
      c.lineWidth = 2 * dpr;
      c.beginPath(); c.moveTo(0, -u * 0.32); c.lineTo(u * 0.22, u * 0.2); c.lineTo(-u * 0.22, u * 0.2); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }

    const sel = (vals, v, k, unit) => `<select data-k="${k}" aria-label="ค่า">${vals.map((x) => `<option value="${x}"${x === v ? ' selected' : ''}>${x}</option>`).join('')}</select>${unit}`;
    function blockHTML(b, k) {
      const [c, v] = b;
      const lock = state.running || state.won ? ' disabled' : '';
      const inner = c === 'F'
        ? `เดินหน้า ${sel([1, 2, 3, 4, 5], v, k, ' ช่อง')}`
        : `หัน ${c === 'R' ? '↻ ขวา' : '↺ ซ้าย'} ${sel([30, 45, 60, 90, 120], v, k, ' องศา')}`;
      return `<div class="sb-b sb-motion t-blk">${inner}<button type="button" class="t-x" data-g="del" data-k="${k}" aria-label="ลบบล็อก"${lock}>×</button></div>`;
    }
    function render() {
      const L = TURTLE[cur];
      const solN = blockCount(L.sol, L.loop);
      const body = prog.body.map(blockHTML).join('') || '<p class="muted t-empty">กดปุ่มด้านล่างเพื่อเพิ่มบล็อก</p>';
      const script = L.loop
        ? `<div class="sb-c"><div class="sb-chead">ทำซ้ำ <select data-rep aria-label="จำนวนครั้ง">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option${n === prog.rep ? ' selected' : ''}>${n}</option>`).join('')}</select> ครั้ง</div><div class="sb-cbody">${body}</div><div class="sb-cfoot"></div></div>`
        : body;
      const lock = state.running || state.won ? ' disabled' : '';
      const fb = state.won
        ? `<div class="feedback ok g-win">${starRow(state.won)} <span>วาดได้ตรงเส้นประ! ใช้ ${blockCount(prog, L.loop)} บล็อก ${state.won === 3 ? 'ยอดเยี่ยม!' : `ลองใช้ให้เหลือ ${solN} บล็อก`}</span></div>
           <div class="row">${cur < TURTLE.length - 1 ? `<button type="button" class="btn primary" data-g="level" data-i="${cur + 1}">รูปถัดไป →</button>` : '<a class="btn primary" href="#games">วาดครบทุกรูปแล้ว!</a>'}<button type="button" class="btn ghost" data-g="retry">วาดรูปนี้อีกครั้ง</button></div>`
        : state.fb ? `<p class="feedback ${state.fb.cls}">${state.fb.msg}</p>` : '';
      root.innerHTML = `
<div class="g-levels">${TURTLE.map((x, i) => `<button type="button" class="g-lv${i === cur ? ' cur' : ''}" data-g="level" data-i="${i}"${unlocked(i) ? '' : ' disabled'}><b>${unlocked(i) ? i + 1 : '🔒'}</b>${starRow(d.lv[i] || 0)}</button>`).join('')}</div>
<section class="panel g-stage">
  <div class="g-head"><h2>${cur + 1}. ${L.name}</h2><span class="chip">3 ดาวเมื่อใช้ ${solN} บล็อก</span></div>
  <p class="muted">ต่อบล็อกให้เต่าสีเขียววาดทับเส้นประให้ครบ${L.loop ? ' ด่านนี้มีบล็อกทำซ้ำให้ใช้' : ''}</p>
  <div class="turtle">
    <canvas class="t-canvas" aria-label="พื้นที่วาดรูป ${L.name}"></canvas>
    <div class="t-side">
      <div class="sb t-script">${script}</div>
      <div class="row t-palette">
        <button type="button" class="sb-b sb-motion" data-g="add" data-c="F"${lock}>+ เดินหน้า</button>
        <button type="button" class="sb-b sb-motion" data-g="add" data-c="R"${lock}>+ หัน ↻ ขวา</button>
        <button type="button" class="sb-b sb-motion" data-g="add" data-c="L"${lock}>+ หัน ↺ ซ้าย</button>
      </div>
      <div class="row">
        <button type="button" class="btn primary" data-g="run"${prog.body.length && !state.running && !state.won ? '' : ' disabled'}>▶ วาด</button>
        <button type="button" class="btn ghost" data-g="clear"${prog.body.length && !state.running && !state.won ? '' : ' disabled'}>ล้าง</button>
      </div>
    </div>
  </div>
  <div aria-live="polite">${fb}</div>
</section>`;
      root.querySelectorAll('.t-script select').forEach((s) => { if (state.running || state.won) s.disabled = true; });
      draw(root.querySelector('canvas'), L, state.frame);
    }
    function reset() { prog = { rep: 1, body: [] }; state = { frame: null, won: 0, fb: null, running: false }; }
    root.addEventListener('change', (e) => {
      const s = e.target;
      if (s.matches('[data-rep]')) prog.rep = Number(s.value);
      else if (s.dataset.k !== undefined) prog.body[Number(s.dataset.k)][1] = Number(s.value);
      state.frame = null; state.fb = null;
      render();
    });
    bind(root, {
      level(el) { cur = Number(el.dataset.i); clearTimeout(timer); reset(); render(); },
      retry() { reset(); render(); },
      add(el) { if (prog.body.length >= 12) return; prog.body.push([el.dataset.c, el.dataset.c === 'F' ? 1 : 90]); state.frame = null; state.fb = null; render(); },
      del(el) { prog.body.splice(Number(el.dataset.k), 1); state.frame = null; state.fb = null; render(); },
      clear() { reset(); render(); },
      run() {
        const L = TURTLE[cur];
        const runP = turtleRun(L, prog);
        state.running = true;
        state.fb = null;
        let i = 0;
        const delay = K.reduceMotion ? 30 : 160;
        const step = () => {
          state.frame = runP.frames[i];
          i++;
          if (i < runP.frames.length) { render(); timer = setTimeout(step, delay); return; }
          state.running = false;
          const ok = sameDrawing(runP.pieces, turtleRun(L, L.sol).pieces);
          if (ok) {
            const used = blockCount(prog, L.loop);
            const sol = blockCount(L.sol, L.loop);
            state.won = used <= sol ? 3 : used <= sol + 2 ? 2 : 1;
            if (!d.lv[cur] || state.won > d.lv[cur]) d.lv[cur] = state.won;
            ctx.save();
          } else {
            state.fb = { cls: 'bad', msg: 'รูปยังไม่ตรงกับเส้นประ ลองดูว่าเดินกี่ช่อง หันไปทางไหน และหันกี่องศา' };
          }
          render();
        };
        step();
      }
    });
    render();
  }

  /* ════════ 4. นักล่าบั๊ก ════════ */
  const BUGS = [
    { goal: 'วาดรูปสี่เหลี่ยมจัตุรัส', s: [['hat'], ['loop', 'ทำซ้ำ 4 ครั้ง', [['motion', 'เคลื่อนที่ 100 ก้าว'], ['motion', 'หัน ↻ 45 องศา']]]], bug: [3], fix: 'สี่เหลี่ยมจัตุรัสต้องหัน 90 องศา' },
    { goal: 'แมวพูด "สวัสดี" ก่อน แล้วค่อยเดิน 50 ก้าว', s: [['hat'], ['motion', 'เคลื่อนที่ 50 ก้าว'], ['looks', 'พูด สวัสดี 2 วินาที']], bug: [1, 2], fix: 'ลำดับผิด ต้องสลับให้บล็อกพูดอยู่ก่อนบล็อกเคลื่อนที่' },
    { goal: 'วาดรูปสามเหลี่ยมด้านเท่า', s: [['hat'], ['loop', 'ทำซ้ำ 3 ครั้ง', [['motion', 'เคลื่อนที่ 100 ก้าว'], ['motion', 'หัน ↻ 90 องศา']]]], bug: [3], fix: 'สามเหลี่ยมด้านเท่าต้องหัน 120 องศา (3 × 120 = 360)' },
    { goal: 'กดธงเขียวแล้ว แมวพูดว่า "เหมียว"', s: [['event', 'เมื่อตัวละครนี้ถูกคลิก', true], ['looks', 'พูด เหมียว 2 วินาที']], bug: [0], fix: 'ต้องใช้บล็อก "เมื่อคลิกธงเขียว" โปรแกรมนี้จะเริ่มเมื่อคลิกที่แมวเท่านั้น' },
    { goal: 'แมวเดิน 10 ก้าว ทั้งหมด 5 ครั้ง', s: [['hat'], ['loop', 'ทำซ้ำ 3 ครั้ง', [['motion', 'เคลื่อนที่ 10 ก้าว']]]], bug: [1], fix: 'ต้องทำซ้ำ 5 ครั้ง ไม่ใช่ 3 ครั้ง' },
    { goal: 'แมวร้องเหมียว แล้วพูดว่า "หิวจัง"', s: [['hat'], ['sound', 'เล่นเสียง เหมียว'], ['looks', 'พูด สวัสดี 2 วินาที']], bug: [2], fix: 'คำพูดผิด ต้องแก้เป็น "หิวจัง"' },
    { goal: 'แมวหันไปทางขวา แล้วเดิน 100 ก้าว', s: [['hat'], ['motion', 'หันไปทิศทาง -90'], ['motion', 'เคลื่อนที่ 100 ก้าว']], bug: [1], fix: 'ทิศทาง -90 คือทางซ้าย ทางขวาคือ 90' },
    { goal: 'แมวเปลี่ยนท่าเต้นไปเรื่อย ๆ ไม่หยุด', s: [['hat'], ['loop', 'ทำซ้ำ 2 ครั้ง', [['looks', 'ชุดถัดไป'], ['control', 'รอ 0.5 วินาที']]]], bug: [1], fix: 'ต้องใช้ "ทำซ้ำตลอดไป" แมวจึงเต้นไม่หยุด' }
  ];
  function bugScript(spec, picked, reveal) {
    let i = 0;
    const cls = (k) => (reveal && reveal.includes(k) ? ' sb-found' : picked.includes(k) ? ' sb-miss' : '');
    const one = (b) => {
      const k = i++;
      if (b[0] === 'hat') return `<button type="button" class="sb-b sb-event sb-hat sb-pick${cls(k)}" data-g="pick" data-i="${k}">เมื่อคลิก ${K.FLAG}</button>`;
      if (b[0] === 'loop') {
        const head = `<button type="button" class="sb-chead sb-pick${cls(k)}" data-g="pick" data-i="${k}">${b[1]}</button>`;
        return `<div class="sb-c">${head}<div class="sb-cbody">${b[2].map(one).join('')}</div><div class="sb-cfoot"></div></div>`;
      }
      return `<button type="button" class="sb-b sb-${b[0]}${b[2] ? ' sb-hat' : ''} sb-pick${cls(k)}" data-g="pick" data-i="${k}">${b[1]}</button>`;
    };
    return `<div class="sb">${spec.map(one).join('')}</div>`;
  }
  function mountBug(root, ctx) {
    let st;
    const start = () => { st = { order: shuffle(BUGS), i: 0, hearts: 3, score: 0, picked: [], found: false }; };
    function render() {
      if (st.i >= st.order.length || st.hearts === 0) {
        const n = st.score;
        const stars = n >= 7 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0;
        if (!st.saved) { keepBest(ctx, stars, { score: Math.max(ctx.data.score || 0, n) }); st.saved = true; }
        root.innerHTML = endScreen(st.hearts === 0 ? 'หัวใจหมดแล้ว' : 'ล่าบั๊กครบทุกโปรแกรม!', `จับบั๊กได้ ${n} จาก ${st.order.length} ตัว`, stars, 'again');
        return;
      }
      const R = st.order[st.i];
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>โปรแกรมที่ ${st.i + 1} / ${st.order.length}</h2><span class="row">${hearts(st.hearts, 3)}<span class="chip">จับได้ ${st.score}</span></span></div>
  <p class="g-goal">🎯 ต้องการให้: <b>${R.goal}</b></p>
  <p class="muted">แตะบล็อกที่มีบั๊ก (บล็อกที่ทำให้ผลไม่ตรงกับที่ต้องการ)</p>
  ${bugScript(R.s, st.picked, st.found ? R.bug : null)}
  <div aria-live="polite">${st.found ? `<p class="feedback ok">🐞 จับบั๊กได้! ${R.fix}</p><div class="row"><button type="button" class="btn primary" data-g="next">โปรแกรมถัดไป →</button></div>` : st.picked.length ? '<p class="feedback bad">บล็อกนั้นไม่มีบั๊ก เสียหัวใจ 1 ดวง ลองใหม่</p>' : ''}</div>
</section>`;
    }
    bind(root, {
      pick(el) {
        if (st.found) return;
        const R = st.order[st.i];
        const k = Number(el.dataset.i);
        if (R.bug.includes(k)) { st.found = true; st.score++; }
        else if (!st.picked.includes(k)) { st.picked.push(k); st.hearts--; }
        render();
      },
      next() { st.i++; st.picked = []; st.found = false; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ 5. คัดแยกเว็บไซต์ ════════ */
  const WEBS = [
    { t: 'พยากรณ์อากาศ 7 วันทั่วประเทศไทย', u: 'www.tmd.go.th', s: 'กรมอุตุนิยมวิทยา หน่วยงานของรัฐที่ดูแลเรื่องสภาพอากาศ', ok: true, why: 'ลงท้าย .go.th เป็นหน่วยงานรัฐที่ดูแลเรื่องอากาศโดยตรง' },
    { t: 'วิธีล้างมือให้สะอาด ป้องกันเชื้อโรค', u: 'www.moph.go.th', s: 'กระทรวงสาธารณสุข', ok: true, why: 'หน่วยงานรัฐด้านสุขภาพ ให้ข้อมูลเรื่องสุขภาพโดยตรง' },
    { t: 'คลังความรู้วิทยาศาสตร์และคณิตศาสตร์', u: 'www.scimath.org', s: 'สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.)', ok: true, why: 'หน่วยงานที่จัดทำหนังสือเรียนวิทยาศาสตร์ของไทย' },
    { t: 'สารานุกรมไทยสำหรับเยาวชน', u: 'www.saranukromthai.or.th', s: 'สารานุกรมที่ผู้เชี่ยวชาญแต่ละด้านช่วยกันเขียน', ok: true, why: 'เขียนโดยผู้เชี่ยวชาญ บอกที่มาชัดเจน' },
    { t: 'ความรู้ดาราศาสตร์ ดวงดาว และท้องฟ้า', u: 'www.narit.or.th', s: 'สถาบันวิจัยดาราศาสตร์แห่งชาติ', ok: true, why: 'หน่วยงานด้านดาราศาสตร์โดยตรง' },
    { t: 'ยินดีด้วย! คุณได้รับแท็บเล็ตฟรี กดรับภายใน 1 นาที', u: 'win-free-prize.xyz', s: 'กรอกชื่อ ที่อยู่ และเบอร์โทรเพื่อรับรางวัล', ok: false, why: 'แจกของฟรี เร่งให้รีบ และขอข้อมูลส่วนตัว เป็นการหลอกลวง' },
    { t: 'กินผักบุ้งวันละจาน สายตาดีขึ้น 100% ใน 1 วัน!!', u: 'viral-news-123.net', s: 'แชร์ด่วน! ไม่บอกชื่อผู้เขียน', ok: false, why: 'ข้อความเกินจริง ไม่บอกผู้เขียน และชวนให้รีบแชร์' },
    { t: 'โหลดเกมฟรี ปลดล็อกทุกด่าน', u: 'free-game-hack.biz', s: 'ใส่รหัสผ่านบัญชีเกมของคุณเพื่อปลดล็อก', ok: false, why: 'ขอรหัสผ่าน และชวนโกงเกม' },
    { t: 'ประเทศไทยมี 50 จังหวัด', u: 'my-old-notes.net', s: 'ผู้เขียน: ไม่ระบุ · อัปเดต: นานมากแล้ว', ok: false, why: 'ไม่บอกผู้เขียน ข้อมูลเก่าและผิด (ไทยมี 76 จังหวัด กับกรุงเทพมหานคร)' },
    { t: 'แจกเหรียญเกม 10,000 เหรียญ แค่บอกรหัสผ่าน', u: 'coins-for-kids.click', s: 'รับทันที ไม่ต้องบอกผู้ปกครอง', ok: false, why: 'ไม่มีเว็บที่ดีขอรหัสผ่านเพื่อแจกของ และชวนปิดบังผู้ปกครอง' }
  ];
  function mountWeb(root, ctx) {
    let st;
    const start = () => { st = { order: shuffle(WEBS), i: 0, score: 0, ans: null }; };
    function render() {
      if (st.i >= st.order.length) {
        const n = st.score;
        const stars = n >= 10 ? 3 : n >= 8 ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars, { score: Math.max(ctx.data.score || 0, n) }); st.saved = true; }
        root.innerHTML = endScreen('คัดแยกครบแล้ว!', `ตอบถูก ${n} จาก ${st.order.length} เว็บไซต์`, stars, 'again');
        return;
      }
      const W = st.order[st.i];
      const done = st.ans !== null;
      const right = done && st.ans === W.ok;
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>เว็บที่ ${st.i + 1} / ${st.order.length}</h2><span class="chip">ถูก ${st.score}</span></div>
  <p class="muted">อ่านผลการค้นหานี้ แล้วเลือกว่าน่าเชื่อถือหรือไม่</p>
  <div class="serp big">
    <p class="serp-url">${esc(W.u)}</p>
    <p class="serp-title">${esc(W.t)}</p>
    <p class="serp-desc">${esc(W.s)}</p>
  </div>
  <div class="row web-btns">
    <button type="button" class="opt${done && W.ok ? ' right' : ''}${done && st.ans === true && !W.ok ? ' wrong' : ''}" data-g="ans" data-v="1"${done ? ' disabled' : ''}><span class="k">✓</span><span>น่าเชื่อถือ</span></button>
    <button type="button" class="opt${done && !W.ok ? ' right' : ''}${done && st.ans === false && W.ok ? ' wrong' : ''}" data-g="ans" data-v="0"${done ? ' disabled' : ''}><span class="k">✗</span><span>ไม่น่าเชื่อถือ</span></button>
  </div>
  <div aria-live="polite">${done ? `<p class="feedback ${right ? 'ok' : 'bad'}">${right ? 'ถูกต้อง!' : 'ยังไม่ถูก'} ${W.why}</p><div class="row"><button type="button" class="btn primary" data-g="next">ต่อไป →</button></div>` : ''}</div>
</section>`;
    }
    bind(root, {
      ans(el) { const W = st.order[st.i]; st.ans = el.dataset.v === '1'; if (st.ans === W.ok) st.score++; render(); },
      next() { st.i++; st.ans = null; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ 6. นักสำรวจข้อมูล ════════ */
  const FRUITS = [['🥭', 'มะม่วง'], ['🍌', 'กล้วย'], ['🍊', 'ส้ม'], ['🍉', 'แตงโม']];
  const tallyHTML = (n) => {
    let s = '';
    for (let i = 0; i < Math.floor(n / 5); i++) s += '<s>||||</s> ';
    s += '|'.repeat(n % 5);
    return s || '<span class="muted">–</span>';
  };
  function mountData(root, ctx) {
    let st;
    function start() {
      let counts;
      // สุ่มจำนวนจนกว่าจะมีค่ามากที่สุดและน้อยที่สุดเพียงชนิดเดียว คำถามจะได้มีคำตอบเดียว
      const unique = (c, v) => c.filter((x) => x === v).length === 1;
      do counts = FRUITS.map(() => 1 + Math.floor(Math.random() * 7));
      while (!unique(counts, Math.max(...counts)) || !unique(counts, Math.min(...counts)));
      const items = [];
      counts.forEach((c, k) => { for (let i = 0; i < c; i++) items.push(k); });
      while (items.length < 30) items.push(-1);
      const maxK = counts.indexOf(Math.max(...counts));
      const minK = counts.indexOf(Math.min(...counts));
      const diff = counts[maxK] - counts[minK];
      const dOpts = shuffle([...new Set([diff, diff + 1, diff + 2, Math.max(1, diff - 1)])].slice(0, 4));
      st = {
        counts, scene: shuffle(items), marked: {}, phase: 1, mistakes: 0,
        tally: FRUITS.map(() => 0), bars: FRUITS.map(() => 0), wrong: null,
        q: [
          { q: 'ผลไม้ชนิดใดมีจำนวนมากที่สุด', opts: shuffle(FRUITS.map((f, k) => k)).map((k) => ({ t: FRUITS[k][1], ok: k === maxK })) },
          { q: `${FRUITS[maxK][1]}มีมากกว่า${FRUITS[minK][1]}กี่ผล`, opts: dOpts.map((v) => ({ t: `${v} ผล`, ok: v === diff })) }
        ],
        qi: 0, qWrong: null
      };
    }
    function render() {
      const P = st.phase;
      const steps = ['นับและขีด', 'สร้างแผนภูมิ', 'ตอบคำถาม'].map((t, i) => `<span class="chip${P > i + 1 ? ' ok' : P === i + 1 ? ' warn' : ''}">${i + 1}. ${t}</span>`).join('');
      let body = '';
      if (P === 1) {
        const scene = st.scene.map((k, i) => (k < 0 ? '<span class="sc-empty"></span>' : `<button type="button" class="sc-item${st.marked[i] ? ' marked' : ''}" data-g="mark" data-i="${i}" aria-label="${FRUITS[k][1]}${st.marked[i] ? ' นับแล้ว' : ''}">${FRUITS[k][0]}</button>`)).join('');
        const rows = FRUITS.map((f, k) => `<tr class="${st.wrong && st.wrong[k] ? 'bad-row' : ''}"><td>${f[0]} ${f[1]}</td><td class="tally">${tallyHTML(st.tally[k])}</td>
<td class="num"><span class="stepper"><button type="button" data-g="tally" data-k="${k}" data-d="-1" aria-label="ลด ${f[1]}">−</button><b>${st.tally[k]}</b><button type="button" data-g="tally" data-k="${k}" data-d="1" aria-label="เพิ่ม ${f[1]}">+</button></span></td></tr>`).join('');
        body = `<p class="muted">นับผลไม้ในตะกร้า แตะผลไม้เพื่อทำเครื่องหมายว่านับแล้ว แล้วกด + เพื่อขีดรอยขีดในตาราง</p>
<div class="scene">${scene}</div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ผลไม้</th><th>รอยขีด</th><th class="num">จำนวน</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="row"><button type="button" class="btn primary" data-g="check1">ตรวจการนับ</button></div>`;
      } else if (P === 2) {
        const top = 8;
        const bars = FRUITS.map((f, k) => `<div class="bb"><div class="bb-track"><div class="bb-bar${st.wrong && st.wrong[k] ? ' bad' : ''}" style="height:${(st.bars[k] / top) * 100}%"><b>${st.bars[k]}</b></div></div>
<span class="stepper"><button type="button" data-g="bar" data-k="${k}" data-d="-1" aria-label="ลดแท่ง ${f[1]}">−</button><button type="button" data-g="bar" data-k="${k}" data-d="1" aria-label="เพิ่มแท่ง ${f[1]}">+</button></span><span>${f[0]} ${f[1]}</span></div>`).join('');
        body = `<p class="muted">ปรับความสูงของแท่งให้ตรงกับจำนวนที่นับได้ (${FRUITS.map((f, k) => `${f[1]} ${st.counts[k]}`).join(', ')})</p>
<figure class="bb-chart" style="margin:0"><figcaption><b>ผลไม้ในตะกร้า</b> (หน่วย: ผล)</figcaption><div class="bb-grid">${bars}</div></figure>
<div class="row"><button type="button" class="btn primary" data-g="check2">ตรวจแผนภูมิ</button></div>`;
      } else if (P === 3) {
        const Q = st.q[st.qi];
        body = `<p class="g-goal">${Q.q}</p><div class="opts">${Q.opts.map((o, i) => `<button type="button" class="opt${st.qWrong === i ? ' wrong' : ''}" data-g="qa" data-i="${i}"><span class="k">${'กขคง'[i]}</span><span>${o.t}</span></button>`).join('')}</div>`;
      } else {
        const stars = st.mistakes === 0 ? 3 : st.mistakes <= 2 ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars); st.saved = true; }
        body = endScreen('สำรวจข้อมูลสำเร็จ!', `รวบรวม ประมวลผล และนำเสนอข้อมูลครบ ผิดพลาด ${st.mistakes} ครั้ง`, stars, 'again');
      }
      root.innerHTML = `<section class="panel g-stage"><div class="row g-phases">${steps}</div>${body}<div aria-live="polite">${st.msg ? `<p class="feedback ${st.msg.cls}">${st.msg.t}</p>` : ''}</div></section>`;
    }
    bind(root, {
      mark(el) { const i = Number(el.dataset.i); st.marked[i] = !st.marked[i]; st.msg = null; render(); },
      tally(el) { const k = Number(el.dataset.k); st.tally[k] = Math.max(0, Math.min(15, st.tally[k] + Number(el.dataset.d))); st.wrong = null; st.msg = null; render(); },
      bar(el) { const k = Number(el.dataset.k); st.bars[k] = Math.max(0, Math.min(8, st.bars[k] + Number(el.dataset.d))); st.wrong = null; st.msg = null; render(); },
      check1() {
        st.wrong = st.tally.map((v, k) => v !== st.counts[k]);
        if (st.wrong.some(Boolean)) { st.mistakes++; st.msg = { cls: 'bad', t: 'ยังนับไม่ถูกในแถวสีแดง ลองนับใหม่อีกครั้ง' }; }
        else { st.phase = 2; st.wrong = null; st.msg = { cls: 'ok', t: 'นับถูกต้อง! ต่อไปสร้างแผนภูมิแท่ง' }; }
        render();
      },
      check2() {
        st.wrong = st.bars.map((v, k) => v !== st.counts[k]);
        if (st.wrong.some(Boolean)) { st.mistakes++; st.msg = { cls: 'bad', t: 'แท่งสีแดงยังสูงไม่ตรงกับจำนวน' }; }
        else { st.phase = 3; st.wrong = null; st.msg = { cls: 'ok', t: 'แผนภูมิถูกต้อง! ตอบคำถามจากข้อมูล' }; }
        render();
      },
      qa(el) {
        const i = Number(el.dataset.i);
        if (st.q[st.qi].opts[i].ok) { st.qi++; st.qWrong = null; st.msg = { cls: 'ok', t: 'ถูกต้อง!' }; if (st.qi >= st.q.length) { st.phase = 4; st.msg = null; } }
        else { st.mistakes++; st.qWrong = i; st.msg = { cls: 'bad', t: 'ยังไม่ถูก ดูแผนภูมิหรือตารางอีกครั้ง' }; }
        render();
      },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ 7. ฮีโร่ปลอดภัยออนไลน์ ════════ */
  const HERO = [
    { who: 'คนแปลกหน้า', av: '🙂', msg: 'สวัสดี เราอายุเท่ากันเลย บ้านเธออยู่ที่ไหนเหรอ', o: ['บอกที่อยู่บ้าน', 'ไม่บอก แล้วเล่าให้พ่อแม่ฟัง', 'ส่งรูปหน้าบ้านให้ดู'], why: 'ที่อยู่บ้านเป็นข้อมูลส่วนตัว ห้ามบอกคนแปลกหน้า' },
    { who: 'เพื่อนในเกม', av: '🎮', msg: 'ขอรหัสผ่านหน่อย เดี๋ยวช่วยเล่นด่านยากให้', o: ['บอกรหัสผ่าน', 'ไม่บอก รหัสผ่านเป็นความลับ', 'บอกแค่ครึ่งเดียว'], why: 'รหัสผ่านต้องเป็นความลับ บอกได้แค่ผู้ปกครอง' },
    { who: 'หน้าต่างเด้ง', av: '🎁', msg: 'ยินดีด้วย! คุณได้รับโทรศัพท์ฟรี คลิกเลย!', o: ['คลิกรับรางวัล', 'ปิดหน้าต่าง ไม่คลิก', 'ส่งต่อให้เพื่อน'], why: 'ข้อความแจกของฟรีมักเป็นการหลอกลวง' },
    { who: 'กลุ่มแชตห้อง', av: '💬', msg: 'มีคนส่งรูปเพื่อนที่ตัดต่อให้ดูตลก ทุกคนหัวเราะกันใหญ่', o: ['ส่งต่อให้คนอื่นดู', 'ไม่ส่งต่อ และบอกครู', 'พิมพ์ล้อเลียนเพิ่ม'], why: 'การส่งต่อทำให้เพื่อนเสียใจ เป็นการกลั่นแกล้งออนไลน์' },
    { who: 'คนแปลกหน้า', av: '😎', msg: 'เจอกันที่ห้างวันเสาร์นะ อย่าบอกพ่อแม่ล่ะ', o: ['แอบไปคนเดียว', 'ไม่ไป และบอกพ่อแม่ทันที', 'ชวนเพื่อนไปด้วย'], why: 'ห้ามนัดเจอคนที่รู้จักทางออนไลน์ และต้องบอกผู้ใหญ่ทุกครั้ง' },
    { who: 'แอปเกม', av: '📱', msg: 'ซื้อเพชร 500 เม็ด ราคา 350 บาท กดซื้อเลย!', o: ['กดซื้อทันที', 'ขออนุญาตผู้ปกครองก่อน', 'ใช้บัตรของพ่อแม่โดยไม่บอก'], why: 'การซื้อของออนไลน์ต้องขออนุญาตผู้ปกครองก่อนเสมอ' },
    { who: 'ไม่รู้จัก', av: '⚠️', msg: 'ส่งข้อความหยาบคายและขู่เรามาหลายครั้งแล้ว', o: ['ด่ากลับให้สาสม', 'ไม่ตอบ แคปหน้าจอ บอกผู้ใหญ่ แล้วบล็อก', 'เก็บไว้คนเดียว'], why: 'หยุด เก็บหลักฐาน บอกผู้ใหญ่ที่ไว้ใจ แล้วบล็อก' },
    { who: 'ความคิดของฉัน', av: '💭', msg: 'ถ่ายรูปเพื่อนตอนทำหน้าตลกไว้ อยากโพสต์ลงอินเทอร์เน็ต', o: ['โพสต์เลยไม่ต้องถาม', 'ขออนุญาตเพื่อนก่อน', 'โพสต์แล้วแท็กทุกคน'], why: 'ต้องขออนุญาตก่อนโพสต์รูปของคนอื่น' },
    { who: 'คอมพิวเตอร์โรงเรียน', av: '🏫', msg: 'ใช้อีเมลเสร็จแล้ว กำลังจะลุกจากเครื่อง', o: ['ปิดจอเฉย ๆ', 'ออกจากระบบก่อน', 'จดรหัสผ่านไว้ข้างจอ'], why: 'ออกจากระบบทุกครั้ง ไม่ให้คนอื่นใช้บัญชีของเรา' },
    { who: 'นาฬิกา', av: '⏰', msg: 'เล่นเกมมา 2 ชั่วโมงแล้ว เกินเวลาที่ตกลงกับแม่', o: ['เล่นต่ออีกนิด', 'หยุดเล่นตามข้อตกลง', 'แอบเล่นต่อในห้อง'], why: 'ทำตามข้อตกลงการใช้อินเทอร์เน็ตกับผู้ปกครอง' }
  ];
  function mountHero(root, ctx) {
    let st;
    const start = () => {
      st = { order: shuffle(HERO).map((h) => ({ ...h, opts: shuffle(h.o.map((t, k) => ({ t, ok: k === 1 }))) })), i: 0, hearts: 3, score: 0, pick: null };
    };
    function render() {
      if (st.i >= st.order.length || st.hearts === 0) {
        const n = st.score;
        const stars = n >= 9 ? 3 : n >= 7 ? 2 : n >= 1 ? 1 : 0;
        if (!st.saved) { keepBest(ctx, stars, { score: Math.max(ctx.data.score || 0, n) }); st.saved = true; }
        root.innerHTML = endScreen(st.hearts === 0 ? 'หัวใจหมดแล้ว ลองใหม่นะ' : 'คุณคือฮีโร่ปลอดภัยออนไลน์!', `เลือกทางที่ปลอดภัยได้ ${n} จาก ${st.order.length} สถานการณ์`, stars, 'again');
        return;
      }
      const H = st.order[st.i];
      const done = st.pick !== null;
      const right = done && H.opts[st.pick].ok;
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>สถานการณ์ ${st.i + 1} / ${st.order.length}</h2><span class="row">${hearts(st.hearts, 3)}<span class="chip">คะแนน ${st.score}</span></span></div>
  <div class="chat"><span class="chat-av" aria-hidden="true">${H.av}</span><div><p class="chat-who">${H.who}</p><p class="chat-msg">${H.msg}</p></div></div>
  <p class="g-goal">ฮีโร่จะทำอย่างไร?</p>
  <div class="opts">${H.opts.map((o, i) => `<button type="button" class="opt${done && o.ok ? ' right' : ''}${done && st.pick === i && !o.ok ? ' wrong' : ''}" data-g="pick" data-i="${i}"${done ? ' disabled' : ''}><span class="k">${'กขค'[i]}</span><span>${o.t}</span></button>`).join('')}</div>
  <div aria-live="polite">${done ? `<p class="feedback ${right ? 'ok' : 'bad'}">${right ? 'ปลอดภัย!' : 'ไม่ปลอดภัย เสียหัวใจ 1 ดวง'} ${H.why}</p><div class="row"><button type="button" class="btn primary" data-g="next">ต่อไป →</button></div>` : ''}</div>
</section>`;
    }
    bind(root, {
      pick(el) { const H = st.order[st.i]; st.pick = Number(el.dataset.i); if (H.opts[st.pick].ok) st.score++; else st.hearts--; render(); },
      next() { st.i++; st.pick = null; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ 8. รหัสผ่านแข็งแรง ════════ */
  const COMMON = ['123456', '12345678', 'password', 'qwerty', '111111', 'abc123', 'iloveyou', '000000', 'abcdef'];
  function checks(p) {
    return [
      { t: 'ยาวอย่างน้อย 8 ตัว', ok: p.length >= 8 },
      { t: 'มีตัวพิมพ์ใหญ่ (A–Z)', ok: /[A-Z]/.test(p) },
      { t: 'มีตัวพิมพ์เล็ก (a–z)', ok: /[a-z]/.test(p) },
      { t: 'มีตัวเลข (0–9)', ok: /[0-9]/.test(p) },
      { t: 'มีสัญลักษณ์ เช่น ! @ # *', ok: /[^A-Za-z0-9]/.test(p) },
      { t: 'ไม่ใช่รหัสผ่านที่คนใช้บ่อย', ok: p.length > 0 && !COMMON.includes(p.toLowerCase()) && !/^(.)\1+$/.test(p) }
    ];
  }
  const STRENGTH = ['อ่อนมาก', 'อ่อนมาก', 'อ่อน', 'พอใช้', 'ดี', 'แข็งแรง', 'แข็งแรงมาก'];
  const PAIRS = [['abcdef', 'Sun7flower!'], ['password', 'Mch4wp!x'], ['nong2015', 'Bl@ckCat88'], ['qwerty', 'Rain*Drop5'], ['11111111', 'Ti9er&Tea'], ['ploy', 'Mango#Sky3']];
  function mountPass(root, ctx) {
    let st;
    let typed = '';
    const start = () => { st = { order: shuffle(PAIRS).map((p) => shuffle(p.map((t, k) => ({ t, ok: k === 1 })))), i: 0, score: 0, pick: null }; };
    function meter(p) {
      const cs = checks(p);
      const n = cs.filter((c) => c.ok).length;
      return { cs, n, label: p ? STRENGTH[n] : '–' };
    }
    function render() {
      let quiz;
      if (st.i >= st.order.length) {
        const n = st.score;
        const stars = n >= 6 ? 3 : n >= 4 ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars, { score: Math.max(ctx.data.score || 0, n) }); st.saved = true; }
        quiz = endScreen('จบรอบเปรียบเทียบ!', `เลือกรหัสผ่านที่แข็งแรงกว่าได้ถูก ${n} จาก ${st.order.length} คู่`, stars, 'again');
      } else {
        const pair = st.order[st.i];
        const done = st.pick !== null;
        quiz = `<div class="g-head"><h2>คู่ที่ ${st.i + 1} / ${st.order.length}</h2><span class="chip">ถูก ${st.score}</span></div>
<p class="g-goal">รหัสผ่านไหนแข็งแรงกว่า?</p>
<div class="row web-btns">${pair.map((o, i) => `<button type="button" class="opt pw${done && o.ok ? ' right' : ''}${done && st.pick === i && !o.ok ? ' wrong' : ''}" data-g="pick" data-i="${i}"${done ? ' disabled' : ''}><span class="k">${'กข'[i]}</span><code>${esc(o.t)}</code></button>`).join('')}</div>
<div aria-live="polite">${done ? (() => {
          const strong = pair.find((o) => o.ok).t;
          const m = meter(strong);
          return `<p class="feedback ${pair[st.pick].ok ? 'ok' : 'bad'}">${pair[st.pick].ok ? 'ถูกต้อง!' : 'ยังไม่ถูก'} <code>${esc(strong)}</code> แข็งแรงกว่า เพราะ${m.cs.filter((c) => c.ok).map((c) => c.t).join(' ')}</p><div class="row"><button type="button" class="btn primary" data-g="next">คู่ถัดไป →</button></div>`;
        })() : ''}</div>`;
      }
      const m = meter(typed);
      root.innerHTML = `
<section class="panel g-stage">${quiz}</section>
<section class="panel g-stage">
  <div class="g-head"><h2>ห้องทดลองรหัสผ่าน</h2><span class="chip warn">ห้ามพิมพ์รหัสผ่านจริง</span></div>
  <p class="muted">ลองพิมพ์รหัสผ่านตัวอย่าง แล้วดูว่าแข็งแรงแค่ไหน ข้อความที่พิมพ์ไม่ถูกบันทึกไว้ที่ใด</p>
  <label class="field" for="pw-try">รหัสผ่านตัวอย่าง<input id="pw-try" type="text" autocomplete="off" spellcheck="false" value="${esc(typed)}" placeholder="เช่น Mch4wp!"></label>
  <div class="pw-meter" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((i) => `<span class="${i <= m.n ? 'lv' + Math.min(m.n, 6) : ''}"></span>`).join('')}</div>
  <p aria-live="polite">ความแข็งแรง: <b>${m.label}</b></p>
  <ul class="pw-checks">${m.cs.map((c) => `<li class="${c.ok ? 'ok' : ''}">${c.ok ? '✓' : '○'} ${c.t}</li>`).join('')}</ul>
</section>`;
    }
    root.addEventListener('input', (e) => {
      if (e.target.id !== 'pw-try') return;
      typed = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = root.querySelector('#pw-try');
      inp.focus();
      try { inp.setSelectionRange(pos, pos); } catch (err) { /* ไม่เป็นไร */ }
    });
    bind(root, {
      pick(el) { st.pick = Number(el.dataset.i); if (st.order[st.i][st.pick].ok) st.score++; render(); },
      next() { st.i++; st.pick = null; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  window.GAMES = [
    { id: 'cat', unit: 'u1', emoji: '🐱', title: 'แมวหาปลา', desc: 'เขียนคำสั่งลูกศรพาแมวไปหาปลา 8 ด่าน ด่านหลังใช้ทำซ้ำได้', mount: mountCat, summary: (d) => sumLevels(d, CAT_LEVELS.length) },
    { id: 'guess', unit: 'u1', emoji: '🔢', title: 'ทายเลขในใจ', desc: 'ทายเลขให้ถูกด้วยครั้งน้อยที่สุด ฝึกคิดแบบแบ่งครึ่ง', mount: mountGuess, summary: (d) => sumLevels(d, GUESS.length) },
    { id: 'turtle', unit: 'u2', emoji: '🐢', title: 'เต่าวาดรูป', desc: 'ต่อบล็อกเดินหน้า หัน และทำซ้ำ ให้เต่าวาดรูปทรงต่าง ๆ', mount: mountTurtle, summary: (d) => sumLevels(d, TURTLE.length) },
    { id: 'bug', unit: 'u2', emoji: '🐞', title: 'นักล่าบั๊ก', desc: 'หาบล็อกที่ผิดในโปรแกรม Scratch มีหัวใจ 3 ดวง', mount: mountBug, summary: bestOf },
    { id: 'web', unit: 'u3', emoji: '🔎', title: 'คัดแยกเว็บไซต์', desc: 'อ่านผลการค้นหา แล้วตัดสินว่าน่าเชื่อถือหรือไม่', mount: mountWeb, summary: bestOf },
    { id: 'data', unit: 'u4', emoji: '🧺', title: 'นักสำรวจข้อมูล', desc: 'นับผลไม้ ขีดรอยขีด สร้างแผนภูมิแท่ง และตอบคำถาม', mount: mountData, summary: bestOf },
    { id: 'hero', unit: 'u5', emoji: '🦸', title: 'ฮีโร่ปลอดภัยออนไลน์', desc: 'เลือกทางที่ปลอดภัยเมื่อเจอสถานการณ์บนอินเทอร์เน็ต', mount: mountHero, summary: bestOf },
    { id: 'pass', unit: 'u5', emoji: '🔐', title: 'รหัสผ่านแข็งแรง', desc: 'เปรียบเทียบรหัสผ่านและทดลองดูความแข็งแรง', mount: mountPass, summary: bestOf }
  ];
  // ข้อมูลเกม เปิดให้หน้าครูหรือสคริปต์ทดสอบอ่านได้
  window.GAME_DATA = { CAT_LEVELS, GUESS, TURTLE, BUGS, WEBS, HERO, PAIRS };
})();
