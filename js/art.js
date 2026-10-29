/*
 * ภาพประกอบ SVG ทั้งหมด ใช้คลาส a-* (กำหนดสีใน style.css) จึงเปลี่ยนตามโหมดสว่าง/มืดได้
 * ART[ชื่อ] = { svg, alt }
 */
(function () {
  'use strict';

  // แมว "น้องสนุก" ตัวละครหลักของเว็บ วาดในกรอบ 100×120 แล้วย้ายด้วย transform
  function cat(x, y, s, opt) {
    opt = opt || {};
    const wave = opt.wave
      ? '<ellipse class="a-cat a-o" cx="86" cy="62" rx="9" ry="13" transform="rotate(-35 86 62)"/>'
      : '<ellipse class="a-cat a-o" cx="74" cy="98" rx="9" ry="7"/>';
    const flip = opt.flip ? ` translate(100 0) scale(-1 1)` : '';
    return `<g transform="translate(${x} ${y}) scale(${s})${flip}">
  <path class="a-tail" d="M76 100 C 102 98, 104 70, 92 62"/>
  <ellipse class="a-cat a-o" cx="50" cy="92" rx="28" ry="24"/>
  <ellipse class="a-cat2" cx="50" cy="97" rx="15" ry="14"/>
  <ellipse class="a-cat a-o" cx="26" cy="98" rx="9" ry="7"/>
  ${wave}
  <path class="a-cat a-o" d="M22 34 L27 6 L46 22 Z"/>
  <path class="a-cat a-o" d="M78 34 L73 6 L54 22 Z"/>
  <path class="a-pink" d="M27 26 L29 13 L38 21 Z"/>
  <path class="a-pink" d="M73 26 L71 13 L62 21 Z"/>
  <circle class="a-cat a-o" cx="50" cy="46" r="30"/>
  <ellipse class="a-cat2" cx="50" cy="57" rx="15" ry="10"/>
  <circle class="a-pink" cx="30" cy="56" r="5" opacity=".55"/>
  <circle class="a-pink" cx="70" cy="56" r="5" opacity=".55"/>
  <ellipse class="a-ink" cx="39" cy="43" rx="4.2" ry="5.6"/>
  <ellipse class="a-ink" cx="61" cy="43" rx="4.2" ry="5.6"/>
  <circle class="a-shine" cx="40.5" cy="41" r="1.5"/>
  <circle class="a-shine" cx="62.5" cy="41" r="1.5"/>
  <path class="a-pink" d="M46 52 h8 l-4 4 z"/>
  <path class="a-line" d="M50 56 q-4 5 -8 2 M50 56 q4 5 8 2"/>
  <path class="a-line a-thin" d="M33 55 h-14 M33 59 l-13 4 M67 55 h14 M67 59 l13 4"/>
</g>`;
  }
  const fish = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})">
  <path class="a-fish a-o" d="M0 12 C 10 -2, 30 -2, 38 12 C 30 26, 10 26, 0 12 Z"/>
  <path class="a-fish a-o" d="M36 12 L50 2 L50 22 Z"/>
  <circle class="a-ink" cx="10" cy="10" r="2.2"/>
