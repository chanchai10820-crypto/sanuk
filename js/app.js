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
  const ARROW = { U: '⬆', D: '⬇', L: '⬅', R: '➡' };
  const MOVE = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app = document.getElementById('app');

  let state = load();
  let quiz = null;        // แบบทดสอบที่กำลังทำอยู่
  let temp = {};          // สถานะชั่วคราวของแบบฝึกหัดแต่ละข้อ
  let askReset = false;

  /* ───────── ข้อมูลที่บันทึก ───────── */
  function fresh() { return { profile: { name: '', room: '', no: '' }, units: {} }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.units && s.profile) return s;
    } catch (e) { /* ใช้ค่าเริ่มต้น */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* เบราว์เซอร์ไม่ให้บันทึก */ }
  }
  function rec(uid) { return state.units[uid] || (state.units[uid] = { lessons: {}, ex: {} }); }

  /* ───────── ตัวช่วย ───────── */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (s, t) => (t ? Math.round((s * 100) / t) : 0);
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
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
    if (h === 'course' || h === 'results') return { view: h };
    if ((m = h.match(/^u(\d)$/)) && unitBy(m[1])) return { view: 'unit', u: unitBy(m[1]) };
    if ((m = h.match(/^u(\d)-l(\d+)$/)) && unitBy(m[1]) && unitBy(m[1]).lessons[m[2] - 1]) return { view: 'lesson', u: unitBy(m[1]), l: Number(m[2]) };
    if ((m = h.match(/^u(\d)-(pre|post)$/)) && unitBy(m[1])) return { view: 'quiz', u: unitBy(m[1]), kind: m[2] };
    if ((m = h.match(/^u(\d)-ex$/)) && unitBy(m[1])) return { view: 'ex', u: unitBy(m[1]) };
    return { view: 'home' };
  }

  let current = parse();
  function render(scrollTop) {
    current = parse();
    const v = current;
    let html;
    if (v.view === 'course') html = coursePage();
    else if (v.view === 'results') html = resultsPage();
    else if (v.view === 'unit') html = unitPage(v.u);
    else if (v.view === 'lesson') html = lessonPage(v.u, v.l);
    else if (v.view === 'quiz') html = quizPage(v.u, v.kind);
    else if (v.view === 'ex') html = exercisePage(v.u);
    else html = homePage();
    app.innerHTML = html;
    enhance(app);
    document.querySelectorAll('[data-nav]').forEach((a) => {
      a.classList.toggle('on', a.dataset.nav === (v.view === 'course' || v.view === 'results' ? v.view : 'home'));
    });
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
    const p = state.profile;
    const all = C.units.map(stats);
    const overall = Math.round(all.reduce((a, s) => a + s.progress, 0) / all.length);
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
      <p class="lead">บทเรียนออนไลน์ 5 หน่วย ตั้งแต่อัลกอริทึม การเขียนโปรแกรม Scratch การค้นหาและนำเสนอข้อมูล ไปจนถึงการใช้อินเทอร์เน็ตอย่างปลอดภัย ทุกหน่วยมีแบบทดสอบก่อนเรียน แบบฝึกหัด และแบบทดสอบหลังเรียน</p>
    </div>
    <form class="panel profile" id="profile" autocomplete="off">
      <h2 id="hello-name">${p.name ? 'สวัสดี ' + esc(p.name) : 'เขียนชื่อก่อนเริ่มเรียน'}</h2>
      <div class="fields">
        <label class="field">ชื่อ-นามสกุล<input id="pf-name" data-pf="name" value="${esc(p.name)}" placeholder="เช่น เด็กหญิงมะลิ ใจดี"></label>
        <label class="field">ชั้น<input id="pf-room" data-pf="room" value="${esc(p.room)}" placeholder="ป.3/1"></label>
        <label class="field">เลขที่<input id="pf-no" data-pf="no" value="${esc(p.no)}" inputmode="numeric" placeholder="12"></label>
      </div>
      <div class="overall">
        <div class="row"><span>ความก้าวหน้าทั้งรายวิชา</span><b>${overall}%</b></div>
        <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overall}"><span style="width:${overall}%"></span></div>
      </div>
      <p class="muted" style="font-size:var(--fs-0)">ชื่อนี้จะแสดงในหน้าผลการเรียน ใช้ส่งผลให้คุณครู</p>
    </form>
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
      <li><b>เรียนเนื้อหา</b><span>อ่านบทเรียน ลองคิด แล้วกดอ่านจบแล้ว</span></li>
      <li><b>ทำแบบฝึกหัด</b><span>เรียงลำดับ จับคู่ เขียนคำสั่งพาแมวไปหาปลา</span></li>
      <li><b>ทดสอบหลังเรียน</b><span>10 ข้อ เทียบคะแนนกับก่อนเรียน ดูเฉลยได้</span></li>
    </ul>
  </section>
