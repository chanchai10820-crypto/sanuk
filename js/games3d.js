/*
 * เกม 3 มิติ 4 เกม (ใช้ข้อมูลและกติกาเดียวกับเกม 2 มิติ)
 *   cat3d     แมวหาปลา 3D              หน่วย u1  (CAT_LEVELS)
 *   hazard3d  สำรวจบ้าน 3D หาจุดอันตราย   หน่วย c1  (SPOTS)
 *   garden3d  แปลงผักบุ้ง 3D             หน่วย c3  (gardenDay)
 *   repair3d  โต๊ะช่างซ่อม 3D            หน่วย c4  (FIXES)
 * ภาพ 3 มิติอยู่ในกล่อง .g3-canvas ที่สร้างครั้งเดียว ส่วนปุ่มควบคุมเป็น HTML ใน .g3-ui
 */
(function () {
  'use strict';

  const W = window.World3D;
  const K = window.Kit;
  const { esc, shuffle, ARROW, DIR_TH } = K;
  const { starRow, bind, keepBest, endScreen, bestOf, sumLevels } = window.GameKit;
  const D = window.GAME_DATA;
  const RM = K.reduceMotion;

  // เตรียมกล่องภาพและแผงควบคุม คืน null ถ้าเครื่องไม่รองรับ 3 มิติ
  function setup(root, ctx, opt, fallback) {
    if (!W || !W.supported()) { root.innerHTML = W ? W.fallbackHTML(fallback, 'แบบ 2 มิติ') : ''; return null; }
    root.innerHTML = `<div class="g3"><div class="w3d g3-canvas">${opt.hint ? `<p class="w3d-hint">${opt.hint}</p>` : ''}</div><div class="g3-ui"></div></div>`;
    const st = W.stage(root.querySelector('.g3-canvas'), opt);
    ctx.leave(() => st.dispose());
    const ui = root.querySelector('.g3-ui');
    // รายชื่อทางเลือก (แทนการแตะภาพ) เปิดค้างไว้ระหว่างที่แผงวาดใหม่
    ui.addEventListener('toggle', (e) => { if (e.target.matches('details.g3-list')) ui.dataset.list = e.target.open ? '1' : ''; }, true);
    return { st, ui };
  }
  // ภาพเคลื่อนไหวแบบลำดับ: เรียก step(t 0..1) จนครบเวลา แล้วเรียก done
  function tween(st, ms, step, done) {
    if (RM) { step(1); st.redraw(); if (done) done(); return; }
    let t = 0;
    const off = st.onFrame((dt) => {
      t = Math.min(1, t + (dt * 1000) / ms);
      step(t);
      if (t >= 1) { off(); if (done) done(); }
      return true;
    });
  }
  const ease = (t) => t * t * (3 - 2 * t);

  /* ════════ แมวหาปลา 3D ════════ */
  const FACE = { U: Math.PI, D: 0, L: -Math.PI / 2, R: Math.PI / 2 };
  function mountCat3D(root, ctx) {
    const S = setup(root, ctx, { sky: '#D7F0FF', aspect: 0.5, minH: 280, maxH: 480 }, '#game-cat');
    if (!S) return;
    const { st, ui } = S;
    const LV = D.CAT_LEVELS;
    const d = ctx.data;
    d.lv = d.lv || {};
    let cur = Math.min(Object.keys(d.lv).length, LV.length - 1);
    let g;
    let board = null;
    let catM = null;
    let fishM = null;
    const unlocked = (i) => i === 0 || d.lv[i - 1] > 0;
    const tilePos = (L, x, y) => ({ x: x - (L.size[0] - 1) / 2, z: y - (L.size[1] - 1) / 2 });

    function build() {
      const L = LV[cur];
      if (board) { st.scene.remove(board); board.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      board = W.group();
      const [w, h] = L.size;
      const base = W.box(w + 0.6, 0.3, h + 0.6, '#8B5A2B');
      base.position.y = -0.2;
      board.add(base);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = tilePos(L, x, y);
          const tile = W.box(0.94, 0.12, 0.94, (x + y) % 2 ? '#8ED37A' : '#A6DA94');
          tile.position.set(p.x, 0, p.z);
          board.add(tile);
        }
      }
      (L.rocks || []).forEach((r) => { const p = tilePos(L, r[0], r[1]); const k = W.rock(1); k.position.set(p.x, 0.06, p.z); board.add(k); });
      const gp = tilePos(L, L.goal[0], L.goal[1]);
      fishM = W.fish(0.9);
      fishM.position.set(gp.x, 0.55, gp.z);
      board.add(fishM);
      const sp = tilePos(L, L.start[0], L.start[1]);
      catM = W.cat(0.62);
      catM.position.set(sp.x, 0.06, sp.z);
      catM.rotation.y = 0;
      board.add(catM);
      st.scene.add(board);
      const span = Math.max(w, h);
      const dist = span * 0.95 + 1.4;
      st.camera.position.set(0, dist * 0.78, dist * 0.62);
      st.camera.lookAt(0, 0, 0.2);
      st.redraw();
    }
    st.onFrame((dt, t) => { if (fishM && fishM.visible && !RM) { fishM.position.y = 0.55 + Math.sin(t * 3) * 0.08; fishM.rotation.y += dt; return true; } return false; });

    function render() {
      const L = LV[cur];
      const lv = LV.map((x, i) => `<button type="button" class="g-lv${i === cur ? ' cur' : ''}" data-g="level" data-i="${i}"${unlocked(i) ? '' : ' disabled'} aria-label="ด่าน ${i + 1}${unlocked(i) ? '' : ' ล็อกอยู่'}"><b>${unlocked(i) ? i + 1 : '🔒'}</b>${starRow(d.lv[i] || 0)}</button>`).join('');
      const prog = g.prog.map((b, k) => `<button type="button" class="${b.n > 1 ? 'loop' : ''}${g.runIdx === k ? ' run' : ''}" data-g="del" data-k="${k}" aria-label="ลบคำสั่ง ${DIR_TH[b.d]} ${b.n} ครั้ง"${g.running || g.won ? ' disabled' : ''}>${ARROW[b.d]}${b.n > 1 ? `<small>×${b.n}</small>` : ''}</button>`).join('');
      const pad = ['U', 'L', 'D', 'R'].map((dd) => `<button type="button" data-g="add" data-d="${dd}" aria-label="เพิ่มคำสั่ง ${DIR_TH[dd]}"${g.running || g.won ? ' disabled' : ''}>${ARROW[dd]}</button>`).join('');
      const times = L.loops ? `<div class="times"><span>ทำซ้ำ</span>${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${g.times === n ? 'on' : ''}" data-g="times" data-n="${n}" aria-pressed="${g.times === n}">×${n}</button>`).join('')}</div>` : '';
      const fb = g.won
        ? `<div class="feedback ok g-win">${starRow(g.won)} <span>ถึงปลาแล้ว! ใช้ ${g.prog.length} คำสั่ง ${g.won === 3 ? 'สุดยอด!' : `ใช้ ${L.par} คำสั่งจะได้ 3 ดาว`}</span></div>
<div class="row">${cur < LV.length - 1 ? `<button type="button" class="btn primary" data-g="level" data-i="${cur + 1}">ด่านถัดไป →</button>` : '<a class="btn primary" href="#games">ผ่านครบทุกด่านแล้ว!</a>'}<button type="button" class="btn ghost" data-g="retry">เล่นด่านนี้อีกครั้ง</button></div>`
        : g.fb ? `<p class="feedback ${g.fb.cls}">${g.fb.msg}</p>` : '';
      ui.innerHTML = `
<div class="g-levels" aria-label="เลือกด่าน">${lv}</div>
<section class="panel g-stage">
  <div class="g-head"><h2>ด่าน ${cur + 1}</h2><span class="chip">${L.loops ? 'ใช้ทำซ้ำได้' : 'ไม่มีทำซ้ำ'} · 3 ดาวเมื่อใช้ ${L.par} คำสั่ง</span></div>
  <p class="muted">${L.tip} · แมวหันหน้าเข้าหาเรา ลูกศร ⬆ คือเดินไปทางด้านหลังกระดาน</p>
  <div class="ctrl">
    <div class="pad">${pad}</div>
    ${times}
    <div class="prog" aria-label="โปรแกรมของฉัน">${prog || '<span class="empty">กดลูกศรเพื่อเพิ่มคำสั่ง แตะคำสั่งเพื่อลบ</span>'}</div>
    <div class="row">
      <button type="button" class="btn primary" data-g="run"${g.prog.length && !g.running && !g.won ? '' : ' disabled'}>▶ เริ่มเดิน</button>
      <button type="button" class="btn ghost" data-g="clear"${g.prog.length && !g.running && !g.won ? '' : ' disabled'}>ล้างคำสั่ง</button>
    </div>
  </div>
  <div aria-live="polite">${fb}</div>
</section>`;
    }
    function reset() {
      g = { prog: [], times: g ? g.times : 1, runIdx: -1, running: false, fb: null, won: 0 };
      if (catM) { const L = LV[cur]; const p = tilePos(L, L.start[0], L.start[1]); catM.position.set(p.x, 0.06, p.z); catM.rotation.set(0, 0, 0); fishM.visible = true; fishM.scale.setScalar(0.9); st.redraw(); }
    }
    function run() {
      const L = LV[cur];
      const sim = K.simulate(L, g.prog);
      g.running = true;
      render();
      let s = 0;
      const next = () => {
        if (s >= sim.path.length) return finish(null);
        const step = sim.path[s];
        g.runIdx = step.k;
        render();
        const from = { x: catM.position.x, z: catM.position.z };
        const dir = g.prog[step.k].d;
        catM.rotation.y = FACE[dir];
        if (step.fail) {
          const to = tilePos(L, step.at[0], step.at[1]);
          return tween(st, 420, (t) => {
            const k = t < 0.5 ? t : 1 - t;
            catM.position.x = from.x + (to.x - from.x) * k * 0.9;
            catM.position.z = from.z + (to.z - from.z) * k * 0.9;
            catM.rotation.z = Math.sin(t * Math.PI * 4) * 0.25 * (1 - t);
          }, () => { catM.rotation.z = 0; finish(step); });
        }
        const to = tilePos(L, step.pos[0], step.pos[1]);
        tween(st, 300, (t) => {
          const e = ease(t);
          catM.position.x = from.x + (to.x - from.x) * e;
          catM.position.z = from.z + (to.z - from.z) * e;
          catM.position.y = 0.06 + Math.sin(t * Math.PI) * 0.18;
        }, () => { s++; next(); });
      };
      const finish = (fail) => {
        g.running = false;
        g.runIdx = fail ? fail.k : -1;
        if (fail) {
          g.fb = { cls: 'bad', msg: `${fail.fail === 'hit' ? 'โอ๊ะ! ชนก้อนหิน' : 'โอ๊ะ! จะตกกระดานแล้ว'} ที่คำสั่งที่ ${fail.k + 1} (กรอบเหลือง) แตะคำสั่งนั้นเพื่อลบแล้วแก้ใหม่` };
          render();
          return;
        }
        if (sim.end[0] !== L.goal[0] || sim.end[1] !== L.goal[1]) { g.fb = { cls: 'bad', msg: 'ยังไปไม่ถึงปลา เพิ่มคำสั่งต่อจากเดิม แล้วกดเริ่มเดินใหม่' }; render(); return; }
        const used = g.prog.length;
        g.won = used <= L.par ? 3 : used <= L.par + 2 ? 2 : 1;
        if (!d.lv[cur] || g.won > d.lv[cur]) d.lv[cur] = g.won;
        ctx.save();
        tween(st, 600, (t) => { fishM.scale.setScalar(0.9 * (1 - t)); catM.position.y = 0.06 + Math.sin(t * Math.PI) * 0.6; catM.rotation.y = t * Math.PI * 2; }, () => { fishM.visible = false; catM.rotation.y = 0; });
        render();
      };
      next();
    }
    bind(ui, {
      level(el) { cur = Number(el.dataset.i); g = null; reset(); build(); render(); },
      retry() { reset(); render(); },
      add(el) { const L = LV[cur]; const prog = g.prog; reset(); g.prog = prog.concat({ d: el.dataset.d, n: L.loops ? g.times : 1 }); render(); },
      times(el) { g.times = Number(el.dataset.n); render(); },
      del(el) { const prog = g.prog; prog.splice(Number(el.dataset.k), 1); reset(); g.prog = prog; render(); },
      clear() { reset(); render(); },
      run() { const prog = g.prog; reset(); g.prog = prog; run(); }
    });
    reset();
    build();
    render();
  }

  /* ════════ สำรวจบ้าน 3D หาจุดอันตราย ════════ */
  function hazardRoom() {
    const m = {};
    const room = W.group();
    const floor = W.box(12, 0.2, 9, '#E3C9A0'); floor.position.y = -0.1; room.add(floor);
    const back = W.box(12, 4.2, 0.2, '#FBF3E4'); back.position.set(0, 2, -4.5); room.add(back);
    const left = W.box(0.2, 4.2, 9, '#F6EAD3'); left.position.set(-6, 2, 0); room.add(left);
    const right = W.box(0.2, 4.2, 9, '#F6EAD3'); right.position.set(6, 2, 0); room.add(right);
    const win = W.box(2.2, 1.4, 0.05, '#BFE3FF'); win.position.set(-3.4, 2.6, -4.38); room.add(win);
    // ครัว: เคาน์เตอร์ เตา หม้อที่ด้ามยื่นออก
    room.add(W.at(W.box(3.4, 1.2, 1.4, '#FFFFFF'), -4, 0.6, -3.6));
    room.add(W.at(W.box(1.2, 0.08, 1, '#1B2333'), -4.4, 1.24, -3.6));
    m.pan = W.group(W.at(W.cyl(0.42, 0.38, 0.28, '#3A3F4B', 12), 0, 0.14, 0), W.at(W.box(1.1, 0.08, 0.14, '#3A3F4B'), 0.85, 0.22, 0.25));
    m.pan.children[1].rotation.y = -0.5;
    m.pan.position.set(-4.4, 1.28, -3.6);
    m.water = new W.T.Mesh(new W.T.CircleGeometry(0.9, 18), W.mat('#7CC4F5', { transparent: true, opacity: 0.85 }));
    m.water.rotation.x = -Math.PI / 2; m.water.scale.set(1.4, 0.8, 1); m.water.position.set(-2.6, 0.02, -1.8);
    // โต๊ะกลางห้อง มีดยื่นออกนอกขอบ
    room.add(W.at(W.box(2.6, 0.12, 1.4, '#C99A5B'), 0.6, 1, -0.6));
    [[-0.6, -1.1], [1.8, -1.1], [-0.6, -0.1], [1.8, -0.1]].forEach(([x, z]) => room.add(W.at(W.box(0.12, 1, 0.12, '#A57A45'), x, 0.5, z)));
    room.add(W.at(W.cyl(0.32, 0.32, 0.04, '#FFFFFF', 14), 0.2, 1.08, -0.6));
    m.knife = W.group(W.at(W.box(0.32, 0.06, 0.1, '#6B4A2B'), 0, 0, 0), W.at(W.box(0.55, 0.03, 0.12, '#C9D3E3'), 0.42, 0, 0));
    m.knife.position.set(1.85, 1.1, -0.15); m.knife.rotation.y = -0.3;
    // ผนังหลัง: ปลั๊กเสียบหลายตัว
    m.plug = W.group(W.at(W.box(0.6, 0.45, 0.08, '#FFFFFF'), 0, 0, 0));
    ['#F2B705', '#2F6BD6', '#C23A63', '#277A33'].forEach((c, i) => {
      m.plug.add(W.at(W.box(0.12, 0.16, 0.12, c), -0.2 + i * 0.13, 0, 0.08));
      const cable = W.cyl(0.025, 0.025, 1.7, '#1B2333', 5);
      cable.position.set(-0.2 + i * 0.13 + (i - 1.5) * 0.15, -0.9, 0.1); cable.rotation.z = (i - 1.5) * 0.18;
      m.plug.add(cable);
    });
    m.plug.position.set(2.2, 1.9, -4.36);
    // มุมขวา: บันได ของเล่นบนขั้นบันได
    for (let i = 0; i < 5; i++) room.add(W.at(W.box(1.6, 0.4 * (i + 1), 0.7, '#C99A5B'), 4.9, 0.2 * (i + 1), -0.4 - i * 0.7));
    m.toy = W.group(W.at(W.box(0.5, 0.22, 0.3, '#E5484D'), 0, 0.2, 0), ...[[-0.15, 0.17], [0.15, 0.17], [-0.15, -0.17], [0.15, -0.17]].map(([x, z]) => { const w = W.cyl(0.08, 0.08, 0.06, '#1B2333', 8); w.rotation.x = Math.PI / 2; w.position.set(x, 0.08, z); return w; }));
    m.toy.position.set(4.7, 0.8, -1.1);
    // หลังโซฟา: ขวดน้ำยาเปิดฝา (ต้องหมุนกล้องจึงเห็น)
    room.add(W.at(W.box(2.8, 0.8, 1, '#5A7FD6'), 2.6, 0.4, 2.4));
    room.add(W.at(W.box(2.8, 0.9, 0.3, '#4A6CC0'), 2.6, 0.9, 2.95));
    m.bottle = W.group(W.at(W.cyl(0.18, 0.18, 0.55, '#C23A63', 10), 0, 0.28, 0), W.at(W.cyl(0.08, 0.08, 0.14, '#C23A63', 8), 0, 0.62, 0));
    const cap = W.cyl(0.1, 0.1, 0.08, '#FFFFFF', 8); cap.position.set(0.35, 0.04, 0.1); cap.rotation.z = Math.PI / 2; m.bottle.add(cap);
    m.bottle.position.set(2.2, 0, 3.6);
    // ของที่เรียบร้อยดี
    m.bin = W.group(W.at(W.cyl(0.38, 0.32, 0.9, '#277A33', 12), 0, 0.45, 0), W.at(W.cyl(0.42, 0.42, 0.1, '#1E5E28', 12), 0, 0.95, 0));
    m.bin.position.set(-1.6, 0, -3.9);
    m.broom = W.group(W.at(W.cyl(0.04, 0.04, 2.2, '#8B5A2B', 6), 0, 1.1, 0), W.at(W.cone(0.32, 0.6, '#F2B705', 6), 0, 0.1, 0));
    m.broom.position.set(-5.8, 0.9, 1.2); m.broom.rotation.z = 0.08;
    m.plant = W.group(W.pot(0.32, 0.5), W.at(W.sphere(0.45, '#4CAF62', 8), 0, 0.85, 0));
    m.plant.position.set(-5, 0, 3.4);
    Object.keys(m).forEach((id) => { m[id].userData.pick = { id }; room.add(m[id]); });
    return { room, m };
  }
  function mountHazard3D(root, ctx) {
    const S = setup(root, ctx, { sky: '#EFE6D6', aspect: 0.6, minH: 300, maxH: 560, hint: 'ลากเพื่อหมุนดูรอบห้อง แตะสิ่งของที่อาจเป็นอันตราย' }, '#game-hazard');
    if (!S) return;
    const { st, ui } = S;
    const SPOTS = D.SPOTS;
    const { room, m } = hazardRoom();
    st.scene.add(room);
    const orb = W.orbit(st, { target: new W.T.Vector3(0, 1, 0), dist: 10.5, yaw: -0.15, pitch: 0.5, minYaw: -1.25, maxYaw: 1.25, minPitch: 0.3, maxPitch: 1.05 });
    ctx.leave(() => orb.off());
    const marks = {};
    let s;
    const risks = SPOTS.filter((x) => x.risk);
    const start = () => {
      s = { found: {}, wrong: 0, last: null, saved: false };
      Object.values(marks).forEach((mk) => st.scene.remove(mk));
      Object.keys(marks).forEach((k) => delete marks[k]);
      st.redraw();
    };
    function mark(sp) {
      const o = m[sp.id];
      const box3 = new W.T.Box3().setFromObject(o);
      const lb = W.label(sp.risk ? '⚠️' : '✓', { px: 56, size: 0.9, bg: sp.risk ? 'rgba(252,232,230,0.95)' : 'rgba(226,243,231,0.95)', border: sp.risk ? '#E5484D' : '#2E9E5B' });
      lb.position.set((box3.min.x + box3.max.x) / 2, box3.max.y + 0.6, (box3.min.z + box3.max.z) / 2);
      st.scene.add(lb);
      marks[sp.id] = lb;
      st.redraw();
    }
    function choose(id) {
      const sp = SPOTS.find((x) => x.id === id);
      if (!sp || s.found[id]) return;
      s.found[id] = true;
      if (!sp.risk) s.wrong += 1;
      s.last = sp;
      mark(sp);
      render();
    }
    function render() {
      const n = risks.filter((x) => s.found[x.id]).length;
      if (n === risks.length) {
        const stars = s.wrong <= 1 ? 3 : s.wrong <= 3 ? 2 : 1;
        if (!s.saved) { keepBest(ctx, stars, { wrong: s.wrong }); s.saved = true; }
        ui.innerHTML = endScreen('สำรวจบ้านครบแล้ว!', `พบจุดอันตรายครบ ${risks.length} จุด แตะผิด ${s.wrong} ครั้ง`, stars, 'again') +
          `<section class="panel stack"><h3>วิธีแก้แต่ละจุด</h3><ul>${risks.map((x) => `<li><b>${x.t}</b> — ${x.why}</li>`).join('')}</ul></section>`;
        return;
      }
      const L = s.last;
      ui.innerHTML = `<section class="panel g-stage">
  <div class="g-head"><h2>ห้องนี้มีจุดอันตราย ${risks.length} จุด</h2><span class="chip">พบแล้ว ${n}/${risks.length} · แตะผิด ${s.wrong}</span></div>
  <div class="row"><button type="button" class="btn ghost" data-g="turn" data-d="0.35">⟲ หมุนซ้าย</button><button type="button" class="btn ghost" data-g="turn" data-d="-0.35">หมุนขวา ⟳</button></div>
  <div aria-live="polite">${L ? `<p class="feedback ${L.risk ? 'ok' : 'bad'}">${L.risk ? `⚠️ เจอแล้ว: <b>${L.t}</b> — ${L.why}` : `✓ <b>${L.t}</b> ไม่ใช่จุดอันตราย ${L.why}`}</p>` : '<p class="muted">บางจุดซ่อนอยู่หลังเฟอร์นิเจอร์ ลองหมุนดูรอบห้อง</p>'}</div>
  <details class="g3-list"${ui.dataset.list ? ' open' : ''}><summary>เลือกจากรายชื่อสิ่งของแทนการแตะภาพ</summary><div class="row">${SPOTS.map((x) => `<button type="button" class="chip" data-g="spot" data-id="${x.id}"${s.found[x.id] ? ' disabled' : ''}>${x.t.replace(/ .*$/, '')}</button>`).join('')}</div></details>
</section>`;
    }
    let downAt = null;
    st.canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
    st.canvas.addEventListener('pointerup', (e) => {
      if (!downAt || Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 8) return;
      const hit = st.pick(e, Object.values(m));
      if (hit && hit.obj) choose(hit.obj.userData.pick.id);
    });
    st.canvas.addEventListener('pointermove', (e) => {
      if (downAt && e.buttons) return;
      const hit = st.pick(e, Object.values(m));
      st.canvas.style.cursor = hit && hit.obj ? 'pointer' : 'grab';
    });
    bind(ui, {
      spot(el) { choose(el.dataset.id); },
      turn(el) { orb.turn(Number(el.dataset.d)); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ แปลงผักบุ้ง 3D ════════ */
  function mountGarden3D(root, ctx) {
    const S = setup(root, ctx, { sky: '#CDEBFF', aspect: 0.55, minH: 280, maxH: 480, hint: 'ลากเพื่อหมุนดูกระถาง' }, '#game-garden');
    if (!S) return;
    const { st, ui } = S;
    const T = W.T;
    const { gardenDay, gardenStars, WEATHER } = D;
    const WX = { sun: { e: '☀️', t: 'แดดจัด', sky: '#9ED3FF' }, cloud: { e: '⛅', t: 'ครึ้มฟ้า', sky: '#B8C7D6' }, rain: { e: '🌧️', t: 'ฝนตก', sky: '#7F93A8' } };
    // ฉาก: ลานดิน โต๊ะ กระถาง ต้นผัก วัชพืช หนอน ฝน ดวงอาทิตย์
    const yard = W.box(9, 0.3, 7, '#9FD58A'); yard.position.y = -0.15; st.scene.add(yard);
    const pot = W.pot(0.9, 1.2, '#B7652A'); st.scene.add(pot);
    const soil = W.cyl(0.9, 0.9, 0.06, '#7A5236', 16); soil.position.y = 1.31; st.scene.add(soil);
    const plant = W.group(); plant.position.y = 1.33; st.scene.add(plant);
    const stem = W.cyl(0.06, 0.08, 1, '#4CAF62', 6); plant.add(stem);
    const leaves = [];
    for (let i = 0; i < 12; i++) {
      const lf = W.sphere(0.32, '#4CAF62', 6); lf.scale.set(1, 0.25, 0.55);
      const a = i * 2.4;
      lf.userData.a = a;
      lf.visible = false;
      plant.add(lf); leaves.push(lf);
    }
    const weeds = W.group(W.at(W.cone(0.08, 0.5, '#7FA03A', 4), 0.6, 0.25, 0.3), W.at(W.cone(0.07, 0.4, '#7FA03A', 4), 0.7, 0.2, 0.1), W.at(W.cone(0.07, 0.45, '#7FA03A', 4), -0.5, 0.22, -0.5));
    weeds.position.y = 1.33; st.scene.add(weeds);
    const worm = W.group(...[0, 1, 2, 3].map((i) => W.at(W.sphere(0.09, i === 3 ? '#C9A227' : '#F2B705', 6), i * 0.14, 0, 0)));
    st.scene.add(worm);
    const sun = W.sphere(0.6, '#FFD84D', 12); sun.position.set(-2.6, 4, -3.2); st.scene.add(sun);
    const cloud = W.group(W.sphere(0.8, '#FFFFFF', 8), W.at(W.sphere(0.6, '#FFFFFF', 8), 0.8, -0.1, 0), W.at(W.sphere(0.6, '#FFFFFF', 8), -0.8, -0.1, 0));
    cloud.position.set(0.5, 4.6, -1.5); st.scene.add(cloud);
    const drops = [];
    for (let i = 0; i < 40; i++) { const dd = W.box(0.03, 0.25, 0.03, '#66B9F2'); dd.position.set((i * 37 % 60) / 10 - 3, 1.2 + ((i * 53) % 35) / 10, (i * 29 % 50) / 10 - 2.5); dd.visible = false; st.scene.add(dd); drops.push(dd); }
    const can = W.group(W.at(W.cyl(0.35, 0.4, 0.6, '#2F6BD6', 10), 0, 0, 0), W.at(W.cyl(0.05, 0.07, 0.9, '#2F6BD6', 6), 0.5, 0.15, 0));
    can.children[1].rotation.z = -1.1;
    can.position.set(2.2, 2.4, 0.4); can.visible = false; st.scene.add(can);
    const orb = W.orbit(st, { target: new T.Vector3(0, 1.9, 0), dist: 6.4, yaw: 0.5, pitch: 0.42, minPitch: 0.15, maxPitch: 1.1 });
    ctx.leave(() => orb.off());
    let raining = false;
    st.onFrame((dt) => {
      if (!raining) return false;
      drops.forEach((dd) => { dd.position.y -= dt * 6; if (dd.position.y < 1.2) dd.position.y = 4.6; });
      return true;
    });

    let g = null;
    let act = {};
    let shownH = 0;
    function paint(h, hp) {
      const height = Math.max(0.15, Math.min(3.2, h * 0.11 + 0.15));
      stem.scale.y = height; stem.position.y = height / 2;
      const col = hp >= 3 ? '#4CAF62' : hp === 2 ? '#C9B44A' : '#9C7B4A';
      stem.material = W.mat(col);
      const n = Math.min(leaves.length, Math.max(1, Math.round(h / 2.5)));
      leaves.forEach((lf, i) => {
        lf.visible = i < n;
        lf.material = W.mat(col);
        const y = Math.min(height, 0.25 + i * (height / Math.max(n, 1)));
        lf.position.set(Math.cos(lf.userData.a) * 0.3, y, Math.sin(lf.userData.a) * 0.3);
        lf.rotation.set(0, -lf.userData.a, hp >= 3 ? -0.3 : -0.9);
      });
      st.redraw();
    }
    function scene(gs) {
      const w = gs ? WX[WEATHER[Math.min(gs.day, WEATHER.length) - 1]] : WX.sun;
      st.scene.background = new T.Color(w.sky);
      sun.visible = !gs || WEATHER[gs.day - 1] === 'sun';
      cloud.visible = !!gs && WEATHER[gs.day - 1] !== 'sun';
      raining = !!gs && WEATHER[gs.day - 1] === 'rain' && !RM;
      drops.forEach((dd) => { dd.visible = raining; });
      const m = gs ? gs.m : 3;
      soil.material = W.mat(m >= 6 ? '#3E2B1F' : m >= 2 ? '#7A5236' : '#C9A27A');
      weeds.visible = !!gs && gs.weed;
      worm.visible = !!gs && gs.pest;
      if (gs && gs.pest) { const lf = leaves.find((x) => x.visible); if (lf) worm.position.set(lf.position.x, 1.33 + lf.position.y + 0.12, lf.position.z); }
      st.redraw();
    }
    paint(0, 3);
    scene(null);

    function render() {
      if (!g) {
        ui.innerHTML = `<section class="panel g-stage">
  <div class="g-head"><h2>ปลูกผักบุ้ง 12 วัน (3 มิติ)</h2><span class="chip">เป้าหมาย สูง 24 ซม. ใบเขียวสด</span></div>
  <p class="g-hint">ดูท้องฟ้าและสีของดินในกระถาง ดินสีอ่อนคือแห้ง สีเข้มมากคือแฉะเกินไป</p>
  <h3>จะวางกระถางไว้ที่ไหน?</h3>
  <div class="sort-btns"><button type="button" class="sort-btn" data-g="place" data-v="sun" style="--bc:#F2B705">🌤️ ระเบียงที่มีแดดครึ่งวัน</button><button type="button" class="sort-btn" data-g="place" data-v="shade" style="--bc:#5A606E">🏚️ ใต้หลังคาที่ร่มทึบ</button></div>
</section>`;
        return;
      }
      if (g.day > WEATHER.length || g.hp === 0) {
        const stars = g.hp === 0 ? 1 : gardenStars(g);
        if (!g.saved) { keepBest(ctx, stars, { score: g.h }); g.saved = true; }
        ui.innerHTML = endScreen(g.hp === 0 ? 'โอ๊ะ ผักตายแล้ว' : 'ถึงวันเก็บเกี่ยว!', g.hp === 0 ? 'ดูแลใหม่อีกครั้ง ให้ดินชุ่มพอดีทุกวัน' : `ผักบุ้งสูง ${g.h} ซม.`, stars, 'again');
        return;
      }
      const w = WX[WEATHER[g.day - 1]];
      const opt = (k, e, t, show) => (show ? `<button type="button" class="dress-opt${act[k] ? ' on' : ''}" data-g="act" data-k="${k}" aria-pressed="${!!act[k]}">${e} ${t}</button>` : '');
      const meter = [0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < g.m ? 'on' : ''}${i === 5 ? ' wet' : ' ideal'}"></i>`).join('');
      ui.innerHTML = `<section class="panel g-stage">
  <div class="g-head"><h2>วันที่ ${g.day} / ${WEATHER.length} · ${w.e} ${w.t}</h2><span class="chip">${'❤️'.repeat(g.hp)}${'🤍'.repeat(3 - g.hp)} · สูง ${g.h} ซม.</span></div>
  <div><p class="muted">ความชื้นของดิน (ขอบเขียว = พอดี ขอบแดง = แฉะ)</p><div class="moist" role="img" aria-label="ความชื้นดิน ${g.m} จาก 6">${meter}</div></div>
  <div class="dress-opts">${opt('water', '💧', 'รดน้ำ', true)}${opt('feed', '🌿', 'ใส่ปุ๋ยหมัก', true)}${opt('weed', '🌱', 'ถอนวัชพืช', g.weed)}${opt('pest', '🐛', 'จับหนอน', g.pest)}</div>
  <div class="row"><button type="button" class="btn primary" data-g="day">จบวันที่ ${g.day} →</button></div>
  <div aria-live="polite">${g.log && g.log.length ? `<ul class="garden-log">${g.log.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
</section>`;
    }
    bind(ui, {
      place(el) { g = { day: 1, m: 3, h: 0, hp: 3, shade: el.dataset.v === 'shade', weed: false, pest: false, lastFeed: 0, log: [el.dataset.v === 'shade' ? 'ที่ร่มทึบได้แสงแดดน้อย ผักจะโตช้า' : 'วางในที่มีแดดครึ่งวัน เหมาะกับผักบุ้ง'] }; shownH = 0; paint(0, 3); scene(g); render(); },
      act(el) { act[el.dataset.k] = !act[el.dataset.k]; render(); },
      day() {
        const before = g;
        const watered = act.water;
        g = gardenDay(g, act);
        act = {};
        const from = shownH;
        const to = g.h;
        can.visible = !!watered;
        tween(st, 900, (t) => {
          if (watered) can.rotation.z = Math.sin(t * Math.PI) * 0.6;
          shownH = from + (to - from) * ease(t);
          paint(shownH, Math.min(before.hp, g.hp));
        }, () => { can.visible = false; paint(to, g.hp); scene(g.day > WEATHER.length ? null : g); });
        render();
        const b = ui.querySelector('[data-g="day"]');
        if (b) b.focus({ preventScroll: true });
      },
      again() { g = null; act = {}; shownH = 0; paint(0, 3); scene(null); render(); }
    });
    render();
  }

  /* ════════ โต๊ะช่างซ่อม 3D ════════ */
  function toolModel(id) {
    const g = W.group();
    if (id === 'needle') { g.add(W.at(W.cyl(0.02, 0.02, 0.8, '#C9D3E3', 5), 0, 0.1, 0)); const r = new W.T.Mesh(new W.T.TorusGeometry(0.16, 0.05, 6, 12), W.mat('#C23A63')); r.position.set(0.25, 0.1, 0); g.add(r); g.children[0].rotation.z = Math.PI / 2; }
    if (id === 'tape') { const r = new W.T.Mesh(new W.T.TorusGeometry(0.22, 0.09, 8, 14), W.mat('#BFE3FF')); r.rotation.x = Math.PI / 2; r.position.y = 0.1; g.add(r); }
    if (id === 'phillips' || id === 'flat') { g.add(W.at(W.cyl(0.08, 0.08, 0.35, id === 'phillips' ? '#E5484D' : '#F2B705', 8), -0.25, 0.1, 0)); g.add(W.at(W.cyl(0.03, 0.03, 0.5, '#C9D3E3', 6), 0.17, 0.1, 0)); g.children.forEach((c) => { c.rotation.z = Math.PI / 2; }); }
    if (id === 'hammer') { g.add(W.at(W.box(0.7, 0.07, 0.07, '#8B5A2B'), 0, 0.08, 0)); g.add(W.at(W.box(0.12, 0.12, 0.38, '#5A606E'), 0.35, 0.1, 0)); }
    if (id === 'tape-measure') { g.add(W.at(W.box(0.32, 0.32, 0.14, '#F2B705'), 0, 0.17, 0)); g.add(W.at(W.box(0.35, 0.02, 0.08, '#F2D35E'), 0.32, 0.03, 0)); }
    if (id === 'pliers') { g.add(W.at(W.box(0.5, 0.05, 0.06, '#2F6BD6'), -0.1, 0.06, 0.07)); g.add(W.at(W.box(0.5, 0.05, 0.06, '#2F6BD6'), -0.1, 0.06, -0.07)); g.add(W.at(W.box(0.28, 0.06, 0.12, '#5A606E'), 0.28, 0.06, 0)); }
    if (id === 'oil') { g.add(W.at(W.cyl(0.16, 0.18, 0.35, '#277A33', 10), 0, 0.18, 0)); const sp = W.cyl(0.02, 0.05, 0.35, '#5A606E', 6); sp.position.set(0.14, 0.42, 0); sp.rotation.z = -0.8; g.add(sp); }
    if (id === 'adult') { g.add(W.at(W.cyl(0.18, 0.22, 0.12, '#8A93A6', 10), 0, 0.06, 0)); g.add(W.at(W.sphere(0.13, '#F2B705', 8), 0, 0.2, 0)); }
    g.add(W.at(W.shadow(0.35), 0, 0.005, 0));
    return g;
  }
  function mountRepair3D(root, ctx) {
    const S = setup(root, ctx, { sky: '#F1E7D6', aspect: 0.52, minH: 280, maxH: 480, hint: 'แตะเครื่องมือบนโต๊ะที่ใช้ซ่อมของชิ้นนี้ได้' }, '#game-repair');
    if (!S) return;
    const { st, ui } = S;
    const FIX = D.FIXES;
    const KIT = [
      { id: 'needle', t: 'เข็มและด้าย' }, { id: 'tape', t: 'เทปใส กระดาษกาว' }, { id: 'phillips', t: 'ไขควงปากแฉก' },
      { id: 'flat', t: 'ไขควงปากแบน' }, { id: 'hammer', t: 'ค้อน' }, { id: 'tape-measure', t: 'ตลับเมตร' },
      { id: 'pliers', t: 'คีม' }, { id: 'oil', t: 'น้ำมันหยอดและผ้า' }, { id: 'adult', t: 'เรียกผู้ใหญ่ช่วย' }
    ];
    st.scene.add(W.at(W.box(10.4, 0.3, 4.2, '#C99A5B'), 0, -0.15, 0));
    st.scene.add(W.at(W.box(9, 3, 0.2, '#E9DCC4'), 0, 1.35, -2.2));
    st.scene.add(W.at(W.cyl(0.7, 0.8, 0.5, '#8A93A6', 14), 0, 0.25, -1.1));
    const tools = {};
    KIT.forEach((k, i) => {
      const m = toolModel(k.id);
      const x = -4.4 + i * 1.1;
      m.position.set(x, 0, 1.1);
      m.userData.pick = { id: k.id };
      m.userData.home = { x, z: 1.1 };
      const lb = W.label(k.t, { px: 30, size: 0.42 });
      lb.position.set(0, i % 2 ? 1.15 : 0.7, 0.15);
      m.add(lb);
      st.scene.add(m);
      tools[k.id] = m;
    });
    st.camera.position.set(0, 4.4, 6.8);
    st.camera.lookAt(0, 0.4, 0);
    let itemSprite = null;
    let s;
    const start = () => { s = { order: shuffle(FIX), i: 0, first: 0, tries: 0, pick: null, ok: false, saved: false }; showItem(); };
    function showItem() {
      if (itemSprite) { st.scene.remove(itemSprite); itemSprite.material.map.dispose(); itemSprite.material.dispose(); itemSprite = null; }
      const it = s.order[s.i];
      if (!it) return;
      itemSprite = W.label([it.e, s.ok ? '✅ ซ่อมแล้ว' : 'รอซ่อม'], { px: 90, size: 0.85, bg: 'rgba(255,255,255,0)' });
      itemSprite.position.set(0, 1.6, -1.1);
      st.scene.add(itemSprite);
      Object.values(tools).forEach((m) => { m.position.set(m.userData.home.x, 0, m.userData.home.z); m.rotation.set(0, 0, 0); });
      st.redraw();
    }
    function choose(id) {
      if (s.ok) return;
      const it = s.order[s.i];
      const m = tools[id];
      s.tries += 1;
      s.pick = id;
      s.ok = id === it.ok;
      if (s.ok) {
        if (s.tries === 1) s.first += 1;
        tween(st, 650, (t) => {
          const e = ease(t);
          m.position.set(m.userData.home.x * (1 - e), Math.sin(t * Math.PI) * 1.2 + e * 0.6, m.userData.home.z + (-1.1 - m.userData.home.z) * e);
        }, () => showItem());
      } else {
        tween(st, 420, (t) => { m.rotation.z = Math.sin(t * Math.PI * 6) * 0.3 * (1 - t); });
      }
      render();
    }
    function render() {
      if (s.i >= s.order.length) {
        const n = s.order.length;
        const stars = s.first >= n - 1 ? 3 : s.first >= Math.ceil(n * 0.6) ? 2 : 1;
        if (!s.saved) { keepBest(ctx, stars, { score: s.first }); s.saved = true; }
        ui.innerHTML = endScreen('ซ่อมครบทุกชิ้นแล้ว!', `เลือกถูกตั้งแต่ครั้งแรก ${s.first} จาก ${n} ชิ้น`, stars, 'again');
        return;
      }
      const it = s.order[s.i];
      ui.innerHTML = `<section class="panel g-stage">
  <div class="g-head"><h2>งานซ่อมชิ้นที่ ${s.i + 1} / ${s.order.length}</h2><span class="chip">ถูกครั้งแรก ${s.first}</span></div>
  <p class="sort-card" style="padding:12px"><b>${it.e} ${esc(it.t)}</b></p>
  <div aria-live="polite">${s.ok ? `<p class="feedback ok">ซ่อมได้แล้ว! ${it.why}</p><div class="row"><button type="button" class="btn primary" data-g="next">ชิ้นต่อไป →</button></div>` : s.pick ? '<p class="feedback bad">ยังไม่เหมาะ เครื่องมือนี้ใช้ซ่อมชิ้นนี้ไม่ได้ ลองเลือกใหม่</p>' : ''}</div>
  <details class="g3-list"${ui.dataset.list ? ' open' : ''}><summary>เลือกจากรายชื่อเครื่องมือแทนการแตะภาพ</summary><div class="row">${KIT.map((k) => `<button type="button" class="chip" data-g="tool" data-id="${k.id}"${s.ok ? ' disabled' : ''}>${k.t}</button>`).join('')}</div></details>
</section>`;
    }
    let downAt = null;
    st.canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
    st.canvas.addEventListener('pointerup', (e) => {
      if (!downAt || Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 8) return;
      const hit = st.pick(e, Object.values(tools));
      if (hit && hit.obj) choose(hit.obj.userData.pick.id);
    });
    st.canvas.addEventListener('pointermove', (e) => { const hit = st.pick(e, Object.values(tools)); st.canvas.style.cursor = hit && hit.obj ? 'pointer' : 'default'; });
    bind(ui, {
      tool(el) { choose(el.dataset.id); },
      next() { s.i += 1; s.tries = 0; s.pick = null; s.ok = false; showItem(); render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  const MORE = [
    { id: 'cat3d', unit: 'u1', lesson: 'u1-3', is3d: true, emoji: '🧊', title: 'แมวหาปลา 3D', desc: 'เขียนคำสั่งลูกศร แล้วดูแมวเดินบนกระดาน 3 มิติไปหาปลา 8 ด่าน', mount: mountCat3D, summary: (dd) => sumLevels(dd, D.CAT_LEVELS.length) },
    { id: 'hazard3d', unit: 'c1', lesson: 'c1-3', is3d: true, emoji: '🏠', title: 'สำรวจบ้าน 3D หาจุดอันตราย', desc: 'หมุนดูรอบห้อง บางจุดซ่อนหลังเฟอร์นิเจอร์ แตะสิ่งที่อาจเป็นอันตราย', mount: mountHazard3D, summary: bestOf },
    { id: 'garden3d', unit: 'c3', lesson: 'c3-4', is3d: true, emoji: '🪴', title: 'แปลงผักบุ้ง 3D', desc: 'ดูแลผักในกระถาง 3 มิติ 12 วัน เห็นฝนตก ดินแห้ง ใบเหี่ยว และผักโตจริง', mount: mountGarden3D, summary: bestOf },
    { id: 'repair3d', unit: 'c4', lesson: 'c4-2', is3d: true, emoji: '🔧', title: 'โต๊ะช่างซ่อม 3D', desc: 'หยิบเครื่องมือบนโต๊ะช่างให้ตรงกับของที่ชำรุด 9 ชิ้น', mount: mountRepair3D, summary: bestOf }
  ];
  MORE.forEach((g) => {
    const G = window.GAMES;
    let at = -1;
    G.forEach((x, i) => { if (x.unit === g.unit) at = i; });
    if (at === -1) G.push(g); else G.splice(at + 1, 0, g);
  });
})();