</g>`;
  const label = (x, y, t, cls) => `<text class="a-t${cls ? ' ' + cls : ''}" x="${x}" y="${y}">${t}</text>`;
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="a-mk" d="M0 0 L10 5 L0 10 z"/></marker></defs>${body}</svg>`;
  const blk = (x, y, w, cls, t) => `<g><rect class="${cls}" x="${x}" y="${y}" width="${w}" height="22" rx="4"/><rect class="${cls}" x="${x + 10}" y="${y + 20}" width="16" height="5" rx="2"/>${t ? `<text class="a-t a-tw" x="${x + 8}" y="${y + 15}">${t}</text>` : ''}</g>`;

  const ART = {
    mascot: {
      alt: 'น้องสนุก แมวสีส้มโบกมือ ข้าง ๆ มีบล็อกคำสั่งต่อกันเป็นตั้งและปลาตัวหนึ่ง',
      svg: svg(320, 220, `
<rect class="a-soft" x="10" y="180" width="300" height="12" rx="6"/>
${blk(178, 70, 110, 'a-hat', 'เมื่อเริ่ม')}
${blk(178, 95, 120, 'a-u1', 'เดิน ➡ ➡')}
${blk(178, 120, 96, 'a-u2', 'ทำซ้ำ 3')}
${blk(178, 145, 128, 'a-u3', 'ค้นหา')}
${cat(40, 62, 1.05, { wave: true })}
${fish(232, 30, 1.1)}
<circle class="a-hat" cx="34" cy="38" r="6"/>
<path class="a-line a-thin" d="M150 40 l8 -8 M160 52 l12 -2 M146 28 l2 -12"/>`)
    },

    /* หน่วยที่ 1 */
    u1: {
      alt: 'แมวเดินตามเส้นทางที่มีลูกศรบอกทิศทาง ไปหาปลาที่ปลายทาง',
      svg: svg(320, 200, `
<path class="a-dash" d="M70 150 H160 V70 H262"/>
<g>${['➡', '➡', '⬆', '⬆', '➡', '➡'].map((a, i) => {
        const pts = [[95, 150], [130, 150], [160, 120], [160, 90], [195, 70], [230, 70]][i];
        return `<rect class="a-paper a-o" x="${pts[0] - 13}" y="${pts[1] - 13}" width="26" height="26" rx="6"/><path class="a-line a-arw" d="M-7 0 H6 M1 -6 L7 0 L1 6" transform="translate(${pts[0]} ${pts[1]}) rotate(${a === '⬆' ? -90 : 0})"/>`;
      }).join('')}</g>
${cat(14, 98, 0.62)}
${fish(250, 58, 0.9)}
<rect class="a-u1" x="22" y="22" width="92" height="30" rx="15"/>
${label(68, 43, 'อัลกอริทึม', 'a-tw a-mid')}`)
    },
    steps: {
      alt: 'บัตรขั้นตอนเรียงลำดับ 1 ถึง 4 มีเครื่องหมายถูก แมวถือดินสอ',
      svg: svg(320, 190, `
<rect class="a-paper a-o" x="120" y="16" width="180" height="160" rx="12"/>
${[0, 1, 2, 3].map((i) => `<circle class="a-u1" cx="146" cy="${46 + i * 36}" r="12"/>
<text class="a-t a-tw a-mid" x="146" y="${51 + i * 36}">${i + 1}</text>
<rect class="a-soft" x="166" y="${40 + i * 36}" width="${[96, 80, 104, 70][i]}" height="12" rx="6"/>
${i < 3 ? `<path class="a-okline" d="M${270} ${44 + i * 36} l5 5 l10 -11"/>` : ''}`).join('')}
${cat(8, 58, 0.95)}
<path class="a-pencil a-o" d="M100 120 l22 -38 l8 5 l-22 38 z"/><path class="a-ink" d="M100 120 l3 -9 l5 3 z"/>`)
    },
    recipe: {
      alt: 'กระทะทอดไข่ดาว ข้าง ๆ มีกระดาษเขียนขั้นตอนเป็นข้อ ๆ',
      svg: svg(320, 190, `
<ellipse class="a-soft" cx="110" cy="158" rx="90" ry="14"/>
<path class="a-ink" d="M180 112 l80 -10 l2 10 l-80 12 z"/>
<ellipse class="a-pan" cx="110" cy="118" rx="82" ry="34"/>
<ellipse class="a-pan2" cx="110" cy="112" rx="70" ry="26"/>
<path class="a-egg a-o" d="M70 110 C 66 92, 96 86, 110 96 C 130 84, 156 96, 146 112 C 152 128, 112 132, 96 126 C 78 130, 62 122, 70 110 Z"/>
<circle class="a-yolk a-o" cx="108" cy="110" r="14"/>
<circle class="a-shine" cx="103" cy="105" r="3"/>
<g transform="rotate(6 262 70)"><rect class="a-paper a-o" x="214" y="18" width="96" height="112" rx="8"/>
${[0, 1, 2, 3, 4].map((i) => `<text class="a-t a-small" x="226" y="${42 + i * 19}">${i + 1}.</text><rect class="a-soft" x="244" y="${33 + i * 19}" width="${[52, 40, 48, 36, 50][i]}" height="9" rx="4"/>`).join('')}</g>`)
    },
    storyboard: {
      alt: 'ภาพเรียงลำดับการปลูกต้นไม้ 3 ช่อง: เมล็ด ต้นกล้า ต้นไม้ มีลูกศรเชื่อมจากช่องแรกถึงช่องสุดท้าย',
      svg: svg(320, 170, `
${[0, 1, 2].map((i) => `<rect class="a-paper a-o" x="${12 + i * 104}" y="24" width="86" height="110" rx="10"/>
<rect class="a-soil" x="${20 + i * 104}" y="104" width="70" height="20" rx="4"/>
<text class="a-t a-small a-mid" x="${55 + i * 104}" y="156">${['ขั้นที่ 1', 'ขั้นที่ 2', 'ขั้นที่ 3'][i]}</text>`).join('')}
<ellipse class="a-seed a-o" cx="55" cy="100" rx="8" ry="5"/>
<path class="a-stem" d="M159 104 v-30"/><ellipse class="a-leaf a-o" cx="149" cy="76" rx="11" ry="6" transform="rotate(-25 149 76)"/><ellipse class="a-leaf a-o" cx="170" cy="70" rx="11" ry="6" transform="rotate(25 170 70)"/>
<path class="a-trunk" d="M263 104 v-36"/><circle class="a-leaf a-o" cx="263" cy="58" r="26"/><circle class="a-fruit" cx="252" cy="54" r="4"/><circle class="a-fruit" cx="272" cy="64" r="4"/>
<path class="a-arrow" d="M98 80 h14"/><path class="a-arrow" d="M202 80 h14"/>`)
    },
    cycle: {
      alt: 'วงจร 4 ขั้นตอนการแก้ปัญหา: เข้าใจปัญหา วางแผน ลงมือทำ ตรวจสอบและปรับปรุง',
      svg: svg(320, 230, `
<circle class="a-ring" cx="160" cy="115" r="78"/>
<path class="a-arrow" d="M214 58 a78 78 0 0 1 22 40"/>
<path class="a-arrow" d="M230 160 a78 78 0 0 1 -38 30"/>
<path class="a-arrow" d="M110 175 a78 78 0 0 1 -30 -38"/>
<path class="a-arrow" d="M92 72 a78 78 0 0 1 40 -30"/>
${[['เข้าใจปัญหา', 160, 36, 'a-u1'], ['วางแผน', 244, 115, 'a-u2'], ['ลงมือทำ', 160, 196, 'a-u4'], ['ตรวจสอบ', 76, 115, 'a-u5']].map(([t, x, y, c], i) => `
<rect class="${c}" x="${x - 52}" y="${y - 18}" width="104" height="36" rx="18"/>
<text class="a-t a-tw a-mid" x="${x}" y="${y + 6}">${i + 1}. ${t}</text>`).join('')}
<circle class="a-hat" cx="160" cy="115" r="22"/>
<path class="a-bulb" d="M152 122 h16 M154 128 h12"/><circle class="a-paper" cx="160" cy="110" r="9"/>`)
    },

    /* หน่วยที่ 2 */
    u2: {
      alt: 'บล็อกคำสั่งสีต่าง ๆ ต่อกันเป็นโปรแกรม และแมวบนเวทีกำลังเดิน',
      svg: svg(320, 200, `
${blk(24, 30, 120, 'a-hat', 'เมื่อคลิก ⚑')}
${blk(24, 56, 132, 'a-sbm', 'เคลื่อนที่ 10')}
${blk(24, 82, 110, 'a-sbl', 'พูด สวัสดี')}
${blk(24, 108, 126, 'a-sbc', 'ทำซ้ำ 4 ครั้ง')}
<rect class="a-paper a-o" x="176" y="30" width="128" height="120" rx="10"/>
<rect class="a-sky" x="182" y="36" width="116" height="80" rx="6"/>
<rect class="a-grass" x="182" y="104" width="116" height="40" rx="6"/>
${cat(212, 50, 0.6)}
<path class="a-line a-thin" d="M200 104 h-10 M204 98 h-12"/>`)
    },
    scratch: {
      alt: 'หน้าจอโปรแกรม Scratch มีหมายเลขกำกับ 1 กลุ่มบล็อกคำสั่ง 2 พื้นที่เขียนสคริปต์ 3 เวที 4 ตัวละคร 5 ธงเขียวและปุ่มหยุด',
      svg: svg(340, 230, `
<rect class="a-paper a-o" x="6" y="6" width="328" height="218" rx="10"/>
<rect class="a-u3" x="6" y="6" width="328" height="24" rx="10"/><rect class="a-u3" x="6" y="20" width="328" height="10"/>
${label(18, 23, 'Scratch', 'a-tw a-small')}
<rect class="a-soft" x="14" y="38" width="70" height="178" rx="6"/>
${['a-sbm', 'a-sbl', 'a-sbs', 'a-sbe', 'a-sbc'].map((c, i) => `<circle class="${c}" cx="26" cy="${54 + i * 22}" r="7"/><rect class="${c}" x="38" y="${48 + i * 22}" width="40" height="12" rx="3"/>`).join('')}
<rect class="a-soft" x="90" y="38" width="122" height="178" rx="6" opacity=".55"/>
${blk(100, 52, 86, 'a-hat', 'เมื่อคลิก ⚑')}
${blk(100, 77, 96, 'a-sbm', 'เคลื่อนที่ 10')}
${blk(100, 102, 80, 'a-sbl', 'พูด สวัสดี')}
<rect class="a-sky" x="218" y="58" width="108" height="86" rx="6"/>
${cat(246, 66, 0.52)}
<rect class="a-soft" x="218" y="150" width="108" height="66" rx="6"/>
<rect class="a-paper a-o" x="226" y="160" width="36" height="36" rx="6"/>${cat(229, 162, 0.3)}
<path class="a-flag" d="M276 36 v16 M276 37 h12 l-3 4 l3 4 h-12"/><polygon class="a-stop" points="302,36 310,36 315,41 315,49 310,54 302,54 297,49 297,41"/>
${[[49, 216, 1], [151, 216, 2], [272, 144, 3], [244, 210, 4], [298, 66, 5]].map(([x, y, n]) => `<circle class="a-ink" cx="${x}" cy="${y - 6}" r="9"/><text class="a-t a-inv a-mid a-small" x="${x}" y="${y - 2}">${n}</text>`).join('')}`)
    },
    project: {
      alt: 'แมวเต้นบนเวที มีโน้ตดนตรีลอยอยู่ ด้านล่างเป็นชุดตัวละคร 2 แบบสลับกัน',
      svg: svg(320, 200, `
<rect class="a-paper a-o" x="20" y="14" width="200" height="140" rx="10"/>
<rect class="a-sky" x="28" y="22" width="184" height="96" rx="6"/>
<rect class="a-stage" x="28" y="108" width="184" height="38" rx="6"/>
${cat(72, 42, 0.68, { wave: true })}
<text class="a-t a-big" x="40" y="56">♪</text><text class="a-t a-big" x="168" y="48">♫</text><text class="a-t" x="186" y="84">♪</text>
<rect class="a-soft" x="234" y="14" width="72" height="140" rx="10"/>
<rect class="a-paper a-o" x="246" y="24" width="48" height="48" rx="6"/>${cat(251, 28, 0.38)}
<rect class="a-paper a-o" x="246" y="84" width="48" height="48" rx="6"/>${cat(251, 88, 0.38, { wave: true })}
${label(270, 148, 'ชุด 1 · 2', 'a-small a-mid')}
${blk(20, 166, 150, 'a-sbl', 'ชุดถัดไป')}`)
    },
    square: {
      alt: 'เส้นทางรูปสี่เหลี่ยมจัตุรัส มีตัวเลข 1 ถึง 4 ที่แต่ละด้าน และเครื่องหมายมุม 90 องศาที่แต่ละมุม',
      svg: svg(320, 210, `
<rect class="a-pathline" x="70" y="30" width="150" height="150"/>
${[[145, 24, '1'], [232, 110, '2'], [145, 200, '3'], [58, 110, '4']].map(([x, y, t]) => `<text class="a-t a-mid a-bold" x="${x}" y="${y}">${t}</text>`).join('')}
${[[70, 30], [220, 30], [220, 180], [70, 180]].map(([x, y]) => `<rect class="a-corner" x="${x - (x > 100 ? 14 : 0)}" y="${y - (y > 100 ? 14 : 0)}" width="14" height="14"/>`).join('')}
<g transform="translate(206 168) scale(.32)">${cat(0, 0, 1)}</g>
<rect class="a-sbc" x="246" y="70" width="64" height="70" rx="8"/>
${label(278, 100, 'ทำซ้ำ', 'a-mid a-small a-dark')}${label(278, 124, '× 4', 'a-mid a-big a-dark')}`)
    },
    bug: {
      alt: 'แว่นขยายส่องบล็อกคำสั่งที่มีแมลงเต่าทองเกาะอยู่ หมายถึงการหาบั๊กในโปรแกรม',
      svg: svg(320, 200, `
${blk(30, 40, 130, 'a-hat', 'เมื่อคลิก ⚑')}
${blk(30, 66, 150, 'a-sbm', 'เคลื่อนที่ 100')}
${blk(30, 92, 140, 'a-sbm', 'หัน ↻ 45 องศา')}
${blk(30, 118, 150, 'a-sbm', 'เคลื่อนที่ 100')}
<g transform="translate(150 98)"><ellipse class="a-bugbody a-o" cx="0" cy="0" rx="13" ry="11"/><path class="a-line" d="M0 -11 V11"/><circle class="a-ink" cx="-5" cy="-3" r="2.5"/><circle class="a-ink" cx="5" cy="4" r="2.5"/><circle class="a-ink" cx="0" cy="-13" r="5"/><path class="a-line a-thin" d="M-12 -4 l-6 -3 M12 -4 l6 -3 M-12 5 l-6 3 M12 5 l6 3"/></g>
<circle class="a-lens" cx="196" cy="100" r="44"/><circle class="a-ring2" cx="196" cy="100" r="44"/>
<path class="a-handle" d="M228 132 l46 46"/>`)
    },

    /* หน่วยที่ 3 */
    u3: {
      alt: 'ลูกโลกตรงกลาง เชื่อมต่อด้วยเส้นกับคอมพิวเตอร์ โทรศัพท์ แท็บเล็ต และโรงเรียน',
      svg: svg(320, 210, `
<path class="a-net" d="M160 105 L52 44 M160 105 L270 44 M160 105 L52 168 M160 105 L270 168"/>
<circle class="a-sea a-o" cx="160" cy="105" r="48"/>
<path class="a-land" d="M128 82 c10 -12 30 -10 34 4 c4 12 -10 14 -8 26 c2 10 -14 14 -22 6 c-10 -10 -12 -24 -4 -36 z M172 120 c8 -6 22 -2 22 8 c0 10 -14 16 -22 10 z M176 70 c8 -4 18 0 18 8 c-6 4 -14 4 -18 -8 z"/>
<rect class="a-paper a-o" x="24" y="26" width="56" height="36" rx="4"/><rect class="a-ink" x="16" y="62" width="72" height="6" rx="3"/>
<rect class="a-paper a-o" x="256" y="18" width="28" height="50" rx="6"/><circle class="a-ink" cx="270" cy="62" r="2"/>
<rect class="a-paper a-o" x="22" y="146" width="62" height="44" rx="6"/>
<path class="a-u5 a-o" d="M244 190 v-30 l26 -16 l26 16 v30 z"/><rect class="a-paper" x="262" y="170" width="16" height="20"/><path class="a-flag" d="M270 144 v-14 h10"/>`)
    },
    browser: {
      alt: 'หน้าต่างเว็บเบราว์เซอร์ มีแท็บ ปุ่มย้อนกลับ ปุ่มไปข้างหน้า ปุ่มรีเฟรช และช่องที่อยู่',
      svg: svg(320, 180, `
<rect class="a-paper a-o" x="10" y="10" width="300" height="160" rx="10"/>
<rect class="a-soft" x="10" y="10" width="300" height="56" rx="10"/><rect class="a-soft" x="10" y="50" width="300" height="16"/>
<rect class="a-paper" x="22" y="18" width="94" height="22" rx="6"/>${label(32, 34, 'แท็บ', 'a-small')}
${['←', '→', '⟳'].map((t, i) => `<text class="a-t a-mid" x="${30 + i * 26}" y="${60}">${t}</text>`).join('')}
<rect class="a-paper a-o2" x="104" y="44" width="192" height="22" rx="11"/>${label(116, 60, 'www.scimath.org', 'a-small')}
<rect class="a-soft" x="30" y="86" width="140" height="14" rx="7"/><rect class="a-soft" x="30" y="108" width="200" height="10" rx="5"/><rect class="a-soft" x="30" y="124" width="170" height="10" rx="5"/>
<rect class="a-u3" x="236" y="86" width="56" height="64" rx="8" opacity=".85"/>`)
    },
    search: {
      alt: 'ช่องค้นหาที่พิมพ์คำค้นว่า ช้างไทย อาหาร มีแว่นขยาย และผลการค้นหา 3 รายการ',
      svg: svg(320, 190, `
<rect class="a-paper a-o2" x="20" y="20" width="280" height="40" rx="20"/>
<circle class="a-ring2" cx="46" cy="40" r="9"/><path class="a-handle a-thinhandle" d="M53 47 l8 8"/>
<rect class="a-u1" x="70" y="28" width="70" height="24" rx="12"/>${label(105, 45, 'ช้างไทย', 'a-tw a-mid a-small')}
<rect class="a-u4" x="146" y="28" width="54" height="24" rx="12"/>${label(173, 45, 'อาหาร', 'a-tw a-mid a-small')}
${[0, 1, 2].map((i) => `<rect class="a-paper a-o" x="20" y="${76 + i * 36}" width="280" height="30" rx="8"/><rect class="a-link" x="32" y="${83 + i * 36}" width="${[150, 120, 170][i]}" height="7" rx="3"/><rect class="a-soft" x="32" y="${94 + i * 36}" width="${[230, 200, 210][i]}" height="6" rx="3"/>`).join('')}`)
    },
    trust: {
      alt: 'โล่มีเครื่องหมายถูก พร้อมป้ายโดเมน .go.th .ac.th .or.th และป้ายเตือนข้อความรับรางวัลที่ไม่น่าเชื่อถือ',
      svg: svg(320, 200, `
<path class="a-ok a-o" d="M90 24 l58 18 v46 c0 40 -30 62 -58 76 c-28 -14 -58 -36 -58 -76 v-46 z"/>
<path class="a-checkw" d="M64 96 l18 18 l34 -38"/>
${[['.go.th', 44], ['.ac.th', 80], ['.or.th', 116]].map(([t, y]) => `<rect class="a-paper a-o" x="168" y="${y}" width="74" height="26" rx="13"/>${label(205, y + 18, t, 'a-mid a-small')}`).join('')}
<path class="a-warn a-o" d="M280 132 l26 46 h-52 z"/>${label(280, 172, '!', 'a-mid a-bold a-dark')}
<rect class="a-bad" x="160" y="156" width="80" height="26" rx="6" opacity=".9"/>${label(200, 174, 'รับรางวัล!!', 'a-tw a-mid a-small')}`)
    },

    /* หน่วยที่ 4 */
    u4: {
      alt: 'แผ่นสำรวจบนคลิปบอร์ดมีรอยขีดนับ ข้าง ๆ เป็นแผนภูมิแท่ง 4 แท่ง',
      svg: svg(320, 200, `
<rect class="a-board a-o" x="24" y="24" width="120" height="160" rx="10"/>
<rect class="a-paper" x="34" y="40" width="100" height="134" rx="4"/>
<rect class="a-ink" x="64" y="16" width="40" height="16" rx="5"/>
${[['🥭', '||||| |||'], ['🍌', '|||||'], ['🍊', '|||'], ['🍉', '||||| |']].map(([f, t], i) => `<text class="a-t" x="42" y="${68 + i * 28}">${f}</text><text class="a-t a-tally" x="64" y="${68 + i * 28}">${t}</text>`).join('')}
<path class="a-axis" d="M170 40 V170 H304"/>
${[8, 5, 3, 6].map((v, i) => `<rect class="a-u${[1, 2, 3, 4][i]}" x="${182 + i * 30}" y="${170 - v * 15}" width="22" height="${v * 15}" rx="3"/>`).join('')}`)
    },
    survey: {
      alt: 'แมวถือคลิปบอร์ดสอบถามเพื่อนว่าชอบผลไม้อะไร มีลูกโป่งคำพูดรูปมะม่วงและกล้วย',
      svg: svg(320, 190, `
${cat(14, 60, 1)}
<rect class="a-board a-o" x="96" y="96" width="40" height="52" rx="5"/><rect class="a-paper" x="101" y="104" width="30" height="38"/>
<path class="a-bubble a-o" d="M160 30 h130 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-96 l-18 16 v-16 h-16 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 z"/>
${label(232, 58, 'ชอบผลไม้อะไร?', 'a-mid')}
<text class="a-t a-big" x="196" y="94">🥭</text><text class="a-t a-big" x="236" y="94">🍌</text><text class="a-t a-big" x="268" y="94">🍉</text>`)
    },
    process: {
      alt: 'ข้อมูลที่ปนกันเข้าเครื่องประมวลผลรูปเฟือง ออกมาเป็นสารสนเทศที่เรียงเป็นแผนภูมิแท่ง',
      svg: svg(340, 180, `
<rect class="a-soft" x="10" y="40" width="96" height="100" rx="12"/>
${[[30, 66, '🥭'], [62, 60, '🍌'], [44, 96, '🍊'], [76, 92, '🥭'], [28, 126, '🍉'], [64, 128, '🥭']].map(([x, y, e]) => `<text class="a-t" x="${x}" y="${y}">${e}</text>`).join('')}
${label(58, 160, 'ข้อมูล', 'a-mid a-bold')}
<path class="a-arrow" d="M112 90 h24"/>
<g transform="translate(170 90)"><circle class="a-u2" r="30"/><circle class="a-paper" r="11"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect class="a-u2" x="-6" y="-40" width="12" height="14" rx="2" transform="rotate(${a})"/>`).join('')}</g>
${label(170, 160, 'ประมวลผล', 'a-mid a-bold')}
<path class="a-arrow" d="M206 90 h24"/>
<rect class="a-soft" x="236" y="40" width="96" height="100" rx="12"/>
${[48, 36, 22, 14].map((h, i) => `<rect class="a-u${i + 1}" x="${248 + i * 20}" y="${128 - h * 1.6}" width="14" height="${h * 1.6}" rx="2"/>`).join('')}
${label(284, 160, 'สารสนเทศ', 'a-mid a-bold')}`)
    },
    present: {
      alt: 'จอนำเสนอแสดงแผนภูมิแท่งพร้อมชื่อเรื่อง มีไม้ชี้ชี้ที่แท่งที่สูงที่สุด',
      svg: svg(320, 200, `
<rect class="a-ink" x="40" y="14" width="240" height="10" rx="5"/>
<rect class="a-paper a-o" x="50" y="22" width="220" height="140" rx="6"/>
<rect class="a-soft" x="90" y="34" width="140" height="12" rx="6"/>
<path class="a-axis" d="M76 56 V146 H250"/>
${[8, 5, 3, 6].map((v, i) => `<rect class="a-u${i + 1}" x="${92 + i * 40}" y="${146 - v * 10}" width="26" height="${v * 10}" rx="3"/>`).join('')}
<path class="a-ink" d="M156 162 l-10 30 h28 l-10 -30 z" opacity=".25"/>
<path class="a-handle a-thinhandle" d="M300 190 L112 70"/>`)
    },
    sheets: {
      alt: 'หน้าจอโปรแกรมตารางคำนวณ มีคอลัมน์ A ชื่อผลไม้ คอลัมน์ B จำนวน และแผนภูมิแท่งที่สร้างจากตาราง',
      svg: svg(340, 210, `
<rect class="a-paper a-o" x="8" y="8" width="324" height="194" rx="10"/>
<rect class="a-u4" x="8" y="8" width="324" height="24" rx="10"/><rect class="a-u4" x="8" y="22" width="324" height="10"/>
${label(20, 25, 'ตารางคำนวณ', 'a-tw a-small')}
${['', 'A', 'B'].map((t, i) => `<rect class="a-soft" x="${16 + [0, 26, 110][i]}" y="40" width="${[24, 82, 50][i]}" height="18"/>${label(16 + [12, 67, 135][i], 54, t, 'a-mid a-small')}`).join('')}
${[['ผลไม้', 'จำนวน'], ['มะม่วง', '8'], ['กล้วย', '5'], ['ส้ม', '3'], ['แตงโม', '6']].map((r, i) => `
<rect class="a-soft" x="16" y="${60 + i * 22}" width="24" height="20"/>${label(28, 75 + i * 22, String(i + 1), 'a-mid a-small')}
<rect class="a-cellbox" x="42" y="${60 + i * 22}" width="82" height="20"/>${label(48, 75 + i * 22, r[0], 'a-small' + (i ? '' : ' a-bold'))}
<rect class="a-cellbox" x="126" y="${60 + i * 22}" width="50" height="20"/>${label(i ? 166 : 132, 75 + i * 22, r[1], 'a-small' + (i ? ' a-end' : ' a-bold'))}`).join('')}
<rect class="a-paper a-o" x="190" y="44" width="132" height="148" rx="6"/>
<path class="a-axis" d="M204 60 V176 H312"/>
${[8, 5, 3, 6].map((v, i) => `<rect class="a-u1" x="${212 + i * 25}" y="${176 - v * 13}" width="17" height="${v * 13}" rx="2"/>`).join('')}`)
    },

    /* หน่วยที่ 5 */
    u5: {
      alt: 'โล่ป้องกันมีแม่กุญแจอยู่ตรงกลาง ล้อมด้วยดาว หมายถึงความปลอดภัยออนไลน์',
      svg: svg(320, 200, `
<path class="a-u5 a-o" d="M160 16 l70 22 v54 c0 46 -36 72 -70 88 c-34 -16 -70 -42 -70 -88 v-54 z"/>
<rect class="a-hat a-o" x="134" y="90" width="52" height="42" rx="8"/>
<path class="a-shackle" d="M144 90 v-14 a16 16 0 0 1 32 0 v14"/>
<circle class="a-ink" cx="160" cy="106" r="5"/><rect class="a-ink" x="158" y="108" width="4" height="12" rx="2"/>
${[[60, 50], [262, 60], [52, 150], [270, 150]].map(([x, y]) => `<path class="a-star" d="M${x} ${y - 10} l3 7 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1 z"/>`).join('')}`)
    },
    password: {
      alt: 'ช่องรหัสผ่านแสดงเป็นจุด มีแถบความแข็งแรงของรหัสผ่านจากสีแดงถึงสีเขียว และแม่กุญแจ',
      svg: svg(320, 170, `
<rect class="a-paper a-o2" x="20" y="30" width="210" height="40" rx="10"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<circle class="a-ink" cx="${42 + i * 18}" cy="50" r="5"/>`).join('')}
${['a-bad', 'a-warn', 'a-hat', 'a-ok', 'a-ok'].map((c, i) => `<rect class="${c}" x="${20 + i * 43}" y="86" width="38" height="12" rx="6"/>`).join('')}
${label(20, 124, 'อ่อน', 'a-small')}${label(230, 124, 'แข็งแรง', 'a-small a-end')}
<rect class="a-hat a-o" x="250" y="56" width="52" height="44" rx="8"/><path class="a-shackle" d="M260 56 v-14 a16 16 0 0 1 32 0 v14"/><circle class="a-ink" cx="276" cy="74" r="5"/>`)
    },
    alert: {
      alt: 'โทรศัพท์มีข้อความแชตจากคนแปลกหน้า ข้อความหนึ่งมีป้ายเตือน และมือแสดงท่าหยุด',
      svg: svg(320, 210, `
<rect class="a-ink" x="90" y="10" width="120" height="190" rx="18"/>
<rect class="a-paper" x="98" y="26" width="104" height="158" rx="8"/>
<rect class="a-soft" x="106" y="38" width="76" height="24" rx="10"/>${label(112, 54, 'สวัสดี 👋', 'a-small')}
<rect class="a-bad" x="106" y="70" width="88" height="36" rx="10" opacity=".9"/>${label(112, 85, 'บอกที่อยู่บ้าน', 'a-tw a-small')}${label(112, 100, 'หน่อยสิ', 'a-tw a-small')}
<rect class="a-u1" x="124" y="114" width="70" height="24" rx="10"/>${label(130, 130, 'ไม่บอก!', 'a-tw a-small')}
<g transform="translate(232 70)"><circle class="a-bad" r="40"/><circle class="a-paper" r="32"/><path class="a-skin a-o" d="M-12 18 v-30 a4 4 0 0 1 8 0 v-6 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v20 c0 10 -8 16 -16 16 h-6 c-6 0 -10 -4 -10 -8 z"/></g>
${cat(10, 104, 0.8)}`)
    },
    eyes: {
      alt: 'กฎ 20-20-20 นาฬิกาบอก 20 นาที ดวงตามองต้นไม้ไกล 6 เมตร นาน 20 วินาที',
      svg: svg(320, 180, `
<circle class="a-paper a-o" cx="56" cy="80" r="40"/><path class="a-line" d="M56 80 V52 M56 80 L74 92"/>${label(56, 148, '20 นาที', 'a-mid a-bold')}
<path class="a-eye a-o" d="M118 80 q34 -32 68 0 q-34 32 -68 0 z"/><circle class="a-u1" cx="152" cy="80" r="11"/><circle class="a-ink" cx="152" cy="80" r="5"/>${label(152, 148, '20 วินาที', 'a-mid a-bold')}
<path class="a-dash" d="M196 80 H252"/>${label(224, 70, '6 เมตร', 'a-mid a-small')}
<path class="a-trunk" d="M282 116 v-30"/><circle class="a-leaf a-o" cx="282" cy="72" r="24"/>${label(282, 148, 'มองไกล', 'a-mid a-bold')}`)
    },
    pledge: {
      alt: 'กระดาษข้อตกลงการใช้อินเทอร์เน็ต มีช่องลงชื่อนักเรียนและผู้ปกครอง และดินสอ',
      svg: svg(320, 190, `
<rect class="a-paper a-o" x="70" y="10" width="180" height="172" rx="10"/>
<rect class="a-u5" x="70" y="10" width="180" height="30" rx="10"/><rect class="a-u5" x="70" y="30" width="180" height="10"/>
${label(160, 31, 'ข้อตกลงของฉัน', 'a-tw a-mid a-bold')}
${[0, 1, 2, 3].map((i) => `<rect class="a-ok" x="86" y="${54 + i * 22}" width="12" height="12" rx="3"/><path class="a-checkw a-thinck" d="M88 ${60 + i * 22} l3 3 l5 -6"/><rect class="a-soft" x="106" y="${56 + i * 22}" width="${[120, 100, 128, 90][i]}" height="9" rx="4"/>`).join('')}
<path class="a-line a-thin" d="M86 160 h60 M164 160 h70"/>${label(116, 174, 'นักเรียน', 'a-mid a-small')}${label(199, 174, 'ผู้ปกครอง', 'a-mid a-small')}
<path class="a-pencil a-o" d="M262 150 l30 -60 l10 5 l-30 60 z"/>`)
    }
  };

  /* ═════════ ภาพประกอบวิชาการงานอาชีพ ═════════ */
  const cycle4 = (labels) => `
<circle class="a-ring" cx="160" cy="115" r="78"/>
<path class="a-arrow" d="M214 58 a78 78 0 0 1 22 40"/>
<path class="a-arrow" d="M230 160 a78 78 0 0 1 -38 30"/>
<path class="a-arrow" d="M110 175 a78 78 0 0 1 -30 -38"/>
<path class="a-arrow" d="M92 72 a78 78 0 0 1 40 -30"/>
${labels.map(([t, x, y, c], i) => `<rect class="${c}" x="${x - 54}" y="${y - 18}" width="108" height="36" rx="18"/><text class="a-t a-tw a-mid" x="${x}" y="${y + 6}">${i + 1}. ${t}</text>`).join('')}`;
  const pot = (x, y, w, h) => `<path class="a-u2 a-o" d="M${x} ${y} h${w} l-${w * 0.12} ${h} h-${w * 0.76} z"/><rect class="a-u2 a-o" x="${x - 4}" y="${y - 8}" width="${w + 8}" height="10" rx="3"/>`;
  const leafy = (cx, base, hgt) => `<path class="a-stem" d="M${cx} ${base} v-${hgt}"/>
<ellipse class="a-leaf a-o" cx="${cx - 12}" cy="${base - hgt * 0.55}" rx="13" ry="6" transform="rotate(-30 ${cx - 12} ${base - hgt * 0.55})"/>
<ellipse class="a-leaf a-o" cx="${cx + 12}" cy="${base - hgt * 0.75}" rx="13" ry="6" transform="rotate(30 ${cx + 12} ${base - hgt * 0.75})"/>
<ellipse class="a-leaf a-o" cx="${cx}" cy="${base - hgt - 6}" rx="7" ry="11"/>`;
  const can = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><rect class="a-u1 a-o" x="0" y="10" width="48" height="40" rx="6"/><path class="a-u1 a-o" d="M46 22 l34 -18 l4 6 l-34 20 z"/><circle class="a-u1 a-o" cx="84" cy="6" r="6"/><path class="a-line" d="M8 10 q16 -22 32 0"/></g>`;
  const drops = (x, y) => `<g class="a-fish">${[0, 1, 2].map((i) => `<ellipse cx="${x + i * 8}" cy="${y + i * 10}" rx="2.4" ry="4"/>`).join('')}</g>`;

  Object.assign(ART, {
    helping: {
      alt: 'แมวถือไม้กวาดหน้าบ้าน มีป้ายงานช่วยเหลือตนเอง ครอบครัว และส่วนรวม',
      svg: svg(320, 200, `
