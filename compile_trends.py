#!/usr/bin/env python3
# =============================================================================
# compile_trends.py
# -----------------------------------------------------------------------------
# Folds the agent-collected series in manual_trends.json into the unified
# long-format bristol_trends.csv (adding a `notes` column). Idempotent: any
# indicator id present in manual_trends.json is removed from the CSV before its
# rows are re-appended, so re-running never duplicates.
#
#   Run order:  python scrape_bristol_trends.py   (writes Nomis rows -> CSV)
#               python compile_trends.py           (merges manual_trends.json)
#               python build_trends_js.py          (CSV -> bristol-trends.js)
# =============================================================================
import csv, json, os

CSV = "bristol_trends.csv"
MANUAL = "manual_trends.json"
COLS = ["indicator","indicator_label","area","year","value","unit","source","source_url","notes"]

def load_csv():
    if not os.path.exists(CSV):
        return []
    rows = []
    for r in csv.DictReader(open(CSV, encoding="utf-8")):
        r.setdefault("notes", "")
        rows.append({c: r.get(c, "") for c in COLS})
    return rows

def main():
    manual = json.load(open(MANUAL, encoding="utf-8"))["indicators"]
    manual_ids = {m["id"] for m in manual}

    # keep existing rows except any indicator we're about to (re)insert from manual
    rows = [r for r in load_csv() if r["indicator"] not in manual_ids]

    for m in manual:
        for p in m["points"]:
            for area_key, area_name in (("bristol", "Bristol"), ("england", "England")):
                v = p.get(area_key)
                if v is None:
                    continue
                rows.append({
                    "indicator": m["id"], "indicator_label": m["label"],
                    "area": area_name, "year": p["year"], "value": v,
                    "unit": m["unit"], "source": m["source"],
                    "source_url": m["source_url"], "notes": m.get("notes", ""),
                })

    rows.sort(key=lambda r: (r["indicator"], r["area"], int(float(r["year"]))))
    with open(CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        w.writerows(rows)
    ids = sorted({r["indicator"] for r in rows})
    print(f"unified {CSV}: {len(rows)} rows, {len(ids)} indicators -> {', '.join(ids)}")

if __name__ == "__main__":
    main()
