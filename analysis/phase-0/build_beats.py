import csv
from pathlib import Path

BASE = Path(r"D:\Programming\Me\Payan-name\analysis\phase-0")
SRC = Path(r"D:\Programming\Me\Payan-name\transposition-three-drops\source\narrative-atlas.csv")

rows = list(csv.DictReader(SRC.open(encoding="utf-8-sig")))
by_id = {row["id"]: dict(row) for row in rows}

by_id["N001"].update(
    title="عنوان: سه قطره خون",
    summary="عنوان اثر، عبارت محوری «سه قطره خون» را پیش از ورود به روایت تثبیت می‌کند.",
    function="نصب موتیف مرکزی و ایجاد انتظار تفسیری",
    motifs="خون/عنوان",
    quotes="Q001",
    note="بازتعریف به‌عنوان پیرامتن؛ عبارت خوانای روی کاغذ در N005 نگه داشته می‌شود.",
)
by_id["N025"]["motifs"] = "خون/کاج"
by_id["N053"].update(
    title="شهادت میرزا احمدخان",
    summary="سیاوش میرزا احمدخان را به‌عنوان شاهد معرفی می‌کند؛ او تأیید می‌کند که سه قطره خون را زیر کاج دیده است.",
    characters="سیاوش/میرزا احمدخان/راوی/رخساره",
    function="شهادت کارگردانی‌شده و تثبیت روایت با اقتدار اجتماعی",
    turn="شاهد از پیش تعیین‌شده فقط جملهٔ تأیید را می‌گوید",
    info_revealed="شهادت، حاصل مشاهدهٔ مستقل نیست",
    note="خلاصهٔ پیشین این beat با متن منبع هم‌خوان نبود و اصلاح شد.",
)

unit_map = {
    "N001": "G1",
    "N002": "U1", "N003": "U1", "N004": "U1",
    "N005": "U2",
    "N006": "U3", "N007": "U3", "N008": "U3", "N009": "U3",
    "N010": "U4",
    "N011": "U5", "N012": "U5",
    "N013": "U7", "N014": "U7",
    "N015": "U8", "N016": "U8", "N017": "U8",
    "N018": "U9", "N019": "U9", "N020": "U9", "N021": "U9",
    "N022": "U10", "N023": "U10", "N024": "U10", "N025": "U10",
    "N026": "U11", "N027": "U11",
    "N028": "U12", "N029": "U12", "N030": "U12",
    "N031": "U13", "N032": "U13",
    "N033": "U14", "N034": "U14",
    "N035": "U15",
    "N036": "U16", "N037": "U16",
    "N038": "U17", "N039": "U17", "N040": "U17",
    "N041": "U18", "N042": "U18", "N043": "U18",
    "N044": "U19", "N045": "U19", "N046": "U19",
    "N047": "U20", "N048": "U20", "N049": "U20",
    "N050": "U21", "N051": "U21",
    "N052": "U22",
    "N053": "U23",
    "N054": "U24",
    "N055": "U25", "N056": "U25",
    "N057": "U26",
    "N058": "U27",
    "N060": "U6", "N061": "U13",
}

new_rows = {
    "N060": {
        "id": "N060", "act": "آسایشگاه", "chapter": "۱", "scene": "۱۲الف",
        "title": "وسواس زهر و محوشدگی",
        "summary": "راوی خیال مسموم‌کردن همه را دارد و از مسموم‌شدن خود می‌ترسد؛ حافظه‌اش محو می‌شود.",
        "fabula_time": "یک سال گذشته", "sjuzhet_order": "",
        "characters": "راوی/دکتر/محمدعلی", "setting": "آسایشگاه/اتاق آبی",
        "conflict": "پارانویا/اعتماد", "turn": "قربانی و جلاد در یک ذهن جابه‌جا می‌شوند",
        "info_revealed": "ترس از زهر و خیال زهر دادن هم‌زمان‌اند",
        "function": "تعلیق اعتماد به ادراک راوی و نهاد",
        "protocol": "اعتماد به نهاد درمان", "dominant": "روایت‌زاد + اعتماد به راوی",
        "motifs": "زهر/دکتر/اتاق آبی/محو شدن", "quotes": "",
        "coverage": "add", "reason": "حفرهٔ وسواس زهر در اطلس پیشین؛ اکنون U6.",
        "priority": "core", "note": "افزوده؛ حفرهٔ وسواس زهر.",
    },
    "N061": {
        "id": "N061", "act": "سیاوش", "chapter": "۴", "scene": "۳۲الف",
        "title": "دعوت به خانه و اشارهٔ سکوت",
        "summary": "سیاوش راوی را به خانهٔ خالی دعوت می‌کند و با انگشت به لب، او را به سکوت و پایین‌آمدن فرا می‌خواند.",
        "fabula_time": "همان غروب", "sjuzhet_order": "",
        "characters": "سیاوش/راوی", "setting": "حیاط/پشت‌بام/خانهٔ سیاوش",
        "conflict": "دعوت/سکوت", "turn": "عاملیت از جست‌وجوی راوی به دعوت سیاوش منتقل می‌شود",
        "info_revealed": "سیاوش سالم در حیاط است و چیزی را پنهان می‌کند",
        "function": "ورود به جهان رازآلود و آماده‌سازی اعتراف",
        "protocol": "دیدار ممنوع/بیماری", "dominant": "روایت‌زاد + زمان/مکان",
        "motifs": "دعوت/سکوت/حیاط/ششلول", "quotes": "",
        "coverage": "add", "reason": "حفرهٔ دیالوگی دعوت و سکوت در اطلس پیشین؛ اکنون U13.",
        "priority": "core", "note": "افزوده؛ حفرهٔ دعوت/سکوت.",
    },
}