<path class="a-u5 a-o" d="M150 70 l60 -44 l60 44 z"/>
<rect class="a-paper a-o" x="160" y="70" width="100" height="90"/>
<rect class="a-board a-o" x="198" y="112" width="24" height="48"/>
<rect class="a-sky a-o" x="170" y="84" width="22" height="20"/><rect class="a-sky a-o" x="228" y="84" width="22" height="20"/>
<rect class="a-soft" x="10" y="160" width="300" height="10" rx="5"/>
${cat(22, 52, 0.95)}
<path class="a-trunk" d="M120 70 L104 150"/><path class="a-hat a-o" d="M96 146 l20 4 l-6 22 l-24 -6 z"/>
${[['ตนเอง', 'a-u1', 20], ['ครอบครัว', 'a-u2', 120], ['ส่วนรวม', 'a-u4', 230]].map(([t, c, x]) => `<rect class="${c}" x="${x}" y="176" width="80" height="22" rx="11"/>${label(x + 40, 192, t, 'a-tw a-mid a-small')}`).join('')}`)
    },
    workflow3: {
      alt: 'กระบวนการทำงาน 3 ขั้น วางแผน ทำตามแผน ประเมินผล และลูกศรย้อนกลับไปปรับปรุงครั้งต่อไป',
      svg: svg(320, 200, `
