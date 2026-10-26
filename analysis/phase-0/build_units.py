import csv
import hashlib
import json
import re
from pathlib import Path

BASE = Path(r"D:\Programming\Me\Payan-name\analysis\phase-0")
SRC = Path(r"C:\Users\LP\AppData\Local\Temp\opencode\payan_extract\story.txt")
SENT = Path(r"C:\Users\LP\AppData\Local\Temp\opencode\payan_extract\story_sentences.csv")

raw = SRC.read_text(encoding="utf-8-sig").replace("\r", "")
flat = re.sub(r"\s+", " ", raw.replace("◆", " ")).strip()
units = json.loads((BASE / "units-source.json").read_text(encoding="utf-8"))

TRANS = str.maketrans({"ي": "ی", "ك": "ک", "ﻰ": "ی", "ﻙ": "ک"})


def match_key(text):
    chars = []
    index = []
    last_space = False
    for i, ch in enumerate(text):
        if ch in ("\u200c", "\u200d", "\ufeff"):
            continue
        if ch.isspace():
            if not last_space:
                chars.append(" ")
                index.append(i)
                last_space = True
            continue
        last_space = False
        chars.append(ch.translate(TRANS))
        index.append(i)
    return "".join(chars), index


flat_key, flat_map = match_key(flat)


def locate(anchor, from_key=0):
    key, _ = match_key(anchor)
    pos = flat_key.find(key, from_key)
    if pos < 0:
        return -1, -1, -1
    first = flat_map[pos]
    last = flat_map[pos + len(key) - 1]
    return first, last + 1, pos


sentence_rows = list(csv.DictReader(SENT.open(encoding="utf-8-sig")))
sentence_ids = [r["id"] for r in sentence_rows]


def expand_ids(spec):
    nums = [int(x) for x in re.findall(r"S(\d{3})", spec)]
    if ("–" in spec or "-" in spec) and len(nums) >= 2:
        return [f"S{n:03d}" for n in range(min(nums), max(nums) + 1)]
    return [f"S{n:03d}" for n in nums]


for unit in units:
    start, _, start_key = locate(unit["start"])
    if start < 0:
        raise SystemExit(f"start not found: {unit['id']} {unit['start']}")
    _, end, _ = locate(unit["end"], start_key)
    if end < 0:
        raise SystemExit(f"end not found: {unit['id']} {unit['end']}")
    unit["quote"] = flat[start:end].strip()
    if flat[start:end] != unit["quote"]:
        raise SystemExit(f"quote mismatch: {unit['id']}")
    unit["char_start"] = start
    unit["char_end"] = end
    unit["char_len"] = len(unit["quote"])
    unit["sentence_ids"] = expand_ids(unit["sentences"])

coverage = {sid: [] for sid in sentence_ids}
for unit in units:
    for sid in unit["sentence_ids"]:
        if sid not in coverage:
            raise SystemExit(f"unknown sentence id: {unit['id']} {sid}")
        coverage[sid].append(unit["id"])

uncovered = [sid for sid, owners in coverage.items() if not owners]
multi = {sid: owners for sid, owners in coverage.items() if len(owners) > 1}

for unit in units:
    unit["coverage_role"] = "owner"
for unit in units:
    if unit["id"] == "U4":
        unit["coverage_role"] = "nested"

fields = [
    "id",
    "order",
    "title",
    "type",
    "chapter_id",
    "chapter",
    "sentences",
    "lines",
    "char_start",
    "char_end",
    "char_len",
    "quote",
    "summary",
    "subject",
    "expectation",
    "intervention",
    "function",
    "dominant",
    "level",
    "technique",
    "relations",
    "motifs",
    "object",
    "free_space",
    "crosswalk",
    "coverage_role",
    "status",
]

