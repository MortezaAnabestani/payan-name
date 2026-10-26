# معماری فنی — پیش‌نویس فاز صفر

وضعیت: پیش‌نویس برای تصویب. این سند انتخاب کتابخانه‌ها را نهایی نمی‌کند؛ مرزهای معماری و قراردادهای ساخت را تثبیت می‌کند.

## ۱. تصمیم بنیادی

بازی یک اثر مرورگری دوبعدی/فرم‌محور است، نه یک جهان سه‌بعدی. بنابراین:

- **Next.js با App Router و TypeScript** ستون فقرات است.
- **DOM/CSS** برای متن، حاشیه‌نویسی، فهرست شهادت‌ها، دیالوگ و رابط‌های تفسیری.
- **Canvas 2D** فقط برای واحدهایی که به میدان دیداری/صوتی نیاز دارند: نویز نوشتاری U2، حالت‌های حیوانی U17، مسیر خون U19، و هم‌زمانی صدا/شاهد در U20–U21.
- **Web Audio API** برای صدای بسنده و دی‌جتیک؛ بدون موتور صوتی سنگین در گام اول.
- **بدون Three.js/WebGL** تا زمانی که یک واحد خاص نیاز سه‌بعدی را توجیه کند.
- **بدون حساب کاربری**؛ نشست ناشناس با کوکی امضاشده.

دلیل: تجربهٔ این اثر از جنس متن، صدا، حافظه و شهادت است. موتور سه‌بعدی پیچیدگی بی‌فایده می‌آورد و دسترسی‌پذیری و استقرار را بدتر می‌کند.

## ۲. لایه‌ها

```text
Next.js Route/Server Action
        ↓
Application (use cases)
        ↓
Domain (entities, rules, state machine)
        ↑
Ports (interfaces)
        ↑
Adapters (DB, content, renderer, clock, IDs)
```

### ۲.۱. Domain

خالص و مستقل از Next.js، React، دیتابیس و مرورگر. شامل:

- `GameSession`: شناسه، فصل جاری، واحد جاری، وضعیت واحدها، دفتر تفسیر، دفتر شهادت، پرچم‌های روایی.
- `UnitProgress`: وضعیت `locked | available | active | resolved`، انتخاب‌ها، زمان، خروجی.
- `Interpretation`: ادعا، شاهد، انتخاب، تناقض، منبع.
- `WitnessRecord`: چه کسی چه چیزی را دیده و چه کسی آن را تأیید/رد کرده است.
- `MotifState`: وضعیت هر موتیف در هر ظهور.
- `SessionEvent`: رخداد تجزیه‌ناپذیر برای بازسازی وضعیت.

قواعد تغییر وضعیت فقط در Domain اجرا می‌شوند. UI و Route فقط فرمان می‌فرستند.

### ۲.۲. Application

Use caseها:

- `StartSession`
- `OpenUnit`
- `SubmitInterpretation`
- `RecordWitness`
- `ChooseTestimony`
- `CompleteUnit`
- `AdvanceChapter`
- `LoadSession`
- `ExportSession`

هر use case یک فرمان می‌گیرد، وضعیت را از repository می‌خواند، قاعده را اجرا می‌کند، رخداد را append می‌کند و view model تازه برمی‌گرداند.

### ۲.۳. Ports

```ts
export interface SessionRepository {
  load(id: string): Promise<GameSession | null>;
  append(id: string, events: SessionEvent[]): Promise<void>;
}

export interface ContentRepository {
  getUnit(id: string): Promise<UnitDefinition>;
  getChapter(id: string): Promise<ChapterDefinition>;
}

export interface SessionView {
  sessionId: string;
  chapter: ChapterView;
  unit: UnitView;
  interpretationLedger: InterpretationView[];
  availableCommands: CommandType[];
}

export interface UnitExperience {
  readonly unitId: string;
  readonly kind: "text" | "canvas" | "audio" | "composite";
  mount(host: HTMLElement, props: UnitView): void;
  update(props: UnitView): void;
  dispose(): void;
}
```

`UnitExperience` برای تجربه‌های Canvas/صوتی است؛ واحدهای متنی با React renderer معمولی اجرا می‌شوند. هر دو باید یک قرارداد مشاهده‌پذیر داشته باشند: `UnitView` و فرمان‌های مجاز.

### ۲.۴. Adapters

- `PostgresSessionRepository`: ذخیرهٔ رخدادها و snapshot.
- `JsonContentRepository`: بارگذاری بستهٔ محتوا از `content/`.
- `NextRouteAdapter`: route handlers/Server Actions.
- `CanvasUnitAdapter` و `ReactUnitAdapter`.
- `SystemClock` و `UlidGenerator`.