<rect class="a-paper a-o" x="34" y="20" width="42" height="56" rx="4"/><rect class="a-u1 a-o" x="45" y="14" width="20" height="10" rx="3"/>
<path class="a-line a-thin" d="M42 38 h26 M42 48 h26 M42 58 h18"/>
<path class="a-trunk" d="M172 18 L160 60"/><path class="a-hat a-o" d="M148 56 l24 5 l-5 18 l-26 -6 z"/>
<circle class="a-ok" cx="265" cy="46" r="26"/><path class="a-checkw a-thinck" d="M253 46 l8 8 l14 -16"/>
${[['วางแผน', 'a-u1', 55], ['ทำตามแผน', 'a-u2', 160], ['ประเมินผล', 'a-u4', 265]].map(([t, c, x], i) => `<rect class="${c}" x="${x - 44}" y="94" width="88" height="40" rx="20"/>${label(x, 119, `${i + 1}. ${t}`, 'a-tw a-mid a-small')}`).join('')}
<path class="a-arrow" d="M100 114 h12"/><path class="a-arrow" d="M205 114 h12"/>
<path class="a-dash" style="marker-end:url(#ah)" d="M265 138 Q160 196 60 140"/>
${label(160, 196, 'ปรับปรุงงานครั้งต่อไป', 'a-mid a-small')}`)
    },
    schoolbag: {
      alt: 'กระเป๋านักเรียนที่จัดหนังสือตามตารางสอน ตารางสอนที่ทำเครื่องหมายถูก และรองเท้านักเรียนที่ขัดสะอาด',
      svg: svg(320, 200, `