sequence = {}
for i in range(1, 13):
    sequence[f"N{i:03d}"] = i
sequence["N060"] = 13
for i in range(13, 33):
    sequence[f"N{i:03d}"] = i + 1
sequence["N061"] = 34
for i in range(33, 59):
    sequence[f"N{i:03d}"] = i + 2

selected = []
for nid, seq in sorted(sequence.items(), key=lambda item: item[1]):
    row = by_id.get(nid) or new_rows.get(nid)
    if row is None:
        raise SystemExit(f"missing row {nid}")
    row = dict(row)
    row["sequence"] = str(seq)
    row["unit_id"] = unit_map[nid]
    row.setdefault("note", "")
    if nid in new_rows:
        row["status"] = "add"
    elif nid == "N053":
        row["status"] = "corrected"
    elif nid == "N001":
        row["status"] = "redefined"
    else:
        row["status"] = "keep"
    selected.append(row)

fields = [
    "sequence", "id", "unit_id", "act", "chapter", "scene", "title", "summary",
    "fabula_time", "characters", "setting", "conflict", "turn", "info_revealed",
    "function", "protocol", "dominant", "motifs", "quotes", "status", "note",
]

with (BASE / "narrative-beats.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(selected)

with (BASE / "archived-beats.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    archived = dict(by_id["N059"])
    archived.update(sequence="", unit_id="", status="archived", note="در متن منبع نیست؛ افزودهٔ نسخهٔ قبلی.")
    writer.writerow(archived)

units = [f"G1"] + [f"U{i}" for i in range(1, 28)]
counts = {unit: 0 for unit in units}
for row in selected:
    counts[row["unit_id"]] += 1

md = ["# اطلس L1 — بیت‌های منبع", ""]
md.append(f"- تعداد بیت‌های L1: {len(selected)}")
md.append(f"- واحدهای L2 پوشش‌داده‌شده: {len([u for u in units if counts[u] > 0])} از {len(units)}")
md.append("- `N059` بایگانی شد؛ `N060` و `N061` افزوده شدند؛ `N001` به پیرامتن بازتعریف شد.")
md.append("")
md.append("| ترتیب | شناسه | واحد | عنوان | کارکرد |")
md.append("|---|---|---|---|---|")
for row in selected:
    md.append(f"| {row['sequence']} | {row['id']} | {row['unit_id']} | {row['title']} | {row['function']} |")
(BASE / "narrative-beats.md").write_text("\n".join(md), encoding="utf-8")

cross = ["# ماتریس اتصال L1 به L2", ""]
cross.append("| واحد | بیت‌های L1 | تعداد |")
cross.append("|---|---|---|")
for unit in units:
    ids = [row["id"] for row in selected if row["unit_id"] == unit]
    cross.append(f"| {unit} | {', '.join(ids)} | {counts[unit]} |")
missing = [unit for unit in units if counts[unit] == 0]
cross.append("")
cross.append(f"- واحدهای بدون بیت: {', '.join(missing) if missing else 'هیچ'}")
cross.append("- `S018` میان U4 (کاتالیزور تودرتو) و U5 (مالک) مشترک است؛ در ماتریس پوشش فقط U5 مالک است.")
(BASE / "l1-l2-crosswalk.md").write_text("\n".join(cross), encoding="utf-8")

print("beats", len(selected))
print("missing", missing)
print("counts", counts)
