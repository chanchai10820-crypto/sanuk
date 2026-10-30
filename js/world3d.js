/*
 * ชุดเครื่องมือภาพ 3 มิติ (ใช้ Three.js r149 ใน vendor/three)
 * ออกแบบให้เบาสำหรับคอมพิวเตอร์โรงเรียน: โมเดล low-poly วัสดุ Lambert ไม่ใช้เงาจริง
 * ถ้าเบราว์เซอร์ไม่รองรับ WebGL ให้ใช้หน้า 2 มิติแทน (supported() คืนค่า false)
 *   stage(el, opt)   สร้างฉากในกล่อง el คืน { scene, camera, onFrame, pick, dispose, ... }
 *   ตัวสร้างโมเดล   cat, fish, tree, rock, house, flag, pot, label, shadow
 */
(function () {
  'use strict';

  const T = window.THREE;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let ok = null;
  function supported() {
    if (ok !== null) return ok;
    try {
      const c = document.createElement('canvas');
      ok = !!(T && window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { ok = false; }
    return ok;
  }

  /* ───── วัสดุและรูปทรงพื้นฐาน (ใช้ซ้ำ ไม่สร้างใหม่ทุกครั้ง) ───── */
  const mats = {};
  function mat(color, opt) {
    const key = color + (opt ? JSON.stringify(opt) : '');
    if (!mats[key]) mats[key] = new T.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opt || {}));
    return mats[key];
  }
  const mesh = (geo, color, opt) => new T.Mesh(geo, mat(color, opt));
  const box = (w, h, d, color) => mesh(new T.BoxGeometry(w, h, d), color);
  const cyl = (rt, rb, h, color, seg) => mesh(new T.CylinderGeometry(rt, rb, h, seg || 8), color);
  const cone = (r, h, color, seg) => mesh(new T.ConeGeometry(r, h, seg || 8), color);
  const sphere = (r, color, seg) => mesh(new T.SphereGeometry(r, seg || 10, Math.max(6, Math.round((seg || 10) * 0.7))), color);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  function group(...kids) { const g = new T.Group(); kids.forEach((k) => k && g.add(k)); return g; }

  /* ───── โมเดล ───── */
  // แมวน้องสนุก หันหน้าไปทาง +z สูงประมาณ 1.3 หน่วย
  function cat(scale) {
    const O = '#F59B3A'; const C = '#FFE3C2'; const D = '#1B2333';
    const g = group(
      at(sphere(0.42, O), 0, 0.45, 0),
      at(sphere(0.3, C, 8), 0, 0.42, 0.18),
      at(sphere(0.36, O), 0, 0.98, 0.08),
      at(sphere(0.17, C, 8), 0, 0.9, 0.36),
      at(sphere(0.045, D, 6), -0.12, 1.04, 0.39),
      at(sphere(0.045, D, 6), 0.12, 1.04, 0.39),
      at(sphere(0.04, '#F49AB0', 6), 0, 0.95, 0.47)
    );
    [-1, 1].forEach((s) => { const e = at(cone(0.12, 0.24, O, 4), s * 0.2, 1.3, 0.05); e.rotation.z = -s * 0.25; g.add(e); });
    [-1, 1].forEach((s) => g.add(at(sphere(0.11, C, 6), s * 0.2, 0.12, 0.25)));
    const tail = at(cyl(0.06, 0.08, 0.7, O, 6), 0, 0.6, -0.42);
    tail.rotation.x = -0.7;
    g.add(tail);
    g.add(at(shadow(0.5), 0, 0.01, 0));
    g.userData.kind = 'cat';
    if (scale) g.scale.setScalar(scale);
    return g;
  }
  function fish(scale) {
    const B = '#49A6E9';
    const body = sphere(0.3, B, 8); body.scale.set(1.5, 0.8, 0.6);
    const tail = at(cone(0.2, 0.3, B, 4), -0.5, 0, 0); tail.rotation.z = Math.PI / 2;
    const eye = at(sphere(0.05, '#1B2333', 6), 0.28, 0.06, 0.15);
    const g = group(body, tail, eye);
    if (scale) g.scale.setScalar(scale);
    return g;
  }
  function tree(h, color) {
    h = h || 2;
    return group(at(cyl(0.12, 0.16, h * 0.45, '#8B5A2B', 6), 0, h * 0.22, 0), at(cone(h * 0.32, h * 0.6, color || '#4CAF62', 7), 0, h * 0.7, 0), at(shadow(h * 0.3), 0, 0.01, 0));
  }
  function rock(s) {
    const r = mesh(new T.DodecahedronGeometry(0.4 * (s || 1), 0), '#8A93A6');
    r.position.y = 0.25 * (s || 1);
    r.scale.y = 0.7;
    return r;
  }
  // บ้านทรงไทยอย่างง่าย: ผนัง หลังคา ประตูหันไปทาง +z
  function house(opt) {
    const w = opt.w || 3.2; const d = opt.d || 2.8; const h = opt.h || 2;
    const g = group(
      at(box(w, h, d, opt.wall || '#FBF3E4'), 0, h / 2, 0),
      at(box(0.8, 1.3, 0.08, '#6B4A2B'), 0, 0.65, d / 2 + 0.02),
      at(box(0.7, 0.55, 0.06, '#BFE3FF'), -w / 3.2, h * 0.62, d / 2 + 0.02),
      at(box(0.7, 0.55, 0.06, '#BFE3FF'), w / 3.2, h * 0.62, d / 2 + 0.02),
      at(shadow(Math.max(w, d) * 0.75), 0, 0.01, 0)
    );
    const roof = at(cone(Math.max(w, d) * 0.78, 1.5, opt.roof || '#C23A63', 4), 0, h + 0.75, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    return g;
  }
  function flag(color) {
    const g = group(at(cyl(0.04, 0.04, 1.4, '#5A606E', 6), 0, 0.7, 0), at(box(0.6, 0.38, 0.03, color || '#F2B705'), 0.32, 1.2, 0));
    return g;
  }
  function pot(r, h, color) {
    return group(at(cyl(r, r * 0.75, h, color || '#B7652A', 10), 0, h / 2, 0), at(cyl(r * 1.08, r * 1.08, h * 0.16, color || '#B7652A', 10), 0, h, 0));
  }
  // เงาวงกลมจาง ๆ ใต้วัตถุ แทนเงาจริงที่ใช้ทรัพยากรมาก
  let shadowMat = null;
  function shadow(r) {
    if (!shadowMat) shadowMat = new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.16, depthWrite: false });
    const m = new T.Mesh(new T.CircleGeometry(r, 16), shadowMat);
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  /* ───── ป้ายข้อความ (วาดบน canvas รองรับภาษาไทยและอีโมจิ) ───── */
  function label(lines, opt) {
    opt = opt || {};
    lines = [].concat(lines);
    const px = opt.px || 44;
    const pad = 18;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const fonts = lines.map((_, i) => `${i === 0 ? 700 : 500} ${i === 0 ? px : Math.round(px * 0.7)}px Mali, "Noto Sans Thai Looped", "Leelawadee UI", sans-serif`);
    let w = 0;
    lines.forEach((t, i) => { g.font = fonts[i]; w = Math.max(w, g.measureText(t).width); });
    const lh = lines.map((_, i) => (i === 0 ? px : px * 0.7) * 1.35);
    c.width = Math.ceil(w + pad * 2);
    c.height = Math.ceil(lh.reduce((a, b) => a + b, 0) + pad * 1.4);
    const r = 22;
    g.fillStyle = opt.bg || 'rgba(255,255,255,0.94)';
    g.beginPath();
    g.moveTo(r, 0); g.arcTo(c.width, 0, c.width, c.height, r); g.arcTo(c.width, c.height, 0, c.height, r); g.arcTo(0, c.height, 0, 0, r); g.arcTo(0, 0, c.width, 0, r);
    g.fill();
    if (opt.border) { g.lineWidth = 6; g.strokeStyle = opt.border; g.stroke(); }
    let y = pad * 0.7;
    lines.forEach((t, i) => {
      g.font = fonts[i];
      g.fillStyle = i === 0 ? (opt.color || '#1B2333') : (opt.sub || '#566178');
      g.textBaseline = 'top';
      g.textAlign = 'center';
      g.fillText(t, c.width / 2, y + (i === 0 ? 0 : 2));
      y += lh[i];
    });
    const tex = new T.CanvasTexture(c);
    tex.anisotropy = 2;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: opt.depthTest !== false, transparent: true }));
    const s = (opt.size || 1) / 100;
    sp.scale.set(c.width * s, c.height * s, 1);
    sp.renderOrder = 2;
    return sp;
  }

  /* ───── ฉาก ───── */
  function stage(el, opt) {
    opt = opt || {};
    const renderer = new T.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new T.Scene();
    scene.background = new T.Color(opt.sky || '#CDEBFF');
    if (opt.fog) scene.fog = new T.Fog(opt.sky || '#CDEBFF', opt.fog[0], opt.fog[1]);
    const camera = new T.PerspectiveCamera(opt.fov || 45, 1, 0.1, 400);
    scene.add(new T.HemisphereLight('#FFFFFF', '#8FBF7A', 0.75));
    const sun = new T.DirectionalLight('#FFFFFF', 0.75);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    const canvas = renderer.domElement;
    canvas.className = 'w3d-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    function size() {
      const w = Math.max(200, el.clientWidth);
      const h = Math.round(Math.min(opt.maxH || 640, Math.max(opt.minH || 260, w * (opt.aspect || 0.6))));
      renderer.setSize(w, h, false);
      canvas.style.width = '100%';
      canvas.style.height = h + 'px';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    }
    let dirty = true;
    const frames = [];
    let raf = 0;
    let last = performance.now();
    let alive = true;
    // วาดใหม่เฉพาะเมื่อมีการเปลี่ยนแปลงหรือมีภาพเคลื่อนไหว เพื่อประหยัดเครื่อง
    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let moving = false;
      for (const fn of frames.slice()) if (fn(dt, now / 1000) === true) moving = true;
      if (moving || dirty) { renderer.render(scene, camera); dirty = false; }
      raf = requestAnimationFrame(loop);
    }
    const ro = window.ResizeObserver ? new ResizeObserver(size) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', size);
    size();
    raf = requestAnimationFrame(loop);
    const ray = new T.Raycaster();
    const v2 = new T.Vector2();
    function pick(ev, targets) {
      const r = canvas.getBoundingClientRect();
      v2.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const hits = ray.intersectObjects(targets || scene.children, true);
      for (const h of hits) {
        let o = h.object;
        while (o && !o.userData.pick) o = o.parent;
        if (o) return { obj: o, point: h.point };
      }
      return hits[0] ? { obj: null, point: hits[0].point } : null;
    }
    function dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', size);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      canvas.remove();
    }
    return {
      T, scene, camera, renderer, canvas, pick, dispose,
      onFrame(fn) { frames.push(fn); return () => frames.splice(frames.indexOf(fn), 1); },
      redraw() { dirty = true; },
      size
    };
  }

  /* ───── กล้องหมุนรอบจุดกลางด้วยการลาก (ใช้กับเกมที่ต้องมองรอบ ๆ) ───── */
  function orbit(st, opt) {
    const o = Object.assign({ target: new T.Vector3(0, 0.6, 0), dist: 8, yaw: 0.6, pitch: 0.55, minPitch: 0.25, maxPitch: 1.2, minYaw: -Infinity, maxYaw: Infinity }, opt || {});
    let drag = null;
    let moved = 0;
    function apply() {
      o.pitch = Math.max(o.minPitch, Math.min(o.maxPitch, o.pitch));
      o.yaw = Math.max(o.minYaw, Math.min(o.maxYaw, o.yaw));
      const c = Math.cos(o.pitch);
      st.camera.position.set(o.target.x + o.dist * c * Math.sin(o.yaw), o.target.y + o.dist * Math.sin(o.pitch), o.target.z + o.dist * c * Math.cos(o.yaw));
      st.camera.lookAt(o.target);
      st.redraw();
    }
    const down = (e) => { drag = { x: e.clientX, y: e.clientY }; moved = 0; };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      drag = { x: e.clientX, y: e.clientY };
      o.yaw -= dx * 0.008; o.pitch += dy * 0.006;
      apply();
    };
    const up = () => { drag = null; };
    st.canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    apply();
    return {
      o, apply,
      wasDrag: () => moved > 8,
      turn(d) { o.yaw += d; apply(); },
      off() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
    };
  }

  // เคลื่อนค่าแบบนุ่มนวล คืน true ระหว่างที่ยังเคลื่อนอยู่ (ใช้ใน onFrame)
  const approach = (cur, to, k, dt) => cur + (to - cur) * Math.min(1, k * dt);

  function fallbackHTML(link, name) {
    return `<div class="w3d-fallback"><p><b>เครื่องนี้ยังเปิดภาพ 3 มิติไม่ได้</b></p><p class="muted">เบราว์เซอร์ไม่รองรับ WebGL หรือปิดการเร่งกราฟิกไว้ ลองใช้ Google Chrome รุ่นใหม่</p>${link ? `<a class="btn primary" href="${link}">เล่น${name || 'แบบ 2 มิติ'}แทน</a>` : ''}</div>`;
  }

  window.World3D = { T, supported, reduceMotion, stage, orbit, approach, mat, mesh, box, cyl, cone, sphere, at, group, cat, fish, tree, rock, house, flag, pot, shadow, label, fallbackHTML };
})();
