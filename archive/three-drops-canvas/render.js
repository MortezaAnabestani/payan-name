window.TD = window.TD || {};
(function (TD) {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = TD.W;
  const H = TD.H;
  const WORLD = TD.WORLD;
  const HORIZON = H * 0.42;
  const STATIONS = TD.STATIONS;
  const clamp = TD.clamp;
  const state = () => TD.state;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const random = (() => {
    let seed = 712367;
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const STARS = [];
  const GRASS = [];
  const FLOWERS = [];
  const BLOOD_TRAIL = [];

  for (let i = 0; i < 88; i += 1) {
    STARS.push({
      x: random() * W,
      y: random() * HORIZON * 0.92,
      r: random() * 1.4 + 0.35,
      a: random() * 0.55 + 0.15,
      p: random() * Math.PI * 2
    });
  }

  for (let i = 0; i < 240; i += 1) {
    GRASS.push({
      x: 90 + random() * (WORLD.w - 180),
      y: 290 + random() * (WORLD.h - 330),
      h: 3 + random() * 9,
      lean: random() * 0.8 - 0.4,
      a: random() * 0.28 + 0.08
    });
  }

  [
    [520, 640, 78],
    [1200, 650, 90],
    [700, 840, 58],
    [1320, 900, 72],
    [410, 910, 64],
    [1570, 760, 48]
  ].forEach(([x, y, r]) => {
    for (let i = 0; i < 9; i += 1) {
      FLOWERS.push({
        x: x + (random() * 2 - 1) * r,
        y: y + (random() * 2 - 1) * r * 0.55,
        c: random() > 0.55 ? "#d9b86a" : "#a9c7c0",
        r: random() * 2 + 1
      });
    }
  });

  [
    [900, 430], [870, 470], [825, 520], [790, 575], [760, 635],
    [710, 675], [650, 705], [590, 725], [535, 705], [490, 675],
    [450, 640], [420, 595], [405, 565]
  ].forEach(([x, y]) => BLOOD_TRAIL.push({ x, y, s: random() * 0.8 + 0.55 }));

  [
    [930, 455], [1010, 485], [1090, 520], [1170, 555],
    [1250, 575], [1330, 585], [1400, 570], [1450, 550]
  ].forEach(([x, y]) => BLOOD_TRAIL.push({ x, y, s: random() * 0.7 + 0.5 }));

  function project(x, y, z = 0) {
    const cam = state().camera;
    const scale = 0.8 + (y / WORLD.h) * 0.45;
    return {
      x: x - cam.x + W / 2,
      y: (y - cam.y) * 0.62 + H * 0.58 - z * scale,
      s: scale
    };
  }

  function worldPath(points, color, edge) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const p = project(x, y);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawSky() {
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 90);
    sky.addColorStop(0, "#03070d");
    sky.addColorStop(0.55, "#071725");
    sky.addColorStop(1, "#0d2a35");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HORIZON + 90);

    const moonX = W * 0.74 - (state().camera.x - 900) * 0.04;
    const moonY = 92;
    const glow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 95);
    glow.addColorStop(0, "rgba(232,220,192,0.24)");
    glow.addColorStop(0.25, "rgba(232,220,192,0.08)");
    glow.addColorStop(1, "rgba(232,220,192,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#d9d2b8";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 7, moonY - 4, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#071725";
    ctx.fill();

    STARS.forEach((star) => {
      const twinkle = state().settings.reduceMotion ? 1 : 0.65 + Math.sin(state().time * 0.7 + star.p) * 0.35;
      ctx.globalAlpha = star.a * twinkle;
      ctx.fillStyle = "#dce7df";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const haze = ctx.createLinearGradient(0, HORIZON - 40, 0, HORIZON + 70);
    haze.addColorStop(0, "rgba(28,64,77,0)");
    haze.addColorStop(0.7, "rgba(28,64,77,0.28)");
    haze.addColorStop(1, "rgba(9,28,32,0.8)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, HORIZON - 40, W, 120);
  }

  function drawGround() {
    const ground = ctx.createLinearGradient(0, HORIZON, 0, H);
    ground.addColorStop(0, "#0a2422");
    ground.addColorStop(0.45, "#0b2b25");
    ground.addColorStop(1, "#061511");
    ctx.fillStyle = ground;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);

    worldPath([[770, 1200], [1030, 1200], [970, 390], [830, 390]], "rgba(82,76,62,0.54)", "rgba(210,190,150,0.13)");
    worldPath([[160, 730], [470, 690], [1430, 690], [1700, 730], [1700, 800], [1430, 760], [470, 760], [160, 800]], "rgba(72,70,60,0.4)", "rgba(210,190,150,0.1)");

    for (let i = 0; i < 10; i += 1) {
      const p = project(900, 430 + i * 68);
      ctx.strokeStyle = `rgba(232,220,192,${0.025 + i * 0.003})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - 120 - i * 8, p.y);
      ctx.lineTo(p.x + 120 + i * 8, p.y);
      ctx.stroke();
    }

    GRASS.forEach((tuft) => {
      const p = project(tuft.x, tuft.y);
      if (p.x < -20 || p.x > W + 20 || p.y < HORIZON - 10 || p.y > H + 20) return;
      ctx.strokeStyle = `rgba(116,154,123,${tuft.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + tuft.lean * 6, p.y - tuft.h * p.s);
      ctx.stroke();
    });

    FLOWERS.forEach((flower) => {
      const p = project(flower.x, flower.y);
      if (p.x < -10 || p.x > W + 10 || p.y < HORIZON) return;
      ctx.fillStyle = flower.c;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, flower.r * p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    [
      [520, 640, 78], [1200, 650, 90], [700, 840, 58],
      [1320, 900, 72], [410, 910, 64], [1570, 760, 48]
    ].forEach(([x, y, r]) => {
      const p = project(x, y);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * p.s, r * 0.38 * p.s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(21,60,48,0.55)";
      ctx.fill();
      ctx.strokeStyle = "rgba(150,180,150,0.08)";
      ctx.stroke();
    });
  }

  function drawWall() {
    const base = project(0, 250);
    const end = project(WORLD.w, 250);
    const scale = (base.s + end.s) / 2;
    const top = base.y - 168 * scale;
    const height = 168 * scale;
    ctx.fillStyle = "#0a2030";
    ctx.fillRect(-120, top, W + 240, height);
    ctx.fillStyle = "rgba(18,50,62,0.65)";
    ctx.fillRect(-120, top, W + 240, height * 0.7);

    for (let row = 0; row < 7; row += 1) {
      const y = top + (row / 7) * height;
      ctx.strokeStyle = "rgba(170,195,190,0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-120, y);
      ctx.lineTo(W + 120, y);
      ctx.stroke();
      const offset = row % 2 === 0 ? 0 : 44;
      for (let x = -120 + offset; x < W + 120; x += 88) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height / 7);
        ctx.stroke();
      }
    }

    for (let x = -80; x < W + 80; x += 74) {
      ctx.fillStyle = "rgba(10,32,48,0.9)";
      ctx.fillRect(x, top - 9 * scale, 42 * scale, 9 * scale);
    }

    const windowX = 1130 - state().camera.x + W / 2;
    const windowY = top + height * 0.34;
    ctx.fillStyle = "rgba(4,10,15,0.8)";
    ctx.fillRect(windowX - 30, windowY - 38, 60, 76);
    ctx.strokeStyle = "rgba(180,205,195,0.24)";
    ctx.lineWidth = 2;
    ctx.strokeRect(windowX - 30, windowY - 38, 60, 76);
    for (let i = -18; i <= 18; i += 12) {
      ctx.beginPath();
      ctx.moveTo(windowX + i, windowY - 38);
      ctx.lineTo(windowX + i, windowY + 38);
      ctx.stroke();
    }
  }

  function drawDrops(x, y, color = "#a32638", size = 1) {
    const p = project(x, y);
    const s = state();
    const glow = s.player.lantern ? 1 : s.player.listening ? 0.8 : 0.48;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.shadowColor = color;
    ctx.shadowBlur = s.player.lantern ? 18 : 8;
    ctx.fillStyle = color;
    [[-7, 0, 2.6], [3, -3, 3.4], [11, 2, 2.2]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.ellipse(p.x + dx * p.s * size, p.y + dy * p.s * size, r * p.s * size, r * 1.45 * p.s * size, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBloodTrail() {
    const s = state();
    const visible = s.player.lantern || s.player.listening;
    ctx.save();
    BLOOD_TRAIL.forEach((drop, index) => {
      const p = project(drop.x, drop.y);
      if (p.x < -20 || p.x > W + 20 || p.y < HORIZON - 20 || p.y > H + 20) return;
      const pulse = s.player.listening ? 0.5 + Math.sin(s.time * 4 + index) * 0.28 : 0.3;
      ctx.globalAlpha = visible ? pulse : pulse * 0.22;
      ctx.fillStyle = index % 3 === 0 ? "#8f2233" : "#5d1724";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 2.1 * p.s * drop.s, 1.2 * p.s * drop.s, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function testimonyAura(x, y, color) {
    const p = project(x, y);
    const pulse = 0.12 + Math.sin(state().time * 1.8) * 0.035;
    const aura = ctx.createRadialGradient(p.x, p.y - 26, 4, p.x, p.y - 26, 96 * p.s);
    aura.addColorStop(0, color.replace("ALPHA", pulse.toFixed(3)));
    aura.addColorStop(1, color.replace("ALPHA", "0"));
    ctx.fillStyle = aura;
    ctx.fillRect(p.x - 110 * p.s, p.y - 140 * p.s, 220 * p.s, 180 * p.s);
  }

  function stationRing(x, y, done) {
    if (done) return;
    const p = project(x, y);
    const pulse = 0.4 + Math.sin(state().time * 2.2) * 0.16;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#f4c46a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4, 28 * p.s, 11 * p.s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPine() {
    const s = state();
    const p = project(900, 370);
    if (p.x < -180 || p.x > W + 180) return;
    const scale = p.s;
    ctx.save();
    ctx.fillStyle = "rgba(1,8,7,0.4)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, 74 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3b2d20";
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(p.x - 8 * scale, p.y - 90 * scale, p.x + 2 * scale, p.y - 180 * scale);
    ctx.stroke();

    [
      [0, -250, 120, 80],
      [-4, -210, 150, 94],
      [5, -164, 176, 104],
      [0, -112, 198, 112]
    ].forEach(([dx, dy, rx, ry], index) => {
      const gradient = ctx.createLinearGradient(p.x - rx * scale, p.y + dy * scale, p.x + rx * scale, p.y + dy * scale);
      gradient.addColorStop(0, index % 2 === 0 ? "#0d2a24" : "#12362a");
      gradient.addColorStop(1, "#0a201c");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(p.x + dx * scale, p.y + dy * scale, rx * scale, ry * scale, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x + dx * scale - rx * scale, p.y + dy * scale);
      ctx.quadraticCurveTo(p.x + dx * scale, p.y + (dy + 55) * scale, p.x + dx * scale + rx * scale, p.y + dy * scale);
      ctx.fill();
    });

    ctx.strokeStyle = "rgba(6,18,16,0.8)";
    ctx.lineWidth = 2 * scale;
    for (let i = 0; i < 7; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(p.x + side * 22 * scale, p.y - (80 + i * 22) * scale);
      ctx.quadraticCurveTo(p.x + side * (75 + i * 9) * scale, p.y - (95 + i * 18) * scale, p.x + side * (110 + i * 8) * scale, p.y - (60 + i * 25) * scale);
      ctx.stroke();
    }
    ctx.restore();

    drawDrops(900, 385, "#a32638", 1.15);
    if (s.stations.pine.value === "cat") testimonyAura(900, 385, "rgba(163,38,56,ALPHA)");
    if (s.stations.pine.value === "hoopoe") testimonyAura(900, 385, "rgba(96,150,170,ALPHA)");
    stationRing(900, 385, s.stations.pine.done);
    if (TD.allDone()) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(state().time * 2.4) * 0.2;
      ctx.strokeStyle = "#f4c46a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 4, 38 * scale, 15 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCage() {
    const s = state();
    const p = project(390, 540);
    const scale = p.s;
    if (p.x < -120 || p.x > W + 120) return;
    ctx.save();
    ctx.fillStyle = "rgba(1,8,7,0.42)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, 50 * scale, 16 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(180,160,120,0.55)";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(p.x - 34 * scale, p.y);
    ctx.lineTo(p.x - 34 * scale, p.y - 92 * scale);
    ctx.lineTo(p.x + 34 * scale, p.y - 92 * scale);
    ctx.lineTo(p.x + 34 * scale, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - 40 * scale, p.y - 92 * scale);
    ctx.lineTo(p.x, p.y - 106 * scale);
    ctx.lineTo(p.x + 40 * scale, p.y - 92 * scale);
    ctx.stroke();

    for (let i = -24; i <= 24; i += 12) {
      ctx.strokeStyle = "rgba(205,185,140,0.32)";
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(p.x + i * scale, p.y);
      ctx.lineTo(p.x + i * scale, p.y - 92 * scale);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(232,220,192,0.42)";
    ctx.beginPath();
    ctx.ellipse(p.x + 20 * scale, p.y + 1, 7 * scale, 2.5 * scale, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x - 21 * scale, p.y + 5, 5 * scale, 2 * scale, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawDrops(390, 552, "#922334", 1);
    if (s.stations.wall.value === "hoopoe") testimonyAura(390, 552, "rgba(210,180,100,ALPHA)");
    if (s.stations.wall.value === "cat") testimonyAura(390, 552, "rgba(163,38,56,ALPHA)");
    stationRing(390, 552, s.stations.wall.done);
  }

  function drawDoor() {
    const s = state();
    const p = project(1460, 540);
    const scale = p.s;
    if (p.x < -140 || p.x > W + 140) return;
    ctx.save();
    ctx.fillStyle = "rgba(1,8,7,0.44)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 3, 62 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const glow = ctx.createRadialGradient(p.x, p.y - 60 * scale, 4, p.x, p.y - 60 * scale, 108 * scale);
    glow.addColorStop(0, "rgba(90,160,190,0.24)");
    glow.addColorStop(1, "rgba(40,90,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 120 * scale, p.y - 180 * scale, 240 * scale, 200 * scale);

    ctx.fillStyle = "#0a1a28";
    ctx.fillRect(p.x - 48 * scale, p.y - 148 * scale, 96 * scale, 148 * scale);
    ctx.fillStyle = "#123b52";
    ctx.fillRect(p.x - 39 * scale, p.y - 138 * scale, 78 * scale, 138 * scale);
    ctx.fillStyle = "#071521";
    ctx.fillRect(p.x - 28 * scale, p.y - 128 * scale, 56 * scale, 128 * scale);
    ctx.strokeStyle = "rgba(170,210,215,0.38)";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(p.x - 48 * scale, p.y - 148 * scale, 96 * scale, 148 * scale);
    ctx.beginPath();
    ctx.moveTo(p.x - 48 * scale, p.y - 148 * scale);
    ctx.lineTo(p.x, p.y - 170 * scale);
    ctx.lineTo(p.x + 48 * scale, p.y - 148 * scale);
    ctx.stroke();

    ctx.fillStyle = "rgba(244,196,106,0.72)";
    ctx.beginPath();
    ctx.arc(p.x + 18 * scale, p.y - 70 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawDrops(1460, 555, "#a32638", 1);
    if (s.stations.door.value === "self") testimonyAura(1460, 555, "rgba(163,38,56,ALPHA)");
    if (s.stations.door.value === "siavash") testimonyAura(1460, 555, "rgba(70,130,170,ALPHA)");
    stationRing(1460, 555, s.stations.door.done);
  }

  function drawBush(spot) {
    const p = project(spot.x, spot.y);
    if (p.x < -100 || p.x > W + 100) return;
    const s = p.s;
    ctx.save();
    ctx.fillStyle = "rgba(8,26,22,0.8)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 5, spot.r * 0.9 * s, spot.r * 0.26 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    const tones = ["#0f3328", "#123b2e", "#0c2a23"];
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = tones[i % tones.length];
      ctx.beginPath();
      ctx.ellipse(
        p.x + (i - 2) * 18 * s,
        p.y - 10 * s - (i % 2) * 9 * s,
        spot.r * (0.44 + (i % 3) * 0.08) * s,
        spot.r * (0.3 + (i % 2) * 0.08) * s,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBench(x, y) {
    const p = project(x, y);
    const s = p.s;
    ctx.save();
    ctx.fillStyle = "rgba(1,8,7,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, 42 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#493627";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(p.x - 32 * s, p.y - 18 * s);
    ctx.lineTo(p.x + 32 * s, p.y - 18 * s);
    ctx.moveTo(p.x - 26 * s, p.y);
    ctx.lineTo(p.x - 26 * s, p.y - 30 * s);
    ctx.moveTo(p.x + 26 * s, p.y);
    ctx.lineTo(p.x + 26 * s, p.y - 30 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawFanoos(x, y) {
    const p = project(x, y);
    const s = p.s;
    ctx.save();
    ctx.strokeStyle = "#4a3a28";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - 62 * s);
    ctx.stroke();
    const glow = ctx.createRadialGradient(p.x, p.y - 66 * s, 2, p.x, p.y - 66 * s, 48 * s);
    glow.addColorStop(0, "rgba(244,196,106,0.28)");
    glow.addColorStop(1, "rgba(244,196,106,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 55 * s, p.y - 120 * s, 110 * s, 110 * s);
    ctx.fillStyle = "rgba(244,196,106,0.8)";
    ctx.fillRect(p.x - 6 * s, p.y - 78 * s, 12 * s, 14 * s);
    ctx.restore();
  }

  function drawPlayer() {
    const s = state();
    const player = s.player;
    const p = project(player.x, player.y);
    const scale = p.s;
    const bob = player.moving && !s.settings.reduceMotion ? Math.sin(s.time * 10) * 1.7 : 0;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(scale, scale * (player.crouch ? 0.84 : 1));
    ctx.fillStyle = "rgba(1,7,6,0.46)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0d1a20";
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-18, -34, -7, -44);
    ctx.lineTo(8, -44);
    ctx.quadraticCurveTo(18, -32, 14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(200,190,160,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#b69b76";
    ctx.beginPath();
    ctx.arc(0, -53, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#101820";
    ctx.beginPath();
    ctx.ellipse(0, -61, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-7, -68, 14, 7);

    ctx.strokeStyle = "#b69b76";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, -35);
    ctx.lineTo(-19, -22);
    ctx.moveTo(11, -35);
    ctx.lineTo(19, -24);
    ctx.stroke();

    ctx.fillStyle = "#3b2e20";
    ctx.beginPath();
    ctx.arc(19, -22, 5, 0, Math.PI * 2);
    ctx.fill();
    if (player.lantern) {
      ctx.fillStyle = "#f4c46a";
      ctx.beginPath();
      ctx.arc(19, -22, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#cfbea0";
    ctx.beginPath();
    ctx.arc(-19, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSupervisor() {
    const s = state();
    const supervisor = s.supervisor;
    const p = project(supervisor.x, supervisor.y);
    const scale = p.s * 1.12;
    const lanternBoost = s.player.lantern ? 1.55 : 1;
    const range = (supervisor.state === "chase" ? 370 : 285) * lanternBoost;
    const angle = Math.atan2(supervisor.facing.y * 0.62, supervisor.facing.x);
    const cone = ctx.createRadialGradient(p.x, p.y - 24, 6, p.x, p.y - 24, range * scale * 0.62);
    const strong = supervisor.state === "chase" ? 0.2 : 0.08;
    cone.addColorStop(0, `rgba(220,170,90,${strong})`);
    cone.addColorStop(0.7, `rgba(220,170,90,${strong * 0.35})`);
    cone.addColorStop(1, "rgba(220,170,90,0)");
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 24);
    ctx.arc(p.x, p.y - 24, range * scale * 0.62, angle - 0.48, angle + 0.48);
    ctx.closePath();
    ctx.fillStyle = cone;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(1,6,6,0.48)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#101d24";
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(-13, -48);
    ctx.lineTo(13, -48);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(210,190,150,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#9a8064";
    ctx.beginPath();
    ctx.arc(0, -56, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a1318";
    ctx.beginPath();
    ctx.ellipse(0, -64, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-6, -78, 12, 15);
    ctx.strokeStyle = "#9a8064";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -40);
    ctx.lineTo(-22, -27);
    ctx.moveTo(12, -40);
    ctx.lineTo(22, -25);
    ctx.stroke();
    ctx.fillStyle = "rgba(244,196,106,0.8)";
    ctx.beginPath();
    ctx.arc(22, -25, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAbbas() {
    const s = state();
    const abbas = s.abbas;
    const p = project(abbas.x, abbas.y);
    const scale = p.s;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(1,7,6,0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2520";
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-16, -34, 0, -44);
    ctx.quadraticCurveTo(16, -34, 15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#a88b69";
    ctx.beginPath();
    ctx.arc(0, -51, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2520";
    ctx.beginPath();
    ctx.ellipse(0, -59, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a88b69";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.lineTo(-18, -24);
    ctx.moveTo(10, -32);
    ctx.lineTo(18, -24);
    ctx.stroke();
    ctx.fillStyle = "#8a4f2f";
    ctx.beginPath();
    ctx.arc(0, -28, 10, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = "rgba(214,190,150,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(8, -28);
    ctx.stroke();
    ctx.restore();
  }

  function drawCat() {
    const s = state();
    const cat = s.cat;
    if (!cat.visible) return;
    const p = project(cat.x, cat.y);
    const scale = p.s * 0.9;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(1,6,6,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111820";
    ctx.beginPath();
    ctx.ellipse(0, -8, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -19);
    ctx.lineTo(11, -27);
    ctx.lineTo(15, -20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, -20);
    ctx.lineTo(21, -27);
    ctx.lineTo(21, -18);
    ctx.fill();
    ctx.strokeStyle = "#111820";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -8);
    ctx.quadraticCurveTo(-28, -14, -26, -25);
    ctx.stroke();
    ctx.fillStyle = "#f4c46a";
    ctx.beginPath();
    ctx.arc(12, -15, 1.6, 0, Math.PI * 2);
    ctx.arc(17, -15, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    const s = state();
    s.particles.forEach((particle) => {
      const p = project(particle.x, particle.y);
      const alpha = clamp(particle.life / particle.max, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, particle.r * p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawListening() {
    const s = state();
    if (!s.player.listening) return;
    const p = project(s.player.x, s.player.y);
    for (let i = 0; i < 3; i += 1) {
      const radius = 30 + ((s.time * 70 + i * 34) % 150);
      ctx.strokeStyle = `rgba(154,205,205,${0.18 * (1 - radius / 190)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 20, radius, radius * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    [s.abbas, s.cat, s.supervisor].forEach((entity) => {
      const q = project(entity.x, entity.y);
      const radius = 24 + ((s.time * 46) % 110);
      ctx.strokeStyle = `rgba(196,220,200,${0.12 * (1 - radius / 150)})`;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y - 12, radius, radius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function drawLighting() {
    const s = state();
    if (s.player.lantern) {
      const p = project(s.player.x, s.player.y);
      const radius = 210 + (s.player.lucidity / 100) * 70;
      const light = ctx.createRadialGradient(p.x, p.y - 26, 12, p.x, p.y - 26, radius);
      light.addColorStop(0, "rgba(255,221,150,0.22)");
      light.addColorStop(0.32, "rgba(244,196,106,0.1)");
      light.addColorStop(0.62, "rgba(2,6,10,0.14)");
      light.addColorStop(1, "rgba(2,6,10,0.66)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "rgba(2,6,10,0.34)";
      ctx.fillRect(0, 0, W, H);
    }

    const vignette = ctx.createRadialGradient(W / 2, H * 0.54, H * 0.18, W / 2, H * 0.54, H * 0.82);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (s.supervisor.suspicion > 0.15) {
      const danger = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      danger.addColorStop(0, "rgba(163,38,56,0)");
      danger.addColorStop(1, `rgba(163,38,56,${0.08 + s.supervisor.suspicion * 0.18})`);
      ctx.fillStyle = danger;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawFog() {
    const s = state();
    const time = s.settings.reduceMotion ? 0 : s.time;
    ctx.save();
    for (let i = 0; i < 5; i += 1) {
      const x = ((time * (4 + i) + i * 270) % (W + 400)) - 200;
      const y = H * 0.58 + i * 26 + Math.sin(time * 0.2 + i) * 10;
      const fog = ctx.createRadialGradient(x, y, 10, x, y, 240);
      fog.addColorStop(0, "rgba(124,158,156,0.035)");
      fog.addColorStop(1, "rgba(124,158,156,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(x - 260, y - 120, 520, 240);
    }
    ctx.restore();
  }

  function drawFlash() {
    const s = state();
    if (s.flags.caughtFlash <= 0) return;
    ctx.fillStyle = `rgba(163,38,56,${0.28 * s.flags.caughtFlash})`;
    ctx.fillRect(0, 0, W, H);
  }

  function render() {
    const s = state();
    ctx.save();
    if (s.flags.caughtFlash > 0 && !s.settings.reduceMotion) {
      ctx.translate(Math.sin(s.time * 40) * 4 * s.flags.caughtFlash, 0);
    }
    ctx.clearRect(-10, -10, W + 20, H + 20);
    drawSky();
    drawGround();
    drawWall();
    drawBloodTrail();
    drawFog();

    const items = [];
    items.push({ y: 370, draw: drawPine });
    items.push({ y: 540, draw: drawCage });
    items.push({ y: 540, draw: drawDoor });
    items.push({ y: 735, draw: () => drawBench(600, 735) });
    items.push({ y: 790, draw: () => drawBench(1230, 790) });
    items.push({ y: 700, draw: () => drawFanoos(1090, 700) });
    TD.HIDE_SPOTS.forEach((spot) => items.push({ y: spot.y, draw: () => drawBush(spot) }));
    items.push({ y: s.abbas.y, draw: drawAbbas });
    items.push({ y: s.cat.y, draw: drawCat });
    items.push({ y: s.supervisor.y, draw: drawSupervisor });
    items.push({ y: s.player.y, draw: drawPlayer });
    items.sort((a, b) => a.y - b.y);
    items.forEach((item) => item.draw());

    drawLighting();
    drawListening();
    drawParticles();
    drawFlash();
    ctx.restore();
  }

  TD.resize = resize;
  TD.project = project;
  TD.render = render;
  resize();
})(window.TD);
