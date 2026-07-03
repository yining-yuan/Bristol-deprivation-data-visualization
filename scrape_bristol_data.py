#!/usr/bin/env python3
# =============================================================================
# scrape_bristol_data.py
# -----------------------------------------------------------------------------
# A pure EXTRACTION SPEC + retriever. It contains NO answer values — only
# indicator ids, source keys/urls, table codes, cell substrings and the name of
# any calculation to apply. Running it pulls the numbers from source and writes
# a single unified CSV, so the data lives in exactly one machine-readable place.
#
#   Census 2021  -> fetched live from the Nomis REST API (fully automatic).
#   ONS / DfE / Sutton / OfS / Open Data Bristol -> no clean open endpoint, so
#       each is emitted to the CSV as a blank row that names the exact measure
#       and cell to read (method="manual"); fill the `value` column by hand or
#       from that source's own download.
#
# Usage:
#   python scrape_bristol_data.py                 # write spec -> CSV (manual rows blank)
#   python scrape_bristol_data.py --fetch         # also pull Census values live
#   python scrape_bristol_data.py --out data.csv  # choose output path
#
# Requires: Python 3.8+   (and `requests` only for --fetch)
# =============================================================================

from __future__ import annotations
import argparse, csv, io, sys
from typing import Iterable, Optional

try:
    import requests
except ImportError:
    requests = None


# =============================================================================
# 1. CALCS  —  the calculation functions (referenced by name in the SPEC)
# =============================================================================
# Generic helpers only. `calc` in the SPEC names one of these; it is applied to
# the cells fetched for that row, never to hard-coded numbers.

def total(values: Iterable[float], dp: int = 2) -> float:
    """Sum of the matched cells (e.g. 'bad' + 'very bad' health = one bar)."""
    return round(sum(values), dp)

def one_or_more(values: Iterable[float], dp: int = 2) -> float:
    """100 minus the matched cell (e.g. 100 - 'not deprived in any dimension')."""
    return round(100 - sum(values), dp)

def mean(values: Iterable[float], dp: int = 2) -> float:
    """Arithmetic mean of the matched cells."""
    v = list(values)
    return round(sum(v) / len(v), dp)

def weighted_mean(value_weight_pairs, dp: int = 2) -> float:
    """Weighted mean of (value, weight) pairs — combine sub-areas into a city
    figure (weight = base population)."""
    num = sum(v * w for v, w in value_weight_pairs)
    den = sum(w for _, w in value_weight_pairs)
    return round(num / den, dp)

def difference(values, dp: int = 1) -> float:
    """Second minus first — used for gaps: peers - disadvantaged, or high - low
    (attainment gap in pp, or a life-expectancy gap between two areas)."""
    v = list(values)
    return round(v[-1] - v[0], dp)

def per100_to_per1000(values, dp: int = 1) -> float:
    """Rescale a 'per 100' rate to 'per 1,000' (x10)."""
    return round(list(values)[0] * 10, dp)

CALCS = {                      # name used in SPEC  -> function
    "total": total,
    "one_or_more": one_or_more,
    "mean": mean,
    "difference": difference,
    "per100_to_per1000": per100_to_per1000,
}


