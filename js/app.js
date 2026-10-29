/*
 * สนุกคิด วิทยาการคำนวณ ป.3
 * เว็บหน้าเดียว ใช้ hash เป็นเส้นทาง:
 *   #home  #course  #results
 *   #u1            หน้าหน่วย
 *   #u1-l2         บทเรียนที่ 2 ของหน่วยที่ 1
 *   #u1-pre        แบบทดสอบก่อนเรียน
 *   #u1-post       แบบทดสอบหลังเรียน
 *   #u1-ex         แบบฝึกหัด
 * ความก้าวหน้าเก็บใน localStorage ของเบราว์เซอร์เครื่องนี้เท่านั้น
 */
(function () {
  'use strict';

  const C = window.COURSE;
  const KEY = 'sanuk-p3-v1';
  const PASS = 60;
  const KO = ['ก', 'ข', 'ค', 'ง'];
  const { ARROW, MOVE, esc, shuffle, reduceMotion, boardHTML } = window.Kit;
  const GAMES = window.GAMES || [];
  const ROSTER = window.ROSTER || { rooms: [] };
  const art = window.artFigure || (() => '');
  const app = document.getElementById('app');

  let state = load();
  let quiz = null;        // แบบทดสอบที่กำลังทำอยู่
  let temp = {};          // สถานะชั่วคราวของแบบฝึกหัดแต่ละข้อ
  let askReset = false;
  let leaveFns = [];      // ฟังก์ชันเก็บกวาดของเกม (เช่น หยุดตัวจับเวลา) เมื่อเปลี่ยนหน้า
  let pick = { room: null, nos: [] };   // ห้องและเลขที่ที่กำลังเลือกในหน้าเลือกชื่อ
  const MAX_GROUP = 6;

  /* ───────── ข้อมูลที่บันทึก ─────────
   * state.session   กลุ่มที่นั่งเรียนเครื่องนี้ { room: '3-5', nos: [3, 12] } หรือ { guest: true }
   * state.learners  ผลการเรียนแยกรายคน คีย์ '3-5#12' (หรือ 'guest') = { units, games }
   * คอมพิวเตอร์ 1 เครื่องนั่งเรียนด้วยกันได้หลายคน ผลจะบันทึกให้ทุกคนในกลุ่ม
   */
  function fresh() { return { session: null, learners: {} }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.learners) return s;
      // ข้อมูลรุ่นแรก (ยังไม่มีการเลือกชื่อ) ย้ายไปเป็นผู้เรียนทั่วไป
      if (s && s.units) return { session: null, learners: { guest: { units: s.units, games: s.games || {} } } };
    } catch (e) { /* ใช้ค่าเริ่มต้น */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* เบราว์เซอร์ไม่ให้บันทึก */ }
  }
  const roomBy = (id) => ROSTER.rooms.find((r) => r.id === id);
  const studentOf = (room, no) => { const r = roomBy(room); return r && r.students.find((x) => x.no === no); };
  function members() {
    const ss = state.session;
    return !ss || ss.guest ? ['guest'] : ss.nos.map((n) => `${ss.room}#${n}`);
  }
  function learner(key) { return state.learners[key] || (state.learners[key] = { units: {}, games: {} }); }
  function unitOf(key, uid) { const L = learner(key); return L.units[uid] || (L.units[uid] = { lessons: {}, ex: {} }); }
  // มุมมองสำหรับแสดงผล ใช้ผลของคนแรกในกลุ่ม แต่นับว่าทำแบบทดสอบก่อนเรียนแล้วเมื่อทุกคนในกลุ่มทำแล้วเท่านั้น
  function rec(uid) {
    const keys = members();
    const r = unitOf(keys[0], uid);
    return Object.assign({}, r, { pre: keys.every((k) => unitOf(k, uid).pre) ? r.pre : undefined });
  }
  // บันทึกผลให้ทุกคนในกลุ่ม
  function eachUnit(uid, fn) { members().forEach((k) => fn(unitOf(k, uid))); save(); }
  function nameOf(key, short) {
    if (key === 'guest') return 'ผู้เรียนทั่วไป';
    const [room, no] = key.split('#');
    const st = studentOf(room, Number(no));
    if (!st) return key;
    return short ? `${st.no}. ${st.n}` : `${roomBy(room).name} เลขที่ ${st.no} ${st.t}${st.n}`;
  }
  function learnersOnDevice() {
    const order = (k) => (k === 'guest' ? [999, 0] : [ROSTER.rooms.findIndex((r) => r.id === k.split('#')[0]), Number(k.split('#')[1])]);
    return Object.keys(state.learners)
      .filter((k) => { const L = state.learners[k]; return Object.keys(L.units).length || Object.keys(L.games || {}).length; })
      .sort((a, b) => { const x = order(a); const y = order(b); return x[0] - y[0] || x[1] - y[1]; });
  }

  /* ───────── ตัวช่วย ───────── */
  const pct = (s, t) => (t ? Math.round((s * 100) / t) : 0);
  function level(p) {
    if (p >= 80) return { t: 'ดีมาก', c: 'lv-great' };
    if (p >= 70) return { t: 'ดี', c: 'lv-good' };
    if (p >= PASS) return { t: 'ผ่าน', c: 'lv-pass' };
    return { t: 'ควรทบทวน', c: 'lv-retry' };
  }
  function thaiDate(ts) {
    try { return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); } catch (e) { return ''; }
  }
  const unitNo = (u) => C.units.indexOf(u) + 1;
  const unitBy = (n) => C.units[Number(n) - 1] || null;

  function stats(u) {
    const r = rec(u.id);
    const read = u.lessons.filter((_, i) => r.lessons[i + 1]).length;
    const exDone = u.exercises.filter((_, i) => r.ex[i] && r.ex[i].ok).length;
    const exFirst = u.exercises.filter((_, i) => r.ex[i] && r.ex[i].ok && r.ex[i].tries === 1 && !r.ex[i].revealed).length;
    const parts = [r.pre ? 1 : 0, read / u.lessons.length, exDone / u.exercises.length, r.post ? 1 : 0];
    const progress = Math.round((parts.reduce((a, b) => a + b, 0) / 4) * 100);
    return { r, read, exDone, exFirst, progress };
  }

  /* ───────── เส้นทาง ───────── */
  function parse() {
    const h = location.hash.replace(/^#/, '');
    let m;
    if (!h || h === 'home') return { view: 'home' };
    if (h === 'course' || h === 'results' || h === 'games' || h === 'login') return { view: h };
    if ((m = h.match(/^game-([a-z]+)$/)) && GAMES.find((g) => g.id === m[1])) return { view: 'game', game: GAMES.find((g) => g.id === m[1]) };
    if ((m = h.match(/^u(\d)$/)) && unitBy(m[1])) return { view: 'unit', u: unitBy(m[1]) };
    if ((m = h.match(/^u(\d)-l(\d+)(?:-(pre|warm|learn|do|sum|post))?$/)) && unitBy(m[1]) && unitBy(m[1]).lessons[m[2] - 1]) return { view: 'lesson', u: unitBy(m[1]), l: Number(m[2]), stage: m[3] };
    if ((m = h.match(/^u(\d)-(pre|post)$/)) && unitBy(m[1])) return { view: 'quiz', u: unitBy(m[1]), kind: m[2] };
    if ((m = h.match(/^u(\d)-ex$/)) && unitBy(m[1])) return { view: 'ex', u: unitBy(m[1]) };
    return { view: 'home' };
  }

  let current = parse();
  function render(scrollTop) {
    leaveFns.forEach((fn) => { try { fn(); } catch (e) { /* ไม่เป็นไร */ } });
    leaveFns = [];
    current = parse();
    const v = current;
    let html;
    if (!state.session && v.view !== 'course') html = loginPage();
    else if (v.view === 'login') html = loginPage();
    else if (v.view === 'course') html = coursePage();
    else if (v.view === 'games') html = gamesPage();
    else if (v.view === 'game') html = gamePage(v.game);
    else if (v.view === 'results') html = resultsPage();
    else if (v.view === 'unit') html = unitPage(v.u);
    else if (v.view === 'lesson') html = lessonPage(v.u, v.l, v.stage);
    else if (v.view === 'quiz') html = quizPage(v.u, v.kind);
    else if (v.view === 'ex') html = exercisePage(v.u);
    else html = homePage();
    app.innerHTML = html;
    enhance(app);
    if (v.view === 'game' && state.session) mountGame(v.game);
    renderWho();
    const navKey = v.view === 'game' ? 'games' : ['course', 'results', 'games'].includes(v.view) ? v.view : 'home';
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === navKey));
    if (scrollTop) {
      window.scrollTo(0, 0);
      try { app.focus({ preventScroll: true }); } catch (e) { /* ไม่เป็นไร */ }
    }
  }

  /* ───────── หน้าแรก ───────── */
  function chip(label, value, on) {
    return `<span class="chip${on ? ' done' : ''}">${label} ${value}</span>`;
  }
  function homePage() {
    const all = C.units.map(stats);
    const overall = Math.round(all.reduce((a, s) => a + s.progress, 0) / all.length);
    const stars = totalStars();
    const blocks = C.units.map((u, i) => {
      const s = all[i];
      const r = s.r;
      const go = s.progress === 0 ? 'เริ่มเรียน' : s.progress === 100 ? 'เรียนครบแล้ว' : `เรียนไป ${s.progress}%`;
      return `
<a class="blk ${u.id}" href="#${u.id}" style="z-index:${9 - i}">
  <span class="no">${i + 1}</span>
  <div>
    <p class="ind">หน่วยที่ ${i + 1} · ${u.indicator.code} · ${u.hours} ชั่วโมง</p>
    <h3>${u.title}</h3>
    <div class="chips">
      ${chip('ก่อนเรียน', r.pre ? `${r.pre.score}/${r.pre.total}` : '–', !!r.pre)}
      ${chip('บทเรียน', `${s.read}/${u.lessons.length}`, s.read === u.lessons.length)}
      ${chip('แบบฝึกหัด', `${s.exDone}/${u.exercises.length}`, s.exDone === u.exercises.length)}
      ${chip('หลังเรียน', r.post ? `${r.post.best}/${r.post.total}` : '–', !!r.post)}
    </div>
  </div>
  <span class="go">${go}</span>
</a>`;
    }).join('');

    return `
<div class="wrap">
  <section class="hello">
    <div class="stack">
      <p class="eyebrow">${C.subject} · ${C.grade}</p>
      <h1>คิดเป็นขั้นตอน <em>สนุก</em>ได้ทุกบทเรียน</h1>
      <p class="lead">เรียนกับน้องสนุก 5 หน่วย ตั้งแต่อัลกอริทึม การเขียนโปรแกรม Scratch การค้นหาและนำเสนอข้อมูล ไปจนถึงการใช้อินเทอร์เน็ตอย่างปลอดภัย มีแบบทดสอบ แบบฝึกหัด และเกมให้เล่นทุกหน่วย</p>
      <div class="row">
        <a class="btn primary" href="#u1">เริ่มเรียนหน่วยที่ 1</a>
        <a class="btn" href="#games">ลานเกม ${starText(stars.stars, stars.max)}</a>
      </div>
    </div>
    ${art('mascot', '', 'hero-art')}
    <section class="panel profile">
      ${groupPanel()}
      <div class="overall">
        <div class="row"><span>ความก้าวหน้าทั้งรายวิชา</span><b>${overall}%</b></div>
        <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overall}"><span style="width:${overall}%"></span></div>
      </div>
    </section>
  </section>

  <section class="stack">
    <div class="script-title">
      <h2>หน่วยการเรียนรู้</h2>
      <span class="muted">${C.units.length} หน่วย · ${C.hours} ชั่วโมง</span>
    </div>
    <div class="script">
      <div class="blk hat" style="z-index:10"><div><b>เมื่อเริ่มเรียน</b> เรียนจากหน่วยบนสุดลงมา เหมือนบล็อกคำสั่งใน Scratch ที่ทำงานจากบนลงล่าง</div></div>
      ${blocks}
    </div>
  </section>

  <section class="panel stack">
    <h2>เรียนแต่ละหน่วยอย่างไร</h2>
    <ul class="howto">
      <li><b>ทดสอบก่อนเรียน</b><span>10 ข้อ ดูว่าเรารู้อะไรอยู่แล้ว ทำได้ครั้งเดียว</span></li>
      <li><b>เรียนรายบท</b><span>บทละ 1 ชั่วโมง: ทดสอบก่อน คำถามนำ เนื้อหา กิจกรรม สรุป ทดสอบหลัง</span></li>
      <li><b>ทำแบบฝึกหัด</b><span>เรียงลำดับ จับคู่ เขียนคำสั่งพาแมวไปหาปลา</span></li>
      <li><b>ทดสอบหลังเรียน</b><span>10 ข้อ เทียบคะแนนกับก่อนเรียน ดูเฉลยได้</span></li>
    </ul>
  </section>
</div>`;
  }

  /* ───────── เลือกชื่อผู้เรียน ───────── */
  function groupPanel() {
    const ss = state.session;
    if (!ss || ss.guest) {
      return `<h2>สวัสดี ผู้เรียนทั่วไป</h2><p class="muted">ผลการเรียนจะไม่ผูกกับชื่อนักเรียน</p><div class="row"><a class="btn ghost" href="#login">เลือกชื่อนักเรียน</a></div>`;
    }
    const keys = members();
    return `<h2>สวัสดี ${keys.map((k) => esc(studentOf(ss.room, Number(k.split('#')[1])).n)).join(', ')}</h2>
<p class="muted">${roomBy(ss.room).name} · เรียนด้วยกัน ${keys.length} คนที่เครื่องนี้ ผลการเรียนจะบันทึกให้ทุกคน</p>
<ul class="who-list">${keys.map((k) => `<li>${esc(nameOf(k, true))}</li>`).join('')}</ul>
<div class="row"><a class="btn ghost" href="#login">เปลี่ยนคนเรียน</a></div>`;
  }
  function renderWho() {
    const el = document.getElementById('who');
    if (!el) return;
    const ss = state.session;
    el.hidden = !ss;
    if (!ss) return;
    el.textContent = ss.guest ? 'ผู้เรียนทั่วไป' : `${roomBy(ss.room).name} · เลขที่ ${ss.nos.join(', ')}`;
    el.setAttribute('aria-label', ss.guest ? 'ผู้เรียนทั่วไป เปลี่ยนคนเรียน' : `กำลังเรียน ${members().map((k) => nameOf(k)).join(', ')} แตะเพื่อเปลี่ยนคนเรียน`);
  }
  function loginPage() {
    const ss = state.session;
    if (ss && !pick.room && current.view === 'login') {
      return `
<div class="wrap login">
  <section class="panel stack" style="max-width:640px">
    <p class="eyebrow">กำลังเรียนอยู่</p>
    ${groupPanel().replace(/<div class="row">[\s\S]*<\/div>$/, '')}
    <div class="row">
      <button type="button" class="btn primary" data-act="logout">เปลี่ยนคนเรียน</button>
      <a class="btn ghost" href="#home">เรียนต่อ</a>
    </div>
  </section>
</div>`;
    }
    if (!pick.room) {
      const rooms = ROSTER.rooms.map((r) => `
<button type="button" class="room-btn" data-act="pick-room" data-room="${r.id}">
  <b>${r.name}</b><span>${r.students.length} คน</span>
</button>`).join('');
      return `
<div class="wrap login">
  <section class="login-hero">
    <div class="stack">
      <p class="eyebrow">${esc(ROSTER.school || '')} · ปีการศึกษา ${esc(ROSTER.year || '')}</p>
      <h1>เลือกห้องเรียนของเรา</h1>
      <p class="lead muted">ก่อนเริ่มเรียน เลือกห้อง แล้วเลือกชื่อของทุกคนที่นั่งคอมพิวเตอร์เครื่องนี้ด้วยกัน</p>
    </div>
    ${art('mascot', '', 'login-art')}
  </section>
  <div class="rooms">${rooms}</div>
  <p class="muted"><button type="button" class="linkbtn" data-act="guest">ทดลองใช้โดยไม่เลือกชื่อ</button> (สำหรับคุณครูหรือผู้ปกครอง)</p>
</div>`;
    }
    const room = roomBy(pick.room);
    const kids = room.students.map((st) => {
      const on = pick.nos.includes(st.no);
      return `<button type="button" class="kid${on ? ' on' : ''}" data-act="pick-kid" data-no="${st.no}" aria-pressed="${on}"><span class="kid-no">${st.no}</span><span class="kid-name"><small>${st.t}</small>${esc(st.n)}</span></button>`;
    }).join('');
    const chosen = pick.nos.map((n) => esc(nameOf(`${room.id}#${n}`, true))).join(' · ');
    return `
<div class="wrap login">
  <div class="row" style="justify-content:space-between">
    <button type="button" class="btn ghost" data-act="pick-back">← เลือกห้องอื่น</button>
    <span class="chip">${room.name} · ${room.students.length} คน</span>
  </div>
  <div class="stack">
    <h1 style="font-size:var(--fs-4)">${room.name} ใครนั่งเครื่องนี้บ้าง?</h1>
    <p class="muted">แตะชื่อของทุกคนที่เรียนด้วยกันที่เครื่องนี้ เลือกได้สูงสุด ${MAX_GROUP} คน แตะอีกครั้งเพื่อยกเลิก</p>
  </div>
  <div class="kids">${kids}</div>
  <div class="pickbar" aria-live="polite">
    <div class="pickbar-in">
      <span class="pick-sum"><b>เลือกแล้ว ${pick.nos.length} คน</b>${chosen ? `<span>${chosen}</span>` : '<span>ยังไม่ได้เลือก</span>'}</span>
      <button type="button" class="btn primary" data-act="login-go"${pick.nos.length ? '' : ' disabled'}>เริ่มเรียน →</button>
    </div>
  </div>
</div>`;
  }
  function startSession(ss) {
    state.session = ss;
    pick = { room: null, nos: [] };
    quiz = null;
    temp = {};
    save();
    if (location.hash === '#login') location.hash = '#home';
    else render(true);
  }

  /* ───────── เกม ───────── */
  function gameStats(g, key) {
    return g.summary(learner(key || members()[0]).games[g.id] || {});
  }
  function mergeGame(dst, src) {
    if (src.lv) {
      dst.lv = dst.lv || {};
      Object.keys(src.lv).forEach((k) => { dst.lv[k] = Math.max(dst.lv[k] || 0, src.lv[k]); });
    }
    ['best', 'score', 'plays'].forEach((k) => { if (src[k] != null) dst[k] = Math.max(dst[k] || 0, src[k]); });
  }
  function totalStars(key) {
    return GAMES.reduce((a, g) => { const s = gameStats(g, key); return { stars: a.stars + s.stars, max: a.max + s.max }; }, { stars: 0, max: 0 });
  }
  function starText(n, max) {
    return `<span class="star-count"><i aria-hidden="true">★</i> ${n}/${max}</span>`;
  }
  function gameCard(g) {
    const s = gameStats(g);
    const u = C.units.find((x) => x.id === g.unit);
    return `<a class="gcard ${g.unit}" href="#game-${g.id}">
  <span class="gcard-emoji" aria-hidden="true">${g.emoji}</span>
  <span class="gcard-body"><span class="eyebrow">หน่วยที่ ${unitNo(u)}</span><b>${g.title}</b><span class="muted">${g.desc}</span></span>
  ${starText(s.stars, s.max)}
</a>`;
  }
  function gamesPage() {
    const t = totalStars();
    return `
<div class="wrap">
  <section class="games-hero">
    <div class="stack">
      <p class="eyebrow">ลานเกม</p>
      <h1>เล่นเกม สะสมดาว</h1>
      <p class="lead muted">เกมฝึกคิดของทุกหน่วย เล่นซ้ำได้ ยิ่งใช้คำสั่งน้อยหรือตอบถูกมาก ยิ่งได้ดาวเยอะ</p>
      <p class="big-stars">${starText(t.stars, t.max)} <span class="muted">ดาวที่สะสมได้</span></p>
    </div>
    ${art('mascot')}
  </section>
  <div class="gcards">${GAMES.map(gameCard).join('')}</div>
</div>`;
  }
  function gamePage(g) {
    const u = C.units.find((x) => x.id === g.unit);
    const n = unitNo(u);
    return `
<div class="wrap ${g.unit}">
  <nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><a href="#games">ลานเกม</a><span>›</span><span>${g.title}</span></nav>
  <header class="band band-game"><p class="eyebrow">เกมของหน่วยที่ ${n} · ${u.title}</p><h1><span aria-hidden="true">${g.emoji}</span> ${g.title}</h1><p>${g.desc}</p></header>
  <div id="game-root" class="game-root"></div>
</div>`;
  }
  function mountGame(g) {
    const root = document.getElementById('game-root');
    if (!root) return;
    const keys = members();
    const lead = learner(keys[0]).games;
    const data = lead[g.id] || (lead[g.id] = {});
    // เกมบันทึกลงข้อมูลของคนแรก แล้วรวมผลที่ดีที่สุดให้ทุกคนในกลุ่ม
    const saveAll = () => {
      keys.slice(1).forEach((k) => { const G = learner(k).games; mergeGame(G[g.id] || (G[g.id] = {}), data); });
      save();
    };
    g.mount(root, { data, save: saveAll, leave: (fn) => leaveFns.push(fn) });
  }

  /* ───────── หน้ารายวิชา ───────── */
  // ชั่วโมงฝึกทักษะของแต่ละหน่วย (รวมกับปฐมนิเทศ บทเรียน และทดสอบหลังเรียน = ชั่วโมงของหน่วย)
  const PRACTICE = {
    u1: ['แบบฝึกหัดหน่วยที่ 1', 'เกมแมวหาปลา', 'เกมทายเลขในใจ', 'กิจกรรมหุ่นยนต์เพื่อนและเดินตามลูกศร (ไม่ใช้คอมพิวเตอร์)'],
    u2: ['แบบฝึกหัดหน่วยที่ 2', 'เกมเต่าวาดรูป', 'เกมนักล่าบั๊ก', 'สร้างผลงาน Scratch ของตนเอง', 'นำเสนอผลงาน Scratch'],
    u3: ['แบบฝึกหัดหน่วยที่ 3 และเกมคัดแยกเว็บไซต์'],
    u4: [],
    u5: ['แบบฝึกหัดหน่วยที่ 5 เกมฮีโร่ปลอดภัยออนไลน์ และเกมรหัสผ่านแข็งแรง']
  };
  function hourPlan() {
    let h = 0;
    const row = (u, kind, text, href) => `<tr class="hp-${kind}"><td class="num">${++h}</td><td>หน่วยที่ ${unitNo(u)}</td><td>${href ? `<a href="${href}">${text}</a>` : text}</td><td>${{ open: 'ปฐมนิเทศ', lesson: 'บทเรียน 6 ขั้น', practice: 'ฝึกทักษะ', test: 'ประเมินผล' }[kind]}</td></tr>`;
    const rows = C.units.map((u) => [
      row(u, 'open', `ปฐมนิเทศหน่วย "${u.title}" และทดสอบก่อนเรียนหน่วย 10 ข้อ`, `#${u.id}-pre`),
      ...u.lessons.map((l, i) => row(u, 'lesson', `บทที่ ${unitNo(u)}.${i + 1} ${l.title}`, `#${u.id}-l${i + 1}`)),
      ...(PRACTICE[u.id] || []).map((t) => row(u, 'practice', t)),
      row(u, 'test', 'ทดสอบหลังเรียนหน่วย 10 ข้อ และทบทวน', `#${u.id}-post`)
    ].join('')).join('');
    return { rows, total: h };
  }
  function coursePage() {
    const plan = hourPlan();
    const rows = C.units.map((u, i) => `
<tr><td class="num">${i + 1}</td><td><b>${u.title}</b><br><span class="muted">${u.lessons.map((l, k) => `${i + 1}.${k + 1} ${l.title}`).join(' · ')}</span></td>
<td><b>${u.indicator.code}</b><br>${u.indicator.text}</td><td class="num">${u.hours}</td></tr>`).join('');
    return `
<div class="wrap">
  <div class="stack">
    <p class="eyebrow">โครงสร้างรายวิชา</p>
    <h1 style="font-size:var(--fs-4)">${C.subject} ${C.grade}</h1>
    <p class="muted">เวลาเรียน ${C.hours} ชั่วโมงต่อปี (ปรับได้ตามโครงสร้างเวลาของโรงเรียน)</p>
  </div>
  <section class="panel stack">
    <h2>มาตรฐานการเรียนรู้ ${C.standard.code}</h2>
    <p>${C.standard.text}</p>
  </section>
  <section class="panel stack">
    <h2>ตัวชี้วัดและหน่วยการเรียนรู้</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th class="num">หน่วย</th><th>หน่วยการเรียนรู้และบทเรียน</th><th>ตัวชี้วัด</th><th class="num">ชั่วโมง</th></tr></thead>
      <tbody>${rows}<tr class="sum"><td></td><td>รวม</td><td></td><td class="num">${C.units.reduce((a, u) => a + u.hours, 0)}</td></tr></tbody>
    </table></div>
  </section>
  <section class="panel stack">
    <h2>แผนการจัดการเรียนรู้ ${plan.total} ชั่วโมง</h2>
    <p class="muted">บทเรียนทุกบทใช้เวลา 1 ชั่วโมง แบ่งเป็น 6 ขั้น: ${STAGES.map((x) => `${x.name} ${x.min} นาที`).join(' · ')} เปิดแผนการสอนของแต่ละบทได้ในหน้าบทเรียน (หัวข้อ "แผนการสอน 60 นาที")</p>
    <div class="tbl-wrap"><table class="tbl hour-plan">
      <thead><tr><th class="num">ชั่วโมงที่</th><th>หน่วย</th><th>เรื่อง</th><th>ลักษณะ</th></tr></thead>
      <tbody>${plan.rows}</tbody>
    </table></div>
  </section>
  <section class="panel stack">
    <h2>การวัดและประเมินผล</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>เครื่องมือ</th><th>จำนวน</th><th>วิธีใช้</th></tr></thead>
      <tbody>
        <tr><td>แบบทดสอบก่อน–หลังเรียนประจำบท</td><td>บทละ 5 ข้อ</td><td>ทำตอนเริ่มและตอนจบของทุกชั่วโมง ก่อนเรียนทำได้ครั้งเดียว หลังเรียนแสดงเฉลย เกณฑ์ผ่าน 3 ข้อ</td></tr>
        <tr><td>แบบทดสอบก่อนเรียน</td><td>หน่วยละ 10 ข้อ</td><td>วัดพื้นฐานก่อนเรียน ทำได้ครั้งเดียว ยังไม่แสดงเฉลย</td></tr>
        <tr><td>แบบฝึกหัด</td><td>หน่วยละ 6–7 ข้อ</td><td>ฝึกระหว่างเรียน ทำซ้ำจนถูกได้ นับคะแนนจากข้อที่ถูกตั้งแต่ครั้งแรก</td></tr>
        <tr><td>แบบทดสอบหลังเรียน</td><td>หน่วยละ 10 ข้อ</td><td>ข้อสอบชุดเดียวกับก่อนเรียน สลับข้อและตัวเลือก ทำซ้ำได้ เก็บคะแนนสูงสุด แสดงเฉลยพร้อมคำอธิบาย</td></tr>
      </tbody>
    </table></div>
    <h3 style="font-size:var(--fs-2)">เกณฑ์การประเมิน (ร้อยละของคะแนนหลังเรียน)</h3>
    <div class="row">
      <span class="chip lv-great">80 ขึ้นไป · ดีมาก</span>
      <span class="chip lv-good">70–79 · ดี</span>
      <span class="chip lv-pass">60–69 · ผ่าน</span>
      <span class="chip lv-retry">ต่ำกว่า 60 · ควรทบทวน</span>
    </div>
    <p class="muted">พัฒนาการ = คะแนนหลังเรียน − คะแนนก่อนเรียน ผลการเรียนเก็บไว้ในเบราว์เซอร์ของเครื่องที่ใช้เรียน นักเรียนคัดลอกสรุปผลจากหน้าผลการเรียนส่งให้ครูได้</p>
  </section>
</div>`;
  }

  /* ───────── หน้าหน่วย ───────── */
  function unitPage(u) {
    const n = unitNo(u);
    const s = stats(u);
    const r = s.r;
    const lessons = u.lessons.map((l, i) => `
<li><a href="#${u.id}-l${i + 1}"><span class="tick${r.lessons[i + 1] ? ' on' : ''}" aria-hidden="true">${r.lessons[i + 1] ? '✓' : ''}</span>
<span>${n}.${i + 1} ${l.title}</span><span class="muted" style="font-size:var(--fs-0)">${(() => { const x = lessonRec(u.id, i + 1); return x.post ? `ก่อน ${x.pre ? x.pre.score : '–'} · หลัง ${x.post.best}/${x.post.total}` : x.pre ? `ก่อนเรียน ${x.pre.score}/${x.pre.total}` : 'ยังไม่เรียน'; })()}</span></a></li>`).join('');
    const preP = r.pre ? pct(r.pre.score, r.pre.total) : 0;
    const postP = r.post ? pct(r.post.best, r.post.total) : 0;

    const preBody = r.pre
      ? `<div class="row"><span class="chip">${r.pre.score}/${r.pre.total} คะแนน · ร้อยละ ${preP}</span><span class="muted">ทำเมื่อ ${thaiDate(r.pre.at)}</span></div>`
      : `<p>ตอบ 10 ข้อ ดูว่าเรารู้เรื่องนี้มาก่อนแค่ไหน ไม่ต้องกังวลถ้าตอบไม่ได้</p><div><a class="btn primary" href="#${u.id}-pre">เริ่มทำแบบทดสอบก่อนเรียน</a></div>`;
    const postBody = !r.pre
      ? `<p class="muted">ทำแบบทดสอบก่อนเรียนก่อน จึงจะทำแบบทดสอบหลังเรียนได้</p>`
      : r.post
        ? `<div class="compare">
            <div class="stat"><b>${r.pre.score}/${r.pre.total}</b><span>ก่อนเรียน</span></div>
            <div class="stat"><b>${r.post.best}/${r.post.total}</b><span>หลังเรียน (สูงสุด)</span></div>
            <div class="stat"><b>${r.post.best - r.pre.score >= 0 ? '+' : ''}${r.post.best - r.pre.score}</b><span>พัฒนาการ</span></div>
          </div>
          <div class="row"><span class="chip ${level(postP).c}">ร้อยละ ${postP} · ${level(postP).t}</span><a class="btn" href="#${u.id}-post">ทำอีกครั้ง</a></div>`
        : `<p>ทำหลังเรียนเนื้อหาและแบบฝึกหัดครบแล้ว ดูว่าเราเก่งขึ้นแค่ไหน</p><div><a class="btn primary" href="#${u.id}-post">เริ่มทำแบบทดสอบหลังเรียน</a></div>`;

    return `
<div class="wrap ${u.id}">
  <nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><span>หน่วยที่ ${n}</span></nav>
  <header class="band band-art">
    <div class="band-text">
      <p class="eyebrow">หน่วยการเรียนรู้ที่ ${n} · ${u.hours} ชั่วโมง</p>
      <h1>${u.title}</h1>
      <p class="ind"><b>${u.indicator.code}</b><span>${u.indicator.text}</span></p>
      <div><p><b>เรียนจบแล้ว นักเรียนจะ</b></p><ul>${u.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>
    </div>
    ${art(u.art, '', 'band-pic')}
  </header>
  <div class="path">
    <div class="step${r.pre ? ' done' : ''}"><span class="n">1</span><section class="panel"><h2>แบบทดสอบก่อนเรียน</h2>${preBody}</section></div>
    <div class="step${s.read === u.lessons.length ? ' done' : ''}"><span class="n">2</span><section class="panel">
      <div class="row" style="justify-content:space-between"><h2>เรียนรายบท (บทละ 1 ชั่วโมง)</h2><span class="chip">ผ่าน ${s.read}/${u.lessons.length} บท</span></div>
      <ul class="lesson-list">${lessons}</ul></section></div>
    <div class="step${s.exDone === u.exercises.length ? ' done' : ''}"><span class="n">3</span><section class="panel">
      <div class="row" style="justify-content:space-between"><h2>แบบฝึกหัด</h2><span class="chip">${s.exDone}/${u.exercises.length} ข้อ</span></div>
      <p>${u.exercises.length} ข้อ มีทั้งเลือกตอบ ถูก-ผิด เรียงลำดับ จับคู่${u.exercises.some((e) => e.type === 'grid') ? ' และเขียนคำสั่งบนตาราง' : ''} ทำซ้ำได้จนกว่าจะถูก</p>
      <div><a class="btn${s.exDone ? '' : ' primary'}" href="#${u.id}-ex">${s.exDone ? 'ทำแบบฝึกหัดต่อ' : 'เริ่มทำแบบฝึกหัด'}</a></div></section></div>
    <div class="step${r.post ? ' done' : ''}"><span class="n">4</span><section class="panel"><h2>แบบทดสอบหลังเรียน</h2>${postBody}</section></div>
  </div>
  <section class="stack">
    <h2 style="font-size:var(--fs-3)">เกมทบทวนของหน่วยนี้</h2>
    <div class="gcards">${GAMES.filter((g) => g.unit === u.id).map(gameCard).join('')}</div>
  </section>
</div>`;
  }

  /* ───────── หน้าบทเรียน: 1 บท = 1 ชั่วโมง 6 ขั้น ───────── */
  const STAGES = window.STAGES || [];
  let lquiz = null;   // แบบทดสอบประจำบทที่กำลังทำ { key, qs, ans, done, score }

  // ผลแบบทดสอบประจำบท นับว่าทำก่อนเรียนแล้วเมื่อทุกคนในกลุ่มทำแล้ว
  function lessonRec(uid, l) {
    const keys = members();
    const get = (k) => (unitOf(k, uid).lq || {})[l] || {};
    const lead = get(keys[0]);
    return { pre: keys.every((k) => get(k).pre) ? lead.pre : undefined, post: lead.post };
  }
  const defaultStage = (lr) => (!lr.pre ? 'pre' : !lr.post ? 'warm' : 'learn');
  const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const goalText = (g) => g.replace(/^[KPA]\s+/, '');

  function newLquiz(key, lesson) {
    return {
      key, done: false, ans: [],
      qs: shuffle(lesson.quiz || []).map((q) => ({ q: q.q, explain: q.explain, choices: shuffle(q.choices.map((t, k) => ({ t, ok: k === q.a }))) }))
    };
  }
  function lessonQuizHTML(u, l, lesson, kind) {
    const key = `${u.id}-${l}-${kind}`;
    if (!lquiz || lquiz.key !== key) lquiz = newLquiz(key, lesson);
    if (lquiz.done) return lessonQuizResult(u, l, lesson, kind);
    const total = lquiz.qs.length;
    const answered = lquiz.ans.filter((a) => a !== undefined).length;
    const items = lquiz.qs.map((q, qi) => `
<fieldset class="lq"><legend>${qi + 1}. ${esc(q.q)}</legend><div class="opts">${q.choices.map((c, ci) => `<button type="button" class="opt${lquiz.ans[qi] === ci ? ' sel' : ''}" data-act="lq-pick" data-q="${qi}" data-i="${ci}" aria-pressed="${lquiz.ans[qi] === ci}"><span class="k">${KO[ci]}</span><span>${esc(c.t)}</span></button>`).join('')}</div></fieldset>`).join('');
    return `<p class="muted">${kind === 'pre' ? `ตอบ ${total} ข้อ ดูว่ารู้เรื่องนี้มาก่อนแค่ไหน ตอบไม่ได้ไม่เป็นไร ยังไม่แสดงเฉลย` : `ตอบ ${total} ข้อ แล้วเทียบคะแนนกับก่อนเรียน เกณฑ์ผ่าน ${Math.ceil(total * PASS / 100)} ข้อ`}</p>
<div class="lq-list">${items}</div>
<div class="row"><button type="button" class="btn primary" data-act="lq-submit" data-kind="${kind}"${answered === total ? '' : ' disabled'}>ส่งคำตอบ (ตอบแล้ว ${answered}/${total})</button></div>`;
  }
  function lessonQuizResult(u, l, lesson, kind) {
    const total = lquiz.qs.length;
    const p = pct(lquiz.score, total);
    const base = `#${u.id}-l${l}`;
    if (kind === 'pre') {
      return `<div class="score"><div class="big">${lquiz.score}<small>/${total}</small></div><span class="chip">ร้อยละ ${p}</span>
<p>${p >= 80 ? 'รู้เรื่องนี้มาก่อนเยอะเลย เรียนต่อให้เก่งยิ่งขึ้น' : 'ไม่เป็นไร ชั่วโมงนี้เราจะได้เรียนรู้เรื่องนี้ด้วยกัน'}</p>
<a class="btn primary" href="${base}-warm">ไปขั้นคำถามนำ →</a></div>`;
    }
    const lr = lessonRec(u.id, l);
    const gain = lquiz.score - (lr.pre ? lr.pre.score : 0);
    const lv = level(p);
    const review = lquiz.qs.map((q, k) => {
      const mine = q.choices[lquiz.ans[k]];
      const right = q.choices.find((c) => c.ok);
      return `<article class="rv"><h3>${k + 1}. ${esc(q.q)}</h3><p class="ans">คำตอบของฉัน: <b class="${mine.ok ? 'ok' : 'bad'}">${esc(mine.t)} ${mine.ok ? '✓' : '✗'}</b>${mine.ok ? '' : `<br>คำตอบที่ถูก: <b class="ok">${esc(right.t)}</b>`}</p><p class="why">${esc(q.explain)}</p></article>`;
    }).join('');
    return `<div class="score"><div class="big">${lquiz.score}<small>/${total}</small></div><span class="chip ${lv.c}">ร้อยละ ${p} · ${lv.t}</span>
<div class="compare" style="width:100%;max-width:440px">
  <div class="stat"><b>${lr.pre ? lr.pre.score : '–'}</b><span>ก่อนเรียน</span></div>
  <div class="stat"><b>${lquiz.score}</b><span>หลังเรียน</span></div>
  <div class="stat"><b>${gain >= 0 ? '+' : ''}${gain}</b><span>พัฒนาการ</span></div>
</div>
<p>${p >= PASS ? 'ผ่านเกณฑ์แล้ว เรียนบทนี้จบแล้ว!' : 'ยังไม่ผ่านเกณฑ์ ลองอ่านเฉลย ทบทวนเนื้อหา แล้วทำอีกครั้ง'}</p>
<div class="row" style="justify-content:center"><button type="button" class="btn" data-act="lq-retry" data-kind="post">ทำอีกครั้ง</button></div></div>
<h3 style="font-size:var(--fs-2)">เฉลยและคำอธิบาย</h3><div class="review">${review}</div>`;
  }

  function teacherPlan(u, l, lesson) {
    const g = lesson.game && GAMES.find((x) => x.id === lesson.game);
    const heads = (lesson.body + (lesson.more || '')).match(/<h3>([\s\S]*?)<\/h3>/g) || [];
    const topics = heads.map(plain).join(' · ');
    const rows = {
      pre: `นักเรียนทำแบบทดสอบก่อนเรียนประจำบท ${(lesson.quiz || []).length} ข้อในบทเรียนออนไลน์ (ทำได้คนละครั้ง)`,
      warm: `ครูถามคำถามนำ ${(lesson.warmup || []).map((w) => `“${w.q}”`).join(' และ ')} ให้นักเรียนแสดงความคิดเห็น แล้วบอกจุดประสงค์ของชั่วโมงนี้`,
      learn: `ครูอธิบายเนื้อหาร่วมกับสื่อในบทเรียน หัวข้อ: ${topics || lesson.title} ระหว่างเรียนให้นักเรียนตอบคำถาม "ลองคิด" และทบทวนคำศัพท์น่ารู้`,
      do: `${lesson.activity || 'นักเรียนทำกิจกรรมฝึกปฏิบัติ'}${g ? ` จากนั้นเล่นเกม "${g.title}"` : ''} ครูเดินดูและให้คำแนะนำ`,
      sum: `ครูและนักเรียนร่วมกันสรุป: ${(lesson.recap || []).join(' / ')} แล้วย้อนกลับไปตอบคำถามนำอีกครั้ง`,
      post: `นักเรียนทำแบบทดสอบหลังเรียนประจำบท เกณฑ์ผ่าน ${Math.ceil((lesson.quiz || []).length * PASS / 100)} ข้อ (ร้อยละ ${PASS}) ดูผลรายคนได้ที่หน้าผลการเรียน`
    };
    return `<details class="tplan"><summary>แผนการสอน 60 นาที (สำหรับครู)</summary><div class="tplan-in">
<div class="tplan-cols">
  <div><h3>จุดประสงค์การเรียนรู้</h3><ul>${(lesson.goals || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div><h3>สื่อและอุปกรณ์</h3><ul>${(lesson.materials || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
</div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ขั้น</th><th class="num">นาที</th><th>กิจกรรมการเรียนรู้</th></tr></thead><tbody>
${STAGES.map((st) => `<tr><td><b>${st.step}</b><br><span class="muted">${st.name}</span></td><td class="num">${st.min}</td><td>${esc(rows[st.id])}</td></tr>`).join('')}
<tr class="sum"><td>รวม</td><td class="num">${STAGES.reduce((a, st) => a + st.min, 0)}</td><td></td></tr>
</tbody></table></div>
<h3>การวัดและประเมินผล</h3>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>วิธีวัด</th><th>เครื่องมือ</th><th>เกณฑ์</th></tr></thead><tbody>
<tr><td>ทดสอบก่อน–หลังเรียน</td><td>แบบทดสอบประจำบท ${(lesson.quiz || []).length} ข้อ</td><td>หลังเรียนถูกตั้งแต่ร้อยละ ${PASS} และสูงกว่าก่อนเรียน</td></tr>
<tr><td>ตรวจกิจกรรมฝึกปฏิบัติ</td><td>ใบงาน / แบบฝึกหัดออนไลน์</td><td>ถูกต้องตั้งแต่ร้อยละ ${PASS}</td></tr>
<tr><td>สังเกตพฤติกรรม</td><td>แบบสังเกตการทำงานกลุ่ม</td><td>ระดับดีขึ้นไป</td></tr>
</tbody></table></div>
</div></details>`;
  }

  function stageBody(u, l, lesson, lr, sid) {
    const base = `#${u.id}-l${l}`;
    const key = `${u.id}-${l}-${sid}`;
    if (sid === 'pre') {
      if (lquiz && lquiz.key === key && lquiz.done) return lessonQuizResult(u, l, lesson, 'pre');
      if (lr.pre) return `<div class="score"><div class="big">${lr.pre.score}<small>/${lr.pre.total}</small></div><span class="chip">ทำแล้วเมื่อ ${thaiDate(lr.pre.at)}</span><p class="muted">แบบทดสอบก่อนเรียนทำได้คนละครั้ง</p><a class="btn primary" href="${base}-warm">ไปขั้นคำถามนำ →</a></div>`;
      return lessonQuizHTML(u, l, lesson, 'pre');
    }
    if (sid === 'warm') {
      return `<div class="goal-box"><h3>ชั่วโมงนี้เราจะได้เรียนรู้</h3><ul>${(lesson.goals || []).map((x) => `<li>${esc(goalText(x))}</li>`).join('')}</ul></div>
${lesson.art ? art(lesson.art, lesson.caption, 'lesson-art') : ''}
<p class="muted">คิดคำตอบในใจ หรือคุยกับเพื่อนที่นั่งด้วยกันก่อน แล้วค่อยกดดูแนวคำตอบ</p>
<div class="warm-list">${(lesson.warmup || []).map((w, i) => `<div class="warm"><span class="wq-n" aria-hidden="true">?${i + 1}</span><div><p class="wq">${esc(w.q)}</p><details><summary>ดูแนวคำตอบ</summary><p>${esc(w.guide)}</p></details></div></div>`).join('')}</div>`;
    }
    if (sid === 'learn') {
      const vocab = lesson.vocab ? `<section class="box vocab"><h2>คำศัพท์น่ารู้</h2><dl>${lesson.vocab.map(([th, en, m]) => `<div><dt>${th} <span lang="en">${en}</span></dt><dd>${m}</dd></div>`).join('')}</dl></section>` : '';
      return `<div class="prose">${lesson.body}${lesson.more || ''}${lesson.moreArt ? art(lesson.moreArt) : ''}</div><div class="extras">${vocab}</div>`;
    }
    if (sid === 'do') {
      const g = lesson.game && GAMES.find((x) => x.id === lesson.game);
      return `<div class="extras">
${lesson.activity ? `<section class="box activity"><h2>กิจกรรมฝึกปฏิบัติ</h2><p>${lesson.activity}</p>${lesson.activityAnswer ? `<details><summary>ดูคำตอบ</summary>${lesson.activityAnswer}</details>` : ''}</section>` : ''}
${g ? `<a class="box game-link" href="#game-${g.id}"><span class="gl-emoji" aria-hidden="true">${g.emoji}</span><span class="gl-text"><b>เล่นเกม ${g.title}</b><span>${g.desc}</span></span><span class="go">เล่นเลย →</span></a>` : ''}
<a class="box game-link" href="#${u.id}-ex"><span class="gl-emoji" aria-hidden="true">✏️</span><span class="gl-text"><b>แบบฝึกหัดหน่วยที่ ${unitNo(u)}</b><span>${u.exercises.length} ข้อ เลือกตอบ เรียงลำดับ จับคู่ ทำซ้ำได้จนถูก</span></span><span class="go">ทำแบบฝึกหัด →</span></a>
</div>`;
    }
    if (sid === 'sum') {
      return `<section class="recap" style="margin-top:0"><h2>สรุปบทเรียน</h2><ul>${lesson.recap.map((x) => `<li>${x}</li>`).join('')}</ul></section>
${lesson.fact ? `<section class="box fact" style="margin-top:14px"><h2>เกร็ดความรู้</h2><p>${lesson.fact}</p></section>` : ''}
<h3 style="font-size:var(--fs-2);margin-top:18px">ย้อนกลับไปตอบคำถามนำ</h3>
<div class="warm-list">${(lesson.warmup || []).map((w, i) => `<div class="warm"><span class="wq-n" aria-hidden="true">?${i + 1}</span><div><p class="wq">${esc(w.q)}</p><p class="muted">${esc(w.guide)}</p></div></div>`).join('')}</div>`;
    }
    // post
    if (lquiz && lquiz.key === key) return lessonQuizHTML(u, l, lesson, 'post');
    if (lr.post) {
      return `<div class="score"><div class="big">${lr.post.best}<small>/${lr.post.total}</small></div><span class="chip ${level(pct(lr.post.best, lr.post.total)).c}">คะแนนสูงสุด · ทำแล้ว ${lr.post.tries} ครั้ง</span>
<div class="row" style="justify-content:center"><button type="button" class="btn" data-act="lq-retry" data-kind="post">ทำอีกครั้ง</button></div></div>`;
    }
    return lessonQuizHTML(u, l, lesson, 'post');
  }

  function lessonPage(u, l, stageId) {
    const n = unitNo(u);
    const lesson = u.lessons[l - 1];
    const r = rec(u.id);
    const lr = lessonRec(u.id, l);
    const sid = stageId || defaultStage(lr);
    const si = STAGES.findIndex((x) => x.id === sid);
    const st = STAGES[si];
    const base = `#${u.id}-l${l}`;
    const locked = sid !== 'pre' && !lr.pre;
    const bar = STAGES.map((x, i) => {
      const done = (x.id === 'pre' && lr.pre) || (x.id === 'post' && lr.post);
      return `<li class="${i === si ? 'cur' : ''}${done ? ' done' : ''}"><a href="${base}-${x.id}"${i === si ? ' aria-current="step"' : ''}><span class="st-n">${done ? '✓' : i + 1}</span><span class="st-t">${x.name}<small>${x.min} นาที</small></span></a></li>`;
    }).join('');
    const prev = si > 0 ? `<a class="btn ghost" href="${base}-${STAGES[si - 1].id}">← ${STAGES[si - 1].name}</a>` : `<a class="btn ghost" href="#${u.id}">← หน้าหน่วย</a>`;
    const last = si === STAGES.length - 1;
    const nextHref = !last ? `${base}-${STAGES[si + 1].id}` : l < u.lessons.length ? `#${u.id}-l${l + 1}` : `#${u.id}-ex`;
    const nextLabel = !last ? STAGES[si + 1].name : l < u.lessons.length ? `บทที่ ${n}.${l + 1}` : 'แบบฝึกหัดของหน่วย';
    const canNext = !locked && !(sid === 'pre' && !lr.pre) && !(sid === 'post' && !lr.post);
    const side = u.lessons.map((x, i) => {
      const xr = lessonRec(u.id, i + 1);
      return `<li><a href="#${u.id}-l${i + 1}"${i + 1 === l ? ' aria-current="page" style="outline:2px solid var(--c)"' : ''}><span class="tick${r.lessons[i + 1] ? ' on' : ''}" aria-hidden="true">${r.lessons[i + 1] ? '✓' : ''}</span><span>${n}.${i + 1} ${x.title}</span><span class="muted" style="font-size:var(--fs-0)">${xr.post ? `${xr.post.best}/${xr.post.total}` : ''}</span></a></li>`;
    }).join('');
    const body = locked
      ? `<div class="lock-note"><p>เริ่มจากทำ<b>แบบทดสอบก่อนเรียน</b> 5 ข้อก่อนนะ แล้วจึงเรียนขั้นต่อไปได้</p><a class="btn primary" href="${base}-pre">ไปทำแบบทดสอบก่อนเรียน</a></div>`
      : stageBody(u, l, lesson, lr, sid);
    return `
<div class="wrap ${u.id}">
  <nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><a href="#${u.id}">หน่วยที่ ${n} ${u.title}</a><span>›</span><span>บทที่ ${n}.${l}</span></nav>
  <div class="reader">
    <article class="article">
      <div class="head">
        <p class="eyebrow">หน่วยที่ ${n} · บทที่ ${n}.${l} จาก ${u.lessons.length} บท · 1 ชั่วโมง</p>
        <h1>${lesson.title}</h1>
      </div>
      <ol class="stages" aria-label="ขั้นตอนการเรียน 60 นาที">${bar}</ol>
      ${teacherPlan(u, l, lesson)}
      <section class="stage" aria-labelledby="stage-h">
        <p class="eyebrow">ขั้นที่ ${si + 1} · ${st.step} · ${st.min} นาที</p>
        <h2 id="stage-h" class="stage-h">${st.name}</h2>
        ${body}
      </section>
      <div class="pager">${prev}${canNext ? `<a class="btn primary" href="${nextHref}">${nextLabel} →</a>` : ''}</div>
    </article>
    <aside class="side panel">
      <h2>บทเรียนในหน่วยนี้</h2>
      <ul class="lesson-list">${side}</ul>
      <a class="btn ghost" href="#${u.id}-ex">แบบฝึกหัด</a>
    </aside>
  </div>
</div>`;
  }

  /* ───────── แบบทดสอบ ───────── */
  function startQuiz(u, kind) {
    quiz = {
      uid: u.id,
      kind,
      i: 0,
      ans: [],
      done: false,
      qs: shuffle(u.test).map((q) => ({
        q: q.q,
        explain: q.explain,
        choices: shuffle(q.choices.map((t, k) => ({ t, ok: k === q.a })))
      }))
    };
  }
  function quizPage(u, kind) {
    const n = unitNo(u);
    const r = rec(u.id);
    const name = kind === 'pre' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน';
    const crumbs = `<nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><a href="#${u.id}">หน่วยที่ ${n}</a><span>›</span><span>${name}</span></nav>`;
    const active = quiz && quiz.uid === u.id && quiz.kind === kind;

    if (kind === 'post' && !r.pre) {
      return `<div class="wrap ${u.id}">${crumbs}<div class="quiz"><div class="score"><h1 style="font-size:var(--fs-3)">ทำแบบทดสอบก่อนเรียนก่อนนะ</h1>
<p class="muted">คะแนนก่อนเรียนใช้เทียบว่าเราเก่งขึ้นแค่ไหนหลังเรียน</p><a class="btn primary" href="#${u.id}-pre">ไปทำแบบทดสอบก่อนเรียน</a></div></div></div>`;
    }
    if (active && quiz.done) return `<div class="wrap ${u.id}">${crumbs}${quizResult(u)}</div>`;
    if (active) return `<div class="wrap ${u.id}">${crumbs}${quizQuestion(u, name)}</div>`;

    if (kind === 'pre' && r.pre) {
      const p = pct(r.pre.score, r.pre.total);
      return `<div class="wrap ${u.id}">${crumbs}<div class="quiz"><div class="score">
<p class="eyebrow">${name} · หน่วยที่ ${n}</p><div class="big">${r.pre.score}<small>/${r.pre.total}</small></div>
<span class="chip">ร้อยละ ${p} · ทำเมื่อ ${thaiDate(r.pre.at)}</span>
<p class="muted">แบบทดสอบก่อนเรียนทำได้ครั้งเดียว เฉลยจะแสดงหลังทำแบบทดสอบหลังเรียน</p>
<div class="row" style="justify-content:center"><a class="btn primary" href="#${u.id}-l1">ไปเรียนบทที่ ${n}.1</a><a class="btn" href="#${u.id}">หน้าหน่วย</a></div></div></div></div>`;
    }

    const prev = kind === 'post' && r.post
      ? `<p class="muted">เคยทำ ${r.post.tries} ครั้ง คะแนนสูงสุด ${r.post.best}/${r.post.total} ครั้งล่าสุด ${r.post.score}/${r.post.total}</p>` : '';
    return `<div class="wrap ${u.id}">${crumbs}<div class="quiz"><div class="score">
<p class="eyebrow">หน่วยที่ ${n} · ${u.title}</p>
<h1 style="font-size:var(--fs-4)">${name}</h1>
<p>จำนวน ${u.test.length} ข้อ เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว</p>
<p class="muted">${kind === 'pre' ? 'ทำได้ครั้งเดียว ตั้งใจอ่านโจทย์ทีละข้อ' : 'ข้อสอบชุดเดียวกับก่อนเรียน แต่สลับข้อ ทำซ้ำได้ ระบบเก็บคะแนนสูงสุด'}</p>
${prev}
<button class="btn primary" type="button" data-act="q-start" data-kind="${kind}">เริ่มทำแบบทดสอบ</button></div></div></div>`;
  }
  function quizQuestion(u, name) {
    const q = quiz.qs[quiz.i];
    const total = quiz.qs.length;
    const answered = quiz.ans.filter((a) => a !== undefined).length;
    const last = quiz.i === total - 1;
    const dots = quiz.qs.map((_, k) => `<button type="button" class="dot${quiz.ans[k] !== undefined ? ' has' : ''}${k === quiz.i ? ' cur' : ''}" data-act="q-go" data-i="${k}" aria-label="ข้อ ${k + 1}">${k + 1}</button>`).join('');
    const opts = q.choices.map((c, k) => `<button type="button" class="opt${quiz.ans[quiz.i] === k ? ' sel' : ''}" data-act="q-pick" data-i="${k}" aria-pressed="${quiz.ans[quiz.i] === k}"><span class="k">${KO[k]}</span><span>${esc(c.t)}</span></button>`).join('');
    return `
<div class="quiz">
  <div class="quiz-top">
    <div class="row"><b>${name}</b><span>ตอบแล้ว ${answered}/${total} ข้อ</span></div>
    <div class="meter"><span style="width:${pct(answered, total)}%;background:var(--c)"></span></div>
    <div class="dots">${dots}</div>
  </div>
  <section class="qcard">
    <p class="eyebrow">ข้อที่ ${quiz.i + 1} จาก ${total}</p>
    <h2>${esc(q.q)}</h2>
    <div class="opts">${opts}</div>
    ${quiz.warn ? `<p class="feedback bad">${quiz.warn}</p>` : ''}
  </section>
  <div class="quiz-nav">
    <button type="button" class="btn ghost" data-act="q-prev"${quiz.i === 0 ? ' disabled' : ''}>← ข้อก่อนหน้า</button>
    ${last
      ? `<button type="button" class="btn primary" data-act="q-submit">ส่งคำตอบ</button>`
      : `<button type="button" class="btn primary" data-act="q-next">ข้อถัดไป →</button>`}
  </div>
</div>`;
  }
  function gradeQuiz(u) {
    const total = quiz.qs.length;
    const score = quiz.qs.filter((q, k) => quiz.ans[k] !== undefined && q.choices[quiz.ans[k]].ok).length;
    const at = Date.now();
    eachUnit(u.id, (r) => {
      if (quiz.kind === 'pre') {
        if (!r.pre) r.pre = { score, total, at };
      } else {
        const p = r.post || { best: 0, tries: 0 };
        r.post = { score, total, at, best: Math.max(p.best, score), tries: p.tries + 1 };
      }
    });
    quiz.done = true;
    quiz.score = score;
  }
  function quizResult(u) {
    const n = unitNo(u);
    const r = rec(u.id);
    const total = quiz.qs.length;
    const p = pct(quiz.score, total);
    const lv = level(p);
    if (quiz.kind === 'pre') {
      return `<div class="quiz"><div class="score">
<p class="eyebrow">ผลแบบทดสอบก่อนเรียน · หน่วยที่ ${n}</p>
<div class="big">${quiz.score}<small>/${total}</small></div>
<span class="chip">ร้อยละ ${p}</span>
<p>${p >= 80 ? 'เก่งมาก! รู้เรื่องนี้มาก่อนเยอะเลย ไปเรียนต่อให้เก่งยิ่งขึ้น' : 'ไม่เป็นไร บทเรียนในหน่วยนี้จะช่วยให้เราเข้าใจมากขึ้น'}</p>
<p class="muted">เฉลยจะแสดงหลังทำแบบทดสอบหลังเรียน</p>
<div class="row" style="justify-content:center"><a class="btn primary" href="#${u.id}-l1">ไปเรียนบทที่ ${n}.1</a><a class="btn" href="#${u.id}">หน้าหน่วย</a></div>
</div></div>`;
    }
    const gain = quiz.score - (r.pre ? r.pre.score : 0);
    const review = quiz.qs.map((q, k) => {
      const a = quiz.ans[k];
      const mine = a === undefined ? null : q.choices[a];
      const right = q.choices.find((c) => c.ok);
      const ok = mine && mine.ok;
      return `<article class="rv"><h3>${k + 1}. ${esc(q.q)}</h3>
<p class="ans">คำตอบของฉัน: <b class="${ok ? 'ok' : 'bad'}">${mine ? esc(mine.t) : 'ไม่ได้ตอบ'} ${ok ? '✓' : '✗'}</b>${ok ? '' : `<br>คำตอบที่ถูก: <b class="ok">${esc(right.t)}</b>`}</p>
<p class="why">${esc(q.explain)}</p></article>`;
    }).join('');
    return `<div class="quiz">
<div class="score">
  <p class="eyebrow">ผลแบบทดสอบหลังเรียน · หน่วยที่ ${n}</p>
  <div class="big">${quiz.score}<small>/${total}</small></div>
  <span class="chip ${lv.c}">ร้อยละ ${p} · ${lv.t}</span>
  <div class="compare" style="width:100%;max-width:440px">
    <div class="stat"><b>${r.pre ? r.pre.score : '–'}</b><span>ก่อนเรียน</span></div>
    <div class="stat"><b>${quiz.score}</b><span>หลังเรียน</span></div>
    <div class="stat"><b>${gain >= 0 ? '+' : ''}${gain}</b><span>พัฒนาการ</span></div>
  </div>
  <p>${p >= PASS ? (gain > 0 ? `เก่งขึ้นกว่าก่อนเรียน ${gain} คะแนน ยอดเยี่ยม!` : 'ผ่านเกณฑ์แล้ว เก่งมาก!') : 'ยังไม่ผ่านเกณฑ์ร้อยละ 60 ลองอ่านเฉลย ทบทวนบทเรียน แล้วทำใหม่อีกครั้ง'}</p>
  <div class="row" style="justify-content:center">
    <button class="btn" type="button" data-act="q-start" data-kind="post">ทำอีกครั้ง</button>
    ${n < C.units.length ? `<a class="btn primary" href="#u${n + 1}">ไปหน่วยที่ ${n + 1}</a>` : `<a class="btn primary" href="#results">ดูผลการเรียน</a>`}
  </div>
</div>
<h2 style="font-size:var(--fs-3)">เฉลยและคำอธิบาย</h2>
<div class="review">${review}</div>
</div>`;
  }

  /* ───────── แบบฝึกหัด ───────── */
  const KIND = { choice: 'เลือกตอบ', tf: 'ถูกหรือผิด', order: 'เรียงลำดับ', match: 'จับคู่', grid: 'เขียนคำสั่ง' };
  function exercisePage(u) {
    const n = unitNo(u);
    const s = stats(u);
    const cards = u.exercises.map((_, i) => exCard(u, i)).join('');
    return `
<div class="wrap ${u.id}">
  <nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><a href="#${u.id}">หน่วยที่ ${n}</a><span>›</span><span>แบบฝึกหัด</span></nav>
  <header class="band">
    <p class="eyebrow">แบบฝึกหัด · หน่วยที่ ${n}</p>
    <h1>${u.title}</h1>
    <div class="row" id="ex-summary">${exSummary(u, s)}</div>
  </header>
  <div class="ex-list">${cards}</div>
  <div class="pager" style="max-width:820px">
    <a class="btn ghost" href="#${u.id}">← หน้าหน่วย</a>
    <a class="btn primary" href="#${u.id}-post">ไปทำแบบทดสอบหลังเรียน →</a>
  </div>
</div>`;
  }
  function exSummary(u, s) {
    return `<span class="chip" style="background:rgba(255,255,255,.2);color:inherit">ทำเสร็จ ${s.exDone}/${u.exercises.length} ข้อ</span>
<span class="chip" style="background:rgba(255,255,255,.2);color:inherit">ถูกตั้งแต่ครั้งแรก ${s.exFirst} ข้อ</span>`;
  }
  function tmp(u, i) {
    const k = `${u.id}-${i}`;
    if (temp[k]) return temp[k];
    const ex = u.exercises[i];
    const t = { fb: null };
    if (ex.type === 'choice') t.order = shuffle(ex.choices.map((_, k2) => k2));
    if (ex.type === 'order') { t.pool = shuffle(ex.items.map((_, k2) => k2)); t.picked = []; }
    if (ex.type === 'match') { t.opts = shuffle([...new Set(ex.pairs.map((p) => p[1]))]); t.rows = shuffle(ex.pairs.map((_, k2) => k2)); t.sel = {}; t.marks = null; }
    if (ex.type === 'grid') { t.prog = []; t.times = 1; t.pos = null; t.trail = []; t.crash = null; t.runIdx = -1; t.running = false; }
    return (temp[k] = t);
  }
  function exCard(u, i) {
    const ex = u.exercises[i];
    const e = rec(u.id).ex[i] || { tries: 0, ok: false };
    const t = tmp(u, i);
    let body = '';
    if (ex.type === 'choice') body = exChoice(ex, e, t, i);
    else if (ex.type === 'tf') body = exTF(ex, e, t, i);
    else if (ex.type === 'order') body = exOrder(ex, e, t, i);
    else if (ex.type === 'match') body = exMatch(ex, e, t, i, u);
    else if (ex.type === 'grid') body = exGrid(ex, e, t, i);
    let fb = '';
    if (e.ok) {
      fb = `<p class="feedback ok">${e.revealed ? 'เฉลย' : e.tries === 1 ? 'ถูกต้อง! ทำได้ตั้งแต่ครั้งแรก' : 'ถูกต้องแล้ว!'} · ${esc(ex.explain)}</p>`;
    } else if (t.fb) {
      fb = `<p class="feedback ${t.fb.cls}">${t.fb.msg}</p>`;
    }
    const reveal = !e.ok && e.tries >= 2
      ? `<button type="button" class="btn ghost" data-act="ex-reveal" data-ex="${i}">ดูเฉลย</button>` : '';
    return `
<section class="ex" data-card="${i}" aria-labelledby="ex-h-${i}">
  <div class="ex-head">
    <div><p class="ex-kind">ข้อ ${i + 1} · ${KIND[ex.type]}</p><h3 id="ex-h-${i}">${esc(ex.q)}</h3></div>
    ${e.ok ? `<span class="chip ${e.tries === 1 && !e.revealed ? 'ok' : 'warn'}">${e.revealed ? 'ดูเฉลยแล้ว' : e.tries === 1 ? 'ถูกครั้งแรก' : 'ทำเสร็จ'}</span>` : e.tries ? `<span class="chip">ลองแล้ว ${e.tries} ครั้ง</span>` : ''}
  </div>
  ${body}
  <div aria-live="polite">${fb}</div>
  ${reveal ? `<div class="row">${reveal}</div>` : ''}
</section>`;
  }
  function exChoice(ex, e, t, i) {
    const right = ex.a;
    const opts = t.order.map((k, pos) => {
      let cls = '';
      if (e.ok && k === right) cls = ' right';
      else if (!e.ok && t.last === k) cls = ' wrong';
      return `<button type="button" class="opt${cls}" data-act="ex-choice" data-ex="${i}" data-k="${k}"${e.ok ? ' disabled' : ''}><span class="k">${KO[pos]}</span><span>${esc(ex.choices[k])}</span></button>`;
    }).join('');
    return `${ex.html ? `<div class="tbl-wrap">${ex.html}</div>` : ''}<div class="opts">${opts}</div>`;
  }
  function exTF(ex, e, t, i) {
    const btn = (val, label, key) => {
      let cls = '';
      if (e.ok && val === ex.a) cls = ' right';
      else if (!e.ok && t.last === val) cls = ' wrong';
      return `<button type="button" class="opt${cls}" data-act="ex-tf" data-ex="${i}" data-v="${val}"${e.ok ? ' disabled' : ''}><span class="k">${key}</span><span>${label}</span></button>`;
    };
    return `<div class="tf">${btn(true, 'ถูก', '✓')}${btn(false, 'ผิด', '✗')}</div>`;
  }
  function exOrder(ex, e, t, i) {
    if (e.ok) {
      return `<ol class="steps">${ex.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
    }
    const pool = t.pool.filter((k) => !t.picked.includes(k))
      .map((k) => `<button type="button" class="tile" data-act="ord-pick" data-ex="${i}" data-k="${k}"><span class="k">+</span><span>${esc(ex.items[k])}</span></button>`).join('');
    const picked = t.picked
      .map((k, pos) => `<button type="button" class="tile" data-act="ord-drop" data-ex="${i}" data-k="${k}" aria-label="เอาออก: ${esc(ex.items[k])}"><span class="k">${pos + 1}</span><span>${esc(ex.items[k])}</span></button>`).join('');
    return `
<div class="order">
  <div class="col"><h4>แตะข้อความตามลำดับ</h4>${pool || '<p class="muted" style="font-size:var(--fs-0)">เลือกครบแล้ว</p>'}</div>
  <div class="col"><h4>ลำดับของฉัน (แตะเพื่อเอาออก)</h4>${picked || '<p class="muted" style="font-size:var(--fs-0)">ยังไม่ได้เลือก</p>'}</div>
</div>
<div class="row"><button type="button" class="btn primary" data-act="ord-check" data-ex="${i}"${t.picked.length === ex.items.length ? '' : ' disabled'}>ตรวจคำตอบ</button>
<button type="button" class="btn ghost" data-act="ord-reset" data-ex="${i}"${t.picked.length ? '' : ' disabled'}>เริ่มใหม่</button></div>`;
  }
  function exMatch(ex, e, t, i, u) {
    const rows = t.rows.map((k) => {
      const [left, right] = ex.pairs[k];
      const val = e.ok ? right : t.sel[k] || '';
      const mark = e.ok ? ' right' : t.marks ? (t.marks[k] ? ' right' : ' wrong') : '';
      const opts = t.opts.map((o) => `<option value="${esc(o)}"${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('');
      return `<div class="mrow${mark}"><label for="m-${u.id}-${i}-${k}">${esc(left)}</label>
<select id="m-${u.id}-${i}-${k}" data-match="${i}" data-k="${k}"${e.ok ? ' disabled' : ''}><option value="">เลือกคำตอบ</option>${opts}</select></div>`;
    }).join('');
    const all = ex.pairs.every((_, k) => t.sel[k]);
    return `<div class="match">${rows}</div>${e.ok ? '' : `<div class="row"><button type="button" class="btn primary" data-act="match-check" data-ex="${i}"${all ? '' : ' disabled'}>ตรวจคำตอบ</button></div>`}`;
  }

  function exGrid(ex, e, t, i) {
    const g = ex.grid;
    const prog = t.prog.map((b, k) => `<button type="button" class="${b.n > 1 ? 'loop' : ''}${t.runIdx === k ? ' run' : ''}" data-act="g-del" data-ex="${i}" data-k="${k}" aria-label="ลบคำสั่ง ${ARROW[b.d]} ${b.n} ครั้ง"${t.running ? ' disabled' : ''}>${ARROW[b.d]}${b.n > 1 ? `<small>×${b.n}</small>` : ''}</button>`).join('');
    const pad = ['U', 'L', 'D', 'R'].map((d) => `<button type="button" data-act="g-add" data-ex="${i}" data-d="${d}" aria-label="เพิ่มคำสั่ง ${{ U: 'ขึ้น', D: 'ลง', L: 'ซ้าย', R: 'ขวา' }[d]}"${t.running || e.ok ? ' disabled' : ''}>${ARROW[d]}</button>`).join('');
    const times = g.loops
      ? `<div class="times"><span>ทำซ้ำ</span>${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${t.times === n ? 'on' : ''}" data-act="g-times" data-ex="${i}" data-n="${n}" aria-pressed="${t.times === n}">×${n}</button>`).join('')}<span class="muted">เลือกจำนวนครั้ง แล้วกดลูกศร</span></div>`
      : '';
    const limit = g.maxBlocks
      ? `<p class="limit${t.prog.length > g.maxBlocks ? ' over' : ''}">ใช้ ${t.prog.length} จาก ${g.maxBlocks} คำสั่ง</p>` : '';
    return `
