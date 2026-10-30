/*
 * หมู่บ้านน้องสนุก 3 มิติ (#world)
 * บ้านแต่ละหลัง = 1 หน่วยการเรียนรู้ของวิชาที่เลือก ลานกลางหมู่บ้านคือลานเกม
 * เดินโดยแตะพื้นหรือบ้าน ใช้ปุ่มลูกศรบนแป้นพิมพ์ หรือกดปุ่มชื่อสถานที่ด้านล่างภาพ
 * api = { course, unitInfo(u), games(uid), esc }
 */
(function () {
  'use strict';

  const W = window.World3D;
  const UNIT_COLOR = { u1: '#2F6BD6', u2: '#A85A06', u3: '#6E44D1', u4: '#277A33', u5: '#C23A63', c1: '#2F6BD6', c2: '#C23A63', c3: '#277A33', c4: '#A85A06', c5: '#6E44D1' };
  const CENTER = { x: 0, z: 2 };
  const R = 10;
  const ANG = [-68, -34, 0, 34, 68].map((a) => (a * Math.PI) / 180);
  const LIMIT = 17;

  function mountVillage(root, api) {
    const host = root.querySelector('#w3d');
    const panel = root.querySelector('#w3d-panel');
    const list = root.querySelector('#w3d-list');
    const C = api.course();
    const esc = api.esc;
    if (!W || !W.supported()) {
      host.innerHTML = W ? W.fallbackHTML('#home', 'หน้าแรกแบบ 2 มิติ') : '';
      return () => {};
    }
    const T = W.T;
    const st = W.stage(host, { sky: '#CDEBFF', fog: [28, 60], aspect: 0.5, minH: 300, maxH: 600 });
    const { scene, camera } = st;

    /* ───── พื้นและทาง ───── */
    const ground = new T.Mesh(new T.CircleGeometry(40, 32), W.mat('#86C76C'));
    ground.rotation.x = -Math.PI / 2;
    ground.userData.ground = true;
    scene.add(ground);
    const plaza = new T.Mesh(new T.CircleGeometry(3.4, 24), W.mat('#E2CC9C'));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(CENTER.x, 0.02, CENTER.z);
    plaza.userData.ground = true;
    scene.add(plaza);

    /* ───── สถานที่: บ้านของแต่ละหน่วย และลานเกม ───── */
    const places = [];
    C.units.forEach((u, i) => {
      const a = ANG[i % ANG.length];
      const x = CENTER.x + R * Math.sin(a);
      const z = CENTER.z - R * Math.cos(a);
      const info = api.unitInfo(u);
      const h = W.house({ roof: UNIT_COLOR[u.id] || '#2F6BD6', wall: '#FBF3E4' });
      h.position.set(x, 0, z);
      h.rotation.y = Math.atan2(CENTER.x - x, CENTER.z - z);
      h.userData.pick = { place: u.id };
      scene.add(h);
      // ทางเดินจากขอบลานกลางถึงประตู
      // จุดยืนหน้าประตู อยู่นอกรัศมีกันชนของบ้าน (2.4) เล็กน้อย
      const door = new T.Vector3(x + (CENTER.x - x) * 0.3, 0, z + (CENTER.z - z) * 0.3);
      const dx = door.x - CENTER.x; const dz = door.z - CENTER.z;
      const dl = Math.hypot(dx, dz);
      const len = dl - 3.2;
      const path = new T.Mesh(new T.BoxGeometry(1.4, 0.02, len), W.mat('#E2CC9C'));
      path.rotation.y = Math.atan2(dx, dz);
      path.position.set(CENTER.x + (dx / dl) * (3.2 + len / 2), 0.015, CENTER.z + (dz / dl) * (3.2 + len / 2));
      path.userData.ground = true;
      scene.add(path);
      const sign = W.label([`หน่วย ${i + 1}`, info.badge ? '🏅 ได้เหรียญตรา' : `เรียนไป ${info.progress}%`], { size: 0.8, border: UNIT_COLOR[u.id] });
      sign.position.set(x, 4.9, z);
      scene.add(sign);
      // เหรียญตราลอยเหนือหลังคา (จางถ้ายังไม่ได้)
      const badge = W.label(info.mission ? info.mission.badge.e : '⭐', { px: 64, size: 1, bg: 'rgba(255,255,255,0)' });
      badge.material.opacity = info.badge ? 1 : 0.3;
      badge.position.set(x, 3.7, z);
      scene.add(badge);
      if (info.badge) {
        const f = W.flag('#F2B705');
        f.position.set(x + 1.2, 2, z);
        scene.add(f);
      }
      places.push({ id: u.id, u, i, info, door, house: h, badge, r: 2.4, pos: new T.Vector3(x, 0, z) });
    });
    // ลานเกม: น้ำพุกลางลาน และป้าย
    const fountain = W.group(W.at(W.cyl(1.1, 1.2, 0.45, '#C9D3E3', 14), 0, 0.22, 0), W.at(W.cyl(0.9, 0.9, 0.05, '#66B9F2', 14), 0, 0.46, 0), W.at(W.cyl(0.15, 0.2, 0.9, '#C9D3E3', 8), 0, 0.8, 0), W.at(W.sphere(0.32, '#66B9F2', 8), 0, 1.3, 0));
    fountain.position.set(CENTER.x, 0, CENTER.z - 0.4);
    fountain.userData.pick = { place: 'games' };
    scene.add(fountain);
    const gsign = W.label(['🎮 ลานเกม', 'เกม 2D และ 3D ทุกหน่วย'], { size: 0.55, border: '#F2B705' });
    gsign.position.set(CENTER.x, 2.4, CENTER.z - 0.4);
    scene.add(gsign);
    places.push({ id: 'games', door: new T.Vector3(CENTER.x, 0, CENTER.z + 1.4), r: 1.3, pos: new T.Vector3(CENTER.x, 0, CENTER.z - 0.4) });

    /* ───── ของตกแต่ง: ต้นไม้ ก้อนหิน เมฆ (ตำแหน่งคงที่) ───── */
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let k = 0; k < 34; k++) {
      const a = rnd() * Math.PI * 2;
      const d = 14 + rnd() * 16;
      const x = CENTER.x + Math.sin(a) * d;
      const z = CENTER.z - Math.cos(a) * d;
      const t = k % 5 === 0 ? W.rock(0.8 + rnd()) : W.tree(1.6 + rnd() * 1.6, ['#4CAF62', '#3E9B54', '#6CC072'][k % 3]);
      t.position.set(x, 0, z);
      scene.add(t);
    }
    const clouds = [];
    for (let k = 0; k < 5; k++) {
      const c = W.group(W.sphere(1.1, '#FFFFFF', 8), W.at(W.sphere(0.8, '#FFFFFF', 8), 1, -0.2, 0), W.at(W.sphere(0.8, '#FFFFFF', 8), -1, -0.2, 0.2));
      c.position.set(-24 + k * 12, 11 + (k % 2) * 2, -22 + (k % 3) * 4);
      scene.add(c);
      clouds.push(c);
    }

    /* ───── น้องสนุก ───── */
    const cat = W.cat(1);
    cat.position.set(CENTER.x, 0, CENTER.z + 2.2);
    cat.rotation.y = 0;
    scene.add(cat);
    const nameTag = W.label('น้องสนุก', { size: 0.4 });
    nameTag.position.set(0, 1.8, 0);
    cat.add(nameTag);
    let goal = null;       // { x, z, place }
    const keys = {};
    let active = null;
    const camOff = new T.Vector3(0, 6.2, 8.6);
    const look = new T.Vector3();
    camera.position.copy(cat.position).add(camOff);
    look.set(cat.position.x, 0.8, cat.position.z - 5.5);
    camera.lookAt(look);

    function collide(p) {
      for (const pl of places) {
        if (!pl.house) continue;
        const dx = p.x - pl.pos.x; const dz = p.z - pl.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < pl.r) { p.x = pl.pos.x + (dx / d) * pl.r; p.z = pl.pos.z + (dz / d) * pl.r; }
      }
      const fx = p.x - (CENTER.x); const fz = p.z - (CENTER.z - 0.4);
      const fd = Math.hypot(fx, fz);
      if (fd < 1.35 && fd > 0) { p.x = CENTER.x + (fx / fd) * 1.35; p.z = CENTER.z - 0.4 + (fz / fd) * 1.35; }
      const cd = Math.hypot(p.x - CENTER.x, p.z - CENTER.z);
      if (cd > LIMIT) { p.x = CENTER.x + ((p.x - CENTER.x) / cd) * LIMIT; p.z = CENTER.z + ((p.z - CENTER.z) / cd) * LIMIT; }
    }
    const obstacles = places.filter((p) => p.house).map((p) => ({ x: p.pos.x, z: p.pos.z, r: p.r })).concat({ x: CENTER.x, z: CENTER.z - 0.4, r: 1.35 });
    function walkTo(pl) { goal = { x: pl.door.x, z: pl.door.z, place: pl.id }; if (W.reduceMotion) { cat.position.set(goal.x, 0, goal.z); } }

    st.onFrame((dt, t) => {
      let moving = false;
      let vx = 0; let vz = 0;
      if (keys.ArrowUp || keys.w) vz -= 1;
      if (keys.ArrowDown || keys.s) vz += 1;
      if (keys.ArrowLeft || keys.a) vx -= 1;
      if (keys.ArrowRight || keys.d) vx += 1;
      if (vx || vz) goal = null;
      else if (goal) {
        const dx = goal.x - cat.position.x; const dz = goal.z - cat.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.15) goal = null; else { vx = dx / d; vz = dz / d; }
      }
      if (vx || vz) {
        // เดินอ้อมสิ่งกีดขวาง: ตัดความเร็วที่พุ่งเข้าหาบ้านหรือน้ำพุ เหลือแต่ทิศเลียบขอบ
        let n0 = Math.hypot(vx, vz); vx /= n0; vz /= n0;
        for (const ob of obstacles) {
          const ox = ob.x - cat.position.x; const oz = ob.z - cat.position.z;
          const od = Math.hypot(ox, oz);
          if (od > ob.r + 0.45 || od === 0) { ob.side = 0; continue; }
          const ux = ox / od; const uz = oz / od;
          const toward = vx * ux + vz * uz;
          if (toward <= 0) continue;
          let tx = vx - toward * ux; let tz = vz - toward * uz;
          // เลือกข้างที่จะอ้อมครั้งเดียว แล้วอ้อมข้างเดิมจนพ้นสิ่งกีดขวาง (ไม่ส่ายไปมา)
          if (!ob.side) ob.side = (tx * -uz + tz * ux) < 0 ? -1 : 1;
          if (Math.hypot(tx, tz) < 0.6) { tx = -uz * ob.side; tz = ux * ob.side; }
          vx = tx; vz = tz;
        }
        const n = Math.hypot(vx, vz) || 1;
        const sp = 5.5 * dt;
        cat.position.x += (vx / n) * sp;
        cat.position.z += (vz / n) * sp;
        collide(cat.position);
        const want = Math.atan2(vx, vz);
        let dr = want - cat.rotation.y;
        while (dr > Math.PI) dr -= Math.PI * 2;
        while (dr < -Math.PI) dr += Math.PI * 2;
        cat.rotation.y += dr * Math.min(1, 12 * dt);
        cat.children[0].position.y = 0.45 + Math.abs(Math.sin(t * 12)) * 0.08;
        moving = true;
      }
      // กล้องตามน้องสนุก
      // จอแคบ (มือถือแนวตั้ง) ถอยกล้องให้เห็นบ้านครบทุกหลัง
      const zoom = Math.min(1.8, Math.max(1, 1.9 / camera.aspect));
      const cx = cat.position.x + camOff.x * zoom; const cy = camOff.y * zoom; const cz = cat.position.z + camOff.z * zoom;
      const k = W.reduceMotion ? 1 : 4;
      camera.position.set(W.approach(camera.position.x, cx, k, dt), W.approach(camera.position.y, cy, k, dt), W.approach(camera.position.z, cz, k, dt));
      look.set(W.approach(look.x, cat.position.x, k, dt), 0.8, W.approach(look.z, cat.position.z - 5.5, k, dt));
      camera.lookAt(look);
      const camMoving = Math.abs(camera.position.x - cx) + Math.abs(camera.position.z - cz) > 0.01;
      // เหรียญตราที่ได้แล้วหมุนช้า ๆ เมฆเคลื่อน
      if (!W.reduceMotion) {
        places.forEach((pl) => { if (pl.info && pl.info.badge) pl.badge.position.y = 3.7 + Math.sin(t * 2 + pl.i) * 0.15; });
        clouds.forEach((c, i) => { c.position.x += dt * (0.25 + i * 0.05); if (c.position.x > 30) c.position.x = -30; });
      }
      // ตำแหน่งน้องสนุก (ใช้ตรวจสอบในการทดสอบอัตโนมัติ)
      if (moving) host.dataset.cat = `${cat.position.x.toFixed(1)},${cat.position.z.toFixed(1)}`;
      // อยู่หน้าประตูสถานที่ไหน
      let near = null;
      for (const pl of places) if (Math.hypot(cat.position.x - pl.door.x, cat.position.z - pl.door.z) < 2.2) near = pl;
      if ((near && near.id) !== (active && active.id)) { active = near; showPanel(); }
      return moving || camMoving || !W.reduceMotion;
    });

    /* ───── แผงข้อมูลสถานที่ ───── */
    function showPanel() {
      if (!active) {
        panel.innerHTML = `<p class="eyebrow">หมู่บ้านน้องสนุก · ${esc(C.short)}</p><h2>เดินไปที่บ้านของแต่ละหน่วย</h2>
<p class="muted">แตะพื้นหรือบ้านเพื่อพาน้องสนุกเดินไป ใช้ปุ่มลูกศรบนแป้นพิมพ์ หรือกดชื่อสถานที่ด้านล่าง เมื่อถึงหน้าประตูจะเข้าเรียนได้</p>`;
        return;
      }
      if (active.id === 'games') {
        const gs = C.units.flatMap((u) => api.games(u.id));
        panel.innerHTML = `<p class="eyebrow">ลานกลางหมู่บ้าน</p><h2>🎮 ลานเกม</h2>
<div class="w3d-games">${gs.filter((g) => g.is3d).map((g) => `<a class="chip" href="#game-${g.id}">${g.emoji} ${esc(g.title)}</a>`).join('')}</div>
<div class="row"><a class="btn primary" href="#games">ไปลานเกมทั้งหมด</a></div>`;
        return;
      }
      const { u, info, i } = active;
      const gs = api.games(u.id);
      panel.innerHTML = `<p class="eyebrow">บ้านหลังที่ ${i + 1} · หน่วยที่ ${i + 1}</p>
<div class="row" style="justify-content:space-between;align-items:flex-start"><h2>${esc(u.title)}</h2>${info.badgeHTML}</div>
${info.mission ? `<p>🎯 ${esc(info.mission.goal)}</p>` : ''}
<div class="chips">${info.chips}</div>
<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${info.progress}"><span style="width:${info.progress}%"></span></div>
<div class="row"><a class="btn primary" href="#${u.id}">เข้าบ้าน: เรียนหน่วยที่ ${i + 1}</a>${gs.map((g) => `<a class="btn ghost" href="#game-${g.id}">${g.emoji} ${esc(g.title)}${g.is3d ? ' <span class="chip">3D</span>' : ''}</a>`).join('')}</div>`;
    }
    showPanel();
    list.innerHTML = places.map((pl) => `<button type="button" class="chip w3d-go" data-w="go" data-id="${pl.id}">${pl.id === 'games' ? '🎮 ลานเกม' : `🏠 ${pl.i + 1}. ${esc(pl.u.title)}`}</button>`).join('');

    /* ───── การควบคุม ───── */
    let downAt = null;
    const onDown = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!downAt || Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 8) return;
      const hit = st.pick(e);
      if (!hit) return;
      if (hit.obj && hit.obj.userData.pick) { const pl = places.find((p) => p.id === hit.obj.userData.pick.place); if (pl) walkTo(pl); return; }
      goal = { x: hit.point.x, z: hit.point.z };
    };
    st.canvas.addEventListener('pointerdown', onDown);
    st.canvas.addEventListener('pointerup', onUp);
    const typing = () => /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    const kd = (e) => {
      if (typing()) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(k)) { keys[k] = true; e.preventDefault(); }
      if (e.key === 'Enter' && active && document.activeElement === document.body) {
        const a = panel.querySelector('a.btn.primary');
        if (a) location.hash = a.getAttribute('href');
      }
    };
    const ku = (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const onClick = (e) => {
      const b = e.target.closest('[data-w="go"]');
      if (!b) return;
      const pl = places.find((p) => p.id === b.dataset.id);
      if (pl) walkTo(pl);
    };
    root.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      root.removeEventListener('click', onClick);
      st.dispose();
    };
  }

  window.Village3D = { mountVillage };
})();