# =============================================================================
# 2. SOURCES  —  source key -> (name, url)
# =============================================================================
SOURCES = {
    "ons":      ("ONS — Explore local statistics (Bristol)", "https://www.ons.gov.uk/explore-local-statistics/areas/E06000023-bristol-city-of"),
    "ons_le":   ("ONS — Life expectancy for local areas of the UK", "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/lifeexpectancyforlocalareasoftheuk/between2001to2003and2021to2023"),
    "ons_nlt":  ("ONS — National life tables, England (2021–2023)", "https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/bulletins/nationallifetablesunitedkingdom/2021to2023"),
    "ons_hle":  ("ONS — Health state life expectancies, UK", "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/healthstatelifeexpectanciesuk/between2011to2013and2021to2023"),
    "ons_clif": ("ONS · DWP — Children in low income families, local area", "https://www.gov.uk/government/statistics/children-in-low-income-families-local-area-statistics-2022-to-2025"),
    "sutton":   ("Sutton Trust — research & the Opportunity Index", "https://www.suttontrust.com/our-research/"),
    "dfe":      ("DfE — Explore education statistics", "https://explore-education-statistics.service.gov.uk/"),
    "dfe_eyfsp":("DfE — EYFSP results (2024/25)", "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2024-25"),
    "dfe_phon": ("DfE — Phonics screening check (2024/25)", "https://explore-education-statistics.service.gov.uk/find-statistics/phonics-screening-check-attainment/2024-25"),
    "dfe_ks2":  ("DfE — Key stage 2 attainment (2024/25 revised)", "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25-revised"),
    "dfe_ks4":  ("DfE — Key stage 4 performance (2024/25)", "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance/2024-25"),
    "dfe_abs":  ("DfE — Pupil absence (2023/24)", "https://explore-education-statistics.service.gov.uk/find-statistics/pupil-absence-in-schools-in-england/2023-24"),
    "dfe_excl": ("DfE — Suspensions & permanent exclusions", "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england"),
    "dfe_wp":   ("DfE — Widening participation in HE (2023/24)", "https://explore-education-statistics.service.gov.uk/find-statistics/widening-participation-in-higher-education/2023-24"),
    "dfe_neet": ("DfE — Participation & NEET 16–17 by LA (2024/25)", "https://explore-education-statistics.service.gov.uk/find-statistics/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25"),
    "ofs":      ("Office for Students — Young participation by area (TUNDRA)", "https://www.officeforstudents.org.uk/data-and-analysis/young-participation-by-area/"),
    "odb_edu":  ("Open Data Bristol — attainment & exclusions by ward", "https://opendata.bristol.gov.uk/explore/dataset/progress-8-and-attainment-8-scores-in-bristol/"),
    # Census 2021 topic tables (Nomis) — the src key is also the table code stem
    "ts003": ("Census 2021 · TS003 Household composition (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts003"),
    "ts007": ("Census 2021 · TS007 Age structure (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts007a"),
    "ts011": ("Census 2021 · TS011 Household deprivation (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts011"),
    "ts037": ("Census 2021 · TS037 General health (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts037"),
    "ts038": ("Census 2021 · TS038 Disability (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts038"),
    "ts039": ("Census 2021 · TS039 Unpaid care (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts039"),
    "ts045": ("Census 2021 · TS045 Car or van availability (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts045"),
    "ts046": ("Census 2021 · TS046 Central heating (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts046"),
    "ts052": ("Census 2021 · TS052 Occupancy / overcrowding (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts052"),
    "ts054": ("Census 2021 · TS054 Tenure (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts054"),
    "ts062": ("Census 2021 · TS062 NS-SeC occupational class (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts062"),
    "ts067": ("Census 2021 · TS067 Highest qualification (Nomis)", "https://www.nomisweb.co.uk/datasets/c2021ts067"),
}

# GSS geography codes
BRISTOL_LA = "E06000023"
ENGLAND    = "E92000001"
# Nomis geography query that expands to every 2021 electoral ward in Bristol.
# TYPE code for 2021 wards on Nomis; confirm on the dataset's geography picker.
WARD_QUERY = f"{BRISTOL_LA}TYPE154"