<rect class="a-u3 a-o" x="46" y="34" width="16" height="30" rx="2"/><rect class="a-u4 a-o" x="66" y="28" width="18" height="36" rx="2"/><rect class="a-u2 a-o" x="88" y="38" width="14" height="26" rx="2"/>
<path class="a-line" d="M60 52 q20 -40 40 0"/>
<rect class="a-u1 a-o" x="30" y="50" width="100" height="120" rx="20"/>
<path class="a-u5 a-o" d="M30 74 q0 -24 24 -24 h52 q24 0 24 24 v10 h-100 z"/>
<rect class="a-u5 a-o" x="50" y="118" width="60" height="38" rx="8"/><path class="a-line a-thin" d="M58 128 h44"/>
<rect class="a-paper a-o" x="154" y="22" width="150" height="96" rx="6"/>
${label(229, 42, 'ตารางสอน', 'a-mid a-bold a-small')}
${[0, 1, 2].map((r) => `<path class="a-line a-thin" d="M162 ${58 + r * 20} h134"/>`).join('')}
${[0, 1, 2, 3].map((r) => `<circle class="a-ok" cx="${176 + r * 34}" cy="${68 + (r % 3) * 20}" r="7"/><path class="a-checkw a-thinck" d="M${172 + r * 34} ${68 + (r % 3) * 20} l3 3 l6 -6"/>`).join('')}
<path class="a-pan a-o" d="M170 176 v-26 q0 -6 6 -6 h22 q10 18 34 20 h22 q12 0 12 12 z"/>
<rect class="a-paper a-o" x="168" y="176" width="100" height="8" rx="3"/>
<ellipse class="a-shine" cx="236" cy="162" rx="8" ry="2.5" opacity=".8"/>
${label(80, 194, 'กระเป๋า', 'a-mid a-small')}${label(218, 198, 'รองเท้า', 'a-mid a-small')}`)
    },
    seasons: {
      alt: 'การแต่งกายตาม 3 ฤดู ฤดูร้อนใส่เสื้อบางกับหมวก ฤดูฝนใช้ร่ม ฤดูหนาวใส่เสื้อกันหนาวและผ้าพันคอ',
      svg: svg(340, 200, `