<div class="gridex">
  ${boardHTML(g, t.pos, t.trail, t.crash)}
  <div class="ctrl">
    <div class="pad" aria-label="ลูกศรคำสั่ง">${pad}</div>
    ${times}
    <div class="prog" aria-label="โปรแกรมของฉัน">${prog || '<span class="empty">ยังไม่มีคำสั่ง กดลูกศรเพื่อเพิ่ม (แตะคำสั่งเพื่อลบ)</span>'}</div>
    ${limit}
    <div class="row">
      <button type="button" class="btn primary" data-act="g-run" data-ex="${i}"${t.prog.length && !t.running && !e.ok ? '' : ' disabled'}>▶ เริ่มเดิน</button>
      <button type="button" class="btn ghost" data-act="g-clear" data-ex="${i}"${t.prog.length && !t.running && !e.ok ? '' : ' disabled'}>ล้างคำสั่ง</button>
    </div>
  </div>
</div>`;
  }
  function runGrid(u, i) {
    const ex = u.exercises[i];
    const g = ex.grid;
    const t = tmp(u, i);
    const steps = [];
    t.prog.forEach((b, k) => { for (let n = 0; n < b.n; n++) steps.push({ d: b.d, k }); });
    t.pos = g.start.slice();
    t.trail = [g.start.slice()];
    t.crash = null;
    t.fb = { cls: 'info', msg: 'กำลังเดินตามคำสั่ง…' };
    t.running = true;
    let s = 0;
    const delay = reduceMotion ? 80 : 380;
    const tick = () => {
      if (s >= steps.length) return finish(null);
      const st = steps[s];
      t.runIdx = st.k;
      const nx = t.pos[0] + MOVE[st.d][0];
      const ny = t.pos[1] + MOVE[st.d][1];
      const out = nx < 0 || ny < 0 || nx >= g.size[0] || ny >= g.size[1];
      const hit = !out && (g.rocks || []).some((r) => r[0] === nx && r[1] === ny);
      if (out || hit) {
        if (hit) t.crash = [nx, ny];
        return finish({ out, hit, k: st.k });
      }
      t.pos = [nx, ny];
      t.trail.push([nx, ny]);
      s++;
      refreshCard(u, i);
      setTimeout(tick, delay);
    };
    const finish = (fail) => {
      t.running = false;
      t.runIdx = fail ? fail.k : -1;
      const atGoal = t.pos[0] === g.goal[0] && t.pos[1] === g.goal[1];
      const over = g.maxBlocks && t.prog.length > g.maxBlocks;
      let ok = false;
      if (fail) {
        t.fb = { cls: 'bad', msg: `${fail.hit ? 'โอ๊ะ! แมวชนก้อนหิน' : 'โอ๊ะ! แมวเดินออกนอกตาราง'} ที่คำสั่งที่ ${fail.k + 1} ลองหาคำสั่งที่ผิดแล้วแก้ไข (ดีบัก)` };
      } else if (!atGoal) {
        t.fb = { cls: 'bad', msg: 'ยังไปไม่ถึงปลา ลองนับช่องอีกครั้ง แล้วเพิ่มหรือแก้คำสั่ง' };
      } else if (over) {
        t.fb = { cls: 'bad', msg: `ถึงปลาแล้ว! แต่ใช้ ${t.prog.length} คำสั่ง เกิน ${g.maxBlocks} คำสั่ง ลองใช้ทำซ้ำรวมคำสั่งที่เหมือนกัน` };
      } else {
        ok = true;
        t.fb = null;
      }
      mark(u, i, ok);
      refreshCard(u, i);
    };
    refreshCard(u, i);
    setTimeout(tick, delay);
  }

  function mark(u, i, ok) {
    eachUnit(u.id, (r) => {
      const e = r.ex[i] || { tries: 0, ok: false };
      if (e.ok) return;
      e.tries += 1;
      if (ok) e.ok = true;
      r.ex[i] = e;
    });
  }
  function refreshCard(u, i, focusSel) {
    const card = app.querySelector(`[data-card="${i}"]`);
    if (!card) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = exCard(u, i);
    const fresh = wrap.firstElementChild;
    card.replaceWith(fresh);
    enhance(fresh);
    const sum = document.getElementById('ex-summary');
    if (sum) sum.innerHTML = exSummary(u, stats(u));
    if (focusSel) {
      const f = fresh.querySelector(focusSel) || fresh.querySelector('button:not([disabled]), select:not([disabled])');
      if (f) f.focus({ preventScroll: true });
    }
  }

  /* ───────── ผลการเรียน ───────── */
  // คะแนนรวมของผู้เรียน 1 คน
  function learnerTotals(key) {
    const L = learner(key);
    let pre = 0; let post = 0; let max = 0;
    const units = C.units.map((u) => {
      const r = L.units[u.id] || {};
      max += u.test.length;
      if (r.pre) pre += r.pre.score;
      if (r.post) post += r.post.best;
      return { pre: r.pre ? r.pre.score : null, post: r.post ? r.post.best : null };
    });
    const lessons = C.units.reduce((a, u) => a + u.lessons.filter((_, i) => ((L.units[u.id] || {}).lessons || {})[i + 1]).length, 0);
    const lessonMax = C.units.reduce((a, u) => a + u.lessons.length, 0);
    return { units, pre, post, max, lessons, lessonMax, stars: totalStars(key) };
  }
  // สรุปผลทุกคนที่เรียนบนเครื่องนี้ สำหรับคัดลอกส่งครู
  function summaryText() {
    const lines = [`ผลการเรียน ${C.subject} ${C.grade}`, `วันที่ ${thaiDate(Date.now())}`, ''];
    const keys = learnersOnDevice();
    if (!keys.length) lines.push('ยังไม่มีผลการเรียนในเครื่องนี้');
    keys.forEach((k) => {
      const t = learnerTotals(k);
      const unitText = t.units.map((x, i) => `หน่วย${i + 1} ${x.pre == null ? '-' : x.pre}/${x.post == null ? '-' : x.post}`).join(' ');
      lines.push(`${nameOf(k)} | ${unitText} | รวมก่อน ${t.pre}/${t.max} หลัง ${t.post}/${t.max} | เรียนจบ ${t.lessons}/${t.lessonMax} บท | ดาว ${t.stars.stars}/${t.stars.max}`);
    });
    lines.push('', 'รูปแบบคะแนน: หน่วย ก่อนเรียน/หลังเรียน (เต็มหน่วยละ 10)');
    return lines.join('\n');
  }
  function resultsPage() {
    const ss = state.session;
    const mine = members();
    let pre = 0; let post = 0; let max = 0; let finished = 0;
    const rows = C.units.map((u, i) => {
      const s = stats(u);
      const r = s.r;
      max += u.test.length;
      if (r.pre) pre += r.pre.score;
      if (r.post) post += r.post.best;
      if (s.progress === 100) finished++;
      const lv = r.post ? level(pct(r.post.best, r.post.total)) : null;
      const gain = r.pre && r.post ? r.post.best - r.pre.score : null;
      return `<tr>
