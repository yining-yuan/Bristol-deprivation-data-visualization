#!/usr/bin/env python3
# =============================================================================
# scrape_bristol_trends.py
# -----------------------------------------------------------------------------
# Pulls the indicators that have a genuine ANNUAL time series from the Nomis
# REST API (fully automatic), for Bristol (E06000023) vs England (E92000001),
# and appends them to a tidy long-format CSV:
#
#     indicator, indicator_label, area, year, value, unit, source, source_url
#
# Nomis-scriptable indicators:
#   - Employment rate 16-64          (APS, NM_17_5 var 45)
#   - Adults with NVQ4+ (Level 4+)   (APS, NM_17_5 var 290)
#   - Adults with no qualifications  (APS, NM_17_5 var 344)
#   - Median gross weekly pay (res.) (ASHE, NM_30_1 sex=7 item=2 pay=1)
#
# The remaining indicators (DfE education, ONS life expectancy, DWP child
# poverty, GDHI) are gathered separately and appended to the same CSV.
#
# Usage:  python scrape_bristol_trends.py            # -> bristol_trends.csv
#         python scrape_bristol_trends.py --years 10 # keep last N years
# =============================================================================
from __future__ import annotations
import argparse, csv, io, sys, re
from urllib.request import urlopen, Request

NOMIS = "https://www.nomisweb.co.uk/api/v01/dataset"
BRISTOL = "E06000023"
ENGLAND = "E92000001"

# indicator id -> (label, unit, nomis dataset, query params, source name)
APS = "https://www.nomisweb.co.uk/datasets/apsnew"
ASHE = "https://www.nomisweb.co.uk/datasets/asher"

def fetch_csv(url):
    req = Request(url, headers={"User-Agent": "bristol-trends/1.0"})
    with urlopen(req, timeout=90) as r:
        text = r.read().decode("utf-8", "replace")
    return list(csv.DictReader(io.StringIO(text)))

def calendar_year(date_name):
    """Return the calendar year for a 'Jan YYYY-Dec YYYY' APS window, else None."""
    m = re.match(r"Jan (\d{4})-Dec (\d{4})", date_name)
    return int(m.group(1)) if m else None

def aps_series(var, indicator, label, unit):
    url = (f"{NOMIS}/NM_17_5.data.csv?geography={BRISTOL},{ENGLAND}"
           f"&variable={var}&measures=20599"
           "&select=date_name,geography_name,obs_value")
    out = []
    for row in fetch_csv(url):
        yr = calendar_year(row["DATE_NAME"])
        if yr is None:
            continue  # keep only calendar-year windows -> one point per year
        area = "Bristol" if row["GEOGRAPHY_NAME"].startswith("Bristol") else "England"
        val = row["OBS_VALUE"]
        if val in ("", None):
            continue
        out.append([indicator, label, area, yr, float(val), unit, "ONS Annual Population Survey (via Nomis)", APS])
    return out

def ashe_pay():
    # ASHE resident analysis: median (item=2) gross weekly pay (pay=1), all workers (sex=7)
    url = (f"{NOMIS}/NM_30_1.data.csv?geography={BRISTOL},{ENGLAND}"
           "&sex=7&item=2&pay=1&measures=20100"
           "&select=date_name,geography_name,obs_value")
    out = []
    for row in fetch_csv(url):
        m = re.match(r"(\d{4})", row["DATE_NAME"])
        if not m:
            continue
        yr = int(m.group(1))
        area = "Bristol" if row["GEOGRAPHY_NAME"].startswith("Bristol") else "England"
        val = row["OBS_VALUE"]
        if val in ("", None) or val == "-":
            continue
        out.append(["pay", "Median gross weekly pay (residents)", area, yr, float(val),
                    "£", "ONS ASHE resident analysis (via Nomis)", ASHE])
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="bristol_trends.csv")
    ap.add_argument("--years", type=int, default=11)
    a = ap.parse_args()

    rows = []
    print("Fetching APS employment rate 16-64 ...", file=sys.stderr)
    rows += aps_series(45,  "employment", "Employment rate (16-64)", "%")
    print("Fetching APS NVQ4+ ...", file=sys.stderr)
    rows += aps_series(290, "quals_l4",   "Adults with Level 4+ qualifications", "%")
    print("Fetching APS no qualifications ...", file=sys.stderr)
    rows += aps_series(344, "quals_none", "Adults with no qualifications", "%")
    print("Fetching ASHE median weekly pay ...", file=sys.stderr)
    rows += ashe_pay()

    # keep last N years per indicator
    maxyr = max(r[3] for r in rows)
    cutoff = maxyr - a.years + 1
    rows = [r for r in rows if r[3] >= cutoff]
    rows.sort(key=lambda r: (r[0], r[2], r[3]))

    with open(a.out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["indicator","indicator_label","area","year","value","unit","source","source_url"])
        w.writerows(rows)
    inds = sorted({r[0] for r in rows})
    print(f"wrote {len(rows)} rows for {len(inds)} indicators ({cutoff}-{maxyr}) -> {a.out}")
    print("indicators:", ", ".join(inds))

if __name__ == "__main__":
    main()