${['ฤดูร้อน', 'ฤดูฝน', 'ฤดูหนาว'].map((t, i) => `<rect class="a-soft" x="${6 + i * 112}" y="6" width="104" height="188" rx="14"/>${label(58 + i * 112, 184, t, 'a-mid a-bold')}`).join('')}
<circle class="a-hat a-o" cx="34" cy="34" r="14"/>
<g transform="translate(26 70) scale(.7)"><path class="a-sky a-o" d="M10 14 l20 -14 q20 14 40 0 l20 14 l-10 20 l-10 -6 v74 h-40 v-74 l-10 6 z"/></g>
<path class="a-hat a-o" d="M60 46 q14 -16 28 0 h8 q-22 10 -44 0 z"/>
<ellipse class="a-paper a-o" cx="170" cy="32" rx="36" ry="14"/>${drops(150, 54)}${drops(178, 50)}
<g transform="translate(130 104)"><path class="a-u5 a-o" d="M0 30 a40 30 0 0 1 80 0 z"/><path class="a-line" d="M40 30 v34 q0 8 -8 8"/></g>
<path class="a-line a-thin" d="M244 24 h50 q10 0 10 -8 M250 40 h56 q10 0 10 8"/>
<g transform="translate(250 64) scale(.7)"><path class="a-u3 a-o" d="M20 4 q20 14 40 0 l30 12 l6 62 l-14 2 l-10 -40 v58 h-64 v-58 l-10 40 l-14 -2 l6 -62 z"/><path class="a-u5 a-o" d="M14 2 q26 20 52 0 l4 10 q-30 22 -60 0 z"/><rect class="a-u5 a-o" x="50" y="14" width="12" height="40" rx="3"/></g>`)
    },
    stitch: {
      alt: 'การเนาผ้า เข็มและด้ายเย็บขึ้นลงเป็นเส้นตรงระยะเท่ากัน และหมอนปักเข็ม',
      svg: svg(320, 200, `
<rect class="a-u4 a-o" x="20" y="54" width="210" height="96" rx="6"/>
<path class="a-line a-thin" d="M20 102 h210" opacity=".35"/>
<path class="a-line" style="stroke:#FFFFFF;stroke-dasharray:14 10" d="M36 102 H196"/>
<path class="a-metal a-o" d="M198 106 L264 54 l4 4 L202 110 z"/><circle class="a-paper" cx="261" cy="58" r="2"/>
<path class="a-line" style="stroke:var(--art-gold)" d="M262 56 q26 -40 48 -16"/>
<path class="a-line a-thin" d="M36 160 v8 h24 v-8"/>${label(48, 186, 'ระยะเท่า ๆ กัน', 'a-small')}
<ellipse class="a-bad a-o" cx="276" cy="156" rx="30" ry="18"/>
<path class="a-line a-thin" d="M266 146 l-6 -18 M284 144 l4 -20"/><circle class="a-hat a-o" cx="260" cy="126" r="4"/><circle class="a-hat a-o" cx="288" cy="122" r="4"/>
${label(276, 194, 'หมอนปักเข็ม', 'a-mid a-small')}`)
    },
    vegtypes: {
      alt: 'ผักสวนครัว 5 ประเภทตามส่วนที่กิน ใบและลำต้น ผลและฝัก หัวและราก ดอก กาบและก้าน',
      svg: svg(340, 210, `
${leafy(36, 150, 70)}
<g transform="translate(86 56)"><path class="a-bad a-o" d="M10 10 q30 10 26 70 q-2 10 -8 0 q0 -50 -24 -60 z"/><path class="a-leaf a-o" d="M4 4 l14 2 l-6 12 z"/></g>
<g transform="translate(142 70)"><path class="a-paper a-o" d="M30 0 q4 20 22 36 q14 16 0 34 h-44 q-14 -18 0 -34 q18 -16 22 -36 z"/><path class="a-line a-thin" d="M30 10 q-10 30 -6 58 M30 10 q10 30 6 58 M18 72 l-4 10 M26 72 l-1 12 M34 72 l1 12 M42 72 l4 10"/></g>
<path class="a-stem" d="M240 150 v-62"/><ellipse class="a-leaf a-o" cx="252" cy="124" rx="12" ry="5" transform="rotate(-30 252 124)"/>
${[0, 1, 2, 3, 4].map((k) => { const a = k * 72 * Math.PI / 180; return `<ellipse class="a-paper a-o" cx="${(240 + 15 * Math.cos(a)).toFixed(1)}" cy="${(78 + 15 * Math.sin(a)).toFixed(1)}" rx="11" ry="7" transform="rotate(${k * 72} ${(240 + 15 * Math.cos(a)).toFixed(1)} ${(78 + 15 * Math.sin(a)).toFixed(1)})"/>`; }).join('')}<circle class="a-hat a-o" cx="240" cy="78" r="7"/>
<rect class="a-leaf a-o" x="296" y="46" width="6" height="88" rx="3"/><rect class="a-leaf a-o" x="305" y="36" width="6" height="98" rx="3"/><rect class="a-leaf a-o" x="314" y="52" width="6" height="82" rx="3"/>
<rect class="a-paper a-o" x="294" y="126" width="28" height="24" rx="9"/><path class="a-line a-thin" d="M300 152 l-3 8 M308 152 v9 M316 152 l3 8"/>
${[['ใบ ลำต้น', 36], ['ผล ฝัก', 104], ['หัว ราก', 172], ['ดอก', 240], ['กาบ ก้าน', 308]].map(([t, x]) => `<rect class="a-soft" x="${x - 31}" y="176" width="62" height="26" rx="13"/>${label(x, 194, t, 'a-mid a-small')}`).join('')}`)
    },
    handtools: {
      alt: 'เครื่องมือช่าง 6 หน้าที่ ค้อนใช้ตอก ไขควงใช้ขันเกลียว คีมใช้จับ เลื่อยใช้ตัด ตลับเมตรใช้วัด และที่เจาะกระดาษใช้เจาะ',
      svg: svg(340, 224, `
${[
    ['ตอก', 'ค้อน', '<rect class="a-board a-o" x="50" y="22" width="12" height="50" rx="4"/><rect class="a-metal a-o" x="28" y="10" width="56" height="16" rx="3"/><path class="a-metal a-o" d="M84 12 q12 0 14 -8 l4 4 q-4 14 -18 16 z"/>'],
    ['ขันเกลียว', 'ไขควง', '<rect class="a-u5 a-o" x="48" y="6" width="18" height="34" rx="7"/><rect class="a-metal a-o" x="54" y="40" width="6" height="30"/><path class="a-metal a-o" d="M54 70 h6 l-1 6 h-4 z"/>'],
    ['จับ', 'คีม', '<path class="a-metal a-o" d="M55 40 l-6 -32 l5 -2 l5 34 z"/><path class="a-metal a-o" d="M59 40 l6 -32 l-5 -2 l-5 34 z"/><path class="a-u1 a-o" d="M55 42 q-12 14 -14 34 l7 1 q4 -18 11 -32 z"/><path class="a-u1 a-o" d="M59 42 q12 14 14 34 l-7 1 q-4 -18 -11 -32 z"/><circle class="a-ink" cx="57" cy="41" r="3"/>'],
    ['ตัด', 'เลื่อย', '<path class="a-metal a-o" d="M14 26 L80 26 L80 44 L14 60 z"/><path class="a-line a-thin" d="M18 58 l5 3 l4 -4 l5 3 l4 -4 l5 3 l4 -4 l5 3 l4 -4 l5 3 l4 -4 l5 3"/><path class="a-board a-o" d="M80 20 h20 q6 0 6 6 v26 q0 6 -6 6 h-20 z"/><rect class="a-paper" x="87" y="30" width="12" height="18" rx="4"/>'],
    ['วัด', 'ตลับเมตร', '<rect class="a-hat a-o" x="20" y="16" width="48" height="48" rx="10"/><circle class="a-ink" cx="44" cy="40" r="5"/><rect class="a-hat a-o" x="66" y="54" width="34" height="8"/><path class="a-line a-thin" d="M74 54 v4 M82 54 v4 M90 54 v4"/>'],
    ['เจาะ', 'ที่เจาะกระดาษ', '<rect class="a-u4 a-o" x="20" y="54" width="76" height="14" rx="3"/><path class="a-u4 a-o" d="M28 54 q0 -30 30 -36 h30 v12 h-24 q-16 4 -16 24 z"/><circle class="a-paper a-o" cx="44" cy="62" r="3"/><circle class="a-paper a-o" cx="70" cy="62" r="3"/>']
  ].map(([fn, name, icon], i) => `<g transform="translate(${(i % 3) * 113} ${Math.floor(i / 3) * 112})"><rect class="a-soft" x="4" y="2" width="105" height="106" rx="12"/>${icon}${label(56, 90, fn, 'a-mid a-bold')}${label(56, 104, name, 'a-mid a-small')}</g>`).join('')}`)
    },
    toyfix: {
      alt: 'ซ่อมของเล่นและของใช้ ขันสกรูรถของเล่นด้วยไขควง เนาตะเข็บตุ๊กตาหมี และติดเทปปกหนังสือ',
      svg: svg(320, 200, `