<td><a href="#${u.id}">หน่วยที่ ${i + 1}</a><br><span class="muted">${u.title}</span></td>
<td class="num">${r.pre ? `${r.pre.score}/${r.pre.total}` : '–'}</td>
<td class="num">${r.post ? `${r.post.best}/${r.post.total}` : '–'}</td>
<td class="num">${gain === null ? '–' : (gain >= 0 ? '+' : '') + gain}</td>
<td class="num">${s.exFirst}/${u.exercises.length}</td>
<td class="num">${s.read}/${u.lessons.length}</td>
<td>${lv ? `<span class="chip ${lv.c}">${lv.t}</span>` : '<span class="chip">ยังไม่ทดสอบ</span>'}</td></tr>`;
    }).join('');

    const cmp = C.units.map((u, i) => {
      const r = rec(u.id);
      const a = r.pre ? pct(r.pre.score, r.pre.total) : 0;
      const b = r.post ? pct(r.post.best, r.post.total) : 0;
      return `<div class="cmp-row ${u.id}"><span>หน่วยที่ ${i + 1}</span><div class="cmp-bars cmp-track">
<div class="cmp-bar" style="width:${a}%"><i>${r.pre ? a + '%' : 'ยังไม่ทำ'}</i></div>
<div class="cmp-bar post" style="width:${b}%"><i>${r.post ? b + '%' : 'ยังไม่ทำ'}</i></div></div></div>`;
    }).join('');

    const confirmBox = askReset
      ? `<div class="confirm"><b>ลบผลการเรียนทั้งหมดในเครื่องนี้?</b><span>คะแนนของนักเรียนทุกคนที่เรียนบนเครื่องนี้จะหายไป กู้คืนไม่ได้</span>