# =============================================================================
# 3. SPEC  —  the extraction plan. NO values, only how to get each number.
# -----------------------------------------------------------------------------
# fields:
#   id     stable indicator id (matches the .js)
#   method "nomis"  = auto-fetch Census table  |  "manual" = read at the url
#   src    key into SOURCES  (also the Nomis table code for method="nomis")
#   table  Census table code for Nomis (e.g. "c2021ts067")
#   cell   substring(s) of the source category/measure to read/match
#   geo    "la" (Bristol + England)  |  "ward" (all Bristol wards)
#   calc   name in CALCS applied to the matched cells (or None = one cell)
#   measure (manual only) the indicator/measure name to find at the source
# =============================================================================
SPEC = [
  # ---- Census 2021, LA level (auto-fetch) ----
  dict(id="quals_l4",    method="nomis", src="ts067", table="c2021ts067", geo="la", cell=["level 4 qualifications and above"]),
  dict(id="quals_none",  method="nomis", src="ts067", table="c2021ts067", geo="la", cell=["no qualifications"]),
  dict(id="health_bad",  method="nomis", src="ts037", table="c2021ts037", geo="la", cell=["bad health"], calc="total"),  # matches 'Bad' + 'Very bad'
  dict(id="disability",  method="nomis", src="ts038", table="c2021ts038", geo="la", cell=["disabled under the equality act"], calc="total"),
  dict(id="unpaid_care", method="nomis", src="ts039", table="c2021ts039", geo="la", cell=["hours unpaid care"], calc="total"),  # sums the caring bands, excludes 'no unpaid care'
  dict(id="no_car",      method="nomis", src="ts045", table="c2021ts045", geo="la", cell=["no cars or vans"]),
  dict(id="overcrowd",   method="nomis", src="ts052", table="c2021ts052", geo="la", cell=["-1 or less"]),
  dict(id="social_rent", method="nomis", src="ts054", table="c2021ts054", geo="la", cell=["social rented"], calc="total"),
  dict(id="own_outright",method="nomis", src="ts054", table="c2021ts054", geo="la", cell=["owns outright"]),
  dict(id="no_heating",  method="nomis", src="ts046", table="c2021ts046", geo="la", cell=["no central heating"]),        # caveat #2 fixed
  dict(id="lone_parent", method="nomis", src="ts003", table="c2021ts003", geo="la", cell=["one-parent"], calc="total"),   # caveat #2 fixed
  dict(id="nssec_rout",  method="nomis", src="ts062", table="c2021ts062", geo="la", cell=["routine", "semi-routine"], calc="total"),  # caveat #1 fixed
  dict(id="median_age",  method="nomis", src="ts007", table="c2021ts007a",geo="la", cell=["median age"]),
  dict(id="deprived_34", method="nomis", src="ts011", table="c2021ts011", geo="la", cell=["three dimensions", "four dimensions"], calc="total"),
  dict(id="deprived_any",method="nomis", src="ts011", table="c2021ts011", geo="la", cell=["not deprived in any dimension"], calc="one_or_more"),

  # ---- Census 2021, ward level (auto-fetch, all Bristol wards) ----
  dict(id="degree_ward", method="nomis", src="ts067", table="c2021ts067", geo="ward", cell=["level 4 qualifications and above"]),
  dict(id="child_share", method="nomis", src="ts007", table="c2021ts007a",geo="ward", cell=["aged 0 to 15"]),

  # ---- ONS (manual: Explore local statistics / bulletins) ----
  dict(id="health_index",method="manual", src="ons",     measure="Health Index (2021)", cell=["Bristol vs England 100.8"]),
  dict(id="gdhi",        method="manual", src="ons",     measure="Gross disposable household income per head (2023)", cell=["Bristol"]),
  dict(id="employment",  method="manual", src="ons",     measure="Employment rate 16–64 (APS 2023)", cell=["Bristol"]),
  dict(id="inactivity",  method="manual", src="ons",     measure="Economic inactivity rate 16–64", cell=["Bristol"]),
  dict(id="pay",         method="manual", src="ons",     measure="Gross median weekly pay (ASHE 2025)", cell=["Bristol"]),
  dict(id="le_city_m",   method="manual", src="ons_le",  measure="Life expectancy at birth, males", cell=["Bristol, City of"]),
  dict(id="le_city_f",   method="manual", src="ons_le",  measure="Life expectancy at birth, females", cell=["Bristol, City of"]),
  dict(id="le_eng_m",    method="manual", src="ons_nlt", measure="National life tables, England males 2021-23", cell=["England"]),
  dict(id="hle_f",       method="manual", src="ons_hle", measure="Healthy life expectancy at birth, females", cell=["Bristol"]),
  dict(id="le_gap_m",    method="manual", src="ons_le",  measure="Male LE gap between lowest & highest ward", cell=["lowest ward", "highest ward"], calc="difference"),
  dict(id="le_male_ward",method="manual", src="ons_le",  measure="Life expectancy at birth, males, by ward", cell=["each Bristol ward"], geo="ward"),
  dict(id="le_female_ward",method="manual", src="ons_le",measure="Life expectancy at birth, females, by ward", cell=["each Bristol ward"], geo="ward"),
  dict(id="child_pov_ward",method="manual", src="ons_clif", measure="Children in relative low income, by ward", cell=["each Bristol ward"], geo="ward"),

  # ---- Sutton Trust (manual: report PDFs, national) ----
  dict(id="fsm_uni",     method="manual", src="sutton", measure="'Crossing Paths' — FSM to university by 19, by ethnicity", cell=["White British FSM", "Black African FSM"]),
  dict(id="ey_ready",    method="manual", src="sutton", measure="School readiness of disadvantaged children; 19-month gap", cell=["disadvantaged", "England average"]),
  dict(id="early_access",method="manual", src="sutton", measure="Access to funded early education by income", cell=["under £20k", "over £45k"]),
  dict(id="fsm_bristol", method="manual", src="sutton", measure="Opportunity Index — Bristol NW white-FSM degree by 22; Bristol South rank of 543", cell=["Bristol North West"]),

  # ---- DfE Explore Education Statistics (manual: filter LA = Bristol) ----
  dict(id="eyfsp_gld",   method="manual", src="dfe_eyfsp", measure="Good level of development (all pupils)", cell=["Bristol", "England"]),
  dict(id="eyfsp_gap",   method="manual", src="dfe_eyfsp", measure="GLD by disadvantage (FSM vs peers)", cell=["FSM", "non-FSM"], calc="difference"),
  dict(id="phonics",     method="manual", src="dfe_phon",  measure="Year 1 phonics — met expected standard", cell=["Bristol", "England"]),
  dict(id="ks2_rwm",     method="manual", src="dfe_ks2",   measure="KS2 reading, writing & maths expected standard", cell=["Bristol", "England"]),
  dict(id="ks2_gap",     method="manual", src="dfe_ks2",   measure="KS2 RWM by disadvantage", cell=["disadvantaged", "others"], calc="difference"),
  dict(id="prim_oo",     method="manual", src="dfe",       measure="Ofsted primary good or outstanding %", cell=["Bristol", "England"]),
  dict(id="attainment8", method="manual", src="dfe_ks4",   measure="Average Attainment 8 score", cell=["Bristol", "England"]),
  dict(id="gcse5_em",    method="manual", src="dfe_ks4",   measure="Grade 5+ English & maths by disadvantage", cell=["disadvantaged", "others"]),
  dict(id="progress8",   method="manual", src="dfe_ks4",   measure="Average Progress 8 by disadvantage", cell=["disadvantaged", "others"]),
  dict(id="absence",     method="manual", src="dfe_abs",   measure="Persistent absentees (10%+ sessions)", cell=["Bristol", "England"]),
  dict(id="suspensions_rate", method="manual", src="dfe_excl", measure="Suspension rate per 100 pupils", cell=["Bristol", "England"]),
  dict(id="he_prog",     method="manual", src="dfe_wp",    measure="Progression to HE by 19, FSM", cell=["Bristol FSM", "England FSM"]),
  dict(id="neet",        method="manual", src="dfe_neet",  measure="NEET 16–17 by LA", cell=["Bristol", "England"], geo="ward"),
  dict(id="excl_gcse",   method="manual", src="dfe_excl",  measure="Timpson Review — good GCSEs after permanent exclusion", cell=["excluded pupils"]),

  # ---- Office for Students / Open Data Bristol (manual: ward level) ----
  dict(id="he_part_ward",method="manual", src="ofs",     measure="TUNDRA young HE participation, by MSOA/area", cell=["each Bristol area"], geo="ward"),
  dict(id="susp_ward",   method="manual", src="odb_edu", measure="Pupils suspended per 1,000, by ward", cell=["each ward"], geo="ward", calc="per100_to_per1000"),
]