</div>`;
  }

  /* ───────── หน้ารายวิชา ───────── */
  function coursePage() {
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
    <h2>การวัดและประเมินผล</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>เครื่องมือ</th><th>จำนวน</th><th>วิธีใช้</th></tr></thead>
      <tbody>
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
<span>${n}.${i + 1} ${l.title}</span><span class="muted" style="font-size:var(--fs-0)">${r.lessons[i + 1] ? 'อ่านแล้ว' : 'ยังไม่อ่าน'}</span></a></li>`).join('');
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
  <header class="band">
    <p class="eyebrow">หน่วยการเรียนรู้ที่ ${n} · ${u.hours} ชั่วโมง</p>
    <h1>${u.title}</h1>
    <p class="ind"><b>${u.indicator.code}</b><span>${u.indicator.text}</span></p>
    <div><p><b>เรียนจบแล้ว นักเรียนจะ</b></p><ul>${u.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>
  </header>
  <div class="path">
    <div class="step${r.pre ? ' done' : ''}"><span class="n">1</span><section class="panel"><h2>แบบทดสอบก่อนเรียน</h2>${preBody}</section></div>
    <div class="step${s.read === u.lessons.length ? ' done' : ''}"><span class="n">2</span><section class="panel">
      <div class="row" style="justify-content:space-between"><h2>เรียนเนื้อหา</h2><span class="chip">${s.read}/${u.lessons.length} บท</span></div>
      <ul class="lesson-list">${lessons}</ul></section></div>
    <div class="step${s.exDone === u.exercises.length ? ' done' : ''}"><span class="n">3</span><section class="panel">
      <div class="row" style="justify-content:space-between"><h2>แบบฝึกหัด</h2><span class="chip">${s.exDone}/${u.exercises.length} ข้อ</span></div>
      <p>${u.exercises.length} ข้อ มีทั้งเลือกตอบ ถูก-ผิด เรียงลำดับ จับคู่${u.exercises.some((e) => e.type === 'grid') ? ' และเขียนคำสั่งบนตาราง' : ''} ทำซ้ำได้จนกว่าจะถูก</p>
      <div><a class="btn${s.exDone ? '' : ' primary'}" href="#${u.id}-ex">${s.exDone ? 'ทำแบบฝึกหัดต่อ' : 'เริ่มทำแบบฝึกหัด'}</a></div></section></div>
    <div class="step${r.post ? ' done' : ''}"><span class="n">4</span><section class="panel"><h2>แบบทดสอบหลังเรียน</h2>${postBody}</section></div>
  </div>
</div>`;
  }

  /* ───────── หน้าบทเรียน ───────── */
  function lessonPage(u, l) {
    const n = unitNo(u);
    const lesson = u.lessons[l - 1];
    const r = rec(u.id);
    const isLast = l === u.lessons.length;
    const next = isLast ? `#${u.id}-ex` : `#${u.id}-l${l + 1}`;
    const side = u.lessons.map((x, i) => `
<li><a href="#${u.id}-l${i + 1}"${i + 1 === l ? ' aria-current="page" style="outline:2px solid var(--c)"' : ''}><span class="tick${r.lessons[i + 1] ? ' on' : ''}" aria-hidden="true">${r.lessons[i + 1] ? '✓' : ''}</span><span>${n}.${i + 1} ${x.title}</span><span></span></a></li>`).join('');
    return `
<div class="wrap ${u.id}">
  <nav class="crumbs" aria-label="ตำแหน่ง"><a href="#home">หน้าแรก</a><span>›</span><a href="#${u.id}">หน่วยที่ ${n} ${u.title}</a><span>›</span><span>บทที่ ${n}.${l}</span></nav>
  <div class="reader">
    <article class="article">
      <div class="head">
        <p class="eyebrow">หน่วยที่ ${n} · บทเรียนที่ ${n}.${l} จาก ${u.lessons.length} บท</p>
        <h1>${lesson.title}</h1>
      </div>
      <div class="prose">${lesson.body}</div>
      <section class="recap"><h2>สรุปบทเรียน</h2><ul>${lesson.recap.map((x) => `<li>${x}</li>`).join('')}</ul></section>
      <div class="pager">
        ${l > 1 ? `<a class="btn ghost" href="#${u.id}-l${l - 1}">← บทก่อนหน้า</a>` : `<a class="btn ghost" href="#${u.id}">← กลับหน้าหน่วย</a>`}
        <button class="btn primary" type="button" data-act="read" data-next="${next}">${r.lessons[l] ? '' : 'อ่านจบแล้ว · '}${isLast ? 'ไปทำแบบฝึกหัด' : 'บทถัดไป'} →</button>
      </div>
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
    const r = rec(u.id);
    const at = Date.now();
    if (quiz.kind === 'pre') {
      if (!r.pre) r.pre = { score, total, at };
    } else {
      const p = r.post || { best: 0, tries: 0 };
      r.post = { score, total, at, best: Math.max(p.best, score), tries: p.tries + 1 };
    }
    quiz.done = true;
    quiz.score = score;
    save();
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

  /* ตารางเดิน */
  function boardHTML(g, pos, trail, crash, arrows) {
    const [w, h] = g.size;
    const rock = (x, y) => (g.rocks || []).some((r) => r[0] === x && r[1] === y);
    const p = pos || g.start;
    let cells = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isHero = p[0] === x && p[1] === y;
        const isGoal = g.goal[0] === x && g.goal[1] === y;
        const inTrail = trail && trail.some((c) => c[0] === x && c[1] === y);
        let cls = 'cell';
        let content = '';
        if (rock(x, y)) { cls += ' rock'; content = '🪨'; }
        if (inTrail) cls += ' trail';
        if (arrows && arrows[`${x},${y}`]) content = `<span class="arw">${arrows[`${x},${y}`]}</span>`;
        if (isGoal) content = '🐟';
        if (isHero) content = '🐱';
        if (crash && crash[0] === x && crash[1] === y) { cls += ' crash'; content = '💥'; }
        if (isHero && isGoal) { cls += ' win'; content = '🐱'; }
        cells += `<div class="${cls}">${content}</div>`;
      }
    }
    const desc = `ตาราง ${w} คอลัมน์ ${h} แถว แมวอยู่คอลัมน์ ${p[0] + 1} แถว ${p[1] + 1} ปลาอยู่คอลัมน์ ${g.goal[0] + 1} แถว ${g.goal[1] + 1}`;
    return `<div class="board" style="--cols:${w}" role="img" aria-label="${desc}">${cells}</div>`;
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
    const r = rec(u.id);
    const e = r.ex[i] || { tries: 0, ok: false };
    if (e.ok) return;
    e.tries += 1;
    if (ok) e.ok = true;
    r.ex[i] = e;
    save();
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
  function summaryText() {
    const p = state.profile;
    const lines = [
      `ผลการเรียน ${C.subject} ${C.grade}`,
      `ชื่อ: ${p.name || '-'}  ชั้น: ${p.room || '-'}  เลขที่: ${p.no || '-'}`,
      ''
    ];
    let pre = 0; let post = 0; let max = 0;
    C.units.forEach((u, i) => {
      const s = stats(u);
      const r = s.r;
      max += u.test.length;
      if (r.pre) pre += r.pre.score;
      if (r.post) post += r.post.best;
      const lv = r.post ? level(pct(r.post.best, r.post.total)).t : 'ยังไม่ทดสอบ';
      lines.push(`หน่วยที่ ${i + 1} ${u.title}: ก่อนเรียน ${r.pre ? r.pre.score : '-'}/${u.test.length}, หลังเรียน ${r.post ? r.post.best : '-'}/${u.test.length}, แบบฝึกหัดถูกครั้งแรก ${s.exFirst}/${u.exercises.length}, ผล ${lv}`);
    });
    lines.push('', `รวม ก่อนเรียน ${pre}/${max} หลังเรียน ${post}/${max} พัฒนาการ ${post - pre >= 0 ? '+' : ''}${post - pre}`);
    lines.push(`วันที่: ${thaiDate(Date.now())}`);
    return lines.join('\n');
  }
  function resultsPage() {
    const p = state.profile;
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
      ? `<div class="confirm"><b>ลบผลการเรียนทั้งหมดในเครื่องนี้?</b><span>คะแนนทุกหน่วยและชื่อจะหายไป กู้คืนไม่ได้</span>
<div class="row"><button type="button" class="btn danger" data-act="reset-yes">ลบข้อมูลทั้งหมด</button><button type="button" class="btn ghost" data-act="reset-no">ยกเลิก</button></div></div>`
      : `<button type="button" class="btn ghost" data-act="reset-ask">เริ่มเรียนใหม่ทั้งหมด</button>`;

    return `
<div class="wrap">
  <div class="stack">
    <p class="eyebrow">ผลการเรียน</p>
    <h1 style="font-size:var(--fs-4)">${p.name ? esc(p.name) : 'ผลการเรียนของฉัน'}</h1>
    <p class="muted">${p.room ? 'ชั้น ' + esc(p.room) : 'ยังไม่ได้ระบุชั้น'}${p.no ? ' · เลขที่ ' + esc(p.no) : ''} · <a href="#home">แก้ไขชื่อ</a></p>
  </div>
  <div class="kpis">
    <div class="stat"><b>${finished}/${C.units.length}</b><span>หน่วยที่เรียนครบ</span></div>
    <div class="stat"><b>${pre}/${max}</b><span>คะแนนก่อนเรียนรวม</span></div>
    <div class="stat"><b>${post}/${max}</b><span>คะแนนหลังเรียนรวม (สูงสุด)</span></div>
  </div>
  <div class="report">
    <section class="panel stack">
      <h2>คะแนนรายหน่วย</h2>
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
    <h2>ส่งผลการเรียนให้คุณครู</h2>
    <p class="muted">ผลการเรียนเก็บไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น กดคัดลอกแล้ววางส่งให้ครูทางแชตหรืออีเมล</p>
    <textarea class="copybox" id="copybox" readonly>${esc(summaryText())}</textarea>
    <div class="row"><button type="button" class="btn primary" data-act="copy">คัดลอกสรุปผล</button><span id="copy-msg" class="muted" aria-live="polite"></span></div>
  </section>
  <section class="stack">${confirmBox}</section>
</div>`;
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
    'read'(el) {
      const u = current.u;
      rec(u.id).lessons[current.l] = true;
      save();
      location.hash = el.dataset.next;
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
      const r = rec(u.id);
      const e = r.ex[i] || { tries: 0, ok: false };
      e.ok = true;
      e.revealed = true;
      r.ex[i] = e;
      save();
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
    'reset-ask'() { askReset = true; render(false); },
    'reset-no'() { askReset = false; render(false); },
    'reset-yes'() {
      state = fresh();
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
  app.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.pf) {
      state.profile[el.dataset.pf] = el.value.trim();
      save();
      if (el.dataset.pf === 'name') {
        const h = document.getElementById('hello-name');
        if (h) h.textContent = state.profile.name ? 'สวัสดี ' + state.profile.name : 'เขียนชื่อก่อนเริ่มเรียน';
      }
    }
  });
  app.addEventListener('submit', (e) => e.preventDefault());

  window.addEventListener('hashchange', () => {
    const v = parse();
    // ออกจากหน้าแบบทดสอบระหว่างทำ ให้เริ่มใหม่เมื่อกลับมา
    if (quiz && !(v.view === 'quiz' && v.u.id === quiz.uid && v.kind === quiz.kind)) quiz = null;
    askReset = false;
    render(true);
  });
  render(false);
})();
