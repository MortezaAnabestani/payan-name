window.TD = window.TD || {};
(function (TD) {
  "use strict";

  const S = () => TD.state;
  const audio = TD.audio;
  const W = TD.W;
  const H = TD.H;
  const WORLD = TD.WORLD;
  const STATIONS = TD.STATIONS;
  const SUP_POINTS = TD.SUP_POINTS;
  const ABBAS_POINTS = TD.ABBAS_POINTS;
  const CAT_POINTS = TD.CAT_POINTS;
  const HIDE_SPOTS = TD.HIDE_SPOTS;
  const OBSTACLES = TD.OBSTACLES;
  const CHOICES = TD.CHOICES;
  const JOURNAL = TD.JOURNAL;
  const ENDINGS = TD.ENDINGS;
  const $ = (id) => document.getElementById(id);

  const ui = {
    hud: $("hud"),
    objective: $("objective"),
    stations: $("stations"),
    lucidity: $("lucidity-bar"),
    suspicionWrap: $("suspicion-wrap"),
    suspicion: $("suspicion-bar"),
    prompt: $("prompt"),
    toast: $("toast"),
    menu: $("menu"),
    intro: $("intro"),
    introText: $("intro-text"),
    choice: $("choice"),
    choiceKicker: $("choice-kicker"),
    choiceTitle: $("choice-title"),
    choiceEcho: $("choice-echo"),
    choiceQuestion: $("choice-question"),
    choiceOptions: $("choice-options"),
    note: $("note"),
    noteKicker: $("note-kicker"),
    noteText: $("note-text"),
    journal: $("journal"),
    journalPine: $("journal-pine"),
    journalWall: $("journal-wall"),
    journalDoor: $("journal-door"),
    journalFinal: $("journal-final"),
    pause: $("pause"),
    ending: $("ending"),
    endingKicker: $("ending-kicker"),
    endingTitle: $("ending-title"),
    endingText: $("ending-text"),
    endingStats: $("ending-stats"),
    muteBtn: $("mute-btn"),
    continueBtn: $("continue-btn"),
    mobile: $("mobile-controls"),
    rotate: $("rotate")
  };

  const held = new Set();
  let toastTimeout = 0;
  let rotateShown = false;
  let lastFrame = performance.now();

  function hideModals() {
    ["menu", "intro", "choice", "note", "journal", "pause", "ending"].forEach((id) => {
      $(id).classList.add("hidden");
    });
  }

  function toast(message, duration = 3200) {
    ui.toast.textContent = message;
    ui.toast.classList.remove("hidden");
    toastTimeout = duration / 1000;
  }

  function syncRotate() {
    const state = S();
    const portrait = window.matchMedia("(orientation: portrait) and (max-width: 760px)").matches;
    const show = state.started && state.scene === "play" && portrait && !document.body.classList.contains("rotate-dismissed");
    if (show === rotateShown) return;
    rotateShown = show;
    ui.rotate.classList.toggle("show", show);
    if (show) clearHeld();
  }

  function syncHudVisibility() {
    const state = S();
    const visible = state.started && !["menu", "intro", "ending"].includes(state.scene);
    ui.hud.classList.toggle("hidden", !visible);
    const isTouch = window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
    ui.mobile.classList.toggle("hidden", !visible || !isTouch);
    syncRotate();
  }

  function updateHud() {
    const state = S();
    syncHudVisibility();
    const count = TD.doneCount();
    if (TD.allDone()) {
      ui.objective.textContent = "به کاج برگرد. شهادت نهایی را ثبت کن.";
    } else if (count === 0) {
      ui.objective.textContent = "سه ایستگاه را پیدا کن: کاج، قفس، در آبی.";
    } else {
      const labels = ["pine", "wall", "door"].filter((id) => !state.stations[id].done).map((id) => STATIONS[id].label);
      ui.objective.textContent = `شهادت بعدی: ${labels.join("، ")}`;
    }

    let currentAssigned = false;
    ui.stations.querySelectorAll(".station-dot").forEach((dot) => {
      const id = dot.dataset.station;
      const done = id === "final" ? Boolean(state.final) : state.stations[id].done;
      const current = !done && id !== "final" && count < 3 && !currentAssigned;
      if (current) currentAssigned = true;
      dot.classList.toggle("done", done);
      dot.classList.toggle("current", current);
    });

    ui.lucidity.style.width = `${TD.clamp(state.player.lucidity, 0, 100)}%`;
    const suspicious = state.supervisor.suspicion;
    ui.suspicionWrap.classList.toggle("hidden", suspicious < 0.025);
    ui.suspicion.style.width = `${TD.clamp(suspicious * 100, 0, 100)}%`;
  }

  function renderJournal() {
    const state = S();
    const pine = state.stations.pine;
    const wall = state.stations.wall;
    const door = state.stations.door;
    ui.journalPine.textContent = pine.done ? JOURNAL.pine[pine.value] : "ثبت نشده.";
    ui.journalWall.textContent = wall.done ? JOURNAL.wall[wall.value] : "ثبت نشده.";
    ui.journalDoor.textContent = door.done ? JOURNAL.door[door.value] : "ثبت نشده.";
    ui.journalFinal.textContent = state.final
      ? `شهادت نهایی: ${CHOICES.final.options.find((option) => option.value === state.final)?.label || ""}`
      : TD.allDone()
        ? "کاج منتظر شهادت نهایی است."
        : "هر سه شهادت را ثبت کن.";
  }

  function openJournal() {
    const state = S();
    if (!["play", "pause"].includes(state.scene)) return;
    state.journalReturn = state.scene;
    if (state.scene === "pause") ui.pause.classList.add("hidden");
    state.scene = "journal";
    clearHeld();
    renderJournal();
    ui.journal.classList.remove("hidden");
    ui.prompt.classList.add("hidden");
    syncHudVisibility();
  }

  function closeJournal() {
    const state = S();
    if (state.scene !== "journal") return;
    ui.journal.classList.add("hidden");
    if (state.journalReturn === "pause") {
      state.scene = "pause";
      ui.pause.classList.remove("hidden");
    } else {
      state.scene = "play";
    }
    syncHudVisibility();
  }

  function openNote(kicker, text) {
    const state = S();
    if (state.scene !== "play") return;
    state.scene = "note";
    clearHeld();
    ui.noteKicker.textContent = kicker;
    ui.noteText.textContent = text;
    ui.note.classList.remove("hidden");
    ui.prompt.classList.add("hidden");
    audio.whisper();
  }

  function closeNote() {
    const state = S();
    if (state.scene !== "note") return;
    ui.note.classList.add("hidden");
    state.scene = "play";
    syncHudVisibility();
  }

  function openChoice(id) {
    const state = S();
    if (!CHOICES[id]) return;
    if (id !== "final" && state.stations[id]?.done) return;
    if (id === "final" && !TD.allDone()) {
      toast("اول سه شهادت را ثبت کن.");
      return;
    }
    state.scene = "choice";
    state.choiceId = id;
    state.phase = id === "final" ? "final" : "testimony";
    clearHeld();
    const data = CHOICES[id];
    ui.choiceKicker.textContent = data.kicker;
    ui.choiceTitle.textContent = data.title;
    ui.choiceEcho.textContent = data.echo;
    ui.choiceQuestion.textContent = data.question;
    ui.choiceOptions.innerHTML = "";
    data.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      const label = document.createElement("span");
      label.textContent = option.label;
      const sub = document.createElement("span");
      sub.className = "choice-sub";
      sub.textContent = option.sub;
      button.append(label, sub);
      button.addEventListener("click", () => resolveChoice(id, option.value));
      ui.choiceOptions.append(button);
    });
    ui.choice.classList.remove("hidden");
    ui.prompt.classList.add("hidden");
    audio.whisper();
    syncHudVisibility();
  }

  function chooseSafety(id, value) {
    const state = S();
    if (id === "pine") {
      state.checkpoint = { ...TD.CHECKPOINTS.pine };
      state.cat.visible = true;
      state.supervisor.suspicion = TD.clamp(state.supervisor.suspicion + (value === "hoopoe" ? -0.12 : 0.08), 0, 1);
    }
    if (id === "wall") {
      state.checkpoint = { ...TD.CHECKPOINTS.wall };
      state.supervisor.suspicion = TD.clamp(state.supervisor.suspicion + (value === "cat" ? 0.24 : -0.16), 0, 1);
      state.abbas.timer = 0;
    }
    if (id === "door") {
      state.checkpoint = { ...TD.CHECKPOINTS.door };
      state.supervisor.suspicion = TD.clamp(state.supervisor.suspicion + (value === "self" ? 0.12 : -0.06), 0, 1);
    }
  }

  function resolveChoice(id, value) {
    const state = S();
    if (id === "final") {
      finish(value);
      return;
    }
    if (!state.stations[id] || state.stations[id].done) return;
    state.stations[id].done = true;
    state.stations[id].value = value;
    chooseSafety(id, value);
    state.scene = "play";
    state.choiceId = null;
    state.phase = "explore";
    ui.choice.classList.add("hidden");
    spawnBurst(STATIONS[id].x, STATIONS[id].y - 30, value === "cat" ? "#b63b46" : "#7aa6b0", 24);
    audio.chime(panFor(STATIONS[id].x));
    if (TD.allDone()) {
      toast("هر سه شهادت ثبت شد. به کاج برگرد.");
    } else {
      toast("شهادت ثبت شد. باغ تغییر کرد.");
    }
    save();
    updateHud();
    syncHudVisibility();
  }

  function finish(value) {
    const state = S();
    state.final = value;
    state.scene = "ending";
    state.started = false;
    state.phase = "ending";
    clearHeld();
    ui.choice.classList.add("hidden");
    ui.hud.classList.add("hidden");
    ui.prompt.classList.add("hidden");
    const ending = ENDINGS[value] || ENDINGS.silence;
    ui.endingKicker.textContent = ending.kicker;
    ui.endingTitle.textContent = ending.title;
    ui.endingText.textContent = ending.text;
    ui.endingStats.textContent = `زمان: ${TD.formatTime(state.elapsed)} · شهادت‌ها: ۳ · بازگشت‌ها: ${state.caughtCount}`;
    ui.ending.classList.remove("hidden");
    syncHudVisibility();
    audio.chime(0);
    save();
  }

  function clearHeld() {
    held.clear();
    Object.keys(S().touch).forEach((key) => {
      S().touch[key] = false;
    });
    S().player.lantern = false;
    S().player.listening = false;
    document.querySelectorAll(".mobile-controls button.active").forEach((button) => button.classList.remove("active"));
  }

  function startNew() {
    const muted = S().settings.muted;
    localStorage.removeItem(TD.SAVE_KEY);
    TD.replaceState(TD.makeState());
    const state = S();
    state.settings.muted = muted;
    audio.setMuted(muted);
    state.started = true;
    hideModals();
    clearHeld();
    state.scene = "intro";
    ui.introText.textContent =
      "یک سال است کاغذ و قلم نمی‌دهند. می‌گویند دیوانه‌ام. شاید.\n\nاما دیشب سه قطره خون روی کاغذ من بود و کسی نیست که بگوید از کجا آمده.\n\nامشب در باغ باز است. باید ببینم پشت این سه قطره چه کسی ایستاده — یا چه چیزی.";
    ui.intro.classList.remove("hidden");
    ui.continueBtn.classList.add("hidden");
    audio.ensure();
    syncHudVisibility();
  }

  function beginPlay() {
    const state = S();
    if (state.scene !== "intro") return;
    ui.intro.classList.add("hidden");
    state.scene = "play";
    state.phase = "explore";
    state.started = true;
    clearHeld();
    audio.ensure();
    toast("باغ باز است. سه ایستگاه: کاج، قفس، در آبی.", 3800);
    updateHud();
    syncHudVisibility();
  }

  function togglePause() {
    const state = S();
    if (state.scene === "play") {
      state.scene = "pause";
      clearHeld();
      ui.pause.classList.remove("hidden");
      ui.prompt.classList.add("hidden");
      syncHudVisibility();
    } else if (state.scene === "pause") {
      resumeGame();
    }
  }

  function resumeGame() {
    const state = S();
    if (state.scene !== "pause") return;
    ui.pause.classList.add("hidden");
    state.scene = "play";
    syncHudVisibility();
  }

  function setMuted(value) {
    const state = S();
    state.settings.muted = value;
    audio.setMuted(value);
    ui.muteBtn.textContent = value ? "صدا: خاموش" : "صدا: روشن";
    save();
  }

  function toggleMute() {
    setMuted(!S().settings.muted);
  }

  function restartGame() {
    startNew();
  }

  function hasSave() {
    try {
      return Boolean(localStorage.getItem(TD.SAVE_KEY));
    } catch {
      return false;
    }
  }

  function save() {
    const state = S();
    if (!["play", "pause", "choice", "note", "journal", "ending"].includes(state.scene)) return;
    try {
      const data = {
        x: state.player.x,
        y: state.player.y,
        lucidity: state.player.lucidity,
        stations: state.stations,
        final: state.final,
        elapsed: state.elapsed,
        caughtCount: state.caughtCount,
        checkpoint: state.checkpoint,
        settings: state.settings
      };
      localStorage.setItem(TD.SAVE_KEY, JSON.stringify(data));
    } catch {
      return;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(TD.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const loaded = TD.makeState();
      loaded.player.x = Number(data.x) || TD.SPAWN.x;
      loaded.player.y = Number(data.y) || TD.SPAWN.y;
      loaded.player.lucidity = TD.clamp(Number(data.lucidity) || 100, 0, 100);
      if (data.stations) {
        ["pine", "wall", "door"].forEach((id) => {
          if (data.stations[id]) {
            loaded.stations[id] = {
              done: Boolean(data.stations[id].done),
              value: data.stations[id].value || null
            };
          }
        });
      }
      loaded.final = data.final || null;
      loaded.elapsed = Number(data.elapsed) || 0;
      loaded.caughtCount = Number(data.caughtCount) || 0;
      loaded.checkpoint = data.checkpoint || loaded.checkpoint;
      loaded.settings = Object.assign(loaded.settings, data.settings || {});
      loaded.started = true;
      loaded.camera.x = TD.clamp(loaded.player.x, W / 2, WORLD.w - W / 2);
      loaded.camera.y = TD.clamp(loaded.player.y - 170, 300, 860);
      TD.replaceState(loaded);
      audio.setMuted(loaded.settings.muted);
      ui.muteBtn.textContent = loaded.settings.muted ? "صدا: خاموش" : "صدا: روشن";
      return true;
    } catch {
      return false;
    }
  }

  function continueGame() {
    if (!load()) {
      startNew();
      return;
    }
    const state = S();
    hideModals();
    clearHeld();
    audio.ensure();
    if (state.final) {
      state.scene = "ending";
      state.started = false;
      const data = ENDINGS[state.final] || ENDINGS.silence;
      ui.endingKicker.textContent = data.kicker;
      ui.endingTitle.textContent = data.title;
      ui.endingText.textContent = data.text;
      ui.endingStats.textContent = `زمان: ${TD.formatTime(state.elapsed)} · شهادت‌ها: ۳ · بازگشت‌ها: ${state.caughtCount}`;
      ui.ending.classList.remove("hidden");
      syncHudVisibility();
      return;
    }
    state.scene = "play";
    state.started = true;
    ui.continueBtn.classList.add("hidden");
    updateHud();
    syncHudVisibility();
    toast("به باغ برگشتی. شهادت‌ها سر جایشان‌اند.", 3200);
  }

  function panFor(worldX) {
    const state = S();
    const screenX = worldX - state.camera.x + W / 2;
    return TD.clamp((screenX / W) * 2 - 1, -0.85, 0.85);
  }

  function near() {
    const state = S();
    if (state.scene !== "play") return null;
    if (TD.allDone() && TD.dist(state.player, STATIONS.pine) < STATIONS.pine.zone + 12) {
      return { type: "final" };
    }
    for (const id of ["pine", "wall", "door"]) {
      if (!state.stations[id].done && TD.dist(state.player, STATIONS[id]) < STATIONS[id].zone) {
        return { type: "station", id };
      }
    }
    if (TD.dist(state.player, state.abbas) < 82) return { type: "abbas" };
    if (state.cat.visible && TD.dist(state.player, state.cat) < 76) return { type: "cat" };
    return null;
  }

  function abbasLine() {
    const state = S();
    if (!state.stations.pine.done) {
      return "سه قطره... زیر کاج. نازی... گربهٔ ماده... کسی که سه گندم خورد، اسمش را عوض می‌کند.";
    }
    if (!state.stations.wall.done) {
      return "قفس خالی است. پرها را دیدی؟ مرغ حق سه گندم خورد، یا گربه قناری را گرفت؟ هر دو درست‌اند، اگر کسی شهادت بدهد.";
    }
    if (!state.stations.door.done) {
      return "درِ آبی... تار... سیاوش. آستانه از خون یاد دارد. تو هم از آن یاد داری، نه؟";
    }
    return "کاج منتظر است. سه قطره، سه شهادت، یک کاغذ. حالا انتخاب کن — یا سکوت کن.";
  }

  function catLine() {
    const state = S();
    if (state.stations.pine.value === "cat") return "نازی در سایه ایستاده. نگاهت می‌کند، انگار تو هم بخشی از خون هستی.";
    if (state.stations.pine.value === "hoopoe") return "گربه از نور فرار می‌کند. سه قطره، سه گندم، سه دروغ؟";
    return "گربهٔ نر از دیوار گذشته. ناله‌اش میان کاج و قفس می‌چرخد.";
  }

  function interact() {
    const state = S();
    if (state.scene !== "play") return;
    const target = near();
    if (!target) return;
    if (target.type === "station") {
      openChoice(target.id);
      return;
    }
    if (target.type === "final") {
      openChoice("final");
      return;
    }
    if (target.type === "abbas") {
      openNote("عباس", abbasLine());
      audio.tar(panFor(state.abbas.x));
      return;
    }
    if (target.type === "cat") {
      openNote("گربه", catLine());
      audio.cat(panFor(state.cat.x));
    }
  }

  function spawnBurst(x, y, color, count) {
    const state = S();
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 55 + 15;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: Math.random() * 1.1 + 0.45,
        max: 1.55,
        color,
        r: Math.random() * 2.5 + 1
      });
    }
    if (state.particles.length > 180) state.particles.splice(0, state.particles.length - 180);
  }

  function updateParticles(dt) {
    const state = S();
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 18 * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }
  }

  function isHidden() {
    const state = S();
    if (!state.player.crouch) return false;
    return HIDE_SPOTS.some((spot) => TD.dist(state.player, spot) < spot.r);
  }

  function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy || 1;
    const t = TD.clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSq, 0, 1);
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    return Math.hypot(cx - px, cy - py) < radius;
  }

  function canSeePlayer() {
    const state = S();
    const supervisor = state.supervisor;
    const player = state.player;
    const d = TD.dist(supervisor, player);
    const lanternBoost = player.lantern ? 1.55 : 1;
    const range = (supervisor.state === "chase" ? 370 : 285) * lanternBoost;
    if (d > range) return false;
    const toPlayer = Math.atan2(player.y - supervisor.y, player.x - supervisor.x);
    const facing = Math.atan2(supervisor.facing.y, supervisor.facing.x);
    if (TD.angleDiff(toPlayer, facing) > Math.PI * 0.34) return false;
    if (isHidden()) return false;
    return !OBSTACLES.some((obstacle) =>
      segmentCircle(supervisor.x, supervisor.y, player.x, player.y, obstacle.x, obstacle.y, obstacle.r * 0.72)
    );
  }

  function caught() {
    const state = S();
    const supervisor = state.supervisor;
    if (supervisor.cooldown > 0 || state.scene !== "play") return;
    state.caughtCount += 1;
    supervisor.cooldown = 3.2;
    supervisor.suspicion = 0;
    supervisor.state = "return";
    supervisor.x = SUP_POINTS[0].x;
    supervisor.y = SUP_POINTS[0].y;
    supervisor.wp = 0;
    state.player.x = state.checkpoint.x;
    state.player.y = state.checkpoint.y;
    state.player.lantern = false;
    state.player.listening = false;
    state.player.crouch = false;
    state.player.lucidity = Math.max(35, state.player.lucidity);
    state.flags.caughtFlash = 1;
    clearHeld();
    toast("ناظم تو را دید. به آخرین قطره برگشتی. شهادت‌ها ماندند.", 3800);
    audio.caught(panFor(state.player.x));
    save();
  }

  function movePlayer(dt) {
    const state = S();
    const player = state.player;
    let inputX = 0;
    let inputY = 0;
    if (held.has("KeyA") || held.has("ArrowLeft") || state.touch.left) inputX -= 1;
    if (held.has("KeyD") || held.has("ArrowRight") || state.touch.right) inputX += 1;
    if (held.has("KeyW") || held.has("ArrowUp") || state.touch.up) inputY -= 1;
    if (held.has("KeyS") || held.has("ArrowDown") || state.touch.down) inputY += 1;
    const moving = inputX !== 0 || inputY !== 0;
    player.moving = moving;

    if (moving) {
      const direction = TD.norm(inputX, inputY);
      player.facing = direction;
      const speed = player.crouch ? 66 : player.listening ? 74 : 155;
      player.x += direction.x * speed * dt;
      player.y += direction.y * speed * dt;
      player.stepTimer -= dt;
      if (player.stepTimer <= 0) {
        audio.step(panFor(player.x));
        player.stepTimer = player.crouch ? 0.68 : 0.42;
      }
    }

    player.x = TD.clamp(player.x, 105, WORLD.w - 105);
    player.y = TD.clamp(player.y, 300, WORLD.h - 90);

    for (const obstacle of OBSTACLES) {
      const dx = player.x - obstacle.x;
      const dy = player.y - obstacle.y;
      const distance = Math.hypot(dx, dy);
      const minimum = obstacle.r + player.r;
      if (distance < minimum && distance > 0.001) {
        player.x = obstacle.x + (dx / distance) * minimum;
        player.y = obstacle.y + (dy / distance) * minimum;
      }
    }

    const wantsLantern = held.has("KeyL") || state.touch.lantern;
    const wantsListening = held.has("KeyH") || state.touch.listening;
    if (wantsLantern && player.lucidity > 0.5) {
      player.lantern = true;
      player.lucidity = Math.max(0, player.lucidity - 7.2 * dt);
      if (player.lucidity <= 0.5) {
        player.lantern = false;
        toast("هوشیاری تمام شد. در سایه بمان تا برگردد.");
      }
    } else {
      player.lantern = false;
      player.lucidity = Math.min(100, player.lucidity + 2.6 * dt);
    }
    player.listening = wantsListening;

    const targetX = TD.clamp(player.x, W / 2, WORLD.w - W / 2);
    const targetY = TD.clamp(player.y - 170, 300, 860);
    state.camera.x = TD.lerp(state.camera.x, targetX, Math.min(1, dt * 4.2));
    state.camera.y = TD.lerp(state.camera.y, targetY, Math.min(1, dt * 3.6));
  }

  function moveToward(entity, target, speed, dt, minimum = 8) {
    const direction = TD.norm(target.x - entity.x, target.y - entity.y);
    entity.x += direction.x * speed * dt;
    entity.y += direction.y * speed * dt;
    if (direction.x !== 0 || direction.y !== 0) entity.facing = direction;
    return TD.dist(entity, target) < minimum;
  }

  function updateSupervisor(dt) {
    const state = S();
    const supervisor = state.supervisor;
    const player = state.player;
    supervisor.cooldown = Math.max(0, supervisor.cooldown - dt);
    supervisor.suspicion = TD.clamp(supervisor.suspicion, 0, 1);

    if (supervisor.state === "chase") {
      const reached = moveToward(supervisor, player, 176, dt, 44);
      supervisor.chaseTimer += dt;
      if (TD.dist(supervisor, player) > 470) {
        supervisor.chaseTimer += dt;
      } else {
        supervisor.chaseTimer = Math.max(0, supervisor.chaseTimer - dt * 0.5);
      }
      if (reached || TD.dist(supervisor, player) < 43) {
        caught();
        return;
      }
      if (supervisor.chaseTimer > 3.4) {
        supervisor.state = "return";
        supervisor.chaseTimer = 0;
      }
    } else if (supervisor.state === "return") {
      const reached = moveToward(supervisor, SUP_POINTS[0], 100, dt, 18);
      if (reached) {
        supervisor.state = "patrol";
        supervisor.wp = 0;
      }
    } else {
      const target = SUP_POINTS[supervisor.wp];
      const reached = moveToward(supervisor, target, 54, dt, 22);
      if (reached) supervisor.wp = (supervisor.wp + 1) % SUP_POINTS.length;
    }

    const visible = canSeePlayer();
    if (visible) {
      const lantern = player.lantern ? 0.42 : 0;
      const crouch = player.crouch ? -0.16 : 0;
      supervisor.suspicion = TD.clamp(supervisor.suspicion + dt * (0.35 + lantern + crouch), 0, 1);
      if (!state.flags.supervisorSeen && supervisor.suspicion > 0.48) {
        state.flags.supervisorSeen = true;
        toast("ناظم نگاهت می‌کند. نور را کم کن یا پنهان شو.");
      }
    } else {
      supervisor.suspicion = TD.clamp(supervisor.suspicion - dt * 0.19, 0, 1);
    }

    if (supervisor.state !== "chase" && supervisor.suspicion > 0.93 && supervisor.cooldown <= 0) {
      supervisor.state = "chase";
      supervisor.chaseTimer = 0;
      audio.chime(panFor(supervisor.x));
    }
    if (supervisor.state === "chase" && supervisor.suspicion < 0.18 && TD.dist(supervisor, player) > 320) {
      supervisor.state = "return";
    }
  }

  function updateAbbas(dt) {
    const state = S();
    const abbas = state.abbas;
    abbas.timer -= dt;
    abbas.tarTimer -= dt;
    const nearPlayer = TD.dist(abbas, state.player) < 130;
    if (nearPlayer) {
      abbas.facing = TD.norm(state.player.x - abbas.x, state.player.y - abbas.y);
      if (abbas.tarTimer <= 0) {
        audio.tar(panFor(abbas.x));
        abbas.tarTimer = 9 + Math.random() * 4;
      }
    } else {
      const target = ABBAS_POINTS[abbas.wp];
      if (moveToward(abbas, target, 28, dt, 18)) {
        abbas.wp = (abbas.wp + 1) % ABBAS_POINTS.length;
        abbas.timer = 2.5;
      }
    }
  }

  function updateCat(dt) {
    const state = S();
    const cat = state.cat;
    const player = state.player;
    cat.timer -= dt;
    cat.cryTimer -= dt;
    const d = TD.dist(cat, player);
    if (player.lantern && d < 260) {
      cat.state = "flee";
    } else if (d < 150) {
      cat.state = "watch";
    } else if (cat.timer <= 0) {
      cat.state = "prowl";
    }

    if (cat.state === "flee") {
      const target = CAT_POINTS[(cat.wp + 2) % CAT_POINTS.length];
      if (moveToward(cat, target, 92, dt, 18)) {
        cat.wp = (cat.wp + 2) % CAT_POINTS.length;
        cat.timer = 1.5;
      }
    } else if (cat.state === "prowl") {
      const target = CAT_POINTS[cat.wp];
      if (moveToward(cat, target, 48, dt, 16)) {
        cat.wp = (cat.wp + 1) % CAT_POINTS.length;
        cat.timer = 1.2;
      }
    } else {
      cat.facing = TD.norm(player.x - cat.x, player.y - cat.y);
    }

    if (cat.cryTimer <= 0 && d < 520) {
      audio.cat(panFor(cat.x));
      cat.cryTimer = 7 + Math.random() * 5;
    }
  }

  function updatePrompt() {
    const target = near();
    if (!target) {
      ui.prompt.classList.add("hidden");
      return;
    }
    let text = "";
    if (target.type === "station") text = `E — ثبت شهادت ${STATIONS[target.id].label}`;
    if (target.type === "final") text = "E — بازگشت به کاج و شهادت نهایی";
    if (target.type === "abbas") text = "E — گوش دادن به عباس";
    if (target.type === "cat") text = "E — نگاه کردن به گربه";
    ui.prompt.textContent = text;
    ui.prompt.classList.remove("hidden");
  }

  function update(dt) {
    const state = S();
    if (state.scene === "play" && ui.rotate.classList.contains("show")) {
      updateHud();
      return;
    }
    state.time += dt;
    if (state.scene === "play") {
      state.elapsed += dt;
      movePlayer(dt);
      updateSupervisor(dt);
      updateAbbas(dt);
      updateCat(dt);
      updateParticles(dt);
      updatePrompt();
      state.flags.caughtFlash = Math.max(0, state.flags.caughtFlash - dt * 1.3);
      if (toastTimeout > 0) {
        toastTimeout -= dt;
        if (toastTimeout <= 0) ui.toast.classList.add("hidden");
      }
      audio.setSuspicion(state.supervisor.suspicion);
      audio.setListening(state.player.listening);
      audio.update(dt);
      updateHud();
    } else {
      updateParticles(dt * 0.4);
      if (toastTimeout > 0) {
        toastTimeout -= dt;
        if (toastTimeout <= 0) ui.toast.classList.add("hidden");
      }
      audio.update(dt);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    update(dt);
    if (TD.render) TD.render();
    requestAnimationFrame(frame);
  }

  function keydown(event) {
    const code = event.code;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) event.preventDefault();
    if (event.repeat && ["KeyE", "KeyC", "KeyJ", "KeyM", "Escape"].includes(code)) return;
    const state = S();

    if (code === "Escape") {
      if (state.scene === "play") togglePause();
      else if (state.scene === "pause") resumeGame();
      else if (state.scene === "journal") closeJournal();
      else if (state.scene === "note") closeNote();
      return;
    }
    if (code === "KeyM") {
      toggleMute();
      return;
    }
    if (code === "KeyJ") {
      if (state.scene === "play" || state.scene === "pause") openJournal();
      else if (state.scene === "journal") closeJournal();
      return;
    }
    if (state.scene !== "play") return;
    if (code === "KeyE") {
      interact();
      return;
    }
    if (code === "KeyC") {
      state.player.crouch = !state.player.crouch;
      return;
    }
    held.add(code);
  }

  function keyup(event) {
    held.delete(event.code);
  }

  function bindTouch() {
    document.querySelectorAll("[data-move]").forEach((button) => {
      const direction = button.dataset.move;
      const press = (event) => {
        event.preventDefault();
        S().touch[direction] = true;
        button.classList.add("active");
        audio.ensure();
      };
      const release = (event) => {
        event.preventDefault();
        S().touch[direction] = false;
        button.classList.remove("active");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.dataset.action;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        audio.ensure();
        if (action === "interact") interact();
        else if (action === "crouch") {
          S().player.crouch = !S().player.crouch;
          button.classList.toggle("active", S().player.crouch);
        } else {
          S().touch[action] = true;
          button.classList.add("active");
        }
      });
      const release = (event) => {
        event.preventDefault();
        if (action !== "interact" && action !== "crouch") {
          S().touch[action] = false;
          button.classList.remove("active");
        }
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
  }

  function initUi() {
    $("start-btn").addEventListener("click", startNew);
    $("continue-btn").addEventListener("click", continueGame);
    $("intro-btn").addEventListener("click", beginPlay);
    $("note-btn").addEventListener("click", closeNote);
    $("journal-btn").addEventListener("click", closeJournal);
    $("resume-btn").addEventListener("click", resumeGame);
    $("pause-journal-btn").addEventListener("click", openJournal);
    $("mute-btn").addEventListener("click", toggleMute);
    $("restart-btn").addEventListener("click", restartGame);
    $("ending-restart-btn").addEventListener("click", restartGame);
    $("rotate-btn").addEventListener("click", () => {
      document.body.classList.add("rotate-dismissed");
      syncHudVisibility();
    });
    $("ending-menu-btn").addEventListener("click", () => {
      const muted = S().settings.muted;
      localStorage.removeItem(TD.SAVE_KEY);
      TD.replaceState(TD.makeState());
      S().settings.muted = muted;
      audio.setMuted(muted);
      hideModals();
      ui.menu.classList.remove("hidden");
      ui.continueBtn.classList.add("hidden");
      ui.hud.classList.add("hidden");
      ui.mobile.classList.add("hidden");
    });
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clearHeld);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && S().scene === "play") togglePause();
    });
    document.addEventListener("pointerdown", () => audio.ensure(), { once: true });
    bindTouch();
    window.addEventListener("resize", () => {
      if (TD.resize) TD.resize();
    });
    ui.continueBtn.classList.toggle("hidden", !hasSave());
    ui.muteBtn.textContent = S().settings.muted ? "صدا: خاموش" : "صدا: روشن";
  }

  TD.startNew = startNew;
  TD.beginPlay = beginPlay;
  TD.continueGame = continueGame;
  TD.openChoice = openChoice;
  TD.resolveChoice = resolveChoice;
  TD.finish = finish;
  TD.interact = interact;
  TD.togglePause = togglePause;
  TD.resumeGame = resumeGame;
  TD.openJournal = openJournal;
  TD.closeJournal = closeJournal;
  TD.setMuted = setMuted;
  TD.toggleMute = toggleMute;
  TD.save = save;
  TD.load = load;
  TD.hasSave = hasSave;
  TD.near = near;
  TD.caught = caught;
  TD.update = update;
  TD.teleport = function (x, y) {
    const state = S();
    state.player.x = TD.clamp(x, 105, WORLD.w - 105);
    state.player.y = TD.clamp(y, 300, WORLD.h - 90);
    state.camera.x = TD.clamp(state.player.x, W / 2, WORLD.w - W / 2);
    state.camera.y = TD.clamp(state.player.y - 170, 300, 860);
  };
  TD.panFor = panFor;

  initUi();
  requestAnimationFrame(frame);
})(window.TD);