<div class="row"><button type="button" class="btn danger" data-act="reset-yes">ลบข้อมูลทั้งหมด</button><button type="button" class="btn ghost" data-act="reset-no">ยกเลิก</button></div></div>`
      : `<button type="button" class="btn ghost" data-act="reset-ask">ลบผลการเรียนทั้งหมดในเครื่องนี้</button>`;

    return `
<div class="wrap">
  <div class="stack">
    <p class="eyebrow">ผลการเรียน${ss && !ss.guest ? ' · ' + roomBy(ss.room).name : ''}</p>
    <h1 style="font-size:var(--fs-4)">${mine.length > 1 ? 'ผลการเรียนของกลุ่มเรา' : esc(nameOf(mine[0]))}</h1>
    ${mine.length > 1 ? `<ul class="who-list">${mine.map((k) => `<li>${esc(nameOf(k, true))}</li>`).join('')}</ul>` : ''}
  </div>
  <div class="kpis">
    <div class="stat"><b>${finished}/${C.units.length}</b><span>หน่วยที่เรียนครบ</span></div>
    <div class="stat"><b>${pre}/${max}</b><span>คะแนนก่อนเรียนรวม</span></div>
    <div class="stat"><b>${post}/${max}</b><span>คะแนนหลังเรียนรวม (สูงสุด)</span></div>
  </div>
  <div class="report">
    <section class="panel stack">
      <h2>คะแนนรายหน่วย${mine.length > 1 ? 'ของกลุ่ม' : ''}</h2>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>หน่วย</th><th class="num">ก่อนเรียน</th><th class="num">หลังเรียน</th><th class="num">พัฒนาการ</th><th class="num">แบบฝึกหัด<br><span class="muted" style="font-weight:400">ถูกครั้งแรก</span></th><th class="num">บทเรียน</th><th>ผล</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>
    <section class="panel stack">
      <h2>ก่อนเรียน เทียบ หลังเรียน</h2>
      <div class="legend"><span><i style="background:var(--line)"></i>ก่อนเรียน</span><span><i style="background:var(--accent)"></i>หลังเรียน (สีตามหน่วย)</span></div>
      <div class="cmp">${cmp}</div>
      <div class="cmp-scale"><span></span><div><span>0%</span><span>50%</span><span>100%</span></div></div>
    </section>
  </div>
  <section class="panel stack">
    <div class="row" style="justify-content:space-between"><h2>ดาวจากเกม</h2>${starText(totalStars().stars, totalStars().max)}</div>
    <div class="gcards">${GAMES.map(gameCard).join('')}</div>
  </section>
  <section class="panel stack">
    <h2>นักเรียนทุกคนที่เรียนบนเครื่องนี้</h2>
    <p class="muted">แถวที่เน้นสีคือกลุ่มที่กำลังเรียนอยู่ คะแนนหลังเรียนเป็นคะแนนสูงสุด</p>
    ${deviceTable()}
  </section>
  <section class="panel stack">
    <h2>ส่งผลการเรียนให้คุณครู</h2>
    <p class="muted">ผลการเรียนเก็บไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น สรุปด้านล่างรวมทุกคนที่เรียนบนเครื่องนี้ กดคัดลอกแล้ววางส่งให้ครูทางแชตหรืออีเมล</p>
    <textarea class="copybox" id="copybox" readonly>${esc(summaryText())}</textarea>
    <div class="row"><button type="button" class="btn primary" data-act="copy">คัดลอกสรุปผล</button><span id="copy-msg" class="muted" aria-live="polite"></span></div>
  </section>
  <section class="stack">${confirmBox}</section>
