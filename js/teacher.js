/*
 * หน้าครู (หลังบ้าน) #teacher
 *   ภาพรวมห้อง · รายคน · วิเคราะห์ข้อสอบ · เครื่องมือสอน · นำเข้า/ส่งออกข้อมูล
 * ผลการเรียนอยู่ในเบราว์เซอร์ของแต่ละเครื่อง นักเรียนส่งไฟล์หรือรหัสผลการเรียนให้ครู
 * ครูนำเข้าที่หน้านี้ ข้อมูลที่นำเข้าเก็บในเบราว์เซอร์ของเครื่องครูเท่านั้น
 * รหัสผ่านหน้าครูกันนักเรียนเข้ามาโดยไม่ตั้งใจ ไม่ใช่ระบบรักษาความปลอดภัย
 */
(function () {
  'use strict';

  const TKEY = 'sanuk-teacher-v1';
  const OPEN_KEY = 'sanuk-teacher-open';
  const CODE_PREFIX = 'SANUK1.';
  const KEY_RE = /^\d-\d+#\d+$/;

  window.TeacherModule = function (api) {
    const { esc, pct, level, PASS, ROSTER, COURSES, GAMES } = api;
    const fresh = () => ({ pin: null, imports: {}, sources: [], projector: false, dock: false, picked: {} });
    let T = (() => { try { const t = JSON.parse(localStorage.getItem(TKEY)); if (t && typeof t === 'object') return Object.assign(fresh(), t); } catch (e) { /* ค่าเริ่มต้น */ } return fresh(); })();
    const saveT = () => { try { localStorage.setItem(TKEY, JSON.stringify(T)); } catch (e) { /* เบราว์เซอร์ไม่ให้บันทึก */ } };
    let unlocked = (() => { try { return sessionStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } })();
    const setOpen = (v) => { unlocked = v; try { if (v) sessionStorage.setItem(OPEN_KEY, '1'); else sessionStorage.removeItem(OPEN_KEY); } catch (e) { /* ไม่เป็นไร */ } };
    const view = { tab: 'class', room: (ROSTER.rooms[0] || {}).id || 'all', student: null, test: 'unit', kind: 'post' };
    const flash = {};
    let pinErr = '';
    let askClear = false;
    const TABS = [['class', '📊 ภาพรวมห้อง'], ['student', '🧒 รายคน'], ['items', '🔍 วิเคราะห์ข้อสอบ'], ['tools', '⏱ เครื่องมือสอน'], ['data', '📥 นำเข้า/ส่งออก']];

    document.documentElement.classList.toggle('projector', !!T.projector);

    /* ───── รหัสผ่าน ───── */
    function hashPin(p) {
      let h = 2166136261;
      for (const ch of 'sanuk-teacher:' + p) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(36);
    }

    /* ───── รวมผลการเรียนจากหลายเครื่อง ───── */
    const clone = (o) => JSON.parse(JSON.stringify(o || {}));
    const earlier = (a, b) => (!a ? b : !b ? a : (a.at || 0) <= (b.at || 0) ? a : b);
    function mergePost(a, b) {
      if (!a) return b;
      if (!b) return a;
      const last = (a.at || 0) >= (b.at || 0) ? a : b;
      return Object.assign({}, last, { best: Math.max(a.best || 0, b.best || 0), tries: Math.max(a.tries || 0, b.tries || 0) });
    }
    function mergeUnit(a, b) {
      a = a || {}; b = b || {};
      const r = { lessons: Object.assign({}, a.lessons, b.lessons), ex: {}, lq: {}, ck: {} };
      const pre = earlier(a.pre, b.pre); if (pre) r.pre = pre;
      const post = mergePost(a.post, b.post); if (post) r.post = post;
      new Set([...Object.keys(a.ex || {}), ...Object.keys(b.ex || {})]).forEach((k) => {
        const x = (a.ex || {})[k]; const y = (b.ex || {})[k];
        r.ex[k] = !x ? y : !y ? x : x.ok && (!y.ok || x.tries <= y.tries) ? x : y.ok ? y : x.tries >= y.tries ? x : y;
      });
      new Set([...Object.keys(a.lq || {}), ...Object.keys(b.lq || {})]).forEach((l) => {
        const x = (a.lq || {})[l] || {}; const y = (b.lq || {})[l] || {};
        const o = {};
        const p1 = earlier(x.pre, y.pre); if (p1) o.pre = p1;
        const p2 = mergePost(x.post, y.post); if (p2) o.post = p2;
        r.lq[l] = o;
      });
      new Set([...Object.keys(a.ck || {}), ...Object.keys(b.ck || {})]).forEach((l) => { r.ck[l] = Object.assign({}, (b.ck || {})[l], (a.ck || {})[l]); });
      return r;
    }
    function mergeLearner(a, b) {
      const out = { units: {}, games: clone(a && a.games) };
      const ua = (a && a.units) || {}; const ub = (b && b.units) || {};
      new Set([...Object.keys(ua), ...Object.keys(ub)]).forEach((id) => { out.units[id] = mergeUnit(ua[id], ub[id]); });
      Object.keys((b && b.games) || {}).forEach((id) => { api.mergeGame(out.games[id] || (out.games[id] = {}), b.games[id]); });
      return out;
    }
    // ข้อมูลจากไฟล์ที่นำเข้าเป็นข้อมูลภายนอก สร้างใหม่ให้เหลือเฉพาะตัวเลขและค่าจริง/เท็จ
    const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const cleanMiss = (m) => { const o = {}; if (m && typeof m === 'object') Object.keys(m).forEach((k) => { if (/^\d+$/.test(k)) o[k] = num(m[k]); }); return o; };
    const cleanScore = (s, post) => {
      if (!s || typeof s !== 'object') return undefined;
      const o = { score: num(s.score), total: num(s.total), at: num(s.at) };
      if (post) { o.best = num(s.best); o.tries = num(s.tries); }
      if (s.miss) o.miss = cleanMiss(s.miss);
      return o;
    };
    function cleanUnit(r) {
      const o = { lessons: {}, ex: {}, lq: {}, ck: {} };
      if (!r || typeof r !== 'object') return o;
      const pre = cleanScore(r.pre); if (pre) o.pre = pre;
      const post = cleanScore(r.post, true); if (post) o.post = post;
      Object.keys(r.lessons || {}).forEach((k) => { if (/^\d+$/.test(k) && r.lessons[k]) o.lessons[k] = true; });
      Object.keys(r.ex || {}).forEach((k) => { const e = r.ex[k]; if (/^\d+$/.test(k) && e) o.ex[k] = { ok: !!e.ok, tries: num(e.tries), revealed: !!e.revealed }; });
      Object.keys(r.lq || {}).forEach((k) => {
        if (!/^\d+$/.test(k) || !r.lq[k]) return;
        const x = {}; const p1 = cleanScore(r.lq[k].pre); const p2 = cleanScore(r.lq[k].post, true);
        if (p1) x.pre = p1; if (p2) x.post = p2;
        o.lq[k] = x;
      });
      Object.keys(r.ck || {}).forEach((k) => {
        if (!/^\d+$/.test(k) || !r.ck[k]) return;
        o.ck[k] = {};
        Object.keys(r.ck[k]).forEach((j) => { const c = r.ck[k][j]; if (/^\d+$/.test(j) && c) o.ck[k][j] = { v: !!c.v, ok: !!c.ok, at: num(c.at) }; });
      });
      return o;
    }
    function cleanLearner(L) {
      const o = { units: {}, games: {} };
      if (!L || typeof L !== 'object') return o;
      Object.keys(L.units || {}).forEach((id) => { if (/^[a-z]\d$/.test(id)) o.units[id] = cleanUnit(L.units[id]); });
      Object.keys(L.games || {}).forEach((id) => {
        const g = L.games[id];
        if (!/^[a-z0-9]+$/.test(id) || !g || typeof g !== 'object') return;
        const x = {};
        ['best', 'score', 'plays', 'wrong'].forEach((k) => { if (g[k] != null) x[k] = num(g[k]); });
        if (g.lv && typeof g.lv === 'object') { x.lv = {}; Object.keys(g.lv).forEach((k) => { if (/^\d+$/.test(k)) x.lv[k] = num(g.lv[k]); }); }
        o.games[id] = x;
      });
      return o;
    }
    // ผลการเรียนทุกคน: ที่นำเข้า + ที่เรียนบนเครื่องนี้
    function allData() {
      const out = {};
      Object.keys(T.imports).forEach((k) => { out[k] = clone(T.imports[k]); });
      const local = api.local();
      Object.keys(local).forEach((k) => {
        if (!KEY_RE.test(k)) return;
        out[k] = out[k] ? mergeLearner(out[k], local[k]) : clone(local[k]);
      });
      return out;
    }

    /* ───── สรุปคะแนน ───── */
    const courseGames = (c) => GAMES.filter((g) => c.units.some((u) => u.id === g.unit));
    function unitSum(u, r) {
      r = r || {};
      const ls = r.lessons || {};
      return {
        pre: r.pre ? r.pre.score : null,
        post: r.post ? r.post.best : null,
        total: u.test.length,
        lessons: u.lessons.filter((_, i) => ls[i + 1]).length,
        exFirst: u.exercises.filter((_, i) => { const e = (r.ex || {})[i]; return e && e.ok && e.tries === 1 && !e.revealed; }).length,
        badge: api.earned(u, r)
      };
    }
    function studentSum(c, L) {
      const units = c.units.map((u) => unitSum(u, ((L && L.units) || {})[u.id]));
      const stars = courseGames(c).reduce((a, g) => { const s = g.summary(((L && L.games) || {})[g.id] || {}); return { stars: a.stars + s.stars, max: a.max + s.max }; }, { stars: 0, max: 0 });
      const started = !!L && c.units.some((u) => {
        const r = (L.units || {})[u.id];
        return r && (r.pre || r.post || ['lessons', 'ex', 'lq', 'ck'].some((k) => Object.keys(r[k] || {}).length));
      });
      return {
        units, stars, started,
        pre: units.reduce((a, x) => a + (x.pre || 0), 0),
        post: units.reduce((a, x) => a + (x.post || 0), 0),
        max: units.reduce((a, x) => a + x.total, 0),
        lessons: units.reduce((a, x) => a + x.lessons, 0),
        lessonMax: c.units.reduce((a, u) => a + u.lessons.length, 0),
        badges: units.filter((x) => x.badge).length,
        weak: units.map((x, i) => (x.post != null && pct(x.post, x.total) < PASS ? i + 1 : 0)).filter(Boolean)
      };
    }
    function roster(roomId) {
      const rooms = roomId === 'all' ? ROSTER.rooms : ROSTER.rooms.filter((r) => r.id === roomId);
      return rooms.flatMap((r) => r.students.map((st) => ({ key: `${r.id}#${st.no}`, room: r, st })));
    }
    const nameCell = (p) => `${esc(p.st.t)}${esc(p.st.n)}`;
    const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

    /* ───── ส่วนหัวและตัวเลือก ───── */
    function roomSelect(withAll) {
      const opts = (withAll ? [['all', 'ทุกห้อง']] : []).concat(ROSTER.rooms.map((r) => [r.id, `${r.name} (${r.students.length} คน)`]));
      return `<label class="t-field"><span>ห้อง</span><select data-tsel="room">${opts.map(([v, t]) => `<option value="${v}"${v === view.room ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
    }
    function shell(body) {
      const C = api.course();
      return `<div class="wrap teacher">
  <div class="t-top">
    <div class="stack"><p class="eyebrow">หน้าครู · ${esc(ROSTER.school || '')}</p><h1 style="font-size:var(--fs-4)">หลังบ้านสำหรับคุณครู</h1></div>
    <div class="row"><a class="btn ghost" href="#home">← กลับหน้าเรียน</a><button type="button" class="btn ghost" data-act="t-lock">🔒 ออกจากหน้าครู</button></div>
  </div>
  <nav class="t-tabs" aria-label="เมนูหน้าครู">${TABS.map(([id, t]) => `<button type="button" class="${view.tab === id ? 'on' : ''}" data-act="t-tab" data-tab="${id}" aria-pressed="${view.tab === id}">${t}</button>`).join('')}</nav>
  ${view.tab === 'tools' || view.tab === 'data' ? '' : `<div class="t-filters">${api.subjTabs()}${roomSelect(view.tab !== 'student')}</div>`}
  ${body}
  <p class="muted t-note">ผลการเรียนในหน้านี้ = ผลที่นำเข้าจากเครื่องนักเรียน (${Object.keys(T.imports).length} คน) รวมกับผลที่เรียนบนเครื่องนี้ · วิชา${esc(C.short)}</p>
</div>`;
    }

    /* ───── รหัสผ่าน ───── */
    function gate() {
      const first = !T.pin;
      return `<div class="wrap teacher"><section class="panel stack t-gate">
  <p class="eyebrow">หน้าครู</p>
  <h1 style="font-size:var(--fs-4)">${first ? 'ตั้งรหัสผ่านหน้าครู' : 'ใส่รหัสผ่านหน้าครู'}</h1>
  <p class="muted">${first ? 'ตั้งรหัสตัวเลข 4–8 หลัก ใช้กันนักเรียนเข้ามาหน้านี้โดยไม่ตั้งใจ (รหัสเก็บไว้ในเครื่องนี้เท่านั้น)' : 'หน้านี้สำหรับคุณครู'}</p>
  <form class="stack" data-tform="${first ? 'set' : 'enter'}">
    <label class="t-field"><span>รหัสผ่าน</span><input id="t-pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required></label>
    ${first ? '<label class="t-field"><span>ใส่รหัสอีกครั้ง</span><input id="t-pin2" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required></label>' : ''}
    ${pinErr ? `<p class="feedback bad">${pinErr}</p>` : ''}
    <div class="row"><button type="submit" class="btn primary">${first ? 'ตั้งรหัสและเข้าหน้าครู' : 'เข้าหน้าครู'}</button><a class="btn ghost" href="#home">กลับหน้าเรียน</a></div>
  </form>
  ${first ? '' : `<details class="t-forgot"><summary>ลืมรหัสผ่าน</summary><p class="muted">ล้างรหัสแล้วตั้งใหม่ได้ ผลการเรียนที่นำเข้าไว้ยังอยู่ครบ</p><button type="button" class="btn ghost" data-act="t-pin-reset">ล้างรหัสผ่าน</button></details>`}
</section></div>`;
    }

    /* ───── 1. ภาพรวมห้อง ───── */
    function classTab() {
      const C = api.course();
      const D = allData();
      const people = roster(view.room).map((p) => Object.assign(p, { s: studentSum(C, D[p.key]) }));
      const started = people.filter((p) => p.s.started);
      const per = C.units.map((u, i) => {
        const pre = started.map((p) => p.s.units[i]).filter((x) => x.pre != null).map((x) => pct(x.pre, x.total));
        const post = started.map((p) => p.s.units[i]).filter((x) => x.post != null).map((x) => pct(x.post, x.total));
        return { u, i, pre: avg(pre), post: avg(post), npre: pre.length, npost: post.length, badges: started.filter((p) => p.s.units[i].badge).length, weak: started.filter((p) => p.s.weak.includes(i + 1)).length };
      });
      const allPre = started.flatMap((p) => p.s.units.filter((x) => x.pre != null).map((x) => pct(x.pre, x.total)));
      const allPost = started.flatMap((p) => p.s.units.filter((x) => x.post != null).map((x) => pct(x.post, x.total)));
      const help = started.filter((p) => p.s.weak.length);
      const kpi = (v, t) => `<div class="stat"><b>${v}</b><span>${t}</span></div>`;
      const chart = per.map((x) => `<div class="cmp-row ${x.u.id}"><span>หน่วยที่ ${x.i + 1}</span><div class="cmp-bars cmp-track">
<div class="cmp-bar" style="width:${x.pre || 0}%" title="หน่วยที่ ${x.i + 1} ก่อนเรียนเฉลี่ย ${x.pre == null ? 'ยังไม่มีข้อมูล' : x.pre + '%'} (${x.npre} คน)"><i>${x.pre == null ? 'ยังไม่มีข้อมูล' : x.pre + '%'}</i></div>
<div class="cmp-bar post" style="width:${x.post || 0}%" title="หน่วยที่ ${x.i + 1} หลังเรียนเฉลี่ย ${x.post == null ? 'ยังไม่มีข้อมูล' : x.post + '%'} (${x.npost} คน)"><i>${x.post == null ? 'ยังไม่มีข้อมูล' : x.post + '%'}</i></div></div></div>`).join('');
      const unitRows = per.map((x) => `<tr><td>หน่วยที่ ${x.i + 1} ${esc(x.u.title)}</td><td class="num">${x.pre == null ? '–' : x.pre + '%'}<br><span class="muted">${x.npre} คน</span></td><td class="num">${x.post == null ? '–' : x.post + '%'}<br><span class="muted">${x.npost} คน</span></td><td class="num">${x.pre != null && x.post != null ? (x.post - x.pre >= 0 ? '+' : '') + (x.post - x.pre) : '–'}</td><td class="num">${x.badges}</td><td class="num">${x.weak ? `<span class="chip warn">⚠ ${x.weak} คน</span>` : '0'}</td></tr>`).join('');
      const cell = (x) => {
        if (x.pre == null && x.post == null) return '<td class="num muted">–</td>';
        const lv = x.post != null ? level(pct(x.post, x.total)) : null;
        return `<td class="num${lv ? ' ' + lv.c : ''}">${x.pre == null ? '–' : x.pre}/${x.post == null ? '–' : x.post}${x.badge ? ' <span aria-label="ได้เหรียญตรา">🏅</span>' : ''}</td>`;
      };
      const rows = people.map((p) => `<tr${p.s.weak.length ? ' class="t-weak"' : ''}>
<td>${esc(p.room.name)}</td><td class="num">${p.st.no}</td><td><button type="button" class="linkbtn" data-act="t-open" data-key="${p.key}">${nameCell(p)}</button></td>
${p.s.units.map(cell).join('')}
<td class="num"><b>${p.s.started ? `${p.s.pre}/${p.s.units.some((x) => x.post != null) ? p.s.post : '–'}` : '–'}</b></td><td class="num">${p.s.lessons}/${p.s.lessonMax}</td><td class="num">${p.s.badges}</td><td class="num">${p.s.stars.stars}</td>
<td>${!p.s.started ? '<span class="chip">ยังไม่เริ่ม</span>' : p.s.weak.length ? `<span class="chip warn">⚠ ทบทวนหน่วย ${p.s.weak.join(', ')}</span>` : p.s.units.some((x) => x.post != null) ? '<span class="chip ok">✓ ตามเกณฑ์</span>' : '<span class="chip">กำลังเรียน</span>'}</td></tr>`).join('');
      return shell(`
<div class="kpis t-kpis">
  ${kpi(`${started.length}/${people.length}`, 'นักเรียนที่เริ่มเรียนแล้ว')}
  ${kpi(allPre.length ? avg(allPre) + '%' : '–', 'ก่อนเรียนเฉลี่ย (ทุกหน่วย)')}
  ${kpi(allPost.length ? avg(allPost) + '%' : '–', 'หลังเรียนเฉลี่ย (ทุกหน่วย)')}
  ${kpi(allPre.length && allPost.length ? `${avg(allPost) - avg(allPre) >= 0 ? '+' : ''}${avg(allPost) - avg(allPre)}` : '–', 'พัฒนาการเฉลี่ย (จุดร้อยละ)')}
  ${kpi(started.reduce((a, p) => a + p.s.badges, 0), 'เหรียญตรารวมทั้งห้อง')}
  ${kpi(help.length, 'คนที่ควรติดตาม')}
</div>
<div class="report">
  <section class="panel stack">
    <h2>คะแนนเฉลี่ยรายหน่วย</h2>
    <div class="legend"><span><i style="background:var(--line)"></i>ก่อนเรียน</span><span><i style="background:var(--accent)"></i>หลังเรียน (สีตามหน่วย)</span></div>
    <div class="cmp">${chart}</div>
    <div class="cmp-scale"><span></span><div><span>0%</span><span>50%</span><span>100%</span></div></div>
    <details><summary>ดูเป็นตาราง</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th>หน่วย</th><th class="num">ก่อนเรียน</th><th class="num">หลังเรียน</th><th class="num">พัฒนาการ</th><th class="num">เหรียญตรา</th><th class="num">ต่ำกว่าเกณฑ์</th></tr></thead><tbody>${unitRows}</tbody></table></div></details>
  </section>
  <section class="panel stack">
    <h2>นักเรียนที่ควรช่วยเหลือ</h2>
    ${help.length ? `<ul class="t-help">${help.map((p) => `<li><button type="button" class="linkbtn" data-act="t-open" data-key="${p.key}">${esc(p.room.name)} เลขที่ ${p.st.no} ${nameCell(p)}</button> <span class="muted">หลังเรียนต่ำกว่าร้อยละ ${PASS} ในหน่วยที่ ${p.s.weak.join(', ')}</span></li>`).join('')}</ul>` : `<p class="muted">${started.length ? 'ยังไม่มีนักเรียนที่ทดสอบหลังเรียนต่ำกว่าเกณฑ์' : 'ยังไม่มีผลการเรียน นำเข้าผลจากเครื่องนักเรียนที่แท็บ "นำเข้า/ส่งออก"'}</p>`}
    <p class="muted">ยังไม่เริ่มเรียน ${people.length - started.length} คน</p>
  </section>
</div>
<section class="panel stack">
  <div class="row" style="justify-content:space-between"><h2>คะแนนรายคน</h2><button type="button" class="btn ghost" data-act="t-csv">⬇ ดาวน์โหลด CSV (เปิดด้วย Excel)</button></div>
  <p class="muted">ช่องหน่วย = ก่อนเรียน/หลังเรียน (เต็มหน่วยละ 10) สีพื้นตามระดับผลหลังเรียน · 🏅 = ได้เหรียญตรา · แตะชื่อเพื่อดูรายละเอียด</p>
  <div class="tbl-wrap"><table class="tbl roster-tbl t-table">
    <thead><tr><th>ห้อง</th><th class="num">เลขที่</th><th>ชื่อ</th>${C.units.map((u, i) => `<th class="num" title="${esc(u.title)}">หน่วย ${i + 1}</th>`).join('')}<th class="num">รวม<br>ก่อน/หลัง</th><th class="num">บทที่<br>เรียนจบ</th><th class="num">เหรียญ</th><th class="num">ดาว</th><th>สถานะ</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</section>`);
    }

    /* ───── 2. รายคน ───── */
    function studentTab() {
      const C = api.course();
      const D = allData();
      const people = roster(view.room === 'all' ? (ROSTER.rooms[0] || {}).id : view.room);
      if (!view.student || !people.some((p) => p.key === view.student)) view.student = (people.find((p) => D[p.key]) || people[0] || {}).key;
      const p = people.find((x) => x.key === view.student);
      const pick = `<label class="t-field"><span>นักเรียน</span><select data-tsel="student">${people.map((x) => `<option value="${x.key}"${x.key === view.student ? ' selected' : ''}>${x.st.no}. ${esc(x.st.t)}${esc(x.st.n)}${D[x.key] ? '' : ' (ยังไม่มีผล)'}</option>`).join('')}</select></label>`;
      if (!p) return shell(`<section class="panel">${pick}<p class="muted">ไม่มีรายชื่อนักเรียน</p></section>`);
      const L = D[p.key];
      const s = studentSum(C, L);
      const units = C.units.map((u, i) => {
        const r = ((L && L.units) || {})[u.id] || {};
        const x = s.units[i];
        const lessons = u.lessons.map((l, k) => {
          const q = (r.lq || {})[k + 1] || {};
          const ck = Object.values((r.ck || {})[k + 1] || {});
          return `<tr><td>${i + 1}.${k + 1} ${esc(l.title)}</td><td class="num">${q.pre ? `${q.pre.score}/${q.pre.total}` : '–'}</td><td class="num">${q.post ? `${q.post.best}/${q.post.total}` : '–'}</td><td class="num">${ck.length ? `${ck.filter((c) => c.ok).length}/${ck.length}` : '–'}</td><td>${(r.lessons || {})[k + 1] ? '<span class="chip ok">✓ จบบท</span>' : '<span class="chip">ยังไม่จบ</span>'}</td></tr>`;
        }).join('');
        const gain = x.pre != null && x.post != null ? x.post - x.pre : null;
        return `<section class="panel stack ${u.id}">
  <div class="row" style="justify-content:space-between"><h3>หน่วยที่ ${i + 1} ${esc(u.title)}</h3>${api.badgeHTML(u, x.badge, true)}</div>
  <div class="compare">
    <div class="stat"><b>${x.pre == null ? '–' : `${x.pre}/${x.total}`}</b><span>ก่อนเรียน</span></div>
    <div class="stat"><b>${x.post == null ? '–' : `${x.post}/${x.total}`}</b><span>หลังเรียน (สูงสุด)${r.post ? ` · ทำ ${r.post.tries} ครั้ง` : ''}</span></div>
    <div class="stat"><b>${gain == null ? '–' : (gain >= 0 ? '+' : '') + gain}</b><span>พัฒนาการ</span></div>
  </div>
  <p class="muted">แบบฝึกหัดถูกตั้งแต่ครั้งแรก ${x.exFirst}/${u.exercises.length} ข้อ · บทที่เรียนจบ ${x.lessons}/${u.lessons.length}${x.post != null ? ` · <span class="chip ${level(pct(x.post, x.total)).c}">${level(pct(x.post, x.total)).t}</span>` : ''}</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>บทเรียน</th><th class="num">ก่อนเรียน</th><th class="num">หลังเรียน</th><th class="num">เช็กความเข้าใจ<br>ตอบถูก</th><th>สถานะ</th></tr></thead><tbody>${lessons}</tbody></table></div>
</section>`;
      }).join('');
      const games = courseGames(C).map((g) => { const sm = g.summary(((L && L.games) || {})[g.id] || {}); return `<li><span aria-hidden="true">${g.emoji}</span> ${esc(g.title)} <b>${'★'.repeat(sm.stars)}</b><span class="muted">${sm.stars}/${sm.max}</span></li>`; }).join('');
      return shell(`
<section class="panel stack">
  <div class="t-filters">${pick}<button type="button" class="btn ghost" data-act="t-print">🖨 พิมพ์รายงาน</button></div>
  <h2>${esc(p.room.name)} เลขที่ ${p.st.no} ${nameCell(p)}</h2>
  ${L ? `<div class="kpis"><div class="stat"><b>${s.pre}/${s.max}</b><span>ก่อนเรียนรวม</span></div><div class="stat"><b>${s.post}/${s.max}</b><span>หลังเรียนรวม</span></div><div class="stat"><b>${s.lessons}/${s.lessonMax}</b><span>บทที่เรียนจบ</span></div><div class="stat"><b>${s.badges}/${C.units.length}</b><span>เหรียญตรา</span></div><div class="stat"><b>${s.stars.stars}/${s.stars.max}</b><span>ดาวจากเกม</span></div></div>` : '<p class="muted">ยังไม่มีผลการเรียนของนักเรียนคนนี้ในวิชานี้</p>'}
</section>
${L ? units + `<section class="panel stack"><h3>ดาวจากเกม</h3><ul class="t-games">${games}</ul></section>` : ''}`);
    }

    /* ───── 3. วิเคราะห์ข้อสอบ ───── */
    function itemsTab() {
      const C = api.course();
      const D = allData();
      const keys = roster(view.room).map((p) => p.key).filter((k) => D[k]);
      const items = [];
      C.units.forEach((u, i) => {
        if (view.test === 'unit') {
          u.test.forEach((q, qi) => items.push({ label: `หน่วยที่ ${i + 1} ข้อ ${qi + 1}`, q, get: (L) => (((L.units || {})[u.id] || {})[view.kind] || null), qi }));
        } else {
          u.lessons.forEach((l, li) => (l.quiz || []).forEach((q, qi) => items.push({ label: `บทที่ ${i + 1}.${li + 1} ข้อ ${qi + 1}`, q, get: (L) => ((((L.units || {})[u.id] || {}).lq || {})[li + 1] || {})[view.kind] || null, qi })));
        }
      });
      const stats = items.map((it) => {
        let n = 0; let wrong = 0; const picks = {};
        keys.forEach((k) => {
          const s = it.get(D[k]);
          if (!s || !s.miss) return;
          n += 1;
          if (s.miss[it.qi] !== undefined) { wrong += 1; picks[s.miss[it.qi]] = (picks[s.miss[it.qi]] || 0) + 1; }
        });
        const top = Object.keys(picks).filter((c) => Number(c) >= 0).sort((a, b) => picks[b] - picks[a])[0];
        return Object.assign({ n, wrong, p: n ? pct(wrong, n) : null, top: top != null ? it.q.choices[top] : null, topN: top != null ? picks[top] : 0 }, it);
      }).filter((x) => x.n).sort((a, b) => b.p - a.p);
      const rows = stats.slice(0, 20).map((x) => `<li class="t-item">
<div class="t-item-head"><span class="eyebrow">${x.label}</span>${x.p >= 50 ? '<span class="chip warn">⚠ ควรสอนซ้ำ</span>' : ''}</div>
<b>${esc(x.q.q)}</b>
<div class="t-bar" title="ตอบผิด ${x.wrong} จาก ${x.n} คน"><span style="width:${x.p}%"></span></div>
<p class="muted">ตอบผิด <b>${x.p}%</b> (${x.wrong}/${x.n} คน) · คำตอบที่ถูก: ${esc(x.q.choices[x.q.a])}${x.top ? ` · ตอบผิดบ่อยที่สุด: "${esc(x.top)}" (${x.topN} คน)` : ''}</p></li>`).join('');
      // คำถามเช็กความเข้าใจระหว่างเรียน
      const CK = window.CHECKS || {};
      const ckRows = C.units.flatMap((u, i) => u.lessons.flatMap((l, li) => (CK[`${u.id}-${li + 1}`] || []).map((q, k) => {
        let n = 0; let ok = 0;
        keys.forEach((key) => { const c = ((((D[key].units || {})[u.id] || {}).ck || {})[li + 1] || {})[k]; if (c) { n += 1; if (c.ok) ok += 1; } });
        return { label: `${i + 1}.${li + 1}`, q, n, p: n ? pct(ok, n) : null };
      }))).filter((x) => x.n).sort((a, b) => a.p - b.p).slice(0, 10);
      const sel = (name, cur, opts) => `<label class="t-field"><span>${name}</span><select data-tsel="${name === 'แบบทดสอบ' ? 'test' : 'kind'}">${opts.map(([v, t]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
      return shell(`
<section class="panel stack">
  <div class="t-filters">${sel('แบบทดสอบ', view.test, [['unit', 'แบบทดสอบหน่วย (10 ข้อ)'], ['lesson', 'แบบทดสอบประจำบท (5 ข้อ)']])}${sel('ครั้ง', view.kind, [['pre', 'ก่อนเรียน'], ['post', 'หลังเรียน (ครั้งล่าสุด)']])}</div>
  <h2>ข้อที่นักเรียนตอบผิดมากที่สุด</h2>
  <p class="muted">เรียงจากข้อที่ตอบผิดมากไปน้อย นับจากนักเรียน ${keys.length} คนที่มีผลการเรียน (เฉพาะผลที่ทำหลังเพิ่มระบบวิเคราะห์ข้อสอบ) ข้อที่ผิดตั้งแต่ร้อยละ 50 ควรสอนซ้ำ</p>
  ${rows ? `<ol class="t-items">${rows}</ol>` : '<p class="muted">ยังไม่มีข้อมูลคำตอบรายข้อสำหรับแบบทดสอบนี้</p>'}
</section>
<section class="panel stack">
  <h2>คำถามเช็กความเข้าใจระหว่างเรียน</h2>
  <p class="muted">ร้อยละของนักเรียนที่ตอบถูกในครั้งแรก เรียงจากข้อที่เข้าใจน้อยที่สุด</p>
  ${ckRows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>บท</th><th>ข้อความ</th><th class="num">ตอบถูก</th><th class="num">จำนวนคน</th></tr></thead><tbody>${ckRows.map((x) => `<tr><td>${x.label}</td><td>${esc(x.q.s)} <span class="muted">(${x.q.a ? 'ถูก' : 'ผิด'})</span></td><td class="num">${x.p}%</td><td class="num">${x.n}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">ยังไม่มีข้อมูล</p>'}
</section>`);
    }

    /* ───── 4. เครื่องมือสอน: นาฬิกาจับเวลา สุ่มชื่อ โหมดโปรเจกเตอร์ ───── */
    const timer = { total: 300, left: 300, running: false, end: 0, id: null, key: '' };
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    function paintTimer() {
      document.querySelectorAll('[data-timer]').forEach((el) => {
        el.textContent = fmt(timer.left);
        el.classList.toggle('done', timer.left === 0);
      });
      document.querySelectorAll('[data-act="t-timer-go"]').forEach((b) => { b.textContent = timer.running ? '⏸ หยุด' : '▶ เริ่ม'; });
    }
    function beep() {
      try {
        const A = window.AudioContext || window.webkitAudioContext;
        const ctx = new A();
        [0, 0.35, 0.7].forEach((t) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 880; g.gain.value = 0.15;
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
        });
      } catch (e) { /* ไม่มีเสียง */ }
    }
    function tick() {
      timer.left = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
      if (timer.left === 0) { stopTimer(); beep(); }
      paintTimer();
    }
    function stopTimer() { timer.running = false; clearInterval(timer.id); timer.id = null; }
    function setTimer(sec, key) { stopTimer(); timer.total = sec; timer.left = sec; timer.key = key || ''; paintTimer(); }
    function timerHTML(big) {
      const stages = api.stagesOf(api.course());
      return `<div class="t-timer${big ? ' big' : ''}">
<div class="t-clock" data-timer aria-live="off">${fmt(timer.left)}</div>
<div class="row"><button type="button" class="btn primary" data-act="t-timer-go">${timer.running ? '⏸ หยุด' : '▶ เริ่ม'}</button><button type="button" class="btn ghost" data-act="t-timer-reset">↺ เริ่มใหม่</button>
<button type="button" class="btn ghost" data-act="t-timer-add" data-sec="-60">−1 นาที</button><button type="button" class="btn ghost" data-act="t-timer-add" data-sec="60">+1 นาที</button></div>
${big ? `<div class="row t-presets">${stages.map((st) => `<button type="button" class="chip" data-act="t-timer-set" data-sec="${st.min * 60}">${esc(st.name)} ${st.min} นาที</button>`).join('')}<button type="button" class="chip" data-act="t-timer-set" data-sec="30">ปรึกษากัน 30 วินาที</button></div>` : ''}
</div>`;
    }
    let pickShow = null;
    function pickerPool() {
      const room = ROSTER.rooms.find((r) => r.id === (view.room === 'all' ? (ROSTER.rooms[0] || {}).id : view.room));
      if (!room) return { room: null, pool: [] };
      const done = T.picked[room.id] || [];
      return { room, pool: room.students.filter((st) => !done.includes(st.no)), done };
    }
    function pickerHTML(compact) {
      const { room, pool, done } = pickerPool();
      if (!room) return '';
      return `<div class="t-picker${compact ? ' compact' : ''}">
<div class="t-pick-name" data-pick aria-live="polite">${pickShow ? `<span>เลขที่ ${pickShow.no}</span><b>${esc(pickShow.n)}</b>` : `<span class="muted">${room.name}</span><b>🎲</b>`}</div>
<div class="row"><button type="button" class="btn primary" data-act="t-pick"${pool.length ? '' : ' disabled'}>🎲 สุ่มชื่อ ${room.name}</button>${compact ? '' : `<button type="button" class="btn ghost" data-act="t-pick-reset"${done.length ? '' : ' disabled'}>เริ่มรอบใหม่</button>`}</div>
${compact ? '' : `<p class="muted">สุ่มไม่ซ้ำคนเดิม เหลืออีก ${pool.length} จาก ${room.students.length} คน</p>`}
</div>`;
    }
    function toolsTab() {
      return shell(`
<div class="t-tools">
  <section class="panel stack"><h2>นาฬิกาจับเวลา</h2><p class="muted">เลือกเวลาตามขั้นของชั่วโมงเรียน หมดเวลาแล้วมีเสียงเตือน</p>${timerHTML(true)}</section>
  <section class="panel stack"><h2>สุ่มชื่อนักเรียน</h2>${roomSelect(false)}${pickerHTML(false)}</section>
</div>
<section class="panel stack">
  <h2>ตั้งค่าการสอนหน้าห้อง</h2>
  <label class="t-switch"><input type="checkbox" data-tset="projector"${T.projector ? ' checked' : ''}> <span><b>โหมดโปรเจกเตอร์</b> ขยายตัวอักษรและปุ่มให้ใหญ่ขึ้น เหมาะกับฉายขึ้นจอหน้าห้อง</span></label>
  <label class="t-switch"><input type="checkbox" data-tset="dock"${T.dock ? ' checked' : ''}> <span><b>แสดงแถบเครื่องมือครูในหน้าบทเรียน</b> มีนาฬิกาจับเวลาตามขั้นของชั่วโมง และปุ่มสุ่มชื่อ ที่มุมขวาล่าง</span></label>
  <p class="muted">การตั้งค่านี้มีผลเฉพาะเครื่องนี้</p>
</section>`);
    }
    // แถบเครื่องมือครูมุมขวาล่างของหน้าบทเรียน
    function dock(u, l, st) {
      if (!T.dock || !unlocked) return '';
      const key = `${u.id}-${l}-${st.id}`;
      if (!timer.running && timer.key !== key) { timer.total = st.min * 60; timer.left = timer.total; timer.key = key; }
      return `<aside class="t-dock" aria-label="เครื่องมือครู"><p class="eyebrow">ครู · ${esc(st.name)} ${st.min} นาที</p>${timerHTML(false)}${pickerHTML(true)}</aside>`;
    }

    /* ───── 5. นำเข้า/ส่งออก ───── */
    function dataTab() {
      const n = Object.keys(T.imports).length;
      const src = T.sources.slice().reverse().slice(0, 30).map((x) => `<tr><td>${api.thaiDate(x.imported)}</td><td>${esc(x.name || 'รหัสที่วาง')}</td><td class="num">${x.n}</td><td>${x.at ? api.thaiDate(x.at) : '–'}</td></tr>`).join('');
      return shell(`
<section class="panel stack">
  <h2>นำเข้าผลการเรียนจากเครื่องนักเรียน</h2>
  <ol class="t-steps"><li>ที่เครื่องนักเรียน เปิดหน้า <b>ผลการเรียน</b> แล้วกด <b>บันทึกไฟล์ผลการเรียน</b> หรือ <b>คัดลอกรหัสผลการเรียน</b></li><li>ส่งไฟล์หรือรหัสมาที่เครื่องครู (แฟลชไดรฟ์ อีเมล หรือแชต)</li><li>เลือกไฟล์ หรือวางรหัสด้านล่าง ผลของนักเรียนคนเดียวกันจากหลายเครื่องจะรวมกันอัตโนมัติ</li></ol>
  <label class="t-field"><span>เลือกไฟล์ผลการเรียน (.json เลือกได้หลายไฟล์)</span><input type="file" id="t-file" accept=".json,application/json" multiple></label>
  <label class="t-field"><span>หรือวางรหัสผลการเรียน (ขึ้นต้นด้วย ${CODE_PREFIX})</span><textarea id="t-paste" class="copybox" rows="4" placeholder="${CODE_PREFIX}..."></textarea></label>
  <div class="row"><button type="button" class="btn primary" data-act="t-import-paste">นำเข้ารหัสที่วาง</button></div>
  <div aria-live="polite">${flash.data || ''}</div>
</section>
<section class="panel stack">
  <h2>ข้อมูลในเครื่องครู</h2>
  <p>นำเข้าแล้ว <b>${n}</b> คน · นักเรียนที่เรียนบนเครื่องนี้ ${Object.keys(api.local()).filter((k) => KEY_RE.test(k)).length} คน</p>
  ${src ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันที่นำเข้า</th><th>ไฟล์</th><th class="num">นักเรียน</th><th>วันที่บันทึกผล</th></tr></thead><tbody>${src}</tbody></table></div>` : ''}
  <div class="row">
    <button type="button" class="btn" data-act="t-backup">⬇ สำรองข้อมูลทั้งหมด (.json)</button>
    <button type="button" class="btn" data-act="t-csv">⬇ CSV ห้องและวิชาที่เลือก</button>
    ${askClear ? `<span class="confirm"><b>ลบผลที่นำเข้าทั้งหมด?</b><span class="row"><button type="button" class="btn danger" data-act="t-clear-yes">ลบ</button><button type="button" class="btn ghost" data-act="t-clear-no">ยกเลิก</button></span></span>` : `<button type="button" class="btn ghost" data-act="t-clear"${n ? '' : ' disabled'}>ลบผลที่นำเข้า</button>`}
  </div>
  <p class="muted">ไฟล์สำรองข้อมูลนำเข้ากลับได้ด้วยช่องเลือกไฟล์ด้านบน</p>
</section>
<section class="panel stack">
  <h2>รหัสผ่านหน้าครู</h2>
  <form class="row" data-tform="change"><label class="t-field"><span>รหัสใหม่ 4–8 หลัก</span><input id="t-newpin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></label><button type="submit" class="btn">เปลี่ยนรหัส</button></form>
  <div aria-live="polite">${flash.pin || ''}</div>
</section>`);
    }

    /* ───── ส่งออกจากเครื่องนักเรียน ───── */
    function payload(learners) {
      const st = api.state();
      if (!st.device) { st.device = Math.random().toString(36).slice(2, 10); api.save(); }
      return { app: 'sanuk-p3', v: 1, at: Date.now(), device: st.device, learners };
    }
    function deviceLearners() {
      const L = api.local();
      const out = {};
      Object.keys(L).forEach((k) => { if (KEY_RE.test(k) && (Object.keys(L[k].units || {}).length || Object.keys(L[k].games || {}).length)) out[k] = L[k]; });
      return out;
    }
    const toCode = (o) => CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
    function fromText(txt) {
      txt = String(txt || '').trim();
      if (txt.startsWith(CODE_PREFIX)) return JSON.parse(decodeURIComponent(escape(atob(txt.slice(CODE_PREFIX.length).replace(/\s+/g, '')))));
      return JSON.parse(txt);
    }
    function download(name, text, type) {
      const blob = new Blob([text], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
    const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
    function studentExportHTML() {
      return `<section class="panel stack">
  <h2>ส่งผลการเรียนให้คุณครู</h2>
  <p class="muted">บันทึกเป็นไฟล์ หรือคัดลอกรหัสส่งให้ครูทางแชต ไฟล์และรหัสรวมผลของทุกคนที่เรียนบนเครื่องนี้ ครูนำเข้าที่หน้าครูได้ทันที</p>
  <div class="row"><button type="button" class="btn primary" data-act="t-export-file">💾 บันทึกไฟล์ผลการเรียน</button><button type="button" class="btn" data-act="t-export-code">📋 คัดลอกรหัสผลการเรียน</button></div>
  <textarea class="copybox" id="t-export-box" readonly hidden></textarea>
  <p class="muted" id="t-export-msg" aria-live="polite"></p>
</section>`;
    }

    /* ───── นำเข้า ───── */
    function importPayload(obj, name) {
      if (!obj || obj.app !== 'sanuk-p3' || !obj.learners || typeof obj.learners !== 'object') throw new Error('bad');
      let n = 0;
      Object.keys(obj.learners).forEach((k) => {
        if (!KEY_RE.test(k)) return;
        const L = cleanLearner(obj.learners[k]);
        T.imports[k] = T.imports[k] ? mergeLearner(T.imports[k], L) : L;
        n += 1;
      });
      T.sources.push({ imported: Date.now(), at: num(obj.at), n, name: String(name || '').slice(0, 80) });
      if (T.sources.length > 200) T.sources = T.sources.slice(-200);
      saveT();
      return n;
    }
    function csv() {
      const C = api.course();
      const D = allData();
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const head = ['ห้อง', 'เลขที่', 'ชื่อ'].concat(C.units.flatMap((u, i) => [`หน่วย${i + 1} ก่อน`, `หน่วย${i + 1} หลัง`]), ['รวมก่อน', 'รวมหลัง', 'คะแนนเต็ม', 'บทที่เรียนจบ', 'จำนวนบท', 'เหรียญตรา', 'ดาว']);
      const lines = [head.map(q).join(',')];
      roster(view.room).forEach((p) => {
        const s = studentSum(C, D[p.key]);
        lines.push([p.room.name, p.st.no, p.st.t + p.st.n].concat(s.units.flatMap((x) => [x.pre == null ? '' : x.pre, x.post == null ? '' : x.post]), [s.started ? s.pre : '', s.started ? s.post : '', s.max, s.lessons, s.lessonMax, s.badges, s.stars.stars]).map(q).join(','));
      });
      download(`sanuk-${C.key}-${view.room}-${stamp()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
    }

    /* ───── หน้าหลักและการกระทำ ───── */
    function page() {
      if (!unlocked) return gate();
      if (view.tab === 'student') return studentTab();
      if (view.tab === 'items') return itemsTab();
      if (view.tab === 'tools') return toolsTab();
      if (view.tab === 'data') return dataTab();
      return classTab();
    }
    const rerender = () => api.render(false);
    const actions = {
      't-tab'(el) { view.tab = el.dataset.tab; askClear = false; Object.keys(flash).forEach((k) => delete flash[k]); rerender(); },
      't-lock'() { setOpen(false); stopTimer(); location.hash = '#home'; },
      't-pin-reset'() { T.pin = null; saveT(); pinErr = ''; rerender(); },
      't-open'(el) { view.student = el.dataset.key; view.room = el.dataset.key.split('#')[0]; view.tab = 'student'; api.render(true); },
      't-print'() { window.print(); },
      't-csv'() { csv(); },
      't-backup'() { download(`sanuk-backup-${stamp()}.json`, JSON.stringify(payload(allData())), 'application/json'); },
      't-clear'() { askClear = true; rerender(); },
      't-clear-no'() { askClear = false; rerender(); },
      't-clear-yes'() { T.imports = {}; T.sources = []; askClear = false; saveT(); flash.data = '<p class="feedback ok">ลบผลที่นำเข้าแล้ว</p>'; rerender(); },
      't-import-paste'() {
        const box = document.getElementById('t-paste');
        try { const n = importPayload(fromText(box.value), 'รหัสที่วาง'); flash.data = `<p class="feedback ok">นำเข้าผลการเรียน ${n} คนแล้ว</p>`; } catch (e) { flash.data = '<p class="feedback bad">รหัสไม่ถูกต้อง ตรวจว่าคัดลอกมาครบทั้งหมด</p>'; }
        rerender();
      },
      't-timer-go'() {
        if (timer.running) { timer.left = Math.max(0, Math.round((timer.end - Date.now()) / 1000)); stopTimer(); paintTimer(); return; }
        if (timer.left === 0) timer.left = timer.total;
        timer.running = true;
        timer.end = Date.now() + timer.left * 1000;
        timer.id = setInterval(tick, 250);
        paintTimer();
      },
      't-timer-reset'() { setTimer(timer.total, timer.key); },
      't-timer-set'(el) { setTimer(Number(el.dataset.sec)); },
      't-timer-add'(el) {
        const d = Number(el.dataset.sec);
        if (timer.running) { timer.end = Math.max(Date.now(), timer.end + d * 1000); tick(); }
        else { timer.left = Math.max(0, timer.left + d); timer.total = Math.max(timer.total, timer.left); paintTimer(); }
      },
      't-pick'() {
        const { room, pool } = pickerPool();
        if (!room || !pool.length) return;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        T.picked[room.id] = (T.picked[room.id] || []).concat(chosen.no);
        saveT();
        const show = (st) => document.querySelectorAll('[data-pick]').forEach((el) => { el.innerHTML = `<span>เลขที่ ${st.no}</span><b>${esc(st.n)}</b>`; });
        let k = 0;
        const roll = setInterval(() => {
          show(pool[Math.floor(Math.random() * pool.length)]);
          if (++k >= 12) { clearInterval(roll); pickShow = chosen; show(chosen); if (view.tab === 'tools' && location.hash === '#teacher') rerender(); }
        }, api.reduceMotion ? 0 : 70);
      },
      't-pick-reset'() { const { room } = pickerPool(); if (room) { T.picked[room.id] = []; saveT(); } pickShow = null; rerender(); },
      't-export-file'() {
        const msg = document.getElementById('t-export-msg');
        const L = deviceLearners();
        if (!Object.keys(L).length) { msg.textContent = 'ยังไม่มีผลการเรียนของนักเรียนที่เลือกชื่อบนเครื่องนี้'; return; }
        const keys = Object.keys(L);
        download(`sanuk-ผลการเรียน-${keys[0].split('#')[0]}-${stamp()}.json`, JSON.stringify(payload(L)), 'application/json');
        msg.textContent = `บันทึกไฟล์ผลการเรียน ${keys.length} คนแล้ว ดูไฟล์ในโฟลเดอร์ดาวน์โหลด แล้วส่งให้คุณครู`;
      },
      't-export-code'() {
        const msg = document.getElementById('t-export-msg');
        const box = document.getElementById('t-export-box');
        const L = deviceLearners();
        if (!Object.keys(L).length) { msg.textContent = 'ยังไม่มีผลการเรียนของนักเรียนที่เลือกชื่อบนเครื่องนี้'; return; }
        box.value = toCode(payload(L));
        box.hidden = false;
        const fallback = () => { box.focus(); box.select(); msg.textContent = 'เลือกรหัสไว้แล้ว กด Ctrl+C แล้วนำไปวางส่งครู'; };
        try { navigator.clipboard.writeText(box.value).then(() => { msg.textContent = `คัดลอกรหัสผลการเรียน ${Object.keys(L).length} คนแล้ว นำไปวางในแชตส่งคุณครู`; }, fallback); } catch (e) { fallback(); }
      }
    };
    function change(e) {
      const el = e.target;
      if (el.dataset.tsel) {
        view[el.dataset.tsel] = el.value;
        if (el.dataset.tsel === 'room') { view.student = null; pickShow = null; }
        rerender();
        const back = document.querySelector(`[data-tsel="${el.dataset.tsel}"]`);
        if (back) back.focus();
        return true;
      }
      if (el.dataset.tset) {
        T[el.dataset.tset] = el.checked;
        saveT();
        document.documentElement.classList.toggle('projector', !!T.projector);
        return true;
      }
      if (el.id === 't-file' && el.files && el.files.length) {
        const files = [...el.files];
        let total = 0; let bad = 0;
        Promise.all(files.map((f) => f.text().then((txt) => { total += importPayload(fromText(txt), f.name); }).catch(() => { bad += 1; }))).then(() => {
          flash.data = `<p class="feedback ${bad ? 'bad' : 'ok'}">นำเข้าผลการเรียน ${total} คน จาก ${files.length - bad} ไฟล์${bad ? ` · อ่านไม่ได้ ${bad} ไฟล์ (ต้องเป็นไฟล์ผลการเรียนจากเว็บนี้)` : ''}</p>`;
          rerender();
        });
        return true;
      }
      return false;
    }
    function submit(e) {
      const form = e.target.closest('[data-tform]');
      if (!form) return false;
      e.preventDefault();
      const kind = form.dataset.tform;
      const val = (id) => (document.getElementById(id) || {}).value || '';
      if (kind === 'set') {
        const a = val('t-pin'); const b = val('t-pin2');
        if (!/^\d{4,8}$/.test(a)) pinErr = 'รหัสต้องเป็นตัวเลข 4–8 หลัก';
        else if (a !== b) pinErr = 'รหัสทั้งสองช่องไม่ตรงกัน';
        else { T.pin = hashPin(a); saveT(); pinErr = ''; setOpen(true); }
      } else if (kind === 'enter') {
        if (hashPin(val('t-pin')) === T.pin) { pinErr = ''; setOpen(true); } else pinErr = 'รหัสไม่ถูกต้อง';
      } else if (kind === 'change') {
        const a = val('t-newpin');
        if (/^\d{4,8}$/.test(a)) { T.pin = hashPin(a); saveT(); flash.pin = '<p class="feedback ok">เปลี่ยนรหัสแล้ว</p>'; } else flash.pin = '<p class="feedback bad">รหัสต้องเป็นตัวเลข 4–8 หลัก</p>';
      }
      rerender();
      const f = document.getElementById('t-pin');
      if (f) f.focus();
      return true;
    }

    return { page, actions, change, submit, dock, studentExportHTML, mergeLearner, cleanLearner, isOpen: () => unlocked };
  };
})();
