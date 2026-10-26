# طراحی فنی

## ۱. موتور

**Canvas 2D + WebAudio + JavaScript بدون وابستگی خارجی.**

دلیل:

- ۲.۵بعدی لایه‌ای/پارالاکس با نقاشی روی Canvas.
- کنترل کامل نور/مه/ذرات.
- بیلد فوری در مرورگر.
- صداى procedural بدون asset خارجی.
- ذخیرهٔ localStorage.

## ۲. معماری

```text
Input → Game State → Systems → Renderer
                 ↘ Audio
                 ↘ Save/Load
```

### فایل‌ها

```
build/
  index.html
  styles.css
  game.js
```

### لایه‌ها

- `state`: حالت بازی/جهان/شهادت‌ها.
- `systems`: حرکت، برخورد، ناظم، تعامل، ذخیره.
- `render`: پس‌زمینه، جهان، کاراکتر، UI.
- `audio`: ambient/SFX/موتیف.
- `ui`: منو/ژورنال/پایان.

## ۳. مختصات/دوربین

- جهان: `x: 0..1800`, `y: 0..1200`.
- دوربین دنبال‌کننده با نرمی.
- پروجکشن ۲.۵بعدی: `screenX = (x - cam.x) * scale`, `screenY = (y - cam.y) * scale * 0.62 + depthOffset`.
- مقیاس اشیا بر اساس `y` (عمق).
- لایه‌های پس‌زمینه با parallax.

## ۴. ماشین وضعیت

```text
menu → intro → play ⇄ pause
                 ↘ journal
                 ↘ caught → play (checkpoint)
                 ↘ ending
```

- `scene`: menu/intro/play/pause/journal/ending.
- `play` زیرحالت‌ها: explore/interact/dialogue/choice.
- `caught`: انیمیشن کوتاه/بازگشت.

## ۵. داده

```js
state = {
  scene, time, seed,
  player: {x,y,vx,vy,lantern,listening,crouch,lucidity,noise},
  camera: {x,y},
  supervisor: {x,y,state,timer,suspicion,waypoint},
  abbas: {x,y,state,timer},
  cat: {x,y,state,timer},
  stations: {pine, wall, door},
  testimonies: {cat:null, hoopoe:null, self:null},
  flags: {visited..., finale, ending},
  settings: {muted, reduceMotion, subtitles, highContrast}
}
```

## ۶. حرکت/برخورد

- WASD/جهت‌ها، نرمال‌سازی برداری.
- برخورد با دایره/مستطیل: دیوار، کاج، قفس، در.
- سرعت پایه ۱۲۰، crouch ۶۰، listen ۵۰.
- محدودهٔ جهان/دوربین.

## ۷. نور

- `lantern` = bool.
- متن نور: radial gradient + mask.
- نور، خون/اشیای پنهان را نشان می‌دهد.
- نور، دید ناظم را افزایش می‌دهد.
- هوشیاری با نور کم می‌شود.

## ۸. شنیدن

- `listening` = hold.
- امواج دایره‌ای/پژواک.
- منابع صدا: گربه/ناظم/عباس/تار.
- حرکت کند؛ صداهای دور قابل‌شنیدن.

## ۹. ناظم

- FSM: patrol → suspicious → chase → return.
- waypointها.
- vision cone/radius + lantern modifier.
- suspicion 0..1.
- در ۱: chase; در فاصله: caught.
- بازگشت به checkpoint.

## ۱۰. تعامل

- نزدیک ایستگاه + `E`.
- اگر شهادت ثبت نشده: باز شدن پنل انتخاب.
- انتخاب: حالت/رنگ/صدا/ژورنال.
- بعد از سه شهادت: کاج نهایی.

## ۱۱. ذخیره

- `localStorage["threeDrops.v1"]`.
- ذخیره در checkpoint/انتخاب/پایان.
- بارگذاری در شروع.
- دکمهٔ «شروع دوباره».

## ۱۲. کارایی

- ۶۰fps هدف؛ fallback ۳۰.
- ذرات محدود (max 200).
- no per-frame allocation زیاد.
- DPR clamp 2.
- `prefers-reduced-motion`.

## ۱۳. ورودی

- WASD/arrows.
- `L` نور (hold/toggle? hold).
- `H` شنیدن (hold).
- `E` تعامل.
- `C` خمیدن/پنهان.
- `J` ژورنال.
- `Esc` توقف.
- `M` بی‌صدا.
- لمسی: جوی‌استیک/دکمه‌های نور/شنیدن/تعامل.

## ۱۴. تست

- smoke: بارگذاری/شروع.
- movement/collision.
- station choice/persist.
- supervisor/caught/checkpoint.
- save/load.
- ending.
- mobile/touch.
- reduced motion/mute.
