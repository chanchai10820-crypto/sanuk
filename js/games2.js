/*
 * กิจกรรมเชิงโต้ตอบ 5 เกม (ต่อจาก games.js)
 *   morning  เรียงกิจวัตรแล้วกดเล่นดูผล        หน่วย u1 บท 1
 *   hazard   หาจุดอันตรายในบ้าน               หน่วย c1 บท 3
 *   dressup  แต่งตัวให้น้องสนุก                หน่วย c2 บท 1
 *   garden   ปลูกผักบุ้ง 12 วัน (จำลองการดูแล)   หน่วย c3 บท 4
 *   repair   กล่องเครื่องมือช่างซ่อม            หน่วย c4 บท 2
 * lesson = บทเรียนที่เกมนี้แสดงในขั้นลงมือปฏิบัติ
 */
(function () {
  'use strict';

  const { esc, shuffle } = window.Kit;
  const { starRow, bind, keepBest, endScreen, bestOf, sumLevels } = window.GameKit;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ════════ เรียงกิจวัตรแล้วกดเล่นดูผล ════════ */
  // need = ขั้นที่ต้องทำมาก่อน, oops = สิ่งที่เกิดขึ้นถ้าทำก่อนเวลา
  const ROUTINES = [
    {
      title: 'เตรียมตัวไปโรงเรียน',
      steps: [
        { id: 'wake', e: '⏰', t: 'ตื่นนอน', need: [] },
        { id: 'bath', e: '🚿', t: 'อาบน้ำ แปรงฟัน', need: ['wake'], oops: 'ยังไม่ตื่นนอนเลย จะอาบน้ำได้อย่างไร!' },
        { id: 'dress', e: '👕', t: 'แต่งชุดนักเรียน', need: ['bath'], oops: 'ใส่ชุดก่อนอาบน้ำ ชุดเปียกหมดเลย!' },
        { id: 'socks', e: '🧦', t: 'ใส่ถุงเท้า', need: ['bath'], oops: 'ใส่ถุงเท้าก่อนอาบน้ำ ถุงเท้าเปียกหมด!' },
        { id: 'shoes', e: '👟', t: 'ใส่รองเท้า', need: ['socks', 'dress'], oops: 'ใส่รองเท้าก่อน แล้วจะใส่ถุงเท้าหรือกางเกงอย่างไร!' },
        { id: 'go', e: '🏫', t: 'ออกจากบ้านไปโรงเรียน', need: ['shoes'], oops: 'ออกจากบ้านทั้งที่ยังแต่งตัวไม่เสร็จ!' }
      ]
    },
    {
      title: 'แปรงฟันก่อนนอน',
      steps: [
        { id: 'pick', e: '🪥', t: 'หยิบแปรงสีฟัน', need: [] },
        { id: 'paste', e: '🧴', t: 'บีบยาสีฟันลงบนแปรง', need: ['pick'], oops: 'ยังไม่มีแปรง บีบยาสีฟันใส่มือแทน!' },
        { id: 'brush', e: '😁', t: 'แปรงฟันให้ทั่วทุกซี่', need: ['paste'], oops: 'แปรงฟันโดยไม่มียาสีฟัน ฟันไม่สะอาด!' },
        { id: 'rinse', e: '💧', t: 'บ้วนปากด้วยน้ำสะอาด', need: ['brush'], oops: 'บ้วนปากก่อนแปรงฟัน ต้องบ้วนใหม่อีกรอบ!' },
        { id: 'wash', e: '🚰', t: 'ล้างแปรงสีฟัน', need: ['brush'], oops: 'ล้างแปรงก่อนใช้ แปรงยังไม่ได้แปรงฟันเลย!' },
        { id: 'keep', e: '🥛', t: 'เก็บแปรงเข้าที่', need: ['wash', 'rinse'], oops: 'เก็บแปรงก่อนแปรงฟันเสร็จ!' }
      ]
    },
    {
      title: 'ปลูกต้นถั่ว',
      steps: [
        { id: 'pot', e: '🪴', t: 'ใส่ดินลงกระถาง', need: [] },
        { id: 'hole', e: '🥄', t: 'ขุดหลุมเล็ก ๆ', need: ['pot'], oops: 'ยังไม่มีดินในกระถาง ขุดหลุมไม่ได้!' },
        { id: 'seed', e: '🫘', t: 'ใส่เมล็ดถั่ว', need: ['hole'], oops: 'ยังไม่ได้ขุดหลุม เมล็ดกลิ้งตกพื้น!' },
        { id: 'cover', e: '🤲', t: 'กลบดินบาง ๆ', need: ['seed'], oops: 'กลบดินก่อนใส่เมล็ด หลุมหายไปแล้ว!' },
        { id: 'water', e: '🚿', t: 'รดน้ำให้ชุ่ม', need: ['cover'], oops: 'รดน้ำก่อนกลบดิน เมล็ดลอยไปกับน้ำ!' },
        { id: 'sun', e: '☀️', t: 'วางไว้ที่มีแดด', need: ['water'], oops: 'วางรับแดดก่อนปลูกเสร็จ ยังไม่มีอะไรให้โตเลย!' }
      ]
    }
  ];
  function mountMorning(root, ctx) {
    const d = ctx.data;
    d.lv = d.lv || {};
    let cur = 0;
    let st;
    let playing = false;
    let alive = true;
    ctx.leave(() => { alive = false; });
    const start = (i) => { cur = i; st = { pool: shuffle(ROUTINES[i].steps.map((_, k) => k)), seq: [], plays: 0, play: -1, bad: -1, msg: null, won: 0 }; };
    function check(seq) {
      const R = ROUTINES[cur].steps;
      const done = new Set();
      for (let p = 0; p < seq.length; p++) {
        const s = R[seq[p]];
        if (!s.need.every((n) => done.has(n))) return p;
        done.add(s.id);
      }
      return -1;
    }
    function render() {
      const R = ROUTINES[cur];
      const lv = ROUTINES.map((x, i) => `<button type="button" class="g-lv${i === cur ? ' cur' : ''}" data-g="lvl" data-i="${i}"${playing ? ' disabled' : ''}><b>${i + 1}. ${x.title}</b>${starRow(d.lv[i] || 0)}</button>`).join('');
      const pool = st.pool.filter((k) => !st.seq.includes(k)).map((k) => `<button type="button" class="tile seq-card" data-g="add" data-k="${k}"${playing || st.won ? ' disabled' : ''}><span class="seq-e" aria-hidden="true">${R.steps[k].e}</span><span>${R.steps[k].t}</span></button>`).join('');
      const seq = R.steps.map((_, p) => {
        const k = st.seq[p];
        if (k === undefined) return `<li class="seq-slot empty"><span class="k">${p + 1}</span><span class="muted">ว่าง</span></li>`;
        const cls = p === st.bad ? ' bad' : p < st.play || (st.won && p <= st.play) ? ' ok' : p === st.play ? ' run' : '';
        return `<li class="seq-slot${cls}"><button type="button" class="tile seq-card" data-g="del" data-p="${p}"${playing || st.won ? ' disabled' : ''} aria-label="เอาออก: ${R.steps[k].t}"><span class="k">${p + 1}</span><span class="seq-e" aria-hidden="true">${R.steps[k].e}</span><span>${R.steps[k].t}</span></button></li>`;
      }).join('');
      root.innerHTML = `
<div class="g-levels">${lv}</div>
<section class="panel g-stage">
  <div class="g-head"><h2>${R.title}</h2><span class="chip">เล่นแล้ว ${st.plays} ครั้ง</span></div>
  <p class="g-hint">แตะการ์ดเรียงขั้นตอนให้ถูก แล้วกด <b>▶ เล่น</b> ดูว่าน้องสนุกทำตามได้หรือไม่ (แตะการ์ดในแถวลำดับเพื่อเอาออก)</p>
  <div class="seq-wrap">
    <div><h3 class="seq-h">การ์ดขั้นตอน</h3><div class="seq-pool">${pool || '<p class="muted">ใช้การ์ดครบแล้ว</p>'}</div></div>
    <div><h3 class="seq-h">ลำดับของฉัน</h3><ol class="seq-list">${seq}</ol></div>
  </div>
  <div class="row"><button type="button" class="btn primary" data-g="play"${st.seq.length === R.steps.length && !playing && !st.won ? '' : ' disabled'}>▶ เล่น</button>
  <button type="button" class="btn ghost" data-g="clear"${st.seq.length && !playing && !st.won ? '' : ' disabled'}>เริ่มใหม่</button></div>
  <div aria-live="polite">${st.msg || ''}</div>
</section>`;
    }
    bind(root, {
      lvl(el) { start(Number(el.dataset.i)); render(); },
      add(el) { st.seq.push(Number(el.dataset.k)); st.bad = -1; st.play = -1; st.msg = null; render(); },
      del(el) { st.seq.splice(Number(el.dataset.p), 1); st.bad = -1; st.play = -1; st.msg = null; render(); },
      clear() { st.seq = []; st.bad = -1; st.play = -1; st.msg = null; render(); },
      async play() {
        const R = ROUTINES[cur];
        const bad = check(st.seq);
        playing = true;
        st.plays += 1;
        st.msg = null;
        st.bad = -1;
        const end = bad === -1 ? st.seq.length : bad;
        for (let p = 0; p <= end && p < st.seq.length; p++) {
          if (!alive) return;
          st.play = p;
          if (p === bad) st.bad = p;
          render();
          await wait(p === bad ? 200 : 550);
        }
        if (!alive) return;
        playing = false;
        if (bad === -1) {
          st.won = st.plays === 1 ? 3 : st.plays === 2 ? 2 : 1;
          if (st.won > (d.lv[cur] || 0)) d.lv[cur] = st.won;
          ctx.save();
          st.msg = `<div class="feedback ok g-win">${starRow(st.won)} <span>น้องสนุกทำได้ครบทุกขั้น! ${st.won === 3 ? 'เรียงถูกตั้งแต่ครั้งแรก เก่งมาก' : 'ลองเรียงให้ถูกตั้งแต่ครั้งแรก จะได้ 3 ดาว'}</span></div>
<div class="row">${cur < ROUTINES.length - 1 ? `<button type="button" class="btn primary" data-g="lvl" data-i="${cur + 1}">ด่านต่อไป →</button>` : ''}<button type="button" class="btn ghost" data-g="lvl" data-i="${cur}">เล่นด่านนี้อีกครั้ง</button></div>`;
        } else {
          const s = R.steps[st.seq[bad]];
          st.msg = `<p class="feedback bad">😵 ขั้นที่ ${bad + 1} "${s.t}" — ${s.oops} ลองย้ายการ์ดแล้วกดเล่นใหม่</p>`;
          st.seq = st.seq.slice(0, bad);
          st.play = -1;
          st.bad = -1;
        }
        render();
      }
    });
    start(Math.min(Object.keys(d.lv).length, ROUTINES.length - 1));
    render();
  }

  /* ════════ หาจุดอันตรายในบ้าน ════════ */
  // x, y = ตำแหน่งจุด (ร้อยละของภาพ)  r = ขนาดวง (ร้อยละของความกว้าง)
  const SPOTS = [
    { id: 'water', x: 26, y: 88, r: 7, risk: true, t: 'น้ำหกบนพื้น', why: 'พื้นเปียกทำให้ลื่นล้ม ต้องเช็ดให้แห้งทันที' },
    { id: 'pan', x: 29, y: 36, r: 6, risk: true, t: 'ด้ามหม้อยื่นออกนอกเตา', why: 'อาจเดินชนแล้วหม้อร้อนหกใส่ ควรหันด้ามเข้าด้านใน' },
    { id: 'knife', x: 56, y: 52, r: 6, risk: true, t: 'มีดวางยื่นออกนอกขอบโต๊ะ', why: 'มีดอาจตกใส่เท้า ควรเก็บเข้าที่ให้ห่างขอบโต๊ะ' },
    { id: 'plug', x: 62, y: 28, r: 6, risk: true, t: 'เสียบปลั๊กหลายตัวในเต้าเดียว', why: 'ไฟฟ้าเกินกำลัง อาจร้อนจนไฟไหม้' },
    { id: 'toy', x: 90, y: 51, r: 6, risk: true, t: 'ของเล่นวางบนบันได', why: 'อาจเหยียบแล้วตกบันได ควรเก็บของเล่นเข้ากล่อง' },
    { id: 'bottle', x: 51, y: 86, r: 6, risk: true, t: 'น้ำยาทำความสะอาดเปิดฝาวางพื้น', why: 'น้องเล็กอาจหยิบกิน ต้องปิดฝาและเก็บให้พ้นมือเด็ก' },
    { id: 'bin', x: 72, y: 83, r: 6, risk: false, t: 'ถังขยะปิดฝา', why: 'ถังขยะปิดฝาเรียบร้อย ไม่มีกลิ่นและแมลง' },
    { id: 'broom', x: 76.5, y: 25, r: 6, risk: false, t: 'ไม้กวาดแขวนผนัง', why: 'เก็บอุปกรณ์เข้าที่ ไม่เกะกะทางเดิน' },
    { id: 'plant', x: 5, y: 80, r: 6, risk: false, t: 'กระถางต้นไม้', why: 'วางเรียบร้อยชิดมุมห้อง ไม่เป็นอันตราย' }
  ];
  const HAZARD_ART = `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<rect class="hz-wall" x="0" y="0" width="400" height="200"/><rect class="hz-floor" x="0" y="200" width="400" height="60"/>
<rect class="a-sky a-o" x="20" y="24" width="60" height="44" rx="4"/><path class="a-line a-thin" d="M50 24 v44 M20 46 h60"/>
<rect class="a-paper a-o" x="10" y="110" width="100" height="90"/><rect class="a-ink" x="16" y="100" width="88" height="10"/>
<rect class="a-pan a-o" x="62" y="86" width="40" height="14" rx="3"/><path class="a-pan a-o" d="M102 90 h30 v6 h-30 z"/>
<path class="a-line a-thin" d="M72 80 q4 -8 0 -14 M88 80 q4 -8 0 -14"/>
<rect class="a-board a-o" x="140" y="140" width="100" height="10" rx="2"/><rect class="a-board a-o" x="150" y="150" width="8" height="50"/><rect class="a-board a-o" x="222" y="150" width="8" height="50"/>
<circle class="a-paper a-o" cx="170" cy="132" r="9"/>
<g transform="translate(206 132)"><rect class="a-board a-o" x="0" y="0" width="14" height="6" rx="2"/><path class="a-metal a-o" d="M14 1 h22 l-4 5 h-18 z"/></g>
<path class="a-line" d="M244 80 q-14 50 -30 98 M248 82 q-6 50 0 96 M252 82 q8 50 26 96 M256 80 q30 40 44 98"/>
<rect class="a-paper a-o" x="236" y="64" width="24" height="18" rx="3"/><circle class="a-ink" cx="243" cy="73" r="2"/><circle class="a-ink" cx="253" cy="73" r="2"/>
<rect class="a-hat a-o" x="208" y="176" width="12" height="8" rx="2"/><rect class="a-u1 a-o" x="242" y="176" width="12" height="8" rx="2"/><rect class="a-u5 a-o" x="272" y="176" width="12" height="8" rx="2"/><rect class="a-u4 a-o" x="294" y="176" width="12" height="8" rx="2"/>
<path class="a-trunk" d="M306 18 L306 88"/><path class="a-hat a-o" d="M296 86 l20 0 l-2 26 l-16 0 z"/><circle class="a-ink" cx="306" cy="18" r="3"/>
<path class="a-board a-o" d="M310 200 v-20 h20 v-20 h20 v-20 h20 v-20 h20 v-20 h10 v100 z"/>
<g transform="translate(352 128)"><rect class="a-bad a-o" x="0" y="0" width="22" height="10" rx="3"/><circle class="a-ink" cx="5" cy="11" r="3"/><circle class="a-ink" cx="17" cy="11" r="3"/></g>
<ellipse class="a-sky" cx="104" cy="230" rx="44" ry="8" opacity=".9"/>
<g transform="translate(196 210)"><rect class="a-u5 a-o" x="0" y="0" width="16" height="26" rx="3"/><rect class="a-u5 a-o" x="4" y="-8" width="8" height="8"/><path class="a-u5" d="M8 26 q16 4 24 0 q-6 -4 -16 -2 z" opacity=".6"/></g>
<g transform="translate(276 196)"><rect class="a-u4 a-o" x="0" y="8" width="24" height="30" rx="3"/><rect class="a-u4 a-o" x="-2" y="2" width="28" height="8" rx="3"/></g>
<g transform="translate(6 210)"><path class="a-u2 a-o" d="M0 0 h24 l-3 20 h-18 z"/><path class="a-stem" d="M12 0 v-16"/><ellipse class="a-leaf a-o" cx="6" cy="-12" rx="7" ry="4"/><ellipse class="a-leaf a-o" cx="18" cy="-16" rx="7" ry="4"/></g>
</svg>`;
  function mountHazard(root, ctx) {
    let st;
    const start = () => { st = { found: {}, wrong: 0, last: null }; };
    const risks = SPOTS.filter((s) => s.risk);
    function render() {
      const n = risks.filter((s) => st.found[s.id]).length;
      if (n === risks.length) {
        const stars = st.wrong <= 1 ? 3 : st.wrong <= 3 ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars, { wrong: st.wrong }); st.saved = true; }
        root.innerHTML = endScreen('หาจุดอันตรายครบแล้ว!', `พบครบ ${risks.length} จุด แตะผิด ${st.wrong} ครั้ง ${stars === 3 ? 'ตาไวมาก!' : 'ลองใหม่ให้แตะผิดน้อยลง'}`, stars, 'again') +
          `<section class="panel stack"><h3>สรุปจุดอันตรายและวิธีแก้</h3><ul>${risks.map((s) => `<li><b>${s.t}</b> — ${s.why}</li>`).join('')}</ul></section>`;
        return;
      }
      const spots = SPOTS.map((s) => {
        const f = st.found[s.id];
        return `<button type="button" class="hz-spot${f ? (s.risk ? ' found' : ' safe') : ''}" data-g="spot" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%;width:${s.r * 2}%;" aria-label="${s.t}${f ? (s.risk ? ' (พบแล้ว)' : ' (ปลอดภัย)') : ''}"${f ? ' disabled' : ''}>${f ? (s.risk ? '⚠️' : '✓') : ''}</button>`;
      }).join('');
      const L = st.last;
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>บ้านนี้มีจุดอันตรายซ่อนอยู่ ${risks.length} จุด</h2><span class="chip">พบแล้ว ${n}/${risks.length} · แตะผิด ${st.wrong}</span></div>
  <p class="g-hint">แตะสิ่งที่อาจทำให้คนในบ้านได้รับอันตราย ระวัง! บางอย่างเรียบร้อยดีอยู่แล้ว</p>
  <div class="hz-scene">${HAZARD_ART}${spots}</div>
  <div aria-live="polite">${L ? `<p class="feedback ${L.risk ? 'ok' : 'bad'}">${L.risk ? `⚠️ เจอแล้ว: <b>${L.t}</b> — ${L.why}` : `✓ <b>${L.t}</b> ไม่ใช่จุดอันตราย ${L.why}`}</p>` : ''}</div>
</section>`;
    }
    bind(root, {
      spot(el) {
        const s = SPOTS.find((x) => x.id === el.dataset.id);
        st.found[s.id] = true;
        if (!s.risk) st.wrong += 1;
        st.last = s;
        render();
        const next = root.querySelector('.hz-spot:not([disabled])');
        if (next && !root.querySelector('.g-end')) next.focus({ preventScroll: true });
      },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ แต่งตัวให้น้องสนุก ════════ */
  const WEAR = {
    top: [
      { id: 'school', t: 'เสื้อนักเรียน', c: '#FFFFFF', sleeve: 'short', collar: true },
      { id: 'white', t: 'เสื้อสุภาพสีขาว แขนยาว', c: '#F4F4F4', sleeve: 'long', collar: true },
      { id: 'black', t: 'เสื้อสุภาพสีดำ', c: '#2A2E37', sleeve: 'short', collar: true },
      { id: 'tee', t: 'เสื้อยืดเนื้อบาง สีอ่อน', c: '#BFE3FF', sleeve: 'short' },
      { id: 'tank', t: 'เสื้อกล้าม', c: '#FFD166', sleeve: 'none' },
      { id: 'sport', t: 'เสื้อกีฬา', c: '#2E9E5B', sleeve: 'short' },
      { id: 'sweater', t: 'เสื้อกันหนาว', c: '#8E5BD8', sleeve: 'long' },
      { id: 'raincoat', t: 'เสื้อกันฝน', c: '#F2B705', sleeve: 'long', hood: true }
    ],
    bottom: [
      { id: 'navy', t: 'กางเกงนักเรียนสีกรมท่า', c: '#24346B', len: 'knee' },
      { id: 'shorts', t: 'กางเกงขาสั้นกีฬา', c: '#2F6BD6', len: 'short' },
      { id: 'long', t: 'กางเกงขายาว', c: '#5A6B86', len: 'long' },
      { id: 'black', t: 'กางเกงสีดำขายาว', c: '#23262E', len: 'long' },
      { id: 'skirt', t: 'กระโปรงยาวคลุมเข่า', c: '#C23A63', len: 'skirt' }
    ],
    feet: [
      { id: 'school', t: 'รองเท้านักเรียน', c: '#1B2333' },
      { id: 'sneaker', t: 'รองเท้าผ้าใบ', c: '#FFFFFF' },
      { id: 'sandal', t: 'รองเท้าแตะ', c: '#E07A2E' },
      { id: 'boots', t: 'รองเท้าบูทยาง', c: '#277A33' },
      { id: 'heels', t: 'รองเท้าส้นสูง', c: '#C23A63' }
    ],
    extra: [
      { id: 'none', t: 'ไม่ใช้' },
      { id: 'hat', t: 'หมวกกันแดด' },
      { id: 'umbrella', t: 'ร่ม' },
      { id: 'scarf', t: 'ผ้าพันคอ' }
    ]
  };
  const SLOT_TH = { top: 'เสื้อ', bottom: 'ท่อนล่าง', feet: 'รองเท้า', extra: 'อุปกรณ์เสริม' };
  const LOOKS = [
    { e: '🏫', t: 'วันจันทร์ อากาศดี ไปโรงเรียน', ok: { top: ['school'], bottom: ['navy'], feet: ['school'], extra: ['none'] }, tip: 'ไปโรงเรียนแต่งชุดนักเรียนให้ถูกระเบียบ' },
    { e: '🌧️', t: 'ฝนตกหนัก ต้องเดินไปโรงเรียน', ok: { top: ['school', 'raincoat'], bottom: ['navy'], feet: ['boots', 'school'], extra: ['umbrella'] }, tip: 'วันฝนตกต้องมีร่ม และใส่รองเท้าที่ไม่ลื่น' },
    { e: '🥶', t: 'เช้าวันหนาว ไปตลาดกับแม่', ok: { top: ['sweater'], bottom: ['long', 'black', 'skirt'], feet: ['sneaker', 'school', 'sandal'], extra: ['scarf', 'none'] }, tip: 'อากาศหนาวใส่เสื้อกันหนาวและกางเกงขายาว' },
    { e: '⚽', t: 'เล่นฟุตบอลตอนเย็น', ok: { top: ['sport', 'tee'], bottom: ['shorts'], feet: ['sneaker'], extra: ['none'] }, tip: 'เล่นกีฬาใส่ชุดกีฬาและรองเท้าผ้าใบ' },
    { e: '🛕', t: 'ไปทำบุญที่วัดกับคุณยาย', ok: { top: ['white', 'black', 'school'], bottom: ['long', 'black', 'skirt'], feet: ['sandal', 'school', 'sneaker'], extra: ['none'] }, tip: 'ไปวัดแต่งกายสุภาพ เสื้อมีแขน กางเกงหรือกระโปรงยาว' },
    { e: '🖤', t: 'ไปงานศพกับครอบครัว', ok: { top: ['black', 'white'], bottom: ['black'], feet: ['school'], extra: ['none'] }, tip: 'งานศพแต่งกายสุภาพสีดำหรือสีขาว' },
    { e: '🏖️', t: 'เที่ยวทะเลตอนเที่ยง แดดจัด', ok: { top: ['tee', 'tank'], bottom: ['shorts'], feet: ['sandal'], extra: ['hat'] }, tip: 'แดดจัดใส่เสื้อบางสีอ่อน และสวมหมวกกันแดด' }
  ];
  function dollSVG(o) {
    const T = WEAR.top.find((x) => x.id === o.top);
    const B = WEAR.bottom.find((x) => x.id === o.bottom);
    const F = WEAR.feet.find((x) => x.id === o.feet);
    const skin = '<g class="a-skin">';
    let s = '';
    // ขาและแขน
    s += `${skin}<rect class="a-o" x="80" y="176" width="16" height="96" rx="7"/><rect class="a-o" x="104" y="176" width="16" height="96" rx="7"/>
<path class="a-o" d="M70 102 l-18 70 l12 3 l18 -64 z"/><path class="a-o" d="M130 102 l18 70 l-12 3 l-18 -64 z"/></g>`;
    // ท่อนล่าง
    if (B) {
      if (B.len === 'skirt') s += `<path class="a-o" style="fill:${B.c}" d="M72 172 h56 l14 70 h-84 z"/>`;
      else {
        const h = { short: 30, knee: 46, long: 92 }[B.len];
        s += `<path class="a-o" style="fill:${B.c}" d="M74 172 h52 l0 ${h} h-22 l-4 -${h - 14} l-4 ${h - 14} h-22 z"/>`;
      }
    }
    // รองเท้า
    if (F) {
      if (F.id === 'boots') s += [76, 102].map((x) => `<path class="a-o" style="fill:${F.c}" d="M${x} 236 h22 v40 h6 v8 h-28 z"/>`).join('');
      else if (F.id === 'sandal') s += [74, 102].map((x) => `<rect class="a-o" style="fill:${F.c}" x="${x}" y="278" width="26" height="6" rx="3"/><path class="a-line" style="stroke:${F.c};stroke-width:4" d="M${x + 6} 278 l7 -8 l7 8"/>`).join('');
      else if (F.id === 'heels') s += [74, 102].map((x) => `<path class="a-o" style="fill:${F.c}" d="M${x} 270 h22 l6 10 h-8 v6 h-4 v-6 h-16 z"/>`).join('');
      else s += [74, 102].map((x) => `<path class="a-o" style="fill:${F.c}" d="M${x} 268 h22 q8 2 8 12 v4 h-30 z"/>${F.id === 'sneaker' ? `<path class="a-line a-thin" d="M${x + 6} 274 h12"/>` : ''}`).join('');
    }
    // เสื้อ
    if (T) {
      const sl = T.sleeve === 'long' ? 'M70 102 l-18 70 l12 3 l18 -64 z M130 102 l18 70 l-12 3 l-18 -64 z'
        : T.sleeve === 'short' ? 'M70 100 l-12 34 l14 4 l10 -28 z M130 100 l12 34 l-14 4 l-10 -28 z' : '';
      if (sl) s += `<path class="a-o" style="fill:${T.c}" d="${sl}"/>`;
      s += `<path class="a-o" style="fill:${T.c}" d="M${T.sleeve === 'none' ? '78 98' : '70 100'} q30 -10 ${T.sleeve === 'none' ? '44' : '60'} 0 l-2 76 h-${T.sleeve === 'none' ? '40' : '56'} z"/>`;
      if (T.collar) s += '<path class="a-o" style="fill:#FFFFFF" d="M88 96 l12 12 l12 -12 l-4 -4 l-8 8 l-8 -8 z"/>';
      if (T.id === 'sport') s += '<text x="100" y="146" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">7</text>';
    }
    // หัว
    s += '<circle class="a-skin a-o" cx="100" cy="62" r="30"/><path class="a-ink" d="M70 58 q2 -34 30 -32 q28 -2 30 32 q-10 -16 -30 -16 q-18 0 -30 16 z"/>';
    s += '<circle class="a-ink" cx="90" cy="64" r="3"/><circle class="a-ink" cx="110" cy="64" r="3"/><path class="a-line" d="M92 76 q8 6 16 0"/>';
    if (T && T.hood) s += `<path class="a-o" style="fill:${T.c}" d="M66 70 q-4 -48 34 -48 q38 0 34 48 l-6 0 q2 -38 -28 -38 q-30 0 -28 38 z"/>`;
    if (o.extra === 'hat') s += '<ellipse class="a-hat a-o" cx="100" cy="38" rx="44" ry="8"/><path class="a-hat a-o" d="M76 38 q2 -24 24 -24 q22 0 24 24 z"/>';
    if (o.extra === 'scarf') s += '<path class="a-bad a-o" d="M78 92 q22 10 44 0 v10 q-22 10 -44 0 z"/><rect class="a-bad a-o" x="108" y="98" width="12" height="34" rx="3"/>';
    if (o.extra === 'umbrella') s += '<path class="a-line" d="M160 176 v-120"/><path class="a-u5 a-o" d="M104 60 q56 -64 112 0 q-14 -8 -28 0 q-14 -8 -28 0 q-14 -8 -28 0 q-14 -8 -28 0 z"/><path class="a-line" d="M160 176 q0 8 -8 8"/>';
    return `<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="น้องสนุกแต่งกาย: ${['top', 'bottom', 'feet', 'extra'].map((k) => { const it = WEAR[k].find((x) => x.id === o[k]); return it ? it.t : ''; }).filter(Boolean).join(' ')}">${s}</svg>`;
  }
  function mountDress(root, ctx) {
    let st;
    const start = () => { st = { i: 0, o: { extra: 'none' }, tries: 0, first: 0, fb: null, ok: false }; };
    function render() {
      if (st.i >= LOOKS.length) {
        const stars = st.first >= LOOKS.length - 1 ? 3 : st.first >= 4 ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars, { score: st.first }); st.saved = true; }
        root.innerHTML = endScreen('แต่งตัวครบทุกสถานการณ์แล้ว!', `แต่งถูกตั้งแต่ครั้งแรก ${st.first} จาก ${LOOKS.length} สถานการณ์`, stars, 'again');
        return;
      }
      const L = LOOKS[st.i];
      const slots = Object.keys(WEAR).map((k) => `<fieldset class="dress-slot"><legend>${SLOT_TH[k]}</legend><div class="dress-opts">${WEAR[k].map((it) => `<button type="button" class="dress-opt${st.o[k] === it.id ? ' on' : ''}" data-g="wear" data-slot="${k}" data-id="${it.id}" aria-pressed="${st.o[k] === it.id}"${st.ok ? ' disabled' : ''}>${it.c ? `<span class="dress-sw" style="background:${it.c}"></span>` : ''}${it.t}</button>`).join('')}</div></fieldset>`).join('');
      const full = ['top', 'bottom', 'feet'].every((k) => st.o[k]);
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>สถานการณ์ที่ ${st.i + 1} / ${LOOKS.length}</h2><span class="chip">ถูกครั้งแรก ${st.first}</span></div>
  <div class="dress-goal"><span aria-hidden="true">${L.e}</span><b>${L.t}</b></div>
  <div class="dress">
    <div class="dress-doll">${dollSVG(st.o)}</div>
    <div class="dress-panel">${slots}</div>
  </div>
  <div aria-live="polite">${st.fb || ''}</div>
  <div class="row">${st.ok ? `<button type="button" class="btn primary" data-g="next">${st.i < LOOKS.length - 1 ? 'สถานการณ์ต่อไป →' : 'ดูผล →'}</button>` : `<button type="button" class="btn primary" data-g="check"${full ? '' : ' disabled'}>${full ? 'ออกไปได้เลย!' : 'เลือกเสื้อ ท่อนล่าง และรองเท้าก่อน'}</button>`}</div>
</section>`;
    }
    bind(root, {
      wear(el) { st.o[el.dataset.slot] = el.dataset.id; st.fb = null; render(); const b = root.querySelector(`[data-slot="${el.dataset.slot}"][data-id="${el.dataset.id}"]`); if (b) b.focus({ preventScroll: true }); },
      check() {
        const L = LOOKS[st.i];
        st.tries += 1;
        const wrong = Object.keys(L.ok).filter((k) => !L.ok[k].includes(st.o[k] || 'none'));
        if (!wrong.length) {
          if (st.tries === 1) st.first += 1;
          st.ok = true;
          st.fb = `<p class="feedback ok">เหมาะสมมาก! ${L.tip}</p>`;
        } else {
          st.fb = `<p class="feedback bad">ยังไม่เหมาะ ลองเปลี่ยน<b>${wrong.map((k) => SLOT_TH[k]).join(' และ ')}</b> · คำใบ้: ${L.tip}</p>`;
        }
        render();
      },
      next() { st.i += 1; st.o = { extra: 'none' }; st.tries = 0; st.ok = false; st.fb = null; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ ปลูกผักบุ้ง 12 วัน ════════ */
  const WEATHER = ['sun', 'sun', 'cloud', 'rain', 'sun', 'cloud', 'rain', 'rain', 'cloud', 'sun', 'sun', 'cloud'];
  const WX = { sun: { e: '☀️', t: 'แดดจัด', dry: 2 }, cloud: { e: '⛅', t: 'ครึ้มฟ้า', dry: 1 }, rain: { e: '🌧️', t: 'ฝนตก', dry: -2 } };
  const WEED_DAYS = [4, 8];
  const PEST_DAY = 7;
  const GOAL3 = 24;
  const GOAL2 = 16;
  // จำลอง 1 วัน: คืนค่าสถานะใหม่และข้อความบอกผล (ใช้ในเกมและในการทดสอบ)
  function gardenDay(g, act) {
    const n = { ...g, log: [] };
    const w = WX[WEATHER[g.day - 1]];
    if (act.water) n.m += 2;
    if (act.weed && n.weed) { n.weed = false; n.log.push('ถอนวัชพืชแล้ว'); }
    if (act.pest && n.pest) { n.pest = false; n.log.push('จับหนอนออกแล้ว'); }
    if (act.feed) {
      if (g.lastFeed && g.day - g.lastFeed < 4) { n.hp -= 1; n.log.push('ใส่ปุ๋ยถี่เกินไป รากเสียหาย'); }
      else n.log.push('ใส่ปุ๋ยหมักแล้ว ผักจะโตเร็วขึ้น 3 วัน');
      n.lastFeed = g.day;
    }
    n.m = Math.max(0, Math.min(6, n.m - w.dry));
    let grow = g.shade ? 1 : 2;
    if (n.lastFeed && g.day - n.lastFeed < 3) grow += 1;
    if (n.weed) { grow = Math.floor(grow / 2); n.log.push('วัชพืชแย่งอาหาร ผักโตช้าลง'); }
    if (n.pest) { n.hp -= 1; n.log.push('หนอนกัดกินใบผัก'); }
    if (n.m === 0) { grow = 0; n.hp -= 1; n.log.push('ดินแห้งมาก ผักเหี่ยว'); }
    else if (n.m >= 6) { grow = 0; n.hp -= 1; n.log.push('ดินแฉะเกินไป รากเริ่มเน่า'); }
    else n.log.push(`ดินชุ่มกำลังดี ผักสูงขึ้น ${grow} ซม.`);
    n.h += grow;
    n.hp = Math.max(0, n.hp);
    n.day += 1;
    if (WEED_DAYS.includes(n.day)) { n.weed = true; n.log.push('มีวัชพืชงอกขึ้นในกระถาง'); }
    if (n.day === PEST_DAY) { n.pest = true; n.log.push('มีหนอนมาเกาะใบผัก'); }
    return n;
  }
  const gardenStars = (g) => (g.hp >= 3 && g.h >= GOAL3 ? 3 : g.hp >= 2 && g.h >= GOAL2 ? 2 : 1);
  function plantSVG(g) {
    const h = Math.min(130, g.h * 4.5 + 6);
    const leaf = g.hp >= 3 ? 'a-leaf' : g.hp === 2 ? 'a-hat' : 'a-soil';
    const soil = g.m >= 6 ? '#4A3426' : g.m >= 2 ? '#7A5236' : '#C9A27A';
    const n = Math.max(1, Math.floor(h / 22));
    let leaves = '';
    for (let i = 0; i < n; i++) {
      const y = 186 - 18 - i * 22;
      leaves += `<ellipse class="${leaf} a-o" cx="${i % 2 ? 114 : 86}" cy="${y}" rx="14" ry="6" transform="rotate(${i % 2 ? 25 : -25} ${i % 2 ? 114 : 86} ${y})"/>`;
    }
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ผักบุ้งสูง ${g.h} เซนติเมตร">
<path class="a-stem" d="M100 186 V${186 - h}"/>${leaves}<ellipse class="${leaf} a-o" cx="100" cy="${180 - h}" rx="7" ry="10"/>
${g.weed ? '<path class="a-stem" d="M140 186 v-16 M140 176 l-6 -6 M140 178 l6 -8" style="stroke:#7FA03A"/>' : ''}
${g.pest ? `<g transform="translate(104 ${186 - h * 0.6})"><ellipse class="a-hat a-o" cx="10" cy="0" rx="12" ry="5"/><circle class="a-ink" cx="20" cy="-1" r="2"/></g>` : ''}
<path class="a-u2 a-o" d="M40 186 h120 l-14 64 h-92 z"/><rect class="a-o" x="36" y="180" width="128" height="12" rx="3" style="fill:${soil}"/>
</svg>`;
  }
  function mountGarden(root, ctx) {
    let g;
    let act;
    const start = () => { g = null; act = {}; };
    function render() {
      if (!g) {
        root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>ปลูกผักบุ้ง 12 วัน</h2><span class="chip">เป้าหมาย สูง ${GOAL3} ซม. ใบเขียวสด</span></div>
  <p class="g-hint">ดูแลผักบุ้งในกระถางทุกวัน ดูสภาพอากาศ ดูความชื้นของดิน แล้วเลือกว่าจะรดน้ำ ใส่ปุ๋ย ถอนวัชพืช หรือจับหนอน</p>
  <h3>ก่อนเริ่ม: จะวางกระถางไว้ที่ไหน?</h3>
  <div class="sort-btns">
    <button type="button" class="sort-btn" data-g="place" data-v="sun" style="--bc:#F2B705"><span aria-hidden="true">🌤️</span> ระเบียงที่มีแดดครึ่งวัน</button>
    <button type="button" class="sort-btn" data-g="place" data-v="shade" style="--bc:#5A606E"><span aria-hidden="true">🏚️</span> ใต้หลังคาที่ร่มทึบ</button>
  </div>
</section>`;
        return;
      }
      if (g.day > WEATHER.length || g.hp === 0) {
        const stars = g.hp === 0 ? 1 : gardenStars(g);
        if (!g.saved) { keepBest(ctx, stars, { score: g.h }); g.saved = true; }
        const msg = g.hp === 0 ? 'ผักเหี่ยวตายเสียก่อน ลองดูแลใหม่อีกครั้ง' : `เก็บเกี่ยวผักบุ้งสูง ${g.h} ซม. ${stars === 3 ? 'ผักงามมาก!' : stars === 2 ? 'ผักโตดี แต่ยังทำได้ดีกว่านี้' : 'ผักโตช้า ลองดูแลให้ดินชุ่มพอดีทุกวัน'}`;
        root.innerHTML = endScreen(g.hp === 0 ? 'โอ๊ะ ผักตายแล้ว' : 'ถึงวันเก็บเกี่ยว!', msg, stars, 'again') +
          `<section class="panel stack"><h3>เคล็ดลับ</h3><ul><li>วันที่ฝนตก ไม่ต้องรดน้ำ ดินจะแฉะเกินไป</li><li>วันที่แดดจัด ดินแห้งเร็ว ต้องรดน้ำ</li><li>ใส่ปุ๋ยห่างกันอย่างน้อย 4 วัน</li><li>ถอนวัชพืชและจับหนอนทันทีที่เห็น</li><li>ผักต้องการแดด ไม่ควรวางในที่ร่มทึบ</li></ul></section>`;
        return;
      }
      const w = WX[WEATHER[g.day - 1]];
      // ช่องที่ 1–5 คือชุ่มพอดี ช่องที่ 6 คือแฉะเกินไป ไม่มีช่องเติมเลยคือดินแห้ง
      const meter = [0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < g.m ? 'on' : ''}${i === 5 ? ' wet' : ' ideal'}"></i>`).join('');
      const opt = (k, e, t, show) => (show ? `<button type="button" class="dress-opt${act[k] ? ' on' : ''}" data-g="act" data-k="${k}" aria-pressed="${!!act[k]}">${e} ${t}</button>` : '');
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>วันที่ ${g.day} / ${WEATHER.length}</h2><span class="chip">${'❤️'.repeat(g.hp)}${'🤍'.repeat(3 - g.hp)} · สูง ${g.h} ซม.</span></div>
  <div class="garden">
    <div class="garden-pic">${plantSVG(g)}</div>
    <div class="stack">
      <p class="garden-wx"><span aria-hidden="true">${w.e}</span> วันนี้<b>${w.t}</b>${WEATHER[g.day] ? ` · พรุ่งนี้ ${WX[WEATHER[g.day]].e}` : ''}</p>
      <div><p class="muted">ความชื้นของดิน: ช่องขอบเขียวคือพอดี ช่องขอบแดงคือแฉะเกินไป ไม่มีน้ำเลยคือแห้ง</p><div class="moist" role="img" aria-label="ความชื้นดิน ${g.m} จาก 6">${meter}</div></div>
      <h3>วันนี้จะทำอะไรบ้าง</h3>
      <div class="dress-opts">${opt('water', '💧', 'รดน้ำ', true)}${opt('feed', '🌿', 'ใส่ปุ๋ยหมัก', true)}${opt('weed', '🌱', 'ถอนวัชพืช', g.weed)}${opt('pest', '🐛', 'จับหนอน', g.pest)}</div>
      <div class="row"><button type="button" class="btn primary" data-g="day">จบวันที่ ${g.day} →</button></div>
      <div aria-live="polite">${g.log && g.log.length ? `<ul class="garden-log">${g.log.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
    </div>
  </div>
</section>`;
    }
    bind(root, {
      place(el) { g = { day: 1, m: 3, h: 0, hp: 3, shade: el.dataset.v === 'shade', weed: false, pest: false, lastFeed: 0, log: el.dataset.v === 'shade' ? ['ที่ร่มทึบได้แสงแดดน้อย ผักจะโตช้า'] : ['วางกระถางในที่มีแดดครึ่งวัน เหมาะกับผักบุ้ง'] }; act = {}; render(); },
      act(el) { act[el.dataset.k] = !act[el.dataset.k]; render(); },
      day() { g = gardenDay(g, act); act = {}; render(); const b = root.querySelector('[data-g="day"]'); if (b) b.focus({ preventScroll: true }); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  /* ════════ กล่องเครื่องมือช่างซ่อม ════════ */
  const FIXES = [
    { e: '🧸', t: 'ตุ๊กตาหมีตะเข็บแขนแยก', ok: 'needle', why: 'เนาตะเข็บด้วยเข็มและด้ายสีเดียวกัน' },
    { e: '📕', t: 'ปกสมุดหลุดออกจากสัน', ok: 'tape', why: 'ติดสันสมุดด้วยเทปใสหรือกระดาษกาว' },
    { e: '🚗', t: 'ล้อรถของเล่นโยกเพราะสกรูหัวกากบาทหลวม', ok: 'phillips', why: 'ขันสกรูหัวกากบาทด้วยไขควงปากแฉก' },
    { e: '🪑', t: 'ตะปูโผล่จากเก้าอี้ไม้', ok: 'hammer', why: 'ตอกตะปูให้จมด้วยค้อน ไม่ให้เกี่ยวเสื้อหรือบาดขา' },
    { e: '🖼️', t: 'จะติดตะขอแขวนรูปให้อยู่กลางผนัง', ok: 'tape-measure', why: 'วัดตำแหน่งกึ่งกลางด้วยตลับเมตรก่อน' },
    { e: '🧺', t: 'หูตะกร้าลวดงอผิดรูป', ok: 'pliers', why: 'ใช้คีมดัดลวดกลับเข้ารูป' },
    { e: '✂️', t: 'กรรไกรเป็นสนิม ตัดฝืด', ok: 'oil', why: 'เช็ดสนิม แล้วหยอดน้ำมันบาง ๆ ที่จุดหมุน' },
    { e: '🔌', t: 'สายไฟของเล่นไฟฟ้าขาด เห็นลวดข้างใน', ok: 'adult', why: 'ของเล่นไฟฟ้าที่สายไฟขาดอันตราย ต้องให้ผู้ใหญ่ซ่อม' },
    { e: '🔦', t: 'ไฟฉายไม่ติดเพราะถ่านหมด ฝาปิดถ่านมีสกรูหัวแบน', ok: 'flat', why: 'ใช้ไขควงปากแบนเปิดฝา แล้วเปลี่ยนถ่านใหม่' }
  ];
  const KIT = [
    { id: 'needle', e: '🪡', t: 'เข็มและด้าย' },
    { id: 'tape', e: '🩹', t: 'เทปใส กระดาษกาว' },
    { id: 'phillips', e: '➕', t: 'ไขควงปากแฉก' },
    { id: 'flat', e: '➖', t: 'ไขควงปากแบน' },
    { id: 'hammer', e: '🔨', t: 'ค้อน' },
    { id: 'tape-measure', e: '📏', t: 'ตลับเมตร' },
    { id: 'pliers', e: '🗜️', t: 'คีม' },
    { id: 'oil', e: '🛢️', t: 'น้ำมันหยอด และผ้า' },
    { id: 'adult', e: '🧑‍🔧', t: 'ให้ผู้ใหญ่ซ่อม' }
  ];
  function mountRepair(root, ctx) {
    let st;
    const start = () => { st = { order: shuffle(FIXES), i: 0, first: 0, tries: 0, pick: null, ok: false }; };
    function render() {
      if (st.i >= st.order.length) {
        const n = st.order.length;
        const stars = st.first >= n - 1 ? 3 : st.first >= Math.ceil(n * 0.6) ? 2 : 1;
        if (!st.saved) { keepBest(ctx, stars, { score: st.first }); st.saved = true; }
        root.innerHTML = endScreen('ซ่อมครบทุกชิ้นแล้ว!', `เลือกเครื่องมือถูกตั้งแต่ครั้งแรก ${st.first} จาก ${n} ชิ้น`, stars, 'again');
        return;
      }
      const it = st.order[st.i];
      const tools = KIT.map((k) => {
        const cls = st.ok && k.id === it.ok ? ' right' : st.pick === k.id && !st.ok ? ' wrong' : '';
        return `<button type="button" class="kit-tool${cls}" data-g="tool" data-id="${k.id}"${st.ok ? ' disabled' : ''}><span class="kit-e" aria-hidden="true">${k.e}</span><span>${k.t}</span></button>`;
      }).join('');
      root.innerHTML = `
<section class="panel g-stage">
  <div class="g-head"><h2>งานซ่อมชิ้นที่ ${st.i + 1} / ${st.order.length}</h2><span class="chip">ถูกครั้งแรก ${st.first}</span></div>
  <div class="sort-card"><span class="sort-e" aria-hidden="true">${it.e}</span><b>${esc(it.t)}</b></div>
  <p class="g-hint">เปิดกล่องเครื่องมือ เลือกสิ่งที่ใช้ซ่อมได้ถูกต้องและปลอดภัย</p>
  <div class="kit">${tools}</div>
  <div aria-live="polite">${st.ok ? `<p class="feedback ok">ซ่อมได้แล้ว! ${it.why}</p><div class="row"><button type="button" class="btn primary" data-g="next">ชิ้นต่อไป →</button></div>` : st.pick ? `<p class="feedback bad">ยังไม่เหมาะ เครื่องมือนี้ใช้ซ่อมชิ้นนี้ไม่ได้ ลองเลือกใหม่</p>` : ''}</div>
</section>`;
    }
    bind(root, {
      tool(el) {
        const it = st.order[st.i];
        st.tries += 1;
        st.pick = el.dataset.id;
        st.ok = st.pick === it.ok;
        if (st.ok && st.tries === 1) st.first += 1;
        render();
      },
      next() { st.i += 1; st.tries = 0; st.pick = null; st.ok = false; render(); },
      again() { start(); render(); }
    });
    start();
    render();
  }

  const MORE = [
    { id: 'morning', unit: 'u1', lesson: 'u1-1', emoji: '🎬', title: 'เรียงแล้วเล่นดูผล', desc: 'เรียงการ์ดกิจวัตร 3 ด่าน แล้วกดเล่นดูว่าน้องสนุกทำตามได้ไหม ลำดับผิดจะเกิดเรื่องวุ่น', mount: mountMorning, summary: (d) => sumLevels(d, ROUTINES.length) },
    { id: 'hazard', unit: 'c1', lesson: 'c1-3', emoji: '🔍', title: 'หาจุดอันตรายในบ้าน', desc: 'แตะหาสิ่งที่อาจทำให้คนในบ้านได้รับอันตราย 6 จุด แล้วเรียนรู้วิธีแก้', mount: mountHazard, summary: bestOf },
    { id: 'dressup', unit: 'c2', lesson: 'c2-1', emoji: '🧒', title: 'แต่งตัวให้น้องสนุก', desc: 'เลือกเสื้อ ท่อนล่าง รองเท้า และอุปกรณ์ ให้เหมาะกับอากาศและสถานที่ 7 สถานการณ์', mount: mountDress, summary: bestOf },
    { id: 'garden', unit: 'c3', lesson: 'c3-4', emoji: '🌱', title: 'ปลูกผักบุ้ง 12 วัน', desc: 'ดูแลผักในกระถางทุกวัน ดูฟ้าฝน รดน้ำให้พอดี ใส่ปุ๋ย ถอนวัชพืช จับหนอน', mount: mountGarden, summary: bestOf },
    { id: 'repair', unit: 'c4', lesson: 'c4-2', emoji: '🧰', title: 'กล่องเครื่องมือช่างซ่อม', desc: 'เลือกเครื่องมือให้ตรงกับของที่ชำรุด 9 ชิ้น บางชิ้นต้องให้ผู้ใหญ่ซ่อม', mount: mountRepair, summary: bestOf }
  ];
  // เรียงเกมใหม่ไว้หลังเกมเดิมของหน่วยเดียวกัน
  MORE.forEach((g) => {
    const G = window.GAMES;
    let at = -1;
    G.forEach((x, i) => { if (x.unit === g.unit) at = i; });
    if (at === -1) G.push(g); else G.splice(at + 1, 0, g);
  });
  Object.assign(window.GAME_DATA, { ROUTINES, SPOTS, LOOKS, WEAR, FIXES, WEATHER, gardenDay, gardenStars });
})();