with (BASE / "narrative-units.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for unit in units:
        row = dict(unit)
        row["motifs"] = "؛ ".join(row["motifs"])
        writer.writerow({key: row.get(key, "") for key in fields})

(BASE / "narrative-units.json").write_text(
    json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8"
)

md = ["# اطلس واحدهای پایه — پیش‌نویس فاز صفر", ""]
md.append(
    "این فایل از `units-source.json` و متن کامل منبع تولید شده است. نقل‌قول هر واحد با جست‌وجوی لنگر آغاز/پایان از متن استخراج می‌شود؛ بازه‌های کاراکتری برای ماشین قابل استفاده‌اند."
)
md.append("")
for unit in units:
    md.append(f"## {unit['id']}. {unit['title']}")
    md.append("")
    md.append(f"- ترتیب: {unit['order']}")
    md.append(f"- نوع: `{unit['type']}`")
    md.append(f"- فصل نامزد: {unit['chapter']}")
    md.append(f"- سطرها: {unit['lines']} | جمله‌ها: {unit['sentences']}")
    md.append(f"- بازهٔ کاراکتری: {unit['char_start']}–{unit['char_end']} ({unit['char_len']} نویسه)")
    md.append(f"- سطح اتکاء: {unit['level']}")
    md.append(f"- شگرد نامزد: {unit['technique']}")
    md.append(f"- تطبیق با رساله: {unit['crosswalk']}")
    md.append("")
    md.append("> " + unit["quote"])
    md.append("")
    md.append(f"**خلاصه:** {unit['summary']}")
    md.append("")
    md.append(f"**سوژه/انتظار:** {unit['subject']} — {unit['expectation']}")
    md.append("")
    md.append(f"**مداخله:** {unit['intervention']}")
    md.append("")
    md.append(f"**کارکرد:** {unit['function']}")
    md.append("")
    md.append(f"**مسلط هدف:** {unit['dominant']}")
    md.append("")
    md.append(f"**روابط:** {unit['relations']}")
    md.append("")
    md.append(f"**موتیف‌ها:** {'؛ '.join(unit['motifs'])}")
    md.append("")
    md.append(f"**شیء برنامه‌پذیر نامزد:** {unit['object']}")
    md.append("")
    md.append(f"**فضای آزاد:** {unit['free_space']}")
    md.append("")
    md.append("---")
    md.append("")

(BASE / "narrative-units.md").write_text("\n".join(md), encoding="utf-8")

covered = set()
for unit in units:
    covered.update(range(unit["char_start"], unit["char_end"]))
uncovered_chars = [i for i in range(len(flat)) if i not in covered and not flat[i].isspace()]
covered_non_space = sum(1 for i in range(len(flat)) if not flat[i].isspace() and i in covered)
non_space = sum(1 for ch in flat if not ch.isspace())
sha = hashlib.sha256(SRC.read_bytes()).hexdigest()

cov = ["# گزارش پوشش متن", ""]
cov.append(f"- SHA-256 منبع: `{sha}`")
cov.append(f"- تعداد نویسه‌های متن نرمال‌شده: {len(flat)}")
cov.append(f"- نویسه‌های غیرفاصلهٔ پوشش‌داده‌شده: {covered_non_space} از {non_space}")
cov.append(f"- تعداد جمله/قطعهٔ شماره‌گذاری‌شده: {len(sentence_ids)}")
cov.append(f"- پوشش جمله: {len(sentence_ids) - len(uncovered)} از {len(sentence_ids)}")
cov.append(f"- تعداد واحدهای پایه: {len([u for u in units if u['id'] != 'G1'])}")
cov.append(f"- واحد پیرامتنی: {len([u for u in units if u['id'] == 'G1'])}")
cov.append(f"- جمله‌های بدون پوشش: {len(uncovered)}")
cov.append(f"- نویسه‌های غیرفاصلهٔ بدون پوشش: {len(uncovered_chars)}")
cov.append(f"- جمله‌های با بیش از یک مالک: {len(multi)}")
cov.append(f"- تطبیق نقل‌قول با بازهٔ کاراکتری: {len(units)} از {len(units)}")
cov.append("")
if uncovered:
    cov.append("## بدون پوشش")
    for sid in uncovered:
        row = next(r for r in sentence_rows if r["id"] == sid)
        cov.append(f"- {sid} (L{row['line']}): {row['text']}")
    cov.append("")
if multi:
    cov.append("## هم‌پوشانی")
    cov.append("- `U4` کاتالیزور تودرتو است و فقط `U5` مالک `S018` محسوب می‌شود.")
    for sid, owners in multi.items():
        row = next(r for r in sentence_rows if r["id"] == sid)
        cov.append(f"- {sid}: {', '.join(owners)} — {row['text']}")
    cov.append("")
cov.append("## پوشش به تفکیک واحد")
cov.append("")
cov.append("| واحد | جمله‌ها | نویسه | نوع |")
cov.append("|---|---|---|---|")
for unit in units:
    cov.append(
        f"| {unit['id']} | {unit['sentences']} | {unit['char_len']} | {unit['type']} |"
    )
(BASE / "coverage-report.md").write_text("\n".join(cov), encoding="utf-8")

print("units", len(units))
print("flat_chars", len(flat))
print("uncovered", len(uncovered))
print("multi", {sid: owners for sid, owners in multi.items()})
for unit in units:
    print(unit["id"], unit["char_len"])