<g transform="translate(6 46)"><path class="a-u1 a-o" d="M4 92 h110 v-24 l-22 -26 h-48 l-20 26 h-20 z"/><rect class="a-sky a-o" x="50" y="48" width="34" height="18" rx="3"/><circle class="a-ink" cx="32" cy="94" r="13"/><circle class="a-metal" cx="32" cy="94" r="5"/><circle class="a-ink" cx="90" cy="94" r="13"/><circle class="a-metal" cx="90" cy="94" r="5"/><circle class="a-paper a-o" cx="72" cy="80" r="4"/></g>
<g transform="translate(108 73) rotate(35)"><rect class="a-u5 a-o" x="0" y="0" width="14" height="28" rx="6"/><rect class="a-metal a-o" x="5" y="28" width="4" height="32"/></g>
<g transform="translate(150 38)"><circle class="a-board a-o" cx="22" cy="14" r="10"/><circle class="a-board a-o" cx="62" cy="14" r="10"/><ellipse class="a-board a-o" cx="42" cy="100" rx="28" ry="34"/><ellipse class="a-board a-o" cx="12" cy="88" rx="10" ry="18" transform="rotate(20 12 88)"/><ellipse class="a-board a-o" cx="72" cy="88" rx="10" ry="18" transform="rotate(-20 72 88)"/><circle class="a-board a-o" cx="42" cy="34" r="22"/><circle class="a-ink" cx="34" cy="30" r="2.5"/><circle class="a-ink" cx="50" cy="30" r="2.5"/><ellipse class="a-ink" cx="42" cy="40" rx="3.5" ry="2.5"/><path class="a-line" style="stroke:#FFFFFF;stroke-dasharray:5 4" d="M30 78 q12 22 0 46"/></g>
<g transform="translate(250 54)"><rect class="a-u3 a-o" x="0" y="0" width="60" height="92" rx="4"/><rect class="a-paper a-o" x="8" y="6" width="48" height="80" rx="2"/><path class="a-line a-thin" d="M16 24 h32 M16 36 h32 M16 48 h24"/><rect class="a-sky a-o" x="-8" y="30" width="22" height="40" rx="2" opacity=".85"/></g>
${label(66, 192, 'ขันสกรู', 'a-mid a-small')}${label(192, 192, 'เนาตะเข็บ', 'a-mid a-small')}${label(280, 192, 'ติดเทป', 'a-mid a-small')}`)
    },
    localcraft: {
      alt: 'กระถางดินเผาพันเชือกปอที่ขอบและติดเมล็ดพืชเป็นลาย กับที่คั่นหนังสือดอกไม้แห้งผูกพู่เชือก',
      svg: svg(320, 200, `
${pot(40, 92, 110, 74)}${leafy(95, 84, 42)}
<path class="a-line a-thin" style="stroke:var(--art-trunk)" d="M36 86 H154 M36 90 H154"/>
${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle class="${['a-bad', 'a-leaf', 'a-hat', 'a-ink'][k % 4]} a-o" cx="${58 + k * 10}" cy="${126 + (k % 2 ? 8 : 0)}" r="4"/>`).join('')}
<rect class="a-paper a-o" x="210" y="24" width="52" height="146" rx="4"/>
<circle class="a-soft a-o" cx="236" cy="38" r="4"/><path class="a-line" style="stroke:var(--art-trunk)" d="M236 34 q-10 -18 -2 -30 M236 34 q8 -16 16 -24"/>
${[0, 1, 2, 3, 4].map((k) => { const a = (k * 72 - 90) * Math.PI / 180; return `<ellipse class="a-pink a-o" cx="${(236 + 12 * Math.cos(a)).toFixed(1)}" cy="${(92 + 12 * Math.sin(a)).toFixed(1)}" rx="9" ry="6" transform="rotate(${k * 72 - 90} ${(236 + 12 * Math.cos(a)).toFixed(1)} ${(92 + 12 * Math.sin(a)).toFixed(1)})"/>`; }).join('')}<circle class="a-hat a-o" cx="236" cy="92" r="6"/>
<path class="a-stem" d="M236 106 v44"/><ellipse class="a-leaf a-o" cx="246" cy="134" rx="10" ry="4" transform="rotate(-30 246 134)"/>
${label(95, 192, 'กระถางตกแต่ง', 'a-mid a-small')}${label(236, 192, 'ที่คั่นหนังสือ', 'a-mid a-small')}`)
    },
    habits: {
      alt: 'ลูกศรวน 3 ทิศ Reduce Reuse Recycle และถังขยะ 4 สี เขียว เหลือง น้ำเงิน แดง',
      svg: svg(320, 210, `
<path class="a-arrow a-thickarrow" d="M110 40 L160 30 L176 74"/>
<path class="a-arrow a-thickarrow" d="M190 100 L170 150 L120 140"/>
<path class="a-arrow a-thickarrow" d="M96 120 L70 76 L100 46"/>
${label(150, 22, 'Reduce', 'a-mid a-bold')}${label(212, 150, 'Reuse', 'a-mid a-bold')}${label(56, 132, 'Recycle', 'a-mid a-bold')}
<circle class="a-leaf" cx="135" cy="92" r="16"/><path class="a-checkw a-thinck" d="M128 92 l5 5 l10 -11"/>
${[['#2E9E5B', 'เปียก'], ['#F2B705', 'รีไซเคิล'], ['#2F6BD6', 'ทั่วไป'], ['#E5484D', 'อันตราย']].map(([c, t], i) => `<g transform="translate(${226 + (i % 2) * 46} ${20 + Math.floor(i / 2) * 82})"><rect x="4" y="0" width="34" height="8" rx="3" style="fill:${c}"/><path d="M2 10 h38 l-4 46 h-30 z" style="fill:${c}" class="a-o"/>${label(21, 74, t, 'a-mid a-small')}</g>`).join('')}`)
    },
    clothes: {
      alt: 'เสื้อยืดแขวนบนไม้แขวนเสื้อ กองเสื้อที่พับเรียบร้อย และถุงเท้าพับเป็นคู่',
      svg: svg(320, 200, `
<path class="a-line" d="M20 20 H300"/>
<path class="a-line" d="M90 20 v12 q0 8 -8 8 M82 40 l-46 26 h108 z"/>
<path class="a-u1 a-o" d="M50 66 l20 -14 q20 14 40 0 l20 14 l-10 20 l-10 -6 v74 h-40 v-74 l-10 6 z"/>
${[0, 1, 2].map((i) => `<rect class="${['a-u3', 'a-u4', 'a-u5'][i]} a-o" x="168" y="${142 - i * 24}" width="96" height="22" rx="4"/><path class="a-line a-thin" d="M188 ${150 - i * 24} h56"/>`).join('')}
<path class="a-paper a-o" d="M272 150 v-30 h18 v24 l12 6 v10 h-30 z"/><path class="a-u2" d="M272 122 h18 v6 h-18 z"/>
<path class="a-hat a-o" d="M230 40 l8 -10 l8 10 v10 h-16 z"/>`)
    },
    tidy: {
      alt: 'ชั้นวางหนังสือที่จัดเป็นระเบียบ กล่องติดป้าย ไม้กวาดและที่ตักผง',
      svg: svg(320, 200, `
<rect class="a-board a-o" x="20" y="20" width="160" height="160" rx="6"/>
${[70, 120].map((y) => `<rect class="a-ink" x="20" y="${y}" width="160" height="6"/>`).join('')}
${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="a-u${(i % 5) + 1} a-o" x="${30 + i * 14}" y="${30 + (i % 2) * 6}" width="12" height="${40 - (i % 2) * 6}" rx="2"/>`).join('')}
<rect class="a-paper a-o" x="30" y="84" width="64" height="36" rx="4"/>${label(62, 107, 'ดินสอ', 'a-mid a-small')}
<rect class="a-paper a-o" x="104" y="84" width="64" height="36" rx="4"/>${label(136, 107, 'สีไม้', 'a-mid a-small')}
<rect class="a-paper a-o" x="30" y="134" width="138" height="38" rx="4"/>${label(99, 158, 'ของเล่น', 'a-mid a-small')}
<path class="a-trunk" d="M240 30 L230 140"/><path class="a-hat a-o" d="M216 136 l30 4 l-4 40 l-34 -4 z"/>
<path class="a-u1 a-o" d="M262 150 h40 l-6 30 h-34 z"/><rect class="a-ink" x="276" y="128" width="6" height="24"/>`)
    },
    garden: {
      alt: 'กระถางผักสวนครัว บัวรดน้ำกำลังรดน้ำ และดวงอาทิตย์',
      svg: svg(320, 200, `