# =============================================================================
# 4. NOMIS fetch (Census only)
# =============================================================================
NOMIS = "https://www.nomisweb.co.uk/api/v01/dataset"

def _dataset_id(table_code: str) -> Optional[str]:
    if requests is None: return None
    try:
        j = requests.get(f"{NOMIS}/def.sdmx.json?search=*{table_code}*", timeout=30).json()
        kf = j["structure"]["keyfamilies"]["keyfamily"]
        return kf[0]["id"] if kf else None
    except Exception as e:
        print(f"  ! id lookup failed {table_code}: {e}", file=sys.stderr); return None

def _rows(table_code: str, geography: str):
    """Return list of (area_code, area_name, cell_label, value_pct)."""
    if requests is None:
        print("  ! install `requests` for --fetch", file=sys.stderr); return []
    ds = _dataset_id(table_code)
    if not ds: return []
    url = (f"{NOMIS}/{ds}.data.csv?geography={geography}&measures=20301"
           "&select=geography_code,geography_name,cell_name,obs_value")
    try:
        rd = csv.DictReader(io.StringIO(requests.get(url, timeout=60).text))
        return [(r["GEOGRAPHY_CODE"], r["GEOGRAPHY_NAME"], r["CELL_NAME"], float(r["OBS_VALUE"] or 0)) for r in rd]
    except Exception as e:
        print(f"  ! fetch failed {table_code}: {e}", file=sys.stderr); return []

