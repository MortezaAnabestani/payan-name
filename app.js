(function () {
  "use strict";

  var STORAGE_KEY = "se-qatre-khoon-v2";
  var VALID_SCENES = ["cover", "write", "hub", "asylum", "memory", "song", "testimony", "end"];
  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  var SPEAKERS = [
    { id: "man", label: "من / راوی" },
    { id: "siavash", label: "سیاوش" },
    { id: "nazem", label: "ناظم" },
    { id: "archivist", label: "بایگان / صدای پرونده" }
  ];

  var LIE_MAP = {
    man: "siavash",
    siavash: "nazem",
    nazem: "archivist",
    archivist: "man"
  };

  var ASYLUM_FRAGMENTS = [
    {
      id: "f1",
      text: "از دیروز تا حالا هر چه فکر می‌کنم چیزی ندارم که بنویسم.",
      source: "لایهٔ ۱ / آغاز"
    },
    {
      id: "f2",
      text: "یکسال است که میان این مردهان عجیب و غریب زندگی می‌کنم.",
      source: "لایهٔ ۲ / آسایشگاه"
    },
    {
      id: "f3",
      text: "همهٔ اینها زیر سر ناظم خودمان است.",
      source: "لایهٔ ۲ / نظم"
    },
    {
      id: "f4",
      text: "من با همین ششلول که دیدی، در سه قدمی نشان رفتم.",
      source: "لایهٔ ۴ / روایت سیاوش"
    },
    {
      id: "f5",
      text: "آن سه قطره خون مال گربه نیست، مال مرغ حق است.",
      source: "لایهٔ ۴ / انکار"
    }
  ];

  var MEMORY_EVENTS = [
    {
      id: "e1",
      text: "صدای خالی شدن تیر از خانهٔ سیاوش می‌آید.",
      source: "لایهٔ ۳ / خاطره"
    },
    {
      id: "e2",
      text: "سیاوش در حیاط، با پیراهن و زیرشلواری، ایستاده است.",
      source: "لایهٔ ۳ / خاطره"
    },
    {
      id: "e3",
      text: "سه چکه خون تازه پای درخت کاج چکیده است.",
      source: "لایهٔ ۳ / موتیف"
    },
    {
      id: "e4",
      text: "نازی دو شب و دو روز پای جفت مرده‌اش کشیک می‌دهد.",
      source: "لایهٔ ۴ / روایت سیاوش"
    },
    {
      id: "e5",
      text: "سیاوش می‌گوید هر شب گربه می‌آید و ناله می‌کشد.",
      source: "لایهٔ ۴ / تکرار"
    },
    {
      id: "e6",
      text: "رخساره و مادرش وارد می‌شوند؛ رخساره گل در دست دارد.",
      source: "لایهٔ ۳ / قطع روایت"
    }
  ];

  var MEMORY_INTERPRETATIONS = [
    { id: "i1", text: "صدای تیر، روایت را از یک خانه به خانهٔ دیگر می‌برد." },
    { id: "i2", text: "حافظه، بدن را در صحنه نگه می‌دارد تا روایت ادامه پیدا کند." },
    { id: "i3", text: "موتیف از یک لایه به لایهٔ دیگر می‌گذرد و معنا عوض می‌کند." },
    { id: "i4", text: "تکرار سوگ، مرده را زنده نگه می‌دارد." },
    { id: "i5", text: "راوی، روایت دیگری را به عنوان شاهد نقل می‌کند." },
    { id: "i6", text: "ورود دیگری، روایت را قطع می‌کند و آبروی آن را می‌برد." }
  ];

  var SONG_LINES = [
    "دریغا که بار دگر شام شد،",
    "سراپای گیتی سیه‌فام شد،",
    "همه خلق را گاه آرام شد؛",
    "مگر من که رنج و غمم شد فزون.",
    "جهان را نباشد خوشی در مزاج،",
    "بجز مرگ نبود غمم را علاج،",
    "ولیکن در آن گوشه در پای کاج،",
    "چکیده‌است بر خاک سه قطره خون."
  ];

  var SONG_ROUNDS = [
    {
      lineIndex: 7,
      target: "خون",
      options: ["خون", "خاک", "باران", "آینه"],
      prompt: "آخرین واژهٔ تصنیف را انتخاب کن."
    },
    {
      lineIndex: 3,
      target: "فزون",
      options: ["فزون", "کم", "پنهان", "دیگر"],
      prompt: "واژهٔ پایان این بیت را عوض کن."
    },
    {
      lineIndex: 6,
      target: "کاج",
      options: ["کاج", "حیاط", "قفس", "خون"],
      prompt: "درخت را دوباره نام بگذار."
    }
  ];

  var DEFAULT_MUTATION_WORDS = ["کاغذ", "آسایشگاه", "قفس", "ناظم", "خاطره", "پرونده"];
  var EXTRACTION_STOP_WORDS = {
    "من": true,
    "تو": true,
    "او": true,
    "ما": true,
    "شما": true,
    "آن": true,
    "این": true,
    "که": true,
    "را": true,
    "و": true,
    "در": true,
    "به": true,
    "از": true,
    "با": true,
    "بر": true,
    "برای": true,
    "یک": true,
    "هم": true,
    "نه": true,
    "بله": true,
    "است": true,
    "بود": true,
    "شد": true,
    "شده": true,
    "می": true,
    "نمی": true,
    "چه": true,
    "چی": true,
    "هر": true,
    "همه": true,
    "هیچ": true,
    "حالا": true,
    "دیروز": true,
    "امروز": true,
    "فکر": true,
    "می‌کنم": true,
    "می‌کنی": true,
    "می‌کند": true,
    "دارم": true,
    "داری": true,
    "دارد": true,
    "ندارم": true,
    "نیست": true,
    "هستم": true,
    "هستی": true,
    "هست": true
  };
  var STOP_WORDS = {
    "که": true,
    "این": true,
    "برای": true,
    "چیزی": true,
    "همان": true,
    "است": true,
    "بود": true,
    "شده": true,
    "می‌شود": true,
    "می‌کنم": true,
    "می‌کردم": true,
    "ندارم": true,
    "دارم": true,
    "حالا": true,
    "دیروز": true,
    "تنها": true,
    "همیشه": true,
    "یکسال": true
  };

  var $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  var $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  var state;
  var storageOK = true;
  var writeEditing = false;
  var memoryNote = "";
  var lastFocus = null;
  var toastTimer = null;
  var pageRegions = [];

  function fa(value) {
    return String(value).replace(/\d/g, function (digit) {
      return FA_DIGITS[Number(digit)];
    });
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function speakerLabel(id) {
    var speaker = SPEAKERS.find(function (item) {
      return item.id === id;
    });
    return speaker ? speaker.label : id;
  }

  function fragmentById(id) {
    return ASYLUM_FRAGMENTS.find(function (item) {
      return item.id === id;
    });
  }

  function eventById(id) {
    return MEMORY_EVENTS.find(function (item) {
      return item.id === id;
    });
  }

  function interpretationById(id) {
    return MEMORY_INTERPRETATIONS.find(function (item) {
      return item.id === id;
    });
  }

  function extractWords(text) {
    var matches = String(text).match(/[\u0600-\u06FF\u200c]+/g) || [];
    var seen = {};
    var words = [];
    matches.forEach(function (raw) {
      var word = raw.replace(/\u200c/g, "‌").trim();
      if (word.length < 3 || EXTRACTION_STOP_WORDS[word] || STOP_WORDS[word] || seen[word]) {
        return;
      }
      seen[word] = true;
      words.push(word);
    });
    return words.slice(0, 3);
  }

  function allExtractedWords() {
    var seen = {};
    var words = [];
    state.writeAttempts.forEach(function (attempt) {
      (attempt.extracted || []).forEach(function (word) {
        if (!seen[word]) {
          seen[word] = true;
          words.push(word);
        }
      });
    });
    return words;
  }

  function correctionCount() {
    return state.modules.asylum.assignments.filter(function (assignment) {
      return assignment.corrected;
    }).length;
  }

  function gapCount() {
    return state.modules.memory.pairs.filter(function (pair) {
      return pair.gap;
    }).length;
  }

  function changedWordCount() {
    return state.modules.song.rounds.filter(function (round) {
      return round.choice !== round.target;
    }).length;
  }

  function pressureValue() {
    return correctionCount() * 2 +
      gapCount() +
      Math.max(0, state.writeAttempts.length - 1) +
      changedWordCount();
  }

  function pressureLabel(value) {
    if (value >= 9) {
      return "باز";
    }
    if (value >= 6) {
      return "ترک‌خورده";
    }
    if (value >= 3) {
      return "لرزان";
    }
    return "آرام";
  }

  function pressureSentence(value) {
    if (value >= 9) {
      return "سند از چند جا باز شده است. بایگان دیگر نمی‌تواند یک نسخهٔ واحد بسازد.";
    }
    if (value >= 6) {
      return "لرزش سند بالا رفته است. بعضی واژه‌ها جای خودشان را عوض کرده‌اند.";
    }
    if (value >= 3) {
      return "سند کمی می‌لرزد؛ اما هنوز یک روایت می‌سازد.";
    }
    return "سند آرام است؛ شاید بیش از حد آرام.";
  }

  function systemAddendum() {
    var value = pressureValue();
    if (value < 4) {
      return "";
    }
    var words = allExtractedWords().slice(-3);
    if (!words.length) {
      words = ["کاغذ", "صدا", "پرونده"];
    }
    return "از نوشتهٔ پاک‌شده‌ات، «" + words.join("»، «") + "» در پرونده ماند. " +
      "بایگان نمی‌داند این واژه‌ها به چه کسی تعلق دارند؛ فقط می‌داند که پاک نشده‌اند.";
  }

  function freshState() {
    return {
      version: 2,
      scene: "cover",
      startedAt: null,
      writeAttempts: [],
      modules: {
        asylum: {
          selected: [],
          assignments: [],
          pending: null,
          done: false
        },
        memory: {
          pairs: [],
          selectedEvent: null,
          done: false
        },
        song: {
          lines: SONG_LINES.slice(),
          rounds: [],
          showResult: false,
          done: false
        }
      },
      final: {
        signed: null,
        witness: "",
        note: "",
        stampedAt: null
      },
      settings: {
        sound: false,
        textSize: "md",
        reducedMotion: false
      }
    };
  }

  function normalizeAttempt(attempt) {
    if (typeof attempt === "string") {
      return {
        text: attempt.slice(0, 1200),
        at: null,
        extracted: extractWords(attempt)
      };
    }
    if (attempt && typeof attempt.text === "string") {
      var extracted = Array.isArray(attempt.extracted)
        ? attempt.extracted.filter(function (word) {
            return typeof word === "string" && word.length > 1;
          }).slice(0, 3)
        : extractWords(attempt.text);
      return {
        text: attempt.text.slice(0, 1200),
        at: Number.isFinite(attempt.at) ? attempt.at : null,
        extracted: extracted
      };
    }
    return null;
  }

  function normalizeState(saved) {
    var out = freshState();
    var modules = saved.modules || {};
    var asylum = modules.asylum || {};
    var memory = modules.memory || {};
    var song = modules.song || {};
    var final = saved.final || {};
    var settings = saved.settings || {};
    var validFragmentIds = ASYLUM_FRAGMENTS.map(function (item) {
      return item.id;
    });
    var validSpeakers = SPEAKERS.map(function (item) {
      return item.id;
    });
    var validEventIds = MEMORY_EVENTS.map(function (item) {
      return item.id;
    });
    var validInterpretationIds = MEMORY_INTERPRETATIONS.map(function (item) {
      return item.id;
    });
    var selectedSet = {};
    var assignedSet = {};

    out.scene = VALID_SCENES.indexOf(saved.scene) >= 0 ? saved.scene : "cover";
    out.startedAt = Number.isFinite(saved.startedAt) ? saved.startedAt : null;
    out.writeAttempts = Array.isArray(saved.writeAttempts)
      ? saved.writeAttempts.map(normalizeAttempt).filter(Boolean)
      : [];

    out.modules.asylum.selected = Array.isArray(asylum.selected)
      ? asylum.selected.filter(function (id) {
          if (validFragmentIds.indexOf(id) < 0 || selectedSet[id]) {
            return false;
          }
          selectedSet[id] = true;
          return true;
        }).slice(0, 3)
      : [];

    out.modules.asylum.assignments = Array.isArray(asylum.assignments)
      ? asylum.assignments.filter(function (item) {
          if (!item || validFragmentIds.indexOf(item.fragmentId) < 0) {
            return false;
          }
          if (assignedSet[item.fragmentId]) {
            return false;
          }
          if (validSpeakers.indexOf(item.finalSpeaker) < 0) {
            return false;
          }
          assignedSet[item.fragmentId] = true;
          return true;
        }).map(function (item) {
          return {
            fragmentId: item.fragmentId,
            playerSpeaker: validSpeakers.indexOf(item.playerSpeaker) >= 0 ? item.playerSpeaker : item.finalSpeaker,
            systemSpeaker: validSpeakers.indexOf(item.systemSpeaker) >= 0 ? item.systemSpeaker : item.finalSpeaker,
            finalSpeaker: item.finalSpeaker,
            corrected: Boolean(item.corrected),
            at: Number.isFinite(item.at) ? item.at : null
          };
        })
      : [];

    if (out.modules.asylum.selected.length < 3) {
      out.modules.asylum.selected = [];
      out.modules.asylum.assignments = [];
      out.modules.asylum.pending = null;
    }

    if (
      asylum.pending &&
      validFragmentIds.indexOf(asylum.pending.fragmentId) >= 0 &&
      validSpeakers.indexOf(asylum.pending.playerSpeaker) >= 0 &&
      validSpeakers.indexOf(asylum.pending.systemSpeaker) >= 0 &&
      !assignedSet[asylum.pending.fragmentId]
    ) {
      out.modules.asylum.pending = {
        fragmentId: asylum.pending.fragmentId,
        playerSpeaker: asylum.pending.playerSpeaker,
        systemSpeaker: asylum.pending.systemSpeaker,
        correcting: Boolean(asylum.pending.correcting)
      };
    }

    out.modules.asylum.done = Boolean(asylum.done) && out.modules.asylum.assignments.length === 3;

    var seenEvents = {};
    var seenInterpretations = {};
    out.modules.memory.pairs = Array.isArray(memory.pairs)
      ? memory.pairs.filter(function (pair) {
          if (!pair) {
            return false;
          }
          if (validEventIds.indexOf(pair.eventId) < 0 || validInterpretationIds.indexOf(pair.interpretationId) < 0) {
            return false;
          }
          if (seenEvents[pair.eventId] || seenInterpretations[pair.interpretationId]) {
            return false;
          }
          seenEvents[pair.eventId] = true;
          seenInterpretations[pair.interpretationId] = true;
          return true;
        }).map(function (pair) {
          return {
            eventId: pair.eventId,
            interpretationId: pair.interpretationId,
            gap: Boolean(pair.gap),
            at: Number.isFinite(pair.at) ? pair.at : null
          };
        })
      : [];

    out.modules.memory.selectedEvent =
      validEventIds.indexOf(memory.selectedEvent) >= 0 && !seenEvents[memory.selectedEvent]
        ? memory.selectedEvent
        : null;
    out.modules.memory.done = Boolean(memory.done) && out.modules.memory.pairs.length >= 3;

    if (Array.isArray(song.lines) && song.lines.length === SONG_LINES.length && song.lines.every(function (line) {
      return typeof line === "string";
    })) {
      out.modules.song.lines = song.lines.slice();
    }

    out.modules.song.rounds = Array.isArray(song.rounds)
      ? song.rounds.filter(function (round) {
          return round &&
            Number.isInteger(round.lineIndex) &&
            round.lineIndex >= 0 &&
            round.lineIndex < SONG_LINES.length &&
            typeof round.target === "string" &&
            typeof round.choice === "string";
        }).slice(0, 3).map(function (round) {
          return {
            lineIndex: round.lineIndex,
            target: round.target,
            choice: round.choice,
            playerChange: round.playerChange || null,
            systemChange: round.systemChange || null
          };
        })
      : [];

    out.modules.song.showResult = Boolean(song.showResult) && out.modules.song.rounds.length > 0;
    out.modules.song.done = Boolean(song.done) && out.modules.song.rounds.length === 3;

    out.final.signed = saved.final && typeof saved.final.signed === "boolean" ? saved.final.signed : null;
    out.final.witness = typeof final.witness === "string" ? final.witness.slice(0, 60) : "";
    out.final.note = typeof final.note === "string" ? final.note.slice(0, 280) : "";
    out.final.stampedAt = Number.isFinite(final.stampedAt) ? final.stampedAt : null;

    out.settings.sound = Boolean(settings.sound);
    out.settings.textSize = ["sm", "md", "lg"].indexOf(settings.textSize) >= 0 ? settings.textSize : "md";
    out.settings.reducedMotion = Boolean(settings.reducedMotion);

    return out;
  }

  function loadState() {
    var saved = null;
    var hadSaved = false;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        hadSaved = true;
        saved = JSON.parse(raw);
      }
    } catch (error) {
      storageOK = false;
    }

    if (!hadSaved) {
      var base = freshState();
      if (window.matchMedia) {
        base.settings.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
      return base;
    }

    if (!saved || saved.version !== 2) {
      return freshState();
    }

    return normalizeState(saved);
  }

  function save() {
    if (!storageOK) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      storageOK = false;
    }
  }

  function allModulesDone() {
    return ["asylum", "memory", "song"].every(function (key) {
      return state.modules[key].done;
    });
  }

  function countDone() {
    return ["asylum", "memory", "song"].filter(function (key) {
      return state.modules[key].done;
    }).length;
  }

  function moduleInProgress(key) {
    if (key === "asylum") {
      return state.modules.asylum.selected.length > 0 || state.modules.asylum.assignments.length > 0;
    }
    if (key === "memory") {
      return state.modules.memory.pairs.length > 0 || Boolean(state.modules.memory.selectedEvent);
    }
    if (key === "song") {
      return state.modules.song.rounds.length > 0;
    }
    return false;
  }

  function motionReduced() {
    return Boolean(state.settings.reducedMotion);
  }

  function announce(message) {
    var live = $("#a11yStatus");
    if (!live) {
      return;
    }
    live.textContent = "";
    window.setTimeout(function () {
      live.textContent = message;
    }, 30);
  }

  function showToast(message) {
    var toast = $("#toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3400);
  }

  var audio = (function () {
    var context = null;
    var enabled = false;

    function ensureContext() {
      if (!enabled) {
        return null;
      }
      if (!context) {
        var Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) {
          return null;
        }
        context = new Context();
      }
      if (context.state === "suspended") {
        context.resume().catch(function () {});
      }
      return context;
    }

    function tone(frequency, duration, type, gainValue, slideTo, delay) {
      var ctx = ensureContext();
      if (!ctx) {
        return;
      }
      var start = ctx.currentTime + (delay || 0);
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      if (slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.025, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    function noise(duration, gainValue, filterFrequency) {
      var ctx = ensureContext();
      if (!ctx) {
        return;
      }
      var length = Math.max(1, Math.floor(ctx.sampleRate * duration));
      var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var index = 0; index < length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
      var source = ctx.createBufferSource();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = filterFrequency || 1200;
      gain.gain.setValueAtTime(gainValue || 0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    }

    return {
      setEnabled: function (value) {
        enabled = Boolean(value);
        if (enabled) {
          ensureContext();
        }
      },
      play: function (name) {
        if (!enabled) {
          return;
        }
        if (name === "click") {
          tone(340, 0.07, "triangle", 0.016);
        } else if (name === "erase") {
          noise(0.22, 0.025, 1300);
          tone(190, 0.28, "sine", 0.018, 72);
        } else if (name === "drop") {
          tone(680, 0.2, "sine", 0.024, 240);
        } else if (name === "stamp") {
          tone(92, 0.13, "sine", 0.04, 55);
          noise(0.07, 0.028, 420);
        } else if (name === "complete") {
          tone(392, 0.14, "sine", 0.022);
          tone(523.25, 0.22, "sine", 0.02, null, 0.1);
        } else if (name === "toggle") {
          tone(440, 0.1, "triangle", 0.018);
        }
      }
    };
  })();

  function applySettings() {
    var root = document.documentElement;
    root.dataset.textSize = state.settings.textSize;
    root.dataset.motion = state.settings.reducedMotion ? "reduced" : "full";
    var soundToggle = $("#soundToggle");
    var motionToggle = $("#motionToggle");
    var textSizeSelect = $("#textSizeSelect");
    if (soundToggle) {
      soundToggle.checked = Boolean(state.settings.sound);
    }
    if (motionToggle) {
      motionToggle.checked = Boolean(state.settings.reducedMotion);
    }
    if (textSizeSelect) {
      textSizeSelect.value = state.settings.textSize;
    }
    audio.setEnabled(state.settings.sound);
  }

  function setPageInert(value) {
    pageRegions.forEach(function (region) {
      if (region) {
        region.inert = value;
      }
    });
  }

  function openDialog(dialog) {
    if (!dialog) {
      return;
    }
    closeArchive();
    $$("dialog[open]").forEach(function (openDialogElement) {
      if (openDialogElement !== dialog) {
        closeDialog(openDialogElement);
      }
    });
    if (dialog.open) {
      return;
    }
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) {
      return;
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function openArchive() {
    var drawer = $("#archiveDrawer");
    var overlay = $("#drawerOverlay");
    if (!drawer || !overlay) {
      return;
    }
    lastFocus = document.activeElement;
    renderArchive();
    drawer.inert = false;
    overlay.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    $("#archiveBtn").setAttribute("aria-expanded", "true");
    document.body.classList.add("has-drawer");
    setPageInert(true);
    window.requestAnimationFrame(function () {
      drawer.classList.add("is-open");
      $("#archiveClose").focus();
    });
  }

  function closeArchive() {
    var drawer = $("#archiveDrawer");
    var overlay = $("#drawerOverlay");
    if (!drawer || !overlay || !drawer.classList.contains("is-open")) {
      return;
    }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    $("#archiveBtn").setAttribute("aria-expanded", "false");
    document.body.classList.remove("has-drawer");
    setPageInert(false);
    drawer.inert = true;
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function trapDrawerFocus(event) {
    if (event.key !== "Tab") {
      return;
    }
    var drawer = $("#archiveDrawer");
    if (!drawer || !drawer.classList.contains("is-open")) {
      return;
    }
    var focusable = $$(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      drawer
    );
    if (!focusable.length) {
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function canEnter(name) {
    if (name === "cover" || name === "write") {
      return true;
    }
    if (!state.writeAttempts.length) {
      return false;
    }
    if (name === "hub" || name === "asylum" || name === "memory" || name === "song") {
      return true;
    }
    if (name === "testimony" || name === "end") {
      return allModulesDone();
    }
    return false;
  }

  function fallbackFor(name) {
    if (name === "testimony" || name === "end") {
      if (!allModulesDone()) {
        return state.writeAttempts.length ? "hub" : "write";
      }
      return state.final.signed === null ? "testimony" : "end";
    }
    if (name === "hub" || name === "asylum" || name === "memory" || name === "song") {
      return state.writeAttempts.length ? "hub" : "write";
    }
    return "cover";
  }

  function goTo(name) {
    var next = canEnter(name) ? name : fallbackFor(name);
    if (next === "end" && state.final.signed === null) {
      next = allModulesDone() ? "testimony" : "hub";
    }
    if (next !== "cover" && !state.startedAt) {
      state.startedAt = Date.now();
    }
    showScene(next);
  }

  function showScene(name, options) {
    var opts = options || {};
    var validName = VALID_SCENES.indexOf(name) >= 0 ? name : "cover";
    state.scene = validName;
    save();
    document.body.dataset.scene = validName;
    $$(".scene").forEach(function (section) {
      section.hidden = section.dataset.scene !== validName;
    });
    renderScene(validName);
    updateChrome();
    if (opts.focus !== false) {
      window.requestAnimationFrame(function () {
        var section = $('.scene[data-scene="' + validName + '"]');
        var heading = section ? section.querySelector("h1, h2") : null;
        if (heading) {
          heading.focus({ preventScroll: true });
        }
        window.scrollTo(0, 0);
      });
    }
  }

  function renderScene(name) {
    if (name === "cover") {
      renderCover();
    } else if (name === "write") {
      renderWrite();
    } else if (name === "hub") {
      renderHub();
    } else if (name === "asylum") {
      renderAsylum();
    } else if (name === "memory") {
      renderMemory();
    } else if (name === "song") {
      renderSong();
    } else if (name === "testimony") {
      renderTestimony();
    } else if (name === "end") {
      renderEnd();
    }
  }

  function updateChrome() {
    var done = countDone();
    var progress = $("#progressLabel");
    if (progress) {
      progress.textContent = "پرونده " + fa(done) + "/۳";
    }
    var titles = {
      cover: "سه قطره خون | بازی ادبی تراگشتی",
      write: "برگهٔ ثبت | سه قطره خون",
      hub: "سه در | سه قطره خون",
      asylum: "آسایشگاه | سه قطره خون",
      memory: "خاطره | سه قطره خون",
      song: "تصنیف | سه قطره خون",
      testimony: "شهادتنامه | سه قطره خون",
      end: "پرونده بسته شد | سه قطره خون"
    };
    document.title = titles[state.scene] || titles.cover;
  }

  function renderCover() {
    var startBtn = $("#startBtn");
    if (!startBtn) {
      return;
    }
    if (allModulesDone() && state.final.signed !== null) {
      startBtn.textContent = "دیدن سند";
    } else if (state.writeAttempts.length) {
      startBtn.textContent = "ادامهٔ پرونده";
    } else {
      startBtn.textContent = "شروع پرونده";
    }
  }

  function resetPaperVisual() {
    var input = $("#writeInput");
    var echo = $("#paperEcho");
    var motif = $("#paperMotif");
    var status = $("#paperStatus");
    if (!input || !echo || !motif || !status) {
      return;
    }
    input.hidden = false;
    input.readOnly = false;
    input.classList.remove("is-shaking");
    echo.textContent = "";
    echo.classList.remove("is-visible", "is-fading");
    motif.classList.remove("is-visible");
    status.textContent = "";
  }

  function renderExtractionStrip() {
    var strip = $("#extractionStrip");
    if (!strip) {
      return;
    }
    var words = allExtractedWords();
    if (!words.length) {
      strip.hidden = true;
      strip.innerHTML = "";
      return;
    }
    strip.hidden = false;
    strip.innerHTML =
      '<span class="field-label">بایگان برداشت</span>' +
      '<span class="word-chips">' +
        words.map(function (word) {
          return '<span class="word-chip">' + esc(word) + "</span>";
        }).join("") +
      "</span>" +
      '<p class="hint">این واژه‌ها بعداً در تصنیف و سند برمی‌گردند.</p>';
  }

  function renderWrite() {
    var attempts = state.writeAttempts;
    var attemptCount = $("#attemptCount");
    var input = $("#writeInput");
    var echo = $("#paperEcho");
    var motif = $("#paperMotif");
    var status = $("#paperStatus");
    var submit = $("#submitWrite");
    var retry = $("#retryWrite");
    var continueButton = $("#continueFromWrite");
    var writeHint = $("#writeHint");

    if (!input) {
      return;
    }

    if (attemptCount) {
      attemptCount.textContent = fa(attempts.length);
    }

    renderExtractionStrip();

    var transformed = attempts.length > 0 && !writeEditing;

    if (transformed) {
      input.hidden = true;
      input.readOnly = true;
      echo.classList.remove("is-visible", "is-fading");
      echo.textContent = "";
      motif.classList.add("is-visible");
      submit.hidden = true;
      submit.disabled = false;
      retry.hidden = attempts.length >= 3;
      continueButton.hidden = false;
      var extractedWords = allExtractedWords();
      status.textContent = "ثبت شد. خروجی معنادار: ۰. آنچه خوانده شد: «سه قطره خون.»" +
        (extractedWords.length ? " واژه‌های ضبط‌شده: «" + extractedWords.join("»، «") + "»." : "");
      writeHint.textContent = attempts.length >= 3
        ? "کاغذ پر شد. جای دیگری برای نوشتن نیست؛ اما واژه‌های برداشت‌شده در پرونده مانده‌اند."
        : "می‌توانی یک بار دیگر بنویسی؛ بایگان باز هم همان را خواهد خواند و واژه‌های بیشتری برمی‌دارد.";
    } else {
      input.hidden = false;
      input.readOnly = false;
      echo.classList.remove("is-visible", "is-fading");
      echo.textContent = "";
      motif.classList.remove("is-visible");
      submit.hidden = false;
      submit.disabled = false;
      retry.hidden = true;
      continueButton.hidden = true;
      status.textContent = attempts.length ? "می‌توانی دوباره بنویسی. بایگان منتظر است." : "";
      writeHint.textContent = "دست‌کم چند واژه بنویس. بایگان متن کوتاه‌تر را نمی‌خواند.";
    }
  }

  function submitWrite() {
    if (state.writeAttempts.length >= 3) {
      return;
    }
    var input = $("#writeInput");
    var text = input ? input.value.trim() : "";
    if (text.length < 8) {
      var paper = $("#writePaper");
      if (paper) {
        paper.classList.remove("is-shaking");
        void paper.offsetWidth;
        paper.classList.add("is-shaking");
      }
      showToast("دست‌کم چند واژه بنویس. بایگان متن کوتاه‌تر را نمی‌خواند.");
      if (input) {
        input.focus();
      }
      return;
    }

    var echo = $("#paperEcho");
    var motif = $("#paperMotif");
    var status = $("#paperStatus");
    var submit = $("#submitWrite");
    var paper = $("#writePaper");

    var extractedNow = extractWords(text);
    state.writeAttempts.push({
      text: text,
      at: Date.now(),
      extracted: extractedNow
    });
    state.startedAt = state.startedAt || Date.now();
    writeEditing = false;
    save();

    if (submit) {
      submit.disabled = true;
    }
    if (input) {
      input.readOnly = true;
      input.blur();
    }
    if (paper) {
      paper.classList.remove("is-shaking");
    }
    if (echo) {
      echo.textContent = text;
      echo.classList.add("is-visible");
      echo.classList.remove("is-fading");
    }
    if (motif) {
      motif.classList.remove("is-visible");
    }
    if (status) {
      status.textContent = "ثبت شد. خروجی معنادار: ۰. بایگان چند واژه را برای خودش برداشت.";
    }
    audio.play("erase");

    var firstDelay = motionReduced() ? 40 : 780;
    var secondDelay = motionReduced() ? 160 : 1450;

    window.setTimeout(function () {
      if (echo) {
        echo.classList.add("is-fading");
      }
    }, firstDelay);

    window.setTimeout(function () {
      if (echo) {
        echo.classList.remove("is-visible", "is-fading");
        echo.textContent = "";
      }
      if (motif) {
        motif.classList.add("is-visible");
      }
      if (status) {
        status.textContent = "ثبت شد. خروجی معنادار: ۰. آنچه خوانده شد: «سه قطره خون.»" +
          (extractedNow.length ? " واژه‌های برداشت‌شده: «" + extractedNow.join("»، «") + "»." : "");
      }
      audio.play("drop");
      renderWrite();
      var continueButton = $("#continueFromWrite");
      if (continueButton) {
        continueButton.focus({ preventScroll: true });
      }
      announce("متن ثبت و پاک شد. فقط سه قطره خون خوانده شد. چند واژه هم در پرونده ماند.");
    }, secondDelay);
  }

  function retryWrite() {
    if (state.writeAttempts.length >= 3) {
      return;
    }
    writeEditing = true;
    resetPaperVisual();
    var input = $("#writeInput");
    if (input) {
      input.value = "";
    }
    renderWrite();
    if (input) {
      input.focus();
    }
    showToast("کاغذ دوباره در دسترس است. بایگان همان را خواهد خواند.");
  }

  function continueFromWrite() {
    if (!state.writeAttempts.length) {
      showToast("اول باید چیزی بنویسی.");
      return;
    }
    goTo("hub");
  }

  function renderHub() {
    ["asylum", "memory", "song"].forEach(function (key) {
      var card = $('[data-module="' + key + '"]');
      if (!card) {
        return;
      }
      var isDone = state.modules[key].done;
      var inProgress = moduleInProgress(key);
      card.classList.toggle("is-done", isDone);
      var stateLabel = card.querySelector('[data-state-for="' + key + '"]');
      if (stateLabel) {
        stateLabel.textContent = isDone ? "ثبت‌شده" : inProgress ? "در جریان" : "باز";
      }
    });

    var allDone = allModulesDone();
    var openTestimony = $("#openTestimony");
    var hubHint = $("#hubHint");
    var hubWriteBtn = $("#hubWriteBtn");
    if (openTestimony) {
      openTestimony.disabled = !allDone;
    }
    if (hubHint) {
      hubHint.textContent = allDone
        ? "هر سه قطره ثبت شده‌اند. سند آماده است."
        : "برای باز کردن شهادتنامه، هر سه قطره را بگذران.";
    }
    if (hubWriteBtn) {
      hubWriteBtn.hidden = state.writeAttempts.length >= 3;
    }
  }

  function renderAsylum() {
    var body = $("#asylumBody");
    var progress = $("#asylumProgress");
    var asylum = state.modules.asylum;
    if (!body) {
      return;
    }
    if (progress) {
      progress.textContent = asylum.selected.length < 3 ? "۱ / ۲" : "۲ / ۲";
    }

    if (asylum.done) {
      body.innerHTML = renderAsylumSummary();
      return;
    }

    if (asylum.selected.length < 3) {
      body.innerHTML =
        '<div class="selection-meter"><span>انتخاب‌شده: <strong>' + fa(asylum.selected.length) + "</strong> / ۳</span><span>از پنج جمله</span></div>" +
        '<div class="fragment-grid">' +
        ASYLUM_FRAGMENTS.map(function (fragment) {
          var selected = asylum.selected.indexOf(fragment.id) >= 0;
          return '<button class="fragment-card' + (selected ? " is-selected" : "") + '" type="button" data-action="toggle-fragment" data-fragment-id="' + fragment.id + '" aria-pressed="' + selected + '">' +
            '<span class="fragment-text">' + esc(fragment.text) + "</span>" +
            '<span class="source-tag">' + esc(fragment.source) + "</span>" +
          "</button>";
        }).join("") +
        "</div>" +
        '<p class="hint">با انتخاب جملهٔ سوم، فرم انتساب باز می‌شود.</p>';
      return;
    }

    var rows = asylum.selected.map(function (fragmentId) {
      var fragment = fragmentById(fragmentId);
      if (!fragment) {
        return "";
      }
      var assigned = asylum.assignments.find(function (item) {
        return item.fragmentId === fragmentId;
      });
      var pending = asylum.pending && asylum.pending.fragmentId === fragmentId ? asylum.pending : null;
      var correcting = Boolean(pending && pending.correcting);
      var locked = Boolean(assigned || (pending && !correcting));
      var badge = "";

      if (assigned) {
        badge = '<span class="resolve-badge' + (assigned.corrected ? " is-corrected" : "") + '">' +
          (assigned.corrected ? "برگرداندن تو" : "ثبت بایگان") +
        "</span>";
      }

      var speakerButtons = SPEAKERS.map(function (speaker) {
        var chosen = assigned
          ? assigned.finalSpeaker === speaker.id
          : pending
            ? pending.systemSpeaker === speaker.id
            : false;
        var action = correcting ? "choose-final-speaker" : "assign-speaker";
        return '<button class="speaker-btn' + (chosen ? " is-chosen" : "") + (correcting && chosen ? " is-system-choice" : "") + '" type="button" data-action="' + action + '" data-fragment-id="' + fragmentId + '" data-speaker="' + speaker.id + '"' + (locked ? " disabled" : "") + ">" + esc(speaker.label) + "</button>";
      }).join("");

      var trace = "";
      if (pending) {
        trace =
          '<div class="system-trace">' +
            '<span class="trace-label">بایگان</span>' +
            "<p>ثبت شد؛ از زبان " + esc(speakerLabel(pending.systemSpeaker)) + ". انتخاب اول تو " + esc(speakerLabel(pending.playerSpeaker)) + " بود.</p>" +
            (correcting
              ? '<p class="trace-hint">حالا خودت نسبت بده. هر صدایی را انتخاب کنی، همان در سند می‌ماند.</p>' +
                '<div class="trace-actions">' +
                  '<button class="trace-btn" type="button" data-action="keep-lie" data-fragment-id="' + fragmentId + '">نگه دار</button>' +
                  '<button class="trace-btn" type="button" data-action="cancel-correction" data-fragment-id="' + fragmentId + '">بازگشت</button>' +
                "</div>"
              : '<div class="trace-actions">' +
                  '<button class="trace-btn" type="button" data-action="keep-lie" data-fragment-id="' + fragmentId + '">بپذیر</button>' +
                  '<button class="trace-btn" type="button" data-action="open-correction" data-fragment-id="' + fragmentId + '">خودم نسبت می‌دهم</button>' +
                "</div>") +
          "</div>";
      }

      return '<article class="assignment-row' + (pending ? " is-pending" : "") + '">' +
        '<blockquote class="assignment-quote">' + esc(fragment.text) + "</blockquote>" +
        '<div class="assignment-meta"><span>انتخاب جمله: ' + esc(fragment.source) + "</span>" + badge + "</div>" +
        '<div class="speaker-row">' + speakerButtons + "</div>" +
        trace +
        (assigned ? '<div class="assignment-meta"><span>ثبت نهایی: ' + esc(speakerLabel(assigned.finalSpeaker)) + "</span></div>" : "") +
      "</article>";
    }).join("");

    body.innerHTML =
      '<div class="selection-meter"><span>سه جمله انتخاب شد.</span>' +
        (asylum.assignments.length === 0 && !asylum.pending
          ? '<button class="link-btn" type="button" data-action="asylum-reselect">تغییر انتخاب</button>'
          : "") +
      "</div>" +
      '<div class="assignment-list">' + rows + "</div>" +
      '<div class="module-actions">' +
        '<button class="btn btn--primary" type="button" data-action="asylum-finish"' + (asylum.assignments.length === 3 ? "" : " disabled") + ">ثبت این قطره</button>" +
      "</div>";
  }

  function renderAsylumSummary() {
    var asylum = state.modules.asylum;
    var corrections = correctionCount();
    var items = asylum.assignments.map(function (assignment) {
      var fragment = fragmentById(assignment.fragmentId);
      if (!fragment) {
        return "";
      }
      return '<div class="summary-item">' +
        '<blockquote class="assignment-quote">' + esc(fragment.text) + "</blockquote>" +
        '<div class="assignment-meta"><span>از زبان ' + esc(speakerLabel(assignment.finalSpeaker)) + "</span>" +
          '<span class="resolve-badge' + (assignment.corrected ? " is-corrected" : "") + '">' +
            (assignment.corrected ? "برگرداندن تو" : "ثبت بایگان") +
          "</span>" +
        "</div>" +
      "</div>";
    }).join("");

    return '<div class="complete-panel">' +
      '<span class="complete-mark">✓</span>' +
      "<h3>قطرهٔ اول ثبت شد.</h3>" +
      "<p>سه جمله به صداها نسبت داده شد. بایگان هر صدا را یک پله جابه‌جا کرد؛ تو " +
        fa(corrections) + " مورد را برگرداندی. فشار پرونده: «" + esc(pressureLabel(pressureValue())) + "».</p>" +
      '<div class="next-actions">' +
        '<button class="btn btn--primary" type="button" data-go="hub">بازگشت به سه قطره</button>' +
        '<button class="btn btn--ghost" type="button" data-go="memory">قطرهٔ بعدی</button>' +
      "</div>" +
    "</div>" +
    '<div class="summary-list">' + items + "</div>";
  }

  function toggleFragment(fragmentId) {
    var asylum = state.modules.asylum;
    if (asylum.pending || asylum.assignments.length) {
      return;
    }
    var index = asylum.selected.indexOf(fragmentId);
    if (index >= 0) {
      asylum.selected.splice(index, 1);
    } else if (asylum.selected.length < 3) {
      asylum.selected.push(fragmentId);
    } else {
      showToast("سه جمله انتخاب شده است. برای عوض‌کردن، یکی را بردار.");
      return;
    }
    save();
    audio.play("click");
    renderAsylum();
  }

  function assignSpeaker(fragmentId, speaker) {
    var asylum = state.modules.asylum;
    if (asylum.pending || asylum.assignments.some(function (item) {
      return item.fragmentId === fragmentId;
    })) {
      return;
    }
    asylum.pending = {
      fragmentId: fragmentId,
      playerSpeaker: speaker,
      systemSpeaker: LIE_MAP[speaker] || "archivist",
      correcting: false
    };
    save();
    audio.play("stamp");
    renderAsylum();
    announce("بایگان صدا را یک پله جابه‌جا کرد. می‌توانی بپذیری یا خودت نسبت بدهی.");
  }

  function openCorrection() {
    var asylum = state.modules.asylum;
    if (!asylum.pending) {
      return;
    }
    asylum.pending.correcting = true;
    save();
    audio.play("click");
    renderAsylum();
    announce("یک صدا انتخاب کن. انتخاب تو در سند ثبت می‌شود.");
  }

  function cancelCorrection() {
    var asylum = state.modules.asylum;
    if (!asylum.pending) {
      return;
    }
    asylum.pending.correcting = false;
    save();
    audio.play("click");
    renderAsylum();
  }

  function resolvePending(speakerId) {
    var asylum = state.modules.asylum;
    var pending = asylum.pending;
    if (!pending) {
      return;
    }
    var valid = SPEAKERS.some(function (speaker) {
      return speaker.id === speakerId;
    });
    if (!valid) {
      return;
    }
    var corrected = speakerId !== pending.systemSpeaker;
    asylum.assignments.push({
      fragmentId: pending.fragmentId,
      playerSpeaker: pending.playerSpeaker,
      systemSpeaker: pending.systemSpeaker,
      finalSpeaker: speakerId,
      corrected: corrected,
      at: Date.now()
    });
    asylum.pending = null;
    save();
    audio.play("stamp");
    renderAsylum();
    announce(corrected ? "صدای دیگری ثبت شد. فشار پرونده بالا رفت." : "ثبت بایگان پذیرفته شد.");
  }

  function keepPending() {
    var asylum = state.modules.asylum;
    if (asylum.pending) {
      resolvePending(asylum.pending.systemSpeaker);
    }
  }

  function chooseFinalSpeaker(fragmentId, speakerId) {
    var asylum = state.modules.asylum;
    if (!asylum.pending || asylum.pending.fragmentId !== fragmentId || !asylum.pending.correcting) {
      return;
    }
    resolvePending(speakerId);
  }

  function finishAsylum() {
    var asylum = state.modules.asylum;
    if (asylum.assignments.length !== 3) {
      showToast("هر سه جمله باید انتساب پیدا کنند.");
      return;
    }
    asylum.done = true;
    asylum.pending = null;
    save();
    audio.play("complete");
    updateChrome();
    renderAsylum();
    announce("قطرهٔ اول ثبت شد.");
  }

  function renderMemory() {
    var body = $("#memoryBody");
    var progress = $("#memoryProgress");
    var memory = state.modules.memory;
    if (!body) {
      return;
    }
    if (progress) {
      progress.textContent = memory.done ? "۳ / ۳ جفت" : fa(memory.pairs.length) + " جفت";
    }

    if (memory.done) {
      body.innerHTML = renderMemorySummary();
      return;
    }

    var pairedEvents = {};
    var pairedInterpretations = {};
    memory.pairs.forEach(function (pair) {
      pairedEvents[pair.eventId] = true;
      pairedInterpretations[pair.interpretationId] = true;
    });

    var events = MEMORY_EVENTS.map(function (event) {
      var isPaired = Boolean(pairedEvents[event.id]);
      var isSelected = memory.selectedEvent === event.id;
      return '<button class="event-card' + (isSelected ? " is-selected" : "") + (isPaired ? " is-paired" : "") + '" type="button" data-action="select-event" data-event-id="' + event.id + '" aria-pressed="' + isSelected + '"' + (isPaired ? " disabled" : "") + ">" +
        esc(event.text) +
        '<span class="source-tag">' + esc(event.source) + "</span>" +
      "</button>";
    }).join("");

    var interpretations = MEMORY_INTERPRETATIONS.map(function (interpretation) {
      var isPaired = Boolean(pairedInterpretations[interpretation.id]);
      return '<button class="interp-card' + (isPaired ? " is-paired" : "") + '" type="button" data-action="pair-interpretation" data-interp-id="' + interpretation.id + '"' + (isPaired ? " disabled" : "") + ">" +
        esc(interpretation.text) +
      "</button>";
    }).join("");

    var note = memoryNote
      ? '<div class="trace-note"><span class="trace-label">بایگان</span><p>' + esc(memoryNote) + "</p></div>"
      : "";

    var selectedEvent = memory.selectedEvent ? eventById(memory.selectedEvent) : null;
    var clearSelection = memory.selectedEvent
      ? '<button class="btn btn--ghost btn--small" type="button" data-action="memory-clear-selection">لغو انتخاب</button>'
      : "";
    var selection = selectedEvent
      ? '<div class="trace-note selected-event"><span class="trace-label">رویداد انتخابی</span><p>' + esc(selectedEvent.text) + "</p></div>"
      : "";

    body.innerHTML =
      '<div class="memory-grid">' +
        '<div class="memory-column">' +
          '<h3 class="column-title">رویدادها</h3>' +
          '<div class="card-stack">' + events + "</div>" +
        "</div>" +
        '<div class="memory-column">' +
          '<h3 class="column-title">تفسیرها</h3>' +
          selection +
          '<div class="card-stack">' + interpretations + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="memory-footer">' +
        note +
        '<div class="selection-meter"><span>جفت‌های ثبت‌شده: <strong>' + fa(memory.pairs.length) + "</strong></span><span>برای ثبت، دست‌کم سه جفت؛ جای خالی مجاز است.</span></div>" +
        '<div class="module-actions">' +
          '<button class="btn btn--primary" type="button" data-action="memory-finish"' + (memory.pairs.length >= 3 ? "" : " disabled") + ">ثبت این قطره</button>" +
          clearSelection +
        "</div>" +
      "</div>" +
      renderPairs(memory.pairs, false);
  }

  function renderPairs(pairs, readOnly) {
    if (!pairs.length) {
      return '<p class="empty-state">هنوز جفتی ساخته نشده است. یک رویداد و یک تفسیر انتخاب کن.</p>';
    }

    return '<div class="pair-list">' + pairs.map(function (pair, index) {
      var event = eventById(pair.eventId);
      var interpretation = interpretationById(pair.interpretationId);
      if (!event || !interpretation) {
        return "";
      }
      var note = pair.gap
        ? '<span class="gap-note">جای خالی</span>'
        : '<span class="free-note">پیوند ثبت‌شده</span>';
      var gap = readOnly
        ? ""
        : '<button class="mini-btn" type="button" data-action="toggle-gap" data-index="' + index + '" aria-pressed="' + pair.gap + '">' +
            (pair.gap ? "بستن جای خالی" : "جای خالی بگذار") +
          "</button>";
      var remove = readOnly
        ? ""
        : '<button class="mini-btn" type="button" data-action="remove-pair" data-index="' + index + '">برداشتن</button>';
      return '<div class="pair-item' + (pair.gap ? " is-gap" : "") + '">' +
        '<p class="pair-quote">' + esc(event.text) + "</p>" +
        '<div class="pair-detail">' + esc(interpretation.text) + "</div>" +
        (pair.gap ? '<p class="pair-gap">این پیوند کامل نشد؛ جای خالی به سند می‌رود.</p>' : "") +
        '<div class="pair-meta">' + note + gap + remove + "</div>" +
      "</div>";
    }).join("") + "</div>";
  }

  function renderMemorySummary() {
    var memory = state.modules.memory;
    var gaps = gapCount();
    return '<div class="complete-panel">' +
      '<span class="complete-mark">✓</span>' +
      "<h3>قطرهٔ دوم ثبت شد.</h3>" +
      "<p>رویدادها و تفسیرها به هم چسبیدند. هیچ جفتی «غلط» نبود؛ تو " +
        fa(gaps) + " جای خالی باز گذاشتی. فشار پرونده: «" + esc(pressureLabel(pressureValue())) + "».</p>" +
      '<div class="next-actions">' +
        '<button class="btn btn--primary" type="button" data-go="hub">بازگشت به سه قطره</button>' +
        '<button class="btn btn--ghost" type="button" data-go="song">قطرهٔ بعدی</button>' +
      "</div>" +
    "</div>" +
    renderPairs(memory.pairs, true);
  }

  function selectEvent(eventId) {
    var memory = state.modules.memory;
    if (memory.pairs.some(function (pair) {
      return pair.eventId === eventId;
    })) {
      showToast("این رویداد قبلاً جفت شده است.");
      return;
    }
    memory.selectedEvent = memory.selectedEvent === eventId ? null : eventId;
    save();
    audio.play("click");
    renderMemory();
    announce(memory.selectedEvent ? "رویداد انتخاب شد. حالا یک تفسیر انتخاب کن." : "انتخاب رویداد لغو شد.");
  }

  function pairInterpretation(interpretationId) {
    var memory = state.modules.memory;
    if (!memory.selectedEvent) {
      showToast("اول یک رویداد انتخاب کن.");
      return;
    }
    if (memory.pairs.some(function (pair) {
      return pair.interpretationId === interpretationId;
    })) {
      showToast("این تفسیر قبلاً استفاده شده است.");
      return;
    }
    var eventId = memory.selectedEvent;
    var interpretation = interpretationById(interpretationId);
    if (!interpretation) {
      return;
    }
    memory.pairs.push({
      eventId: eventId,
      interpretationId: interpretationId,
      gap: false,
      at: Date.now()
    });
    memory.selectedEvent = null;
    memoryNote = "پیوند ثبت شد. حالا می‌توانی جای خالی را باز بگذاری یا ببندی؛ بایگان هر دو را می‌پذیرد.";
    save();
    audio.play("stamp");
    renderMemory();
    announce("جفت ثبت شد. می‌توانی جای خالی را باز بگذاری.");
  }

  function toggleGap(index) {
    var memory = state.modules.memory;
    if (index < 0 || index >= memory.pairs.length) {
      return;
    }
    memory.pairs[index].gap = !memory.pairs[index].gap;
    memoryNote = memory.pairs[index].gap
      ? "جای خالی باز ماند. بایگان آن را پر نمی‌کند؛ به سند منتقل می‌کند."
      : "جای خالی بسته شد. پیوند دوباره کامل شد.";
    save();
    audio.play("click");
    renderMemory();
    announce(memory.pairs[index].gap ? "جای خالی باز شد." : "جای خالی بسته شد.");
  }

  function removePair(index) {
    var memory = state.modules.memory;
    if (index < 0 || index >= memory.pairs.length) {
      return;
    }
    memory.pairs.splice(index, 1);
    memoryNote = "";
    save();
    audio.play("click");
    renderMemory();
    announce("جفت برداشته شد.");
  }

  function finishMemory() {
    var memory = state.modules.memory;
    if (memory.pairs.length < 3) {
      showToast("دست‌کم سه جفت لازم است.");
      return;
    }
    memory.done = true;
    memory.selectedEvent = null;
    save();
    audio.play("complete");
    updateChrome();
    renderMemory();
    announce("قطرهٔ دوم ثبت شد.");
  }

  function replaceFirst(text, target, replacement) {
    var index = text.indexOf(target);
    if (index < 0) {
      return text;
    }
    return text.slice(0, index) + replacement + text.slice(index + target.length);
  }

  function renderPoem(activeRoundIndex) {
    var lines = SONG_LINES.slice();
    var song = state.modules.song;

    song.rounds.forEach(function (round) {
      if (round.choice) {
        lines[round.lineIndex] = replaceFirst(
          lines[round.lineIndex],
          round.target,
          "\u0001P:" + round.choice + "\u0002"
        );
      }
      if (round.systemChange) {
        lines[round.systemChange.lineIndex] = replaceFirst(
          lines[round.systemChange.lineIndex],
          round.systemChange.target,
          "\u0001S:" + round.systemChange.replacement + "\u0002"
        );
      }
    });

    if (activeRoundIndex >= 0 && activeRoundIndex < SONG_ROUNDS.length) {
      var active = SONG_ROUNDS[activeRoundIndex];
      lines[active.lineIndex] = replaceFirst(
        lines[active.lineIndex],
        active.target,
        "\u0001B:…\u0002"
      );
    }

    return '<div class="poem" aria-label="تصنیف سه قطره خون">' +
      lines.map(function (line) {
        var safe = esc(line)
          .replace(/\u0001P:([^\u0002]*)\u0002/g, '<mark class="mark-player">$1</mark>')
          .replace(/\u0001S:([^\u0002]*)\u0002/g, '<mark class="mark-system">$1</mark>')
          .replace(/\u0001B:([^\u0002]*)\u0002/g, '<span class="blank-word">$1</span>');
        return '<span class="poem-line">' + safe + "</span>";
      }).join("") +
    "</div>";
  }

  function renderSongChanges() {
    var song = state.modules.song;
    if (!song.rounds.length) {
      return "";
    }
    var items = [];
    song.rounds.forEach(function (round, index) {
      items.push('<li class="change-item"><span class="change-by">تو / دور ' + fa(index + 1) + '</span>«' + esc(round.target) + '» ← «' + esc(round.choice) + '»</li>');
      if (round.systemChange) {
        items.push('<li class="change-item"><span class="change-by is-system">بایگان</span>«' + esc(round.systemChange.target) + '» ← «' + esc(round.systemChange.replacement) + '» <span class="source-tag">از نوشته‌های پاک‌شده</span></li>');
      }
    });
    return '<ul class="change-list">' + items.join("") + "</ul>";
  }

  function mutationPool() {
    var words = [];
    var seen = {};
    var used = {};
    state.modules.song.rounds.forEach(function (round) {
      if (round.systemChange) {
        used[round.systemChange.replacement] = true;
      }
    });

    function addWord(word) {
      if (!word || word.length < 2 || STOP_WORDS[word] || seen[word] || used[word]) {
        return;
      }
      seen[word] = true;
      words.push(word);
    }

    allExtractedWords().forEach(addWord);
    state.writeAttempts.forEach(function (attempt) {
      var matches = attempt.text.match(/[\u0600-\u06FF\u200c]+/g) || [];
      matches.forEach(function (word) {
        addWord(word.replace(/\u200c/g, "‌").trim());
      });
    });

    if (!words.length) {
      DEFAULT_MUTATION_WORDS.forEach(addWord);
    }

    return words.length ? words : DEFAULT_MUTATION_WORDS.slice();
  }

  function buildSystemChange(roundIndex) {
    var targets = [
      { lineIndex: 0, target: "شام" },
      { lineIndex: 4, target: "مزاج" },
      { lineIndex: 2, target: "آرام" }
    ];
    var target = targets[roundIndex % targets.length];
    var pool = mutationPool();
    var replacement = pool[(roundIndex + state.writeAttempts.length + pressureValue()) % pool.length];
    if (!replacement || replacement === target.target) {
      replacement = pool.filter(function (word) {
        return word !== target.target;
      })[0] || "کاغذ";
    }
    return {
      lineIndex: target.lineIndex,
      target: target.target,
      replacement: replacement
    };
  }

  function chooseSongWord(choice) {
    var song = state.modules.song;
    if (song.done || song.showResult || song.rounds.length >= SONG_ROUNDS.length) {
      return;
    }
    var roundIndex = song.rounds.length;
    var round = SONG_ROUNDS[roundIndex];
    if (round.options.indexOf(choice) < 0) {
      return;
    }
    var systemChange = buildSystemChange(roundIndex);
    song.rounds.push({
      lineIndex: round.lineIndex,
      target: round.target,
      choice: choice,
      playerChange: { lineIndex: round.lineIndex, target: round.target, replacement: choice },
      systemChange: systemChange
    });
    song.showResult = song.rounds.length === SONG_ROUNDS.length;
    save();
    audio.play("stamp");
    renderSong();
    announce(song.showResult ? "سه دور تمام شد. نتیجه را ثبت کن." : "واژه ثبت شد. دور بعد آماده است.");
  }

  function finishSong() {
    var song = state.modules.song;
    if (song.rounds.length !== SONG_ROUNDS.length) {
      showToast("سه دور تصنیف باید کامل شود.");
      return;
    }
    song.done = true;
    song.showResult = true;
    save();
    audio.play("complete");
    updateChrome();
    renderSong();
    announce("قطرهٔ سوم ثبت شد.");
  }

  function renderSong() {
    var body = $("#songBody");
    var progress = $("#songProgress");
    var song = state.modules.song;
    if (!body) {
      return;
    }

    if (progress) {
      progress.textContent = song.done ? "۳ / ۳ دور" : song.showResult ? "نتیجه / ۳ دور" : "دور " + fa(song.rounds.length + 1) + " / ۳";
    }

    if (song.done) {
      body.innerHTML =
        '<div class="song-done">' +
          '<div class="complete-panel">' +
            '<span class="complete-mark">✓</span>' +
            "<h3>قطرهٔ سوم ثبت شد.</h3>" +
            "<p>تصنیف دیگر همان تصنیف نیست. واژه‌های تو و واژه‌های پاک‌شده در یک فرم نشسته‌اند. فشار پرونده: «" + esc(pressureLabel(pressureValue())) + "».</p>" +
            '<div class="next-actions">' +
              '<button class="btn btn--primary" type="button" data-go="hub">بازگشت به سه قطره</button>' +
              '<button class="btn btn--ghost" type="button" data-go="testimony">دیدن شهادتنامه</button>' +
            "</div>" +
          "</div>" +
          renderPoem(-1) +
          '<div class="song-controls"><h3>تغییرها</h3>' + renderSongChanges() + "</div>" +
        "</div>";
      return;
    }

    if (song.showResult) {
      body.innerHTML =
        '<div class="song-layout">' +
          renderPoem(-1) +
          '<div class="song-controls">' +
            "<h3>تصنیف تمام شد.</h3>" +
            "<p>سه واژه از تو و سه واژه از بایگان. حالا می‌توانی این قطره را ثبت کنی.</p>" +
            renderSongChanges() +
            '<div class="module-actions">' +
              '<button class="btn btn--primary" type="button" data-action="song-finish">ثبت این قطره</button>' +
            "</div>" +
          "</div>" +
        "</div>";
      return;
    }

    var round = SONG_ROUNDS[song.rounds.length];
    var options = round.options.map(function (option) {
      var source = option === round.target ? "واژهٔ تصنیف" : "واژهٔ دیگر";
      return '<button class="word-option" type="button" data-action="choose-song-word" data-word="' + esc(option) + '">' +
        '<span class="option-word">' + esc(option) + "</span>" +
        '<span class="option-source">' + source + "</span>" +
      "</button>";
    }).join("");

    body.innerHTML =
      '<div class="song-layout">' +
        renderPoem(song.rounds.length) +
        '<div class="song-controls">' +
          "<h3>دور " + fa(song.rounds.length + 1) + " از ۳</h3>" +
          "<p>" + esc(round.prompt) + "</p>" +
          '<div class="word-options">' + options + "</div>" +
          (allExtractedWords().length
            ? '<div class="song-extraction"><span class="field-label">از نوشته‌ات</span><span class="word-chips">' +
                allExtractedWords().map(function (word) {
                  return '<span class="word-chip">' + esc(word) + "</span>";
                }).join("") +
              "</span></div>"
            : "") +
          '<div class="song-meta"><span>واژه‌های پاک‌شدهٔ تو هم در دسترس بایگان‌اند.</span><span>' + fa(song.rounds.length) + " / ۳</span></div>" +
          (song.rounds.length ? '<div class="song-meta"><span>تغییرهای ثبت‌شده</span></div>' + renderSongChanges() : "") +
        "</div>" +
      "</div>";
  }

  function songPlainLines() {
    var lines = SONG_LINES.slice();
    state.modules.song.rounds.forEach(function (round) {
      if (round.choice) {
        lines[round.lineIndex] = replaceFirst(lines[round.lineIndex], round.target, round.choice);
      }
      if (round.systemChange) {
        lines[round.systemChange.lineIndex] = replaceFirst(
          lines[round.systemChange.lineIndex],
          round.systemChange.target,
          round.systemChange.replacement
        );
      }
    });
    return lines;
  }

  function formatDate(timestamp) {
    if (!timestamp) {
      return "بدون تاریخ";
    }
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(timestamp));
    } catch (error) {
      return new Date(timestamp).toLocaleString("fa-IR");
    }
  }

  function finalStatusText() {
    if (state.final.signed === true) {
      return "امضا شده است.";
    }
    if (state.final.signed === false) {
      return "امتناع از امضا ثبت شده است.";
    }
    return "این سند هنوز امضا نشده است.";
  }

  function renderTestimonyPreview() {
    var asylum = state.modules.asylum;
    var memory = state.modules.memory;
    var attempts = state.writeAttempts;
    var lines = songPlainLines();
    var pressure = pressureValue();
    var addendum = systemAddendum();
    var note = state.final.note.trim();

    var writes = attempts.length
      ? attempts.map(function (attempt) {
          return '<li class="doc-item"><blockquote class="doc-quote">' + esc(attempt.text) + "</blockquote>" +
            ((attempt.extracted || []).length
              ? '<span class="doc-small">واژه‌های ضبط‌شده: ' + esc((attempt.extracted || []).join(" / ")) + "</span>"
              : "") +
          "</li>";
        }).join("")
      : '<li class="doc-item">هیچ نوشته‌ای ثبت نشد.</li>';

    var assignments = asylum.assignments.map(function (assignment) {
      var fragment = fragmentById(assignment.fragmentId);
      if (!fragment) {
        return "";
      }
      return '<li class="doc-item">' +
        '<blockquote class="doc-quote">' + esc(fragment.text) + "</blockquote>" +
        '<span class="doc-small">ثبت بایگان: ' + esc(speakerLabel(assignment.systemSpeaker)) +
          (assignment.corrected
            ? " / برگرداندن تو: " + esc(speakerLabel(assignment.finalSpeaker))
            : " / پذیرفته‌شده") +
        "</span>" +
      "</li>";
    }).join("");

    var pairs = memory.pairs.map(function (pair) {
      var event = eventById(pair.eventId);
      var interpretation = interpretationById(pair.interpretationId);
      if (!event || !interpretation) {
        return "";
      }
      return '<li class="doc-item">' +
        '<blockquote class="doc-quote">' + esc(event.text) + "</blockquote>" +
        "<p>" + esc(interpretation.text) + "</p>" +
        '<span class="doc-small">' + (pair.gap ? "جای خالی / پیوند ناتمام" : "پیوند ثبت‌شده") + "</span>" +
      "</li>";
    }).join("");

    var poem = lines.map(function (line) {
      return esc(line);
    }).join("<br>");

    var margin = note
      ? '<section class="doc-section doc-margin"><h3>حاشیهٔ سند</h3><p>' + esc(note) + "</p></section>"
      : "";
    var addendumBlock = addendum
      ? '<section class="doc-section doc-addendum"><h3>افزودهٔ بایگان</h3><p>' + esc(addendum) + "</p></section>"
      : "";

    return '<div class="doc-head">' +
      '<span class="doc-kicker">بایگان / پروندهٔ ناتمام</span>' +
      '<h3 class="doc-title">شهادتنامهٔ سه قطره خون</h3>' +
      '<span class="doc-meta">' + formatDate(state.final.stampedAt || Date.now()) + " / " +
        (state.final.witness ? "شاهد: " + esc(state.final.witness) : "بدون نام شاهد") +
        " / فشار: " + esc(pressureLabel(pressure)) +
      "</span>" +
    "</div>" +
    '<section class="doc-section"><h3>نوشته‌های پاک‌شده</h3><ul class="doc-list">' + writes + "</ul></section>" +
    '<section class="doc-section"><h3>انتساب‌ها</h3><ul class="doc-list">' + (assignments || '<li class="doc-item">هنوز انتسابی ثبت نشده است.</li>') + "</ul></section>" +
    '<section class="doc-section"><h3>جفت‌های خاطره</h3><ul class="doc-list">' + (pairs || '<li class="doc-item">هنوز جفتی ثبت نشده است.</li>') + "</ul></section>" +
    '<section class="doc-section"><h3>تصنیف</h3><p class="doc-poem">' + poem + "</p></section>" +
    addendumBlock +
    margin +
    '<div class="doc-verdict">' + finalStatusText() + "</div>";
  }

  function renderTestimony() {
    var preview = $("#testimonyPreview");
    var witness = $("#witnessInput");
    var note = $("#noteInput");
    var signButton = $("#signBtn");
    var refuseButton = $("#refuseBtn");
    if (!preview) {
      return;
    }
    if (witness) {
      witness.value = state.final.witness;
      witness.disabled = state.final.signed !== null;
    }
    if (note) {
      note.value = state.final.note;
      note.disabled = state.final.signed !== null;
    }
    if (signButton) {
      signButton.disabled = state.final.signed !== null;
    }
    if (refuseButton) {
      refuseButton.disabled = state.final.signed !== null;
    }
    preview.innerHTML = renderTestimonyPreview();
  }

  function refreshTestimonyPreview() {
    var preview = $("#testimonyPreview");
    if (!preview) {
      return;
    }
    var scrollTop = preview.scrollTop;
    preview.innerHTML = renderTestimonyPreview();
    preview.scrollTop = scrollTop;
  }

  function saveWitness() {
    var witness = $("#witnessInput");
    if (!witness || state.final.signed !== null) {
      return;
    }
    state.final.witness = witness.value.trim().slice(0, 60);
    save();
    refreshTestimonyPreview();
  }

  function saveFinalNote() {
    var note = $("#noteInput");
    if (!note || state.final.signed !== null) {
      return;
    }
    state.final.note = note.value.trim().slice(0, 280);
    save();
    refreshTestimonyPreview();
  }

  function closeTestimony(signed) {
    if (state.final.signed !== null) {
      showToast("این سند قبلاً بسته شده است.");
      return;
    }
    saveWitness();
    saveFinalNote();
    state.final.signed = signed;
    state.final.stampedAt = Date.now();
    save();
    audio.play("stamp");
    goTo("end");
  }

  function renderEnd() {
    var signed = state.final.signed;
    var title = $("#endTitle");
    var stamp = $("#endStamp");
    var message = $("#endMessage");
    var pressure = $("#endPressure");
    var poemLine = $("#endPoemLine");
    var value = pressureValue();
    if (!title || !stamp || !message) {
      return;
    }

    if (signed === true) {
      title.textContent = "امضا ثبت شد.";
      stamp.textContent = "ثبت شد / امضا";
      stamp.dataset.kind = "signed";
      message.textContent = "پرونده بسته شد. اما سند فقط یک روایت است؛ روایت دیگر هنوز روی کاغذ است.";
    } else {
      title.textContent = "امتناع ثبت شد.";
      stamp.textContent = "ثبت شد / امتناع";
      stamp.dataset.kind = "refused";
      message.textContent = "تو امضا نکردی. بایگان امتناع را هم ثبت کرد. پرونده بسته شد، اما سکوت تو در آن مانده است.";
    }

    if (state.final.note.trim()) {
      message.textContent += " حاشیهٔ تو بیرون از روایت بایگان ماند.";
    }

    if (pressure) {
      pressure.textContent = "لرزش سند: «" + pressureLabel(value) + "» / " + pressureSentence(value);
    }

    if (poemLine) {
      poemLine.textContent = songPlainLines()[7] || "چکیده‌است بر خاک سه قطره خون.";
    }
  }

  function buildDocText() {
    var lines = [];
    var value = pressureValue();
    var addendum = systemAddendum();
    lines.push("شهادتنامهٔ سه قطره خون");
    lines.push("بر اساس داستان کوتاه صادق هدایت");
    lines.push("تاریخ: " + formatDate(state.final.stampedAt || Date.now()));
    lines.push("شاهد: " + (state.final.witness || "بدون نام"));
    lines.push("لرزش سند: " + pressureLabel(value));
    lines.push("");
    lines.push("نوشته‌های پاک‌شده:");
    state.writeAttempts.forEach(function (attempt, index) {
      lines.push(fa(index + 1) + ". " + attempt.text);
      if ((attempt.extracted || []).length) {
        lines.push("   واژه‌های ضبط‌شده: " + attempt.extracted.join(" / "));
      }
    });
    if (!state.writeAttempts.length) {
      lines.push("هیچ نوشته‌ای ثبت نشد.");
    }
    lines.push("");
    lines.push("انتساب‌ها:");
    state.modules.asylum.assignments.forEach(function (assignment) {
      var fragment = fragmentById(assignment.fragmentId);
      if (fragment) {
        lines.push("- «" + fragment.text + "» / ثبت بایگان: " + speakerLabel(assignment.systemSpeaker) +
          (assignment.corrected ? " / برگرداندن تو: " + speakerLabel(assignment.finalSpeaker) : " / پذیرفته‌شده"));
      }
    });
    lines.push("");
    lines.push("جفت‌های خاطره:");
    state.modules.memory.pairs.forEach(function (pair) {
      var event = eventById(pair.eventId);
      var interpretation = interpretationById(pair.interpretationId);
      if (event && interpretation) {
        lines.push("- «" + event.text + "» / " + interpretation.text + " / " + (pair.gap ? "جای خالی" : "پیوند ثبت‌شده"));
      }
    });
    lines.push("");
    lines.push("تصنیف:");
    songPlainLines().forEach(function (line) {
      lines.push(line);
    });
    if (addendum) {
      lines.push("");
      lines.push("افزودهٔ بایگان:");
      lines.push(addendum);
    }
    if (state.final.note.trim()) {
      lines.push("");
      lines.push("حاشیهٔ سند:");
      lines.push(state.final.note.trim());
    }
    lines.push("");
    lines.push("حکم: " + finalStatusText());
    lines.push("");
    lines.push("این سند در همین مرورگر ساخته شده و به سرور فرستاده نشده است.");
    return lines.join("\r\n");
  }

  function downloadTestimony() {
    var text = buildDocText();
    var blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "shahadatnameh-se-qatre-khoon.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    showToast("سند آمادهٔ دریافت شد.");
    announce("سند متنی دریافت شد.");
  }

  function archiveEmpty(message) {
    return '<p class="archive-empty">' + esc(message) + "</p>";
  }

  function archiveEntry(kicker, title, body) {
    return '<div class="archive-entry">' +
      (kicker ? '<span class="source-tag">' + esc(kicker) + "</span>" : "") +
      "<strong>" + esc(title) + "</strong>" +
      (body ? "<p>" + body + "</p>" : "") +
    "</div>";
  }

  function renderArchive() {
    var writes = $("#archiveWrites");
    var extraction = $("#archiveExtraction");
    var assignments = $("#archiveAssignments");
    var pairs = $("#archivePairs");
    var songBox = $("#archiveSong");
    var pressure = $("#archivePressure");
    var verdict = $("#archiveVerdict");
    if (!writes || !extraction || !assignments || !pairs || !songBox || !pressure || !verdict) {
      return;
    }

    writes.innerHTML = state.writeAttempts.length
      ? state.writeAttempts.map(function (attempt, index) {
          return archiveEntry(
            "ثبت " + fa(index + 1),
            "نوشتهٔ پاک‌شده",
            esc(attempt.text) +
              ((attempt.extracted || []).length
                ? '<span class="archive-date">برداشت: ' + esc(attempt.extracted.join(" / ")) + "</span>"
                : "") +
              '<span class="archive-date">' + formatDate(attempt.at) + "</span>"
          );
        }).join("")
      : archiveEmpty("هنوز نوشته‌ای پاک نشده است.");

    var extracted = allExtractedWords();
    extraction.innerHTML = extracted.length
      ? '<div class="word-chips">' + extracted.map(function (word) {
          return '<span class="word-chip">' + esc(word) + "</span>";
        }).join("") + "</div>" +
        '<p class="archive-rule">این واژه‌ها از نوشته‌های پاک‌شده برداشته شده‌اند و در تصنیف و افزودهٔ بایگان برمی‌گردند.</p>'
      : archiveEmpty("بایگان هنوز واژه‌ای برنداشته است.");

    assignments.innerHTML = state.modules.asylum.assignments.length
      ? state.modules.asylum.assignments.map(function (assignment) {
          var fragment = fragmentById(assignment.fragmentId);
          if (!fragment) {
            return "";
          }
          return archiveEntry(
            "ثبت نهایی: " + speakerLabel(assignment.finalSpeaker),
            fragment.text,
            "بایگان: " + esc(speakerLabel(assignment.systemSpeaker)) +
              (assignment.corrected ? " / برگرداندن تو: " + esc(speakerLabel(assignment.finalSpeaker)) : " / پذیرفته") +
              '<span class="archive-date">' + esc(fragment.source) + "</span>"
          );
        }).join("")
      : archiveEmpty("هنوز انتسابی ثبت نشده است.");

    pairs.innerHTML = state.modules.memory.pairs.length
      ? state.modules.memory.pairs.map(function (pair) {
          var event = eventById(pair.eventId);
          var interpretation = interpretationById(pair.interpretationId);
          if (!event || !interpretation) {
            return "";
          }
          return archiveEntry(
            pair.gap ? "جای خالی" : "پیوند ثبت‌شده",
            event.text,
            esc(interpretation.text)
          );
        }).join("")
      : archiveEmpty("هنوز جفتی ساخته نشده است.");

    songBox.innerHTML = state.modules.song.rounds.length
      ? '<div class="archive-entry"><strong>تصنیف بازنویسی‌شده</strong><p>' +
          songPlainLines().map(function (line) {
            return esc(line);
          }).join("<br>") +
        "</p></div>" +
        state.modules.song.rounds.map(function (round, index) {
          var body = "«" + esc(round.target) + "» ← «" + esc(round.choice) + "»";
          if (round.systemChange) {
            body += '<span class="archive-date">بایگان: «' + esc(round.systemChange.target) + "» ← «" + esc(round.systemChange.replacement) + "»</span>";
          }
          return archiveEntry("دور " + fa(index + 1), "تغییر واژه", body);
        }).join("")
      : archiveEmpty("هنوز تصنیفی تغییر نکرده است.");

    var value = pressureValue();
    pressure.innerHTML = archiveEntry(
      "لرزش: " + pressureLabel(value),
      "فشار پرونده",
      fa(value) + " نشانهٔ مقاومت ثبت شده است. " + esc(pressureSentence(value)) +
        '<span class="archive-date">اصلاح صدا: ' + fa(correctionCount()) +
        " / جای خالی: " + fa(gapCount()) +
        " / بازنویسی نوشته: " + fa(Math.max(0, state.writeAttempts.length - 1)) +
        " / تغییر واژه: " + fa(changedWordCount()) + "</span>"
    );

    verdict.innerHTML = archiveEntry(
      state.final.signed === null ? "باز" : "بسته",
      "حکم",
      finalStatusText() +
        (state.final.witness ? '<span class="archive-date">شاهد: ' + esc(state.final.witness) + "</span>" : "") +
        (state.final.note ? '<span class="archive-date">حاشیه: ' + esc(state.final.note) + "</span>" : "") +
        (state.final.stampedAt ? '<span class="archive-date">' + formatDate(state.final.stampedAt) + "</span>" : "")
    );
  }

  function resetGame() {
    if (!window.confirm("همهٔ نوشته‌ها، انتخاب‌ها و سند پاک می‌شوند. شروع دوباره؟")) {
      return;
    }
    var settings = state.settings;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageOK = false;
    }
    state = freshState();
    state.settings = settings;
    writeEditing = false;
    memoryNote = "";
    save();
    applySettings();
    closeArchive();
    closeDialog($("#settingsDialog"));
    closeDialog($("#aboutDialog"));
    showScene("cover");
    showToast("پرونده پاک شد. می‌توانی از نو شروع کنی.");
    announce("پرونده پاک شد و بازی از نو شروع شد.");
  }

  function handleAction(element) {
    var action = element.dataset.action;
    if (action === "toggle-fragment") {
      toggleFragment(element.dataset.fragmentId);
    } else if (action === "asylum-reselect") {
      var asylum = state.modules.asylum;
      if (asylum.assignments.length || asylum.pending) {
        showToast("پس از ثبت انتساب، انتخاب قابل تغییر نیست.");
        return;
      }
      asylum.selected = [];
      save();
      audio.play("click");
      renderAsylum();
    } else if (action === "assign-speaker") {
      assignSpeaker(element.dataset.fragmentId, element.dataset.speaker);
    } else if (action === "choose-final-speaker") {
      chooseFinalSpeaker(element.dataset.fragmentId, element.dataset.speaker);
    } else if (action === "keep-lie") {
      keepPending();
    } else if (action === "open-correction") {
      openCorrection();
    } else if (action === "cancel-correction") {
      cancelCorrection();
    } else if (action === "asylum-finish") {
      finishAsylum();
    } else if (action === "select-event") {
      selectEvent(element.dataset.eventId);
    } else if (action === "pair-interpretation") {
      pairInterpretation(element.dataset.interpId);
    } else if (action === "remove-pair") {
      removePair(Number(element.dataset.index));
    } else if (action === "toggle-gap") {
      toggleGap(Number(element.dataset.index));
    } else if (action === "memory-clear-selection") {
      state.modules.memory.selectedEvent = null;
      save();
      renderMemory();
      announce("انتخاب رویداد لغو شد.");
    } else if (action === "memory-finish") {
      finishMemory();
    } else if (action === "choose-song-word") {
      chooseSongWord(element.dataset.word);
    } else if (action === "song-finish") {
      finishSong();
    }
  }

  function on(id, eventName, handler) {
    var element = document.getElementById(id);
    if (element) {
      element.addEventListener(eventName, handler);
    }
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      var go = target.closest("[data-go]");
      if (go) {
        event.preventDefault();
        audio.play("click");
        goTo(go.dataset.go);
        return;
      }

      var action = target.closest("[data-action]");
      if (action) {
        event.preventDefault();
        handleAction(action);
        return;
      }

      var moduleCard = target.closest("[data-module]");
      if (moduleCard) {
        event.preventDefault();
        audio.play("click");
        goTo(moduleCard.dataset.module);
      }
    });

    on("startBtn", "click", function () {
      audio.play("click");
      if (state.final.signed !== null && allModulesDone()) {
        goTo("end");
      } else if (state.writeAttempts.length) {
        goTo(allModulesDone() ? "testimony" : "hub");
      } else {
        goTo("write");
      }
    });

    on("aboutBtn", "click", function () {
      openDialog($("#aboutDialog"));
    });
    on("footerAbout", "click", function () {
      openDialog($("#aboutDialog"));
    });
    on("endAboutBtn", "click", function () {
      openDialog($("#aboutDialog"));
    });
    on("settingsAboutBtn", "click", function () {
      openDialog($("#aboutDialog"));
    });

    on("settingsBtn", "click", function () {
      openDialog($("#settingsDialog"));
    });

    on("archiveBtn", "click", openArchive);
    on("endArchiveBtn", "click", openArchive);
    on("archiveClose", "click", closeArchive);
    on("drawerOverlay", "click", closeArchive);

    on("submitWrite", "click", submitWrite);
    on("retryWrite", "click", retryWrite);
    on("continueFromWrite", "click", continueFromWrite);
    on("hubWriteBtn", "click", function () {
      if (state.writeAttempts.length >= 3) {
        showToast("کاغذ پر شده است. جای دیگری برای نوشتن نیست.");
        return;
      }
      writeEditing = true;
      var input = $("#writeInput");
      if (input) {
        input.value = "";
      }
      resetPaperVisual();
      goTo("write");
    });
    on("openTestimony", "click", function () {
      audio.play("click");
      goTo("testimony");
    });
    on("signBtn", "click", function () {
      closeTestimony(true);
    });
    on("refuseBtn", "click", function () {
      closeTestimony(false);
    });
    on("downloadBtn", "click", downloadTestimony);
    on("restartBtn", "click", resetGame);
    on("resetBtn", "click", resetGame);
    on("witnessInput", "input", saveWitness);
    on("noteInput", "input", saveFinalNote);

    on("soundToggle", "change", function () {
      state.settings.sound = this.checked;
      save();
      applySettings();
      audio.play("toggle");
      announce(this.checked ? "صدا روشن شد." : "صدا خاموش شد.");
    });

    on("motionToggle", "change", function () {
      state.settings.reducedMotion = this.checked;
      save();
      applySettings();
      announce(this.checked ? "حرکت کم شد." : "حرکت کامل شد.");
    });

    on("textSizeSelect", "change", function () {
      state.settings.textSize = this.value;
      save();
      applySettings();
      announce("اندازهٔ متن تغییر کرد.");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        var drawer = $("#archiveDrawer");
        if (drawer && drawer.classList.contains("is-open")) {
          event.preventDefault();
          closeArchive();
        }
      }
      trapDrawerFocus(event);
    });
  }

  function init() {
    state = loadState();
    pageRegions = [$(".topbar"), $("#sceneRoot"), $(".footer")];
    var drawer = $("#archiveDrawer");
    if (drawer) {
      drawer.inert = true;
      drawer.setAttribute("aria-hidden", "true");
    }
    applySettings();

    var initial = state.scene;
    if (!canEnter(initial)) {
      initial = fallbackFor(initial);
    }
    if (initial === "hub" && !state.writeAttempts.length) {
      initial = "write";
    }
    if ((initial === "asylum" || initial === "memory" || initial === "song") && !state.writeAttempts.length) {
      initial = "write";
    }
    if (initial === "end" && state.final.signed === null) {
      initial = allModulesDone() ? "testimony" : (state.writeAttempts.length ? "hub" : "write");
    }
    if (initial === "testimony") {
      if (!allModulesDone()) {
        initial = state.writeAttempts.length ? "hub" : "write";
      } else if (state.final.signed !== null) {
        initial = "end";
      }
    }

    showScene(initial, { focus: false });
    bindEvents();

    if (!storageOK) {
      showToast("ذخیره‌سازی محلی در دسترس نیست. با بستن صفحه، پرونده پاک می‌شود.");
    }
  }

  init();
})();