کتابخانهٔ دیتابیس و ORM در گام پیاده‌سازی انتخاب می‌شود؛ نامزد پیش‌فرض PostgreSQL + Prisma است، اما تا تأیید نصب نمی‌شود. اعتبارسنجی محتوا با یک schema validator (نامزد: Zod) انجام می‌شود.

## ۳. ساختار پوشه‌ها

```text
app/
  (game)/
    play/[sessionId]/page.tsx
  api/
    sessions/route.ts
    sessions/[id]/commands/route.ts
    sessions/[id]/view/route.ts
src/
  domain/
    session/
    units/
    interpretation/
    witness/
  application/
    commands/
    queries/
  ports/
  adapters/
    db/
    content/
    renderers/
  content/
    chapters/
    units/
    motifs/
    localization/
  ui/
    shell/
    units/
    components/
  lib/
```

`app/` فقط پوسته و اتصال است. منطق بازی در `src/domain` و `src/application` می‌ماند.

## ۴. مدل محتوا

هر واحد یک `UnitDefinition` دارد:

```ts
export interface UnitDefinition {
  id: string;
  order: number;
  chapterId: string;
  title: string;
  type: "paratext" | "core" | "support" | "catalyst";
  source: {
    lines: string;
    sentences: string;
    quote: string;
    charStart: number;
    charEnd: number;
  };
  expectation: string;
  intervention: string;
  dominant: string;
  level: 1 | 2 | 3 | 4 | 5;
  technique: string;
  motifs: string[];
  relations: string[];
  programmableObject: string;
  freeSpace: string[];
  renderer: {
    kind: "text" | "canvas" | "audio" | "composite";
    key: string;
  };
  commands: CommandType[];
  transitions: UnitTransition[];
}
```

متن منبع از کد جدا می‌ماند. بازه‌های کاراکتری و SHA-256 منبع در build اعتبارسنجی می‌شوند. هر تغییر در متن منبع باید build را بشکند، نه اینکه بی‌صدا بگذرد.

## ۵. جریان یک واحد

```text
OpenUnit
  → load UnitDefinition + Session
  → guard: chapter/order/previous state
  → emit UnitOpened
  → render UnitView
  → player command
  → validate + apply domain rule
  → append event
  → return new view
  → CompleteUnit when exit conditions met
```

واحدهای `catalyst` تودرتو می‌توانند بدون قفل فصل اجرا شوند، اما وضعیتشان جدا ثبت می‌شود. واحد `support` می‌تواند در کنار هسته فعال باشد، ولی ترتیب منبع را نمی‌شکند.

## ۶. ماشین وضعیت

### نشست

```text
Prologue → Chapter1 → Chapter2 → Chapter3 → Chapter4 → Chapter5 → Ended
```

### واحد

```text
locked → available → active → resolved
                         ↘ failed_validation (بازگشت به active)
```

`failed_validation` برای خطای فنی/داده است، نه شکست بازیکن. بازی «باخت» ندارد. اگر بازیکن از یک انتخاب عقب‌نشینی کند، رخداد `InterpretationRevised` ثبت می‌شود و انتخاب پیشین حذف نمی‌شود.

## ۷. دفتر تفسیر و شهادت

- هر انتخاب یک `Interpretation` با `unitId`، `claim`، `evidenceRefs` و `timestamp` می‌سازد.
- شهادت‌ها در `WitnessRecord` ثبت می‌شوند: شاهد، ادعا، تأییدکننده، منبع، وضعیت.
- فصل‌های بعد می‌توانند به انتخاب‌های قبلی ارجاع دهند، اما نمی‌توانند آن‌ها را جعل کنند.
- «حقیقت» نهایی در state وجود ندارد؛ فقط شبکهٔ ادعاها و شاهدها وجود دارد. این تصمیم تفسیری باید در UI هم منعکس شود.

## ۸. ذخیره/بارگذاری

- هر نشست یک `sessionId` ناشناس دارد.
- رخدادها append-only در `session_events` ذخیره می‌شوند.
- snapshot دوره‌ای برای بارگذاری سریع ساخته می‌شود.
- بازسازی وضعیت با reducer قطعی انجام می‌شود.
- نسخهٔ محتوا و نسخهٔ schema در snapshot ثبت می‌شود.
- ذخیرهٔ خراب: بازی snapshot قبلی را پیشنهاد می‌دهد، نه اینکه نشست را پاک کند.
- خروجی JSON برای پژوهش/بازبینی قابل دریافت است.