def _matches(rows, area_code, substrings):
    subs = [s.lower() for s in substrings]
    return [(cell, val) for code, name, cell, val in rows
            if code == area_code and any(s in cell.lower() for s in subs)]


# =============================================================================
# 5. build rows for the unified CSV
# =============================================================================
COLUMNS = ["id","area_code","area_name","source_key","source_url",
           "table_or_measure","cell","value","method","calc"]

def build(fetch: bool):
    out = []
    for s in SPEC:
        sk = s["src"]; url = SOURCES.get(sk, ("", ""))[1]
        cells = "; ".join(s.get("cell", []))
        calc = s.get("calc")
        tom = s.get("table") or s.get("measure") or ""

        if s["method"] == "nomis" and fetch:
            geo = WARD_QUERY if s.get("geo") == "ward" else f"{BRISTOL_LA},{ENGLAND}"
            rows = _rows(s["table"], geo)
            areas = sorted({(c, n) for c, n, _, _ in rows})
            for code, name in areas:
                hits = _matches(rows, code, s["cell"])
                vals = [v for _, v in hits]
                if not vals:
                    value = ""
                elif calc:
                    value = CALCS[calc](vals)
                elif len(vals) == 1:
                    value = vals[0]
                else:
                    value = ""  # ambiguous match — inspect cell substring
                out.append([s["id"], code, name, sk, url, s["table"], cells, value, "nomis", calc or ""])
        else:
            # manual (or nomis without --fetch): emit a blank row naming what to read
            out.append([s["id"], "", "", sk, url, tom, cells, "", s["method"], calc or ""])
    return out

def write_csv(rows, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(COLUMNS); w.writerows(rows)


# =============================================================================
# 6. main
# =============================================================================
def _self_test():
    assert total([3.0, 1.0]) == 4.0
    assert one_or_more([60.0]) == 40.0
    assert difference([30, 50]) == 20
    assert per100_to_per1000([5]) == 50
    assert mean([10, 20]) == 15
    print("CALCS self-test: pass ✓")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="bristol_data_extracted.csv")
    ap.add_argument("--fetch", action="store_true", help="pull Census values live from Nomis")
    a = ap.parse_args()
    _self_test()
    rows = build(fetch=a.fetch)
    write_csv(rows, a.out)
    filled = sum(1 for r in rows if r[7] != "")
    print(f"wrote {len(rows)} rows ({filled} with values, {len(rows)-filled} blank/manual) -> {a.out}")
    if not a.fetch:
        print("run with --fetch to auto-fill the Census (nomis) rows")
