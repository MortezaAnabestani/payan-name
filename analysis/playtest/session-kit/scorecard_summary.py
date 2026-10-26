#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""scorecard_summary.py — خلاصه‌ساز session-scorecard.csv برای جمع‌بندی پذیرش (§۸ runbook).

کاربرد:
    python3 analysis/playtest/session-kit/scorecard_summary.py [path/to/scorecard.csv]

خروجی:
  - شمار ردیف‌ها (کل / complete=yes) به‌عنوان مخرج نسبت‌ها
  - میانگین رضایت ۰–۱۰۰ و نمرات ۱–۵ (فقط ردیف‌های کامل)
  - نسبت yes/true در ستون‌های بولی پذیرش
  - هشترها: ستون خالی، کد تکراری، مقدار نامعتبر، نشانهٔ «فرم/سایت»

قواعد صداقت: این ابزار فقط آمار ردیف‌های ثبت‌شده را می‌دهد؛ حکم پذیرش را نمی‌دهد.
معیارهای آستانه (≥۴/۵ و …) در پروتکل هر واحد است: phase-1/03 §۸، phase-1/08 §۸، phase-1/11 §۸.
هیچ مقداری حدسی نیست؛ سلول خالی = ثبت‌نشده، نه صفر.
"""
import csv
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_CSV = HERE / "session-scorecard.csv"

BOOL_COLS = [
    "motif_or_texture_seen_no_hint",
    "website_form_language_used",   # معکوس: true = نقض
    "told_story_recount_y_n",
    "distinction_registered_vs_read_y_n",
    "object_touch_described_y_n",
    "sound_removal_noticed_y_n",
    "keyboard_full_path_y_n",
    "reduce_motion_survived_y_n",
    "narrow_390_ok_y_n",
    "screenreader_session_y_n",
]
INVERTED_BOOL = {"website_form_language_used"}  # اینجا yes = شکست بند
NUM0100 = ["satisfaction_0_100"]
NUM15 = ["ease_1_5", "presence_1_5", "clarity_lock_consequence_1_5", "continue_likelihood_1_5"]
REQUIRED = ["id", "unit", "complete"]


def parse_bool(v):
    s = (v or "").strip().lower()
    if s in {"yes", "y", "true", "بله"}:
        return True
    if s in {"no", "n", "false", "نه"}:
        return False
    return None


def to_float(v):
    try:
        return float((v or "").strip())
    except ValueError:
        return None


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    if not path.exists():
        print(f"ERROR: scorecard not found: {path}")
        return 1

    with path.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    complete = [r for r in rows if parse_bool(r.get("complete")) is True]
    n = len(complete)
    print(f"# خلاصهٔ scorecard: {path.name}")
    print(f"ردیف کل: {total} | کامل (complete=yes → مخرج نسبت‌ها): {n}")
    if n == 0:
        print("هنوز هیچ ردیف کاملی ثبت نشده — نشست‌ها اجرا نشده یا ناقص‌اند. حکمی قابل استخراج نیست.")
        return 0

    by_unit = Counter((r.get("unit") or "?").strip() for r in complete)
    print(f"واحد‌ها (ردیف کامل): {dict(by_unit)}")

    ids = [r.get("id", "").strip() for r in complete]
    dups = [k for k, c in Counter(ids).items() if c > 1 and k]
    if dups:
        print(f"هشدار کد تکراری: {dups}")

    def mean(col, lo, hi):
        vals = [to_float(r.get(col)) for r in complete]
        vals = [v for v in vals if v is not None and lo <= v <= hi]
        missing = sum(1 for r in complete if to_float(r.get(col)) is None)
        avg = (sum(vals) / len(vals)) if vals else None
        flag = f" | {missing} خالی" if missing else ""
        return f"{avg:.1f} (n={len(vals)}){flag}" if avg is not None else f"— (همگی خالی){flag}"

    print("\n## پرسش‌های بسته")
    for c in NUM0100:
        print(f"- {c}: {mean(c, 0, 100)}")
    for c in NUM15:
        print(f"- {c}: {mean(c, 1, 5)}")

    print("\n## ستون‌های بولی (نسبت از ردیف‌های کاملِ ثبت‌شده)")
    for c in BOOL_COLS:
        vals = [parse_bool(r.get(c)) for r in complete]
        known = [v for v in vals if v is not None]
        yes = sum(1 for v in known if v)
        invalid = len([r for r in complete if (r.get(c) or "").strip()]) - len(known)
        tag = " (yes = نقض بند)" if c in INVERTED_BOOL else ""
        if known:
            print(f"- {c}{tag}: {yes}/{len(known)} = {yes/len(known):.2f}" + (f" | {invalid} نامعتبر" if invalid else ""))
        else:
            print(f"- {c}{tag}: ثبت‌نشده")

    print("\n## مشکلات فنی (جمع روی ردیف‌های کامل)")
    for c in ("console_errors", "critical_bugs"):
        vals = [to_float(r.get(c)) for r in complete]
        tot = int(sum(v for v in vals if v is not None))
        print(f"- {c}: مجموع={tot}")

    print("\n## بازرستی داده")
    issues = []
    for r in complete:
        rid = r.get("id", "?")
        for req in REQUIRED:
            if not (r.get(req) or "").strip():
                issues.append(f"{rid}: ستون لازم خالی: {req}")
        consent = (r.get("screenshot_consent") or "").strip().lower()
        quote = (r.get("key_quote") or "").strip()
        if consent in ("", "no") and quote:
            issues.append(f"{rid}: نقل‌قول ثبت شده ولی رضایت نقل‌قول/صفحه تیک نخورده — بررسی کن")
    if issues:
        for i in issues:
            print(f"! {i}")
    else:
        print("بدون ایراد ساختاری.")

    print("\nیادآوری: حکم پذیرش را دستی با آستانه‌های پروتکل همان واحد بده "
          "(phase-1/03 §۸ | phase-1/08 §۸ | phase-1/11 §۸) و در گزارش + دروازه ثبت کن.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
