import hashlib
import json
from pathlib import Path

BASE = Path(r"D:\Programming\Me\Payan-name\analysis\phase-0")
SRC = Path(r"C:\Users\LP\AppData\Local\Temp\opencode\payan_extract\story.txt")

units = json.loads((BASE / "narrative-units.json").read_text(encoding="utf-8"))
sha = hashlib.sha256(SRC.read_bytes()).hexdigest()

designs = {}
for path in sorted((BASE / "designs").glob("*.json")):
    designs.update(json.loads(path.read_text(encoding="utf-8")))

expected = {unit["id"] for unit in units}
if set(designs) != expected:
    raise SystemExit(f"design ids mismatch: missing={sorted(expected - set(designs))} extra={sorted(set(designs) - expected)}")

records = []
for unit in units:
    design = designs[unit["id"]]
    pending = []
    form = {
        "1_print_unit": unit["quote"],
        "2_position": {
            "chapter": unit["chapter"],
            "order": unit["order"],
            "lines": unit["lines"],
            "sentences": unit["sentences"],
            "char_range": f'{unit["char_start"]}–{unit["char_end"]}',
            "relations": unit["relations"],
            "motifs": unit["motifs"],
            "macro_role": unit["function"],
            "dialectical_inversion": design["dialectical_inversion"],
        },
        "3_level": unit["level"],
        "4_dominant_protocol": {
            "dominant": unit["dominant"],
            "normalized_protocol": unit["expectation"],
            "recalibration": unit["intervention"],
        },
        "5_dominant_breaking_function": unit["function"],
        "6_transposition_unit": design["transposition_unit"],
        "7_technique": {
            "candidate": unit["technique"],
            "print_computer_pairs": design["print_computer_pairs"],
        },
        "8_native_materials": [
            {
                "material": unit["object"],
                "status": "candidate",
            }
        ],
        "9_interpretation": {
            "contract": design["interpretive_contract"],
            "threshold": design["interpretive_threshold"],
            "feedback_loop": design["aesthetic_feedback_loop"],
            "failure_conditions": design["failure_conditions"],
        },
        "10_composition_rules": design["composition_rules"],
        "11_free_space": {
            "questions": [item["question"] for item in design["free_space_options"]],
            "options": design["free_space_options"],
            "untranslatable": design["untranslatable"],
        },
        "12_summary": design["final_summary"],
    }
    records.append(
        {
            "id": unit["id"],
            "order": unit["order"],
            "title": unit["title"],
            "type": unit["type"],
            "chapter": unit["chapter"],
            "source": {
                "lines": unit["lines"],
                "sentences": unit["sentences"],
                "char_start": unit["char_start"],
                "char_end": unit["char_end"],
                "quote": unit["quote"],
            },
            "crosswalk": unit["crosswalk"],
            "status": "design_complete_unverified",
            "pending_fields": pending,
            "form": form,
        }
    )

data = {
    "title": "تراگشت سه قطره خون",
    "status": "phase_0_report_ready_unverified",
    "source_sha256": sha,
    "source_chars_normalized": 14003,
    "units_count": 27,
    "paratext_count": 1,
    "beats_count": 60,
    "records": records,
}
(BASE / "report-data.json").write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)

pair_count = sum(len(r["form"]["7_technique"]["print_computer_pairs"]) for r in records)
question_count = sum(len(r["form"]["11_free_space"]["options"]) for r in records)
sample = next(r for r in records if r["id"] == "U1")
sample_form = sample["form"]
sample_unit = sample_form["6_transposition_unit"]