جدول‌های پیشنهادی:

```text
sessions(id, created_at, content_version, schema_version)
session_events(id, session_id, sequence, type, payload, created_at)
session_snapshots(session_id, sequence, state, created_at)
interpretations(id, session_id, unit_id, claim, evidence, created_at)
witness_records(id, session_id, unit_id, witness, claim, status, created_at)
```

## ۹. رابط کاربری و دسترسی‌پذیری

- راست‌به‌چپ کامل؛ فونت فارسی با fallback امن.
- متن منبع همیشه قابل خواندن با صفحه‌کلید و screen reader.
- Canvasها باید متن جایگزین/روایت موازی داشته باشند؛ تصویر تنها حامل معنا نباشد.
- تنظیم کاهش حرکت، اندازهٔ متن، کنتراست و صدا.
- فرمان‌ها با صفحه‌کلید و بدون نیاز به drag دقیق.
- هر واحد باید بدون صدا هم کامل باشد؛ صدا افزودهٔ تفسیری است، نه شرط بقا.

## ۱۰. کارایی

| بودجه | هدف |
|---|---|
| اولین محتوای معنادار | < ۲.۵ ثانیه در شبکهٔ معمول |
| پاسخ فرمان | < ۱۰۰ میلی‌ثانیه در محیط محلی |
| Canvas | ۶۰fps یا ۳۰fps پایدار |
| بارگذاری بستهٔ یک فصل | < ۵۰۰ms |
| ذخیره/بازسازی | < ۱ ثانیه برای snapshot |

بدون asset سه‌بعدی و بدون ویدیوی سنگین. صداها فشرده و قابل preload محدود.

## ۱۱. آزمون

- Unit test برای قواعد Domain و reducer.
- Contract test برای `UnitExperience` و view model.
- Integration test برای session → event → snapshot → restore.
- Test برای پوشش محتوا: هر `UnitDefinition` باید quote معتبر و بازهٔ منبع داشته باشد.
- Test برای عدم نشت state پنهان به view.
- Playwright برای مسیر کامل یک فصل و ذخیره/بارگذاری.
- Accessibility test برای RTL، keyboard و screen reader.
- Test خرابی snapshot و نسخهٔ ناسازگار.

## ۱۲. مهاجرت از نمونهٔ قبلی

نمونهٔ Canvas فعلی بایگانی می‌شود، حذف نمی‌شود. محتوای فصل ۱ از آن قابل استخراج است، اما مکانیک‌ها بازنویسی می‌شوند:

1. آرشیو در `archive/three-drops-canvas/`.
2. استخراج متن/دادهٔ قابل استفاده به `content/`.
3. بازنویسی واحد U1 به‌عنوان vertical slice معماری تازه.
4. تنها پس از تأیید U1، بقیهٔ فصل ۱.

## ۱۳. ریسک‌ها

| ریسک | اثر | کاهش |
|---|---|---|
| اورمهندسی موتور پیش از اثبات تجربه | تأخیر و پیچیدگی | شروع با U1؛ Canvas فقط در واحد نیازمند |
| از دست رفتن ابهام متن به‌نفع مکانیک شفاف | فروپاشی کارکرد مسلط‌زدا | حفظ دفتر تفسیر و نبود «پاسخ درست» |
| نمایش متن خام به‌جای تراگشت | تبدیل بازی به کتاب | آزمون برنامه‌پذیری هر واحد |
| دسترسی‌پذیری ضعیف Canvas | حذف بخشی از مخاطبان | روایت موازی متنی و کنترل‌های جایگزین |
| پیچیدگی ذخیره/بازسازی | از دست رفتن نشست | event log + snapshot + تست خرابی |
| ناسازگاری متن منبع | نقل‌قول جعلی | SHA-256 و اعتبارسنجی بازه‌ها در build |

## ۱۴. تصمیم‌های باقی‌مانده

- ORM/دیتابیس نهایی پس از scaffold.
- کتابخانهٔ schema validation.
- روش دقیق ذخیرهٔ صدا و فرمت asset.
- انتخاب Canvas 2D خام یا یک کتابخانهٔ سبک پس از نمونهٔ U2.
- سیاست telemetry: فعلاً هیچ؛ اگر افزوده شد، با رضایت و حداقل داده.

هیچ‌کدام از این‌ها مانع تصویب نقشهٔ فصل‌ها و روش واحد نیستند.
