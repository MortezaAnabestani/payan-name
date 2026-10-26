import csv
from pathlib import Path

p = Path(__file__).with_name("narrative-atlas.csv")
rows = list(csv.reader(p.open(encoding="utf-8")))
header = rows[0]
assert len(header) == 21
out = [header]
for row in rows[1:]:
    if len(row) == 21:
        out.append(row)
        continue
    base = row[:15]
    rest = row[15:]
    qi = next((i for i, value in enumerate(rest) if value.startswith("Q")), None)
    if qi is None:
        raise ValueError(f"no quote marker in {row[0]}: {rest}")
    pre = rest[:qi]
    tail = rest[qi + 1:]
    if len(tail) != 3:
        raise ValueError(f"bad tail in {row[0]}: {tail}")
    if len(pre) == 0:
        dominant, motifs = "", ""
    elif len(pre) == 1:
        value = pre[0]
        if "=" in value or value in {"قدرت", "شنیداری", "غوطه‌وری/زیبایی", "نظم/زمان"}:
            dominant, motifs = value, ""
        else:
            dominant, motifs = "", value
    else:
        dominant, motifs = pre[0], pre[1]
    out.append(base + [dominant, motifs, rest[qi]] + tail)
with p.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, quoting=csv.QUOTE_ALL)
    w.writerows(out)
print(f"normalized {len(out)-1} rows")
