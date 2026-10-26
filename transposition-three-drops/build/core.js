window.TD = window.TD || {};
(function (TD) {
  "use strict";

  const W = 1280;
  const H = 720;
  const WORLD = { w: 1800, h: 1200 };
  const SAVE_KEY = "threeDrops.v1";
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const norm = (x, y) => {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  };
  const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  const STATIONS = {
    pine: { x: 900, y: 370, zone: 126, label: "کاج" },
    wall: { x: 390, y: 540, zone: 96, label: "قفس" },
    door: { x: 1460, y: 540, zone: 100, label: "در آبی" }
  };

  const SPAWN = { x: 900, y: 1070 };
  const CHECKPOINTS = {
    pine: { x: 900, y: 545 },
    wall: { x: 535, y: 660 },
    door: { x: 1305, y: 660 }
  };
  const SUP_POINTS = [
    { x: 1120, y: 720 },
    { x: 1100, y: 500 },
    { x: 760, y: 470 },
    { x: 610, y: 720 },
    { x: 980, y: 900 }
  ];
  const ABBAS_POINTS = [
    { x: 560, y: 780 },
    { x: 680, y: 690 },
    { x: 475, y: 860 },
    { x: 745, y: 850 }
  ];
  const CAT_POINTS = [
    { x: 860, y: 430 },
    { x: 1010, y: 520 },
    { x: 1180, y: 610 },
    { x: 770, y: 670 },
    { x: 1340, y: 730 }
  ];
  const HIDE_SPOTS = [
    { x: 640, y: 680, r: 92 },
    { x: 1220, y: 850, r: 86 },
    { x: 1040, y: 620, r: 72 }
  ];
  const OBSTACLES = [
    { x: 900, y: 370, r: 46 },
    { x: 390, y: 540, r: 40 },
    { x: 1460, y: 540, r: 32 },
    { x: 600, y: 735, r: 25 },
    { x: 1230, y: 790, r: 25 }
  ];

  const CHOICES = {
    pine: {
      kicker: "شهادت اول — کاج",
      title: "سه قطره در پای کاج",
      echo: "«آن سه قطره خون مال گربه است، ولی از خودش که بپرسند می‌گوید مال مرغ حق است.»",
      question: "زیر کاج، سه قطره تازه است. کدام روایت را ثبت می‌کنی؟",
      options: [
        { value: "cat", label: "خون گربه است.", sub: "نازی، گربهٔ ماده، در سایه ایستاده است." },
        { value: "hoopoe", label: "خون مرغ حق است.", sub: "پرنده‌ای در باد، سه گندم، یک اسطوره." }
      ]
    },
    wall: {
      kicker: "شهادت دوم — قفس",
      title: "قفس خالی",
      echo: "«مرغ حق سه گندم خورده است. گربه قناری را گرفته است.»",
      question: "قفس خالی است و خون روی دیوار. چه اتفاقی افتاد؟",
      options: [
        { value: "hoopoe", label: "مرغ حق سه گندم خورده.", sub: "قفس را ناظم باز کرده؛ خون، بهای یک افسانه است." },
        { value: "cat", label: "گربه قناری را گرفته.", sub: "پرها روی سنگ؛ گربه از دیوار گذشته است." }
      ]
    },
    door: {
      kicker: "شهادت سوم — در آبی",
      title: "آستانهٔ آبی",
      echo: "«تو که به چشم خودت دیدی، تو که شاهد من هستی؟»",
      question: "خون روی آستانه خشک شده. از کیست؟",
      options: [
        { value: "self", label: "خون خودم است.", sub: "دستت بی‌حس است. آستانه از تو یاد دارد." },
        { value: "siavash", label: "خون سیاوش است.", sub: "اتاق خالی است؛ تار هنوز می‌لرزد." }
      ]
    },
    final: {
      kicker: "شهادت نهایی — کاج",
      title: "سه قطره، یک انتخاب",
      echo: "«این دیوانه است.»",
      question: "حالا که سه شهادت داری، سه قطره خون مال کیست؟",
      options: [
        { value: "cat", label: "خون گربه است.", sub: "روایت خودت را حفظ می‌کنی." },
        { value: "hoopoe", label: "خون مرغ حق است.", sub: "اسطوره را انتخاب می‌کنی؛ باغ آرام می‌شود." },
        { value: "self", label: "خون خودم است.", sub: "شاهد، عامل می‌شود." },
        { value: "silence", label: "نمی‌دانم.", sub: "از شهادت امتناع می‌کنی." }
      ]
    }
  };

  const JOURNAL = {
    pine: { cat: "خون گربه است.", hoopoe: "خون مرغ حق است." },
    wall: { hoopoe: "مرغ حق سه گندم خورده.", cat: "گربه قناری را گرفته." },
    door: { self: "خون خودم است.", siavash: "خون سیاوش است." }
  };

  const ENDINGS = {
    cat: {
      kicker: "پایان — شهادت",
      title: "کاغذی که صبح نبود",
      text: "گربه از سایه بیرون می‌آید. نگاهت می‌کند. ناظم می‌گوید: «این دیوانه است.»\n\nاما تو نوشتی. سه قطره، سه شهادت، یک کاغذ. صبح، کاغذ نیست."
    },
    hoopoe: {
      kicker: "پایان — اسطوره",
      title: "سه گندم",
      text: "مرغ حق روی کاج می‌نشیند. سه گندم می‌خورد. خون از آستانه پاک می‌شود.\n\nناظم لبخند می‌زند. تو می‌دانی که دروغ گفته‌ای؛ اما باغ آرام است."
    },
    self: {
      kicker: "پایان — اعتراف",
      title: "آستانه",
      text: "دستت را روی آستانه می‌گذاری. خون گرم است. سیاوش پشت پنجره است.\n\nدر را می‌بندی. این بار شاهد، عامل است."
    },
    silence: {
      kicker: "پایان — سکوت",
      title: "نمی‌دانم",
      text: "«نمی‌دانم.»\n\nناظم شانه بالا می‌اندازد. کاغذ را می‌گیرد. سه قطره خشک می‌شود.\n\nپشت پنجره، رخساره و سیاوش در آغوش‌اند. تو فقط نگاه می‌کنی."
    }
  };

  function makeState() {
    return {
      scene: "menu",
      phase: "explore",
      started: false,
      time: 0,
      elapsed: 0,
      caughtCount: 0,
      choiceId: null,
      journalReturn: "play",
      player: {
        x: SPAWN.x,
        y: SPAWN.y,
        r: 15,
        lantern: false,
        listening: false,
        crouch: false,
        lucidity: 100,
        facing: { x: 0, y: -1 },
        moving: false,
        stepTimer: 0,
        breath: 0
      },
      camera: { x: SPAWN.x, y: 860 },
      supervisor: {
        x: SUP_POINTS[0].x,
        y: SUP_POINTS[0].y,
        wp: 0,
        state: "patrol",
        suspicion: 0,
        facing: { x: -1, y: 0 },
        chaseTimer: 0,
        cooldown: 0,
        talked: false
      },
      abbas: {
        x: ABBAS_POINTS[0].x,
        y: ABBAS_POINTS[0].y,
        wp: 0,
        timer: 0,
        tarTimer: 3,
        facing: { x: 1, y: 0 }
      },
      cat: {
        x: CAT_POINTS[0].x,
        y: CAT_POINTS[0].y,
        wp: 0,
        state: "watch",
        timer: 0,
        cryTimer: 4,
        visible: true,
        facing: { x: -1, y: 0 }
      },
      stations: {
        pine: { done: false, value: null },
        wall: { done: false, value: null },
        door: { done: false, value: null }
      },
      final: null,
      checkpoint: { x: SPAWN.x, y: SPAWN.y },
      flags: {
        caughtFlash: 0,
        toastTimer: 0,
        warned: false,
        supervisorSeen: false
      },
      touch: {
        up: false,
        down: false,
        left: false,
        right: false,
        lantern: false,
        listening: false
      },
      settings: {
        muted: false,
        reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      },
      particles: []
    };
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  let state = makeState();

  TD.W = W;
  TD.H = H;
  TD.WORLD = WORLD;
  TD.SAVE_KEY = SAVE_KEY;
  TD.clamp = clamp;
  TD.lerp = lerp;
  TD.dist = dist;
  TD.norm = norm;
  TD.angleDiff = angleDiff;
  TD.STATIONS = STATIONS;
  TD.SPAWN = SPAWN;
  TD.CHECKPOINTS = CHECKPOINTS;
  TD.SUP_POINTS = SUP_POINTS;
  TD.ABBAS_POINTS = ABBAS_POINTS;
  TD.CAT_POINTS = CAT_POINTS;
  TD.HIDE_SPOTS = HIDE_SPOTS;
  TD.OBSTACLES = OBSTACLES;
  TD.CHOICES = CHOICES;
  TD.JOURNAL = JOURNAL;
  TD.ENDINGS = ENDINGS;
  TD.makeState = makeState;
  TD.formatTime = formatTime;
  TD.replaceState = function (next) { state = next; };
  TD.allDone = function (s) {
    const value = s || state;
    return value.stations.pine.done && value.stations.wall.done && value.stations.door.done;
  };
  TD.doneCount = function (s) {
    const value = s || state;
    return ["pine", "wall", "door"].filter((id) => value.stations[id].done).length;
  };
  Object.defineProperty(TD, "state", { get: function () { return state; } });
})(window.TD);