</div>`;
  }

  function deviceTable() {
    const keys = learnersOnDevice();
    if (!keys.length) return '<p class="muted">ยังไม่มีผลการเรียนในเครื่องนี้</p>';
    const mine = members();
    const head1 = C.units.map((u, i) => `<th colspan="2" class="num">หน่วย ${i + 1}</th>`).join('');
    const head2 = C.units.map(() => '<th class="num sub">ก่อน</th><th class="num sub">หลัง</th>').join('');
    const rows = keys.map((k) => {
      const t = learnerTotals(k);
      const cells = t.units.map((x) => `<td class="num">${x.pre == null ? '–' : x.pre}</td><td class="num">${x.post == null ? '–' : x.post}</td>`).join('');
      return `<tr${mine.includes(k) ? ' class="me"' : ''}><td>${esc(nameOf(k))}</td>${cells}<td class="num"><b>${t.pre}</b></td><td class="num"><b>${t.post}</b></td><td class="num">${t.lessons}/${t.lessonMax}</td><td class="num">${t.stars.stars}</td></tr>`;
    }).join('');
    return `<div class="tbl-wrap"><table class="tbl roster-tbl">
<thead><tr><th rowspan="2">นักเรียน</th>${head1}<th colspan="2" class="num">รวม (เต็ม 50)</th><th rowspan="2" class="num">บทที่<br>เรียนจบ</th><th rowspan="2" class="num">ดาว</th></tr>
<tr>${head2}<th class="num sub">ก่อน</th><th class="num sub">หลัง</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
  }

  /* ───────── วาดตารางภาพนิ่งและแผนภูมิในเนื้อหา ───────── */
  function enhance(root) {
    root.querySelectorAll('.mini-grid[data-grid]').forEach((el) => {
      let g;
      try { g = JSON.parse(el.dataset.grid); } catch (e) { return; }
      const arrows = {};
      const trail = [g.start.slice()];
      let p = g.start.slice();
      for (const d of g.path || '') {
        arrows[`${p[0]},${p[1]}`] = ARROW[d];
        p = [p[0] + MOVE[d][0], p[1] + MOVE[d][1]];
        trail.push(p);
      }
      el.innerHTML = boardHTML(g, g.start, trail, null, arrows);
      el.removeAttribute('data-grid');
    });
    root.querySelectorAll('.bars[data-bars]').forEach((el) => {
      let rows;
      try { rows = JSON.parse(el.dataset.bars); } catch (e) { return; }
      const max = Math.max(...rows.map((r) => r[1]));
      const step = max <= 10 ? 2 : 5;
      const top = Math.ceil(max / step) * step;
      const n = top / step;
      const ticks = [];
      for (let k = n; k >= 1; k--) ticks.push(`<span>${k * step}</span>`);
      ticks.push('<span>0</span>');
      const bars = rows.map((r) => `<div class="chart-bar" style="height:${(r[1] / top) * 100}%"><b>${r[1]}</b></div>`).join('');
      const labels = rows.map((r) => `<span>${esc(r[0])}</span>`).join('');
      el.innerHTML = `<figure class="chart" style="margin:0">
<h4>${esc(el.dataset.title)}</h4>
<div class="chart-body" style="--steps:${n};--n:${rows.length}" role="img" aria-label="${esc(el.dataset.title)}: ${rows.map((r) => `${r[0]} ${r[1]} ${el.dataset.unit}`).join(', ')}">
  <div class="chart-axis">${ticks.join('')}</div>
  <div class="chart-plot">${bars}</div>
  <span></span>
  <div class="chart-labels">${labels}</div>
</div>
<figcaption class="chart-unit">จำนวน (${esc(el.dataset.unit)})</figcaption></figure>`;
      el.removeAttribute('data-bars');
    });
    root.querySelectorAll('.prose table.tbl').forEach((tbl) => {
      if (tbl.parentElement.classList.contains('tbl-wrap')) return;
      const w = document.createElement('div');
      w.className = 'tbl-wrap';
      tbl.replaceWith(w);
      w.appendChild(tbl);
    });
  }

  /* ───────── การกระทำ ───────── */
  function exCtx(el) {
    const u = current.u;
    const i = Number(el.dataset.ex);
    return { u, i, ex: u.exercises[i], t: tmp(u, i) };
  }
  const actions = {
    'lq-pick'(el) {
      lquiz.ans[Number(el.dataset.q)] = Number(el.dataset.i);
      render(false);
      const b = app.querySelector(`[data-act="lq-pick"][data-q="${el.dataset.q}"][data-i="${el.dataset.i}"]`);
      if (b) b.focus({ preventScroll: true });
    },
    'lq-submit'(el) {
      const kind = el.dataset.kind;
      const { u, l } = current;
      const total = lquiz.qs.length;
      const score = lquiz.qs.filter((q, k) => lquiz.ans[k] !== undefined && q.choices[lquiz.ans[k]].ok).length;
      const at = Date.now();
      eachUnit(u.id, (r) => {
        r.lq = r.lq || {};
        const x = r.lq[l] || (r.lq[l] = {});
        if (kind === 'pre') { if (!x.pre) x.pre = { score, total, at }; }
        else {
          const p0 = x.post || { best: 0, tries: 0 };
          x.post = { score, total, at, best: Math.max(p0.best, score), tries: p0.tries + 1 };
          r.lessons[l] = true;
        }
      });
      lquiz.done = true;
      lquiz.score = score;
      const want = `#${u.id}-l${l}-${kind}`;
      if (location.hash !== want) location.hash = want; // แสดงผลคะแนนในขั้นเดิม
      else render(false);
      const h = document.getElementById('stage-h');
      if (h) h.scrollIntoView({ block: 'start' });
    },
    'lq-retry'() {
      const { u, l } = current;
      lquiz = newLquiz(`${u.id}-${l}-post`, u.lessons[l - 1]);
      render(false);
    },
    'q-start'(el) {
      startQuiz(current.u, el.dataset.kind);
      render(true);
    },
    'q-pick'(el) {
      quiz.ans[quiz.i] = Number(el.dataset.i);
      quiz.warn = null;
      render(false);
      const sel = app.querySelector(`.opt[data-i="${el.dataset.i}"]`);
      if (sel) sel.focus({ preventScroll: true });
    },
    'q-next'() { if (quiz.i < quiz.qs.length - 1) quiz.i++; quiz.warn = null; render(false); },
    'q-prev'() { if (quiz.i > 0) quiz.i--; quiz.warn = null; render(false); },
    'q-go'(el) { quiz.i = Number(el.dataset.i); quiz.warn = null; render(false); },
    'q-submit'() {
      const missing = quiz.qs.map((_, k) => k).filter((k) => quiz.ans[k] === undefined);
      if (missing.length) {
        quiz.i = missing[0];
        quiz.warn = `ยังไม่ได้ตอบข้อ ${missing.map((k) => k + 1).join(', ')} ตอบให้ครบก่อนส่งนะ`;
        render(false);
        return;
      }
      gradeQuiz(current.u);
      render(true);
    },
    'ex-choice'(el) {
      const { u, i, ex, t } = exCtx(el);
      const k = Number(el.dataset.k);
      const ok = k === ex.a;
      t.last = k;
      t.fb = ok ? null : { cls: 'bad', msg: 'ยังไม่ถูก ลองอ่านโจทย์อีกครั้งแล้วเลือกใหม่' };
      mark(u, i, ok);
      refreshCard(u, i, '.opt:not([disabled])');
    },
    'ex-tf'(el) {
      const { u, i, ex, t } = exCtx(el);
      const v = el.dataset.v === 'true';
      const ok = v === ex.a;
      t.last = v;
      t.fb = ok ? null : { cls: 'bad', msg: 'ยังไม่ถูก ลองคิดอีกครั้ง' };
      mark(u, i, ok);
      refreshCard(u, i, '.opt:not([disabled])');
    },
    'ord-pick'(el) {
      const { u, i, t } = exCtx(el);
      t.picked.push(Number(el.dataset.k));
      t.fb = null;
      refreshCard(u, i, '.order .col:first-child .tile');
    },
    'ord-drop'(el) {
      const { u, i, t } = exCtx(el);
      t.picked = t.picked.filter((k) => k !== Number(el.dataset.k));
      t.fb = null;
      refreshCard(u, i, '.order .col:last-child .tile');
    },
    'ord-reset'(el) {
      const { u, i, t } = exCtx(el);
      t.picked = [];
      t.fb = null;
      refreshCard(u, i, '.tile');
    },
    'ord-check'(el) {
      const { u, i, t } = exCtx(el);
      const firstWrong = t.picked.findIndex((k, pos) => k !== pos);
      const ok = firstWrong === -1;
      t.fb = ok ? null : { cls: 'bad', msg: `ยังไม่ถูก ลำดับที่ ${firstWrong + 1} ยังไม่ใช่ ลองเรียงใหม่` };
      if (!ok) t.picked = t.picked.slice(0, firstWrong);
      mark(u, i, ok);
      refreshCard(u, i, '.tile');
    },
    'match-check'(el) {
      const { u, i, ex, t } = exCtx(el);
      t.marks = {};
      ex.pairs.forEach((p, k) => { t.marks[k] = t.sel[k] === p[1]; });
      const wrong = Object.values(t.marks).filter((v) => !v).length;
      const ok = wrong === 0;
      t.fb = ok ? null : { cls: 'bad', msg: `ยังผิด ${wrong} คู่ (กรอบสีแดง) ลองแก้แล้วตรวจใหม่` };
      mark(u, i, ok);
      refreshCard(u, i, '.mrow.wrong select');
    },
    'ex-reveal'(el) {
      const { u, i } = exCtx(el);
      eachUnit(u.id, (r) => {
        const e = r.ex[i] || { tries: 0, ok: false };
        if (!e.ok) { e.ok = true; e.revealed = true; }
        r.ex[i] = e;
      });
      refreshCard(u, i);
    },
    'g-add'(el) {
      const { u, i, ex, t } = exCtx(el);
      const n = ex.grid.loops ? t.times : 1;
      t.prog.push({ d: el.dataset.d, n });
      resetRun(t);
      refreshCard(u, i, `.pad [data-d="${el.dataset.d}"]`);
    },
    'g-times'(el) {
      const { u, i, t } = exCtx(el);
      t.times = Number(el.dataset.n);
      refreshCard(u, i, `.times [data-n="${el.dataset.n}"]`);
    },
    'g-del'(el) {
      const { u, i, t } = exCtx(el);
      t.prog.splice(Number(el.dataset.k), 1);
      resetRun(t);
      refreshCard(u, i, '.prog button');
    },
    'g-clear'(el) {
      const { u, i, t } = exCtx(el);
      t.prog = [];
      resetRun(t);
      refreshCard(u, i, '.pad button');
    },
    'g-run'(el) {
      const { u, i } = exCtx(el);
      runGrid(u, i);
    },
    'copy'() {
      const box = document.getElementById('copybox');
      const msg = document.getElementById('copy-msg');
      const fallback = () => {
        box.focus();
        box.select();
        msg.textContent = 'เลือกข้อความไว้แล้ว กด Ctrl+C (หรือกดค้างแล้วเลือกคัดลอก)';
      };
      try {
        navigator.clipboard.writeText(box.value).then(() => { msg.textContent = 'คัดลอกแล้ว'; }, fallback);
      } catch (e) { fallback(); }
    },
    'pick-room'(el) { pick = { room: el.dataset.room, nos: [] }; render(true); },
    'pick-back'() { pick = { room: null, nos: [] }; render(true); },
    'pick-kid'(el) {
      const no = Number(el.dataset.no);
      if (pick.nos.includes(no)) pick.nos = pick.nos.filter((n) => n !== no);
      else if (pick.nos.length < MAX_GROUP) pick.nos = pick.nos.concat(no).sort((a, b) => a - b);
      render(false);
      const btn = app.querySelector(`.kid[data-no="${no}"]`);
      if (btn) btn.focus({ preventScroll: true });
    },
    'login-go'() { if (pick.nos.length) startSession({ room: pick.room, nos: pick.nos.slice() }); },
    'guest'() { startSession({ guest: true }); },
    'logout'() {
      state.session = null;
      quiz = null;
      temp = {};
      save();
      render(true);
    },
    'reset-ask'() { askReset = true; render(false); },
    'reset-no'() { askReset = false; render(false); },
    'reset-yes'() {
      state = fresh();
      pick = { room: null, nos: [] };
      temp = {};
      quiz = null;
      askReset = false;
      save();
      render(true);
    }
  };
  function resetRun(t) { t.pos = null; t.trail = []; t.crash = null; t.fb = null; t.runIdx = -1; }

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !actions[el.dataset.act]) return;
    e.preventDefault();
    actions[el.dataset.act](el, e);
  });
  app.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.match !== undefined) {
      const u = current.u;
      const i = Number(el.dataset.match);
      const t = tmp(u, i);
      t.sel[Number(el.dataset.k)] = el.value;
      t.marks = null;
      t.fb = null;
      refreshCard(u, i, `#${el.id}`);
    }
  });
  app.addEventListener('submit', (e) => e.preventDefault());

  window.addEventListener('hashchange', () => {
    const v = parse();
    // ออกจากหน้าแบบทดสอบระหว่างทำ ให้เริ่มใหม่เมื่อกลับมา
    if (quiz && !(v.view === 'quiz' && v.u.id === quiz.uid && v.kind === quiz.kind)) quiz = null;
    if (lquiz && !(v.view === 'lesson' && lquiz.key === `${v.u.id}-${v.l}-${v.stage}`)) lquiz = null;
    askReset = false;
    render(true);
  });
  render(false);
})();
