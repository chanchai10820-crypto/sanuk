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

  window.ART = ART;
  window.artFigure = function (name, caption, cls) {
    const a = ART[name];
    if (!a) return '';
    return `<figure class="art${cls ? ' ' + cls : ''}"><div class="art-img" role="img" aria-label="${a.alt}">${a.svg}</div>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  };
})();
