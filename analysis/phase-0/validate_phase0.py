import csv
import json
import re
import zipfile
from pathlib import Path

BASE = Path(r"D:\Programming\Me\Payan-name\analysis\phase-0")
SRC = Path(r"C:\Users\LP\AppData\Local\Temp\opencode\payan_extract\story.txt")

errors = []
units = json.loads((BASE / "narrative-units.json").read_text(encoding="utf-8"))
beats = list(csv.DictReader((BASE / "narrative-beats.csv").open(encoding="utf-8-sig")))
archived = list(csv.DictReader((BASE / "archived-beats.csv").open(encoding="utf-8-sig")))
report = json.loads((BASE / "report-data.json").read_text(encoding="utf-8"))

expected_ids = ["G1"] + [f"U{i}" for i in range(1, 28)]
ids = [unit["id"] for unit in units]
if ids != expected_ids:
    errors.append("unit ids/order mismatch")
if [unit["order"] for unit in units] != list(range(28)):
    errors.append("unit order not contiguous")

source = re.sub(
    r"\s+", " ", SRC.read_text(encoding="utf-8-sig").replace("\r", "").replace("◆", " ")
).strip()
for unit in units:
    if source[unit["char_start"] : unit["char_end"]] != unit["quote"]:
        errors.append(f"quote mismatch: {unit['id']}")
    for field in ["summary", "expectation", "intervention", "function", "dominant", "technique", "object", "free_space", "crosswalk"]:
        if not unit.get(field):
            errors.append(f"empty {field}: {unit['id']}")

if len(beats) != 60:
    errors.append(f"beat count {len(beats)} != 60")
if [int(row["sequence"]) for row in beats] != list(range(1, 61)):
    errors.append("beat sequence mismatch")
if len({row["id"] for row in beats}) != 60:
    errors.append("duplicate beat id")
for row in beats:
    if row["unit_id"] not in expected_ids:
        errors.append(f"bad beat unit: {row['id']}")
    if row["id"] == "N059":
        errors.append("N059 still in beats")
if any(row["id"] != "N059" for row in archived):
    errors.append("archived set is not N059")

beat_units = {row["unit_id"] for row in beats}
if beat_units != set(expected_ids):
    errors.append("L1 does not cover all L2 units")

if len(report["records"]) != 28:
    errors.append("report record count mismatch")
if report["beats_count"] != 60:
    errors.append("report beat count mismatch")
if report["units_count"] != 27:
    errors.append("report unit count mismatch")
if report["status"] != "phase_0_report_ready_unverified":
    errors.append("report status mismatch")

for record in report["records"]:
    rid = record["id"]
    form = record["form"]
    if record["pending_fields"]:
        errors.append(f"pending fields: {rid}")
    if record["status"] != "design_complete_unverified":
        errors.append(f"record status: {rid}")
    if not form["2_position"]["dialectical_inversion"]:
        errors.append(f"empty dialectical inversion: {rid}")
    unit = form["6_transposition_unit"]
    for key in ["name", "subject", "violated_protocol", "intervention", "suspension", "player_role", "verb", "goal", "obstacle", "failure", "exit"]:
        if not unit.get(key):
            errors.append(f"empty unit {key}: {rid}")
    pairs = form["7_technique"]["print_computer_pairs"]
    if len(pairs) < 3:
        errors.append(f"too few pairs: {rid}")
    for pair in pairs:
        if not pair.get("print") or not pair.get("computer"):
            errors.append(f"empty pair: {rid}")
    interpretation = form["9_interpretation"]
    for key in ["contract", "threshold", "feedback_loop", "failure_conditions"]:
        if not interpretation.get(key):
            errors.append(f"empty interpretation {key}: {rid}")
    if len(form["10_composition_rules"]) < 4:
        errors.append(f"too few composition rules: {rid}")
    free = form["11_free_space"]
    if len(free["questions"]) != len(free["options"]):
        errors.append(f"free-space question/option mismatch: {rid}")
    if len(free["options"]) < 2:
        errors.append(f"too few free-space questions: {rid}")
    for item in free["options"]:
        if not item.get("question") or len(item.get("options", [])) < 2:
            errors.append(f"bad free-space item: {rid}")
        for option in item.get("options", []):
            if not option.get("option") or not option.get("consequence"):
                errors.append(f"bad free-space option: {rid}")
    if not free.get("untranslatable"):
        errors.append(f"empty untranslatable: {rid}")
    summary = form["12_summary"]
    for key in ["level", "dominant", "protocol", "function", "transposition_unit", "technique", "materials", "free_space"]:
        if not summary.get(key):
            errors.append(f"empty summary {key}: {rid}")
    summary_level = summary["level"].replace("پیرامتن", "—").strip()
    if summary_level != form["3_level"]:
        errors.append(f"summary level mismatch: {rid}")

for path in [
    "00-unit-method.md",
    "01-chapter-map.md",
    "02-architecture.md",
    "03-report-skeleton.md",
    "04-phase-0-gate.md",
    "coverage-report.md",
    "l1-l2-crosswalk.md",
    "report-three-drops.docx",
    "report-three-drops-preview.pdf",
]:
    if not (BASE / path).exists():
        errors.append(f"missing {path}")

docx_path = BASE / "report-three-drops.docx"
if docx_path.exists():
    with zipfile.ZipFile(docx_path) as archive:
        xml = archive.read("word/document.xml").decode("utf-8")
    for unit_id in expected_ids:
        if f"{unit_id} —" not in xml:
            errors.append(f"docx missing unit heading: {unit_id}")
    if xml.count("<w:tbl>") != 34:
        errors.append(f"docx table count {xml.count('<w:tbl>')} != 34")

if errors:
    print("FAIL")
    for error in errors:
        print(error)
    raise SystemExit(1)

print(f"OK units={len(units)} beats={len(beats)} report_records={len(report['records'])}")