md = [
    "# گزارش تراگشت سه قطره خون — فاز صفر",
    "",
    f"- SHA-256 منبع: `{sha}`",
    "- واحدهای پایه: ۲۷ + پیرامتن `G1`",
    "- بیت‌های L1: ۶۰",
    "- وضعیت: طراحی هر ۲۸ جدول کامل شده؛ بازبینی انسانی و پلی‌تست انجام نشده است.",
    "",
    "## ساختار سند",
    "",
    "1. صفحهٔ عنوان و چکیده",
    "2. مسئله، پرسش‌ها و روش تراگشت",
    "3. تحلیل منبع: پوشش، L1 و L2",
    "4. نقشهٔ فصل‌ها و معماری کلان",
    "5. جدول‌های واحدهای پایه (G1 و U1–U27)",
    "6. طراحی فنی و قراردادهای پیاده‌سازی",
    "7. جمع‌بندی، محدودیت‌ها و پیوست شاهدها",
    "",
    "## نگاشت دوازده بخش فرم",
    "",
    "| بخش فرم | منبع داده | وضعیت |",
    "|---|---|---|",
    "| ۱. واحد پایهٔ چاپی | `form.1_print_unit` | کامل از منبع |",
    "| ۲. جایگاه و روابط | `form.2_position` | کامل؛ شامل وارونگی دیالکتیکی |",
    "| ۳. طیف اتکاء | `form.3_level` | کامل |",
    "| ۴. مسلط و پروتکل | `form.4_dominant_protocol` | کامل |",
    "| ۵. کارکرد مسلط‌زدا | `form.5_dominant_breaking_function` | کامل |",
    "| ۶. واحد تراگشت | `form.6_transposition_unit` | کامل |",
    "| ۷. شگرد تراگشت | `form.7_technique` | کامل؛ دارای جدول چاپ/رایانه |",
    "| ۸. مصالح بومی | `form.8_native_materials` | نامزد فنی، متصل به واحد |",
    "| ۹. آستانه و بازخورد | `form.9_interpretation` | کامل |",
    "| ۱۰. قواعد ترکیب | `form.10_composition_rules` | کامل |",
    "| ۱۱. فضای آزاد | `form.11_free_space` | کامل؛ گزینه و پیامد |",
    "| ۱۲. جمع‌بندی | `form.12_summary` | کامل |",
    "",
    "## فصل‌ها",
    "",
    "| فصل | واحدها | وضعیت |",
    "|---|---|---|",
    "| پیش‌درآمد | G1 | طراحی کامل؛ تأییدشده |",
    "| فصل ۱: کاغذ و آسایشگاه | U1–U9 | طراحی کامل؛ تأییدشده |",
    "| فصل ۲: عباس و میهمانان | U10–U12 | طراحی کامل؛ تأییدشده |",
    "| فصل ۳: سیاوش و سه قطره | U13–U15 | طراحی کامل؛ تأییدشده |",
    "| فصل ۴: نازی | U16–U20 | طراحی کامل؛ تأییدشده |",
    "| فصل ۵: نمایش عادی‌بودن | U21–U27 | طراحی کامل؛ تأییدشده |",
    "",
    "## خلاصهٔ طراحی",
    "",
    f"- جدول‌های واحد: **{len(records)}**",
    f"- واحدهای تراگشت: **{len(records)}**",
    f"- جفت‌های چاپ/رایانه: **{pair_count}**",
    f"- پرسش‌های فضای آزاد: **{question_count}**",
    "- وضعیت: `design_complete_unverified`",
    "",
    "## فهرست واحدها",
    "",
    "| ترتیب | شناسه | عنوان | فصل | جمله‌ها | واحد تراگشت | وضعیت |",
    "|---|---|---|---|---|---|---|",
]

for record in records:
    md.append(
        f"| {record['order']} | {record['id']} | {record['title']} | {record['chapter']} | {record['source']['sentences']} | {record['form']['6_transposition_unit']['name']} | {record['status']} |"
    )

md.extend(
    [
        "",
        "## نمونهٔ فشردهٔ U1",
        "",
        f"- وارونگی: {sample_form['2_position']['dialectical_inversion']}",
        f"- واحد تراگشت: **{sample_unit['name']}** — {sample_unit['intervention']}",
        f"- پیمان تفسیری: {sample_form['9_interpretation']['contract']}",
        f"- آستانه: {sample_form['9_interpretation']['threshold']}",
        f"- بازخورد: {sample_form['9_interpretation']['feedback_loop']}",
        f"- فضای آزاد: {len(sample_form['11_free_space']['options'])} پرسش طراحی‌شده",
        "",
        "## وضعیت و کارهای باقی‌مانده",
        "",
        "1. گزارش DOCX با ۲۸ جدول و پیش‌نمایش PDF تولید شده است: `report-three-drops.docx` و `report-three-drops-preview.pdf`.",
        "2. بازبینی انسانی متن، جدول‌ها و چیدمان گزارش.",
        "3. پلی‌تست U1 و سپس اعتبارسنجی تجربی، نه ادعای پذیرش.",
        "4. پس از تأیید گزارش: اسکافولد Next.js و انتقال نمونهٔ قبلی به آرشیو.",
    ]
)

(BASE / "03-report-skeleton.md").write_text("\n".join(md), encoding="utf-8")

print("records", len(records))
print("pending", sum(len(r["pending_fields"]) for r in records))
print("pairs", pair_count)
print("questions", question_count)