<circle class="a-hat" cx="270" cy="40" r="22"/>
${pot(60, 120, 90, 60)}${leafy(90, 116, 54)}${leafy(122, 116, 40)}
${can(170, 60, 1)}${drops(250, 84)}
<rect class="a-soft" x="10" y="182" width="300" height="8" rx="4"/>`)
    },
    farmtools: {
      alt: 'เครื่องมือเกษตรขนาดเล็ก ช้อนปลูก ส้อมพรวน บัวรดน้ำ และถุงมือ พร้อมป้ายชื่อ',
      svg: svg(340, 200, `
<g transform="translate(20 20)"><rect class="a-board a-o" x="16" y="0" width="14" height="56" rx="6"/><path class="a-metal a-o" d="M10 56 h26 v30 q-13 26 -26 0 z"/></g>
<g transform="translate(100 20)"><rect class="a-board a-o" x="16" y="0" width="14" height="56" rx="6"/><path class="a-metal a-o" d="M6 56 h34 v8 h-6 v30 h-4 v-30 h-4 v30 h-4 v-30 h-4 v30 h-4 v-30 h-4 z"/></g>
${can(180, 34, 1)}
<g transform="translate(286 30)"><path class="a-hat a-o" d="M4 60 v-34 q0 -6 6 -6 v-14 q0 -6 6 -6 q6 0 6 6 v-6 q0 -6 6 -6 q6 0 6 6 v6 q0 -6 6 -6 q6 0 6 6 v40 q0 14 -14 14 h-20 q-14 0 -14 -6 z"/></g>
${[['ช้อนปลูก', 43], ['ส้อมพรวน', 123], ['บัวรดน้ำ', 222], ['ถุงมือ', 310]].map(([t, x]) => `<rect class="a-soft" x="${x - 38}" y="150" width="76" height="26" rx="13"/>${label(x, 168, t, 'a-mid a-small')}`).join('')}`)
    },
    planting: {
      alt: 'ปลูกผักบุ้งในขวดพลาสติก 3 ระยะ วันที่ 1 หยอดเมล็ด วันที่ 7 ต้นงอก และวันที่ 25 พร้อมเก็บ',
      svg: svg(320, 190, `
${[0, 1, 2].map((i) => `<g transform="translate(${18 + i * 102} 0)">
<path class="a-sky a-o" d="M6 90 h80 v70 q0 10 -10 10 h-60 q-10 0 -10 -10 z" opacity=".7"/>
<rect class="a-soil" x="10" y="110" width="72" height="56" rx="4"/>
${i === 0 ? '<ellipse class="a-seed a-o" cx="30" cy="108" rx="5" ry="3"/><ellipse class="a-seed a-o" cx="60" cy="108" rx="5" ry="3"/>' : ''}
${i === 1 ? leafy(34, 110, 18) + leafy(60, 110, 14) : ''}
${i === 2 ? leafy(26, 110, 52) + leafy(46, 110, 60) + leafy(66, 110, 48) : ''}
${label(46, 186, ['วันที่ 1', 'วันที่ 7', 'วันที่ 25'][i], 'a-mid a-bold')}</g>`).join('')}
<path class="a-arrow" d="M106 140 h12"/><path class="a-arrow" d="M208 140 h12"/>`)
    },
    plantcare: {
      alt: 'ต้นผักในกระถางข้างไม้บรรทัดวัดความสูง และแผนภูมิแท่งบันทึกความสูงที่เพิ่มขึ้น',
      svg: svg(320, 200, `
${pot(30, 140, 70, 46)}${leafy(65, 136, 80)}
<rect class="a-hat a-o" x="116" y="40" width="20" height="140" rx="2"/>
${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path class="a-line a-thin" d="M116 ${170 - i * 20} h${i % 2 ? 6 : 10}"/>`).join('')}
<path class="a-axis" d="M176 40 V170 H306"/>
${[10, 32, 64, 104].map((h, i) => `<rect class="a-leaf" x="${188 + i * 28}" y="${170 - h}" width="18" height="${h}" rx="2"/>`).join('')}
${label(241, 190, 'ความสูงทุก 3 วัน', 'a-mid a-small')}`)
    },
    crafttools: {
      alt: 'เครื่องมืองานประดิษฐ์ กรรไกรปลายมน กาว ไม้บรรทัด ดินสอ และเทปกาว',
      svg: svg(340, 200, `
<g transform="translate(20 30)"><circle class="a-u5 a-o" cx="14" cy="100" r="13"/><circle class="a-u5 a-o" cx="48" cy="100" r="13"/><path class="a-metal a-o" d="M20 88 L44 10 q4 -4 6 2 L28 90 z"/><path class="a-metal a-o" d="M42 88 L18 10 q-4 -4 -6 2 L34 90 z"/></g>
<g transform="translate(96 40)"><rect class="a-paper a-o" x="0" y="20" width="40" height="80" rx="8"/><path class="a-u3 a-o" d="M8 20 v-12 h24 v12 z"/><path class="a-hat a-o" d="M14 8 l6 -8 l6 8 z"/>${label(20, 66, 'กาว', 'a-mid a-small')}</g>
<g transform="translate(150 60)"><rect class="a-hat a-o" x="0" y="0" width="140" height="26" rx="3"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => `<path class="a-line a-thin" d="M${8 + i * 9.5} 0 v${i % 2 ? 6 : 10}"/>`).join('')}</g>
<g transform="translate(150 110) rotate(-8)"><rect class="a-u2 a-o" x="0" y="0" width="110" height="16" rx="3"/><path class="a-skin a-o" d="M110 0 l20 8 l-20 8 z"/><path class="a-ink" d="M124 6 l6 2 l-6 2 z"/></g>
<g transform="translate(284 130)"><circle class="a-sky a-o" cx="20" cy="20" r="22"/><circle class="a-paper a-o" cx="20" cy="20" r="9"/></g>`)
    },
    pinwheel: {
      alt: 'กระดาษสี่เหลี่ยมพับแนวทแยงและตัดไม่ถึงกลาง แล้วพับมุมเป็นกังหันลมติดกับหลอด',
      svg: svg(320, 200, `
<rect class="a-paper a-o" x="20" y="40" width="110" height="110"/>
<path class="a-line a-thin" d="M20 40 L130 150 M130 40 L20 150"/>
<path class="a-cutline" d="M20 40 L62 82 M130 40 L88 82 M20 150 L62 108 M130 150 L88 108"/>
<circle class="a-ink" cx="75" cy="95" r="3"/>
${label(75, 176, 'ตัดตามเส้นแดง', 'a-mid a-small')}
<path class="a-arrow" d="M146 95 h30"/>
<g transform="translate(240 80)">
<path class="a-u5 a-o" d="M0 0 L0 -56 Q30 -40 0 0 z"/>
<path class="a-u1 a-o" d="M0 0 L56 0 Q40 30 0 0 z"/>
<path class="a-u4 a-o" d="M0 0 L0 56 Q-30 40 0 0 z"/>
<path class="a-hat a-o" d="M0 0 L-56 0 Q-40 -30 0 0 z"/>
<circle class="a-ink" cx="0" cy="0" r="5"/>
<rect class="a-u2 a-o" x="-4" y="6" width="8" height="110" rx="3"/>
</g>`)
    }
  });

  window.ART = ART;
  window.artFigure = function (name, caption, cls) {
    const a = ART[name];
    if (!a) return '';
    return `<figure class="art${cls ? ' ' + cls : ''}"><div class="art-img" role="img" aria-label="${a.alt}">${a.svg}</div>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  };
})();
