#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
compile_economic_sources.py
============================
Single source of truth for the ECONOMIC-deprivation domain of the Bristol
deprivation data-story. Mirrors the education pipeline (compile_edu_sources.py
-> build_comparators_js.py) but folded into one step because the economic
indicators are hand-verified LA-level figures rather than a bulk scrape.

Every figure below was read directly from an official source spreadsheet / API
(ONS, Nomis, DWP, DESNZ, MHCLG English Indices of Deprivation 2019) in July 2026
by five parallel research passes, one per life stage. Deep links + the exact
sheet/column/filter used are recorded in each indicator's `note` and in the
per-geography notes, so any number can be re-checked at source.

Geography codes: Bristol E06000023 · England E92000001 · London region
E12000007 · Manchester LA E08000003.

Outputs (run: python3 compile_economic_sources.py):
  1. bristol_economic_sources.csv  — long-format auditable store (one row per
     geography per indicator): indicator,indicator_label,area,place,year,value,
     unit,source,source_url,notes
  2. bristol-economic.js           — window.BRISTOL_ECONOMY consumed by
     Bristol-Deprivation-Economy.html

The through-line: Bristol is a high-output, high-employment, above-average-pay
core city (GDP/head a third above England) whose prosperity is NOT shared — its
disposable income per head trails England, and deprivation is concentrated in a
sixth of its neighbourhoods. The economy of deprivation, across the life course.
"""
import csv, json, io

# ---- source registry (deep-linked) ----------------------------------------
SOURCES = {
    "clif":    {"name": "DWP — Children in low income families, local area (FYE 2024)",
                "url": "https://www.gov.uk/government/statistics/children-in-low-income-families-local-area-statistics-2014-to-2024/children-in-low-income-families-local-area-statistics-financial-year-ending-2024"},
    "iod":     {"name": "MHCLG — English Indices of Deprivation 2019 (LA summaries, File 10)",
                "url": "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019"},
    "fsm":     {"name": "DfE — Schools, pupils and their characteristics (2024/25)",
                "url": "https://explore-education-statistics.service.gov.uk/find-statistics/school-pupils-and-their-characteristics/2024-25"},
    "fuel":    {"name": "DESNZ — Sub-regional fuel poverty in England (2026 report, 2024 data)",
                "url": "https://www.gov.uk/government/statistics/sub-regional-fuel-poverty-data-2026-2024-data"},
    "gdhi":    {"name": "ONS — Regional gross disposable household income, local authorities (2023)",
                "url": "https://www.ons.gov.uk/economy/regionalaccounts/grossdisposablehouseholdincome/datasets/regionalgrossdisposablehouseholdincomelocalauthorities"},
    "ts062":   {"name": "Census 2021 · TS062 NS-SeC occupational class (Nomis)",
                "url": "https://www.nomisweb.co.uk/datasets/c2021ts062"},
    "afford":  {"name": "ONS — Ratio of house price to workplace-based earnings (2025)",
                "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/ratioofhousepricetoworkplacebasedearningslowerquartileandmedian/current"},
    "aps":     {"name": "ONS — Annual Population Survey (Nomis NM_17_5, Jan–Dec 2025)",
                "url": "https://www.nomisweb.co.uk/datasets/apsnew"},
    "ashe":    {"name": "ONS — Annual Survey of Hours and Earnings (Nomis NM_30_1, 2025)",
                "url": "https://www.nomisweb.co.uk/sources/ashe"},
    "lowpay":  {"name": "ONS — Employee jobs paid below the real Living Wage (ASHE/LWF, 2025)",
                "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/numberandproportionofemployeejobswithhourlypaybelowthelivingwage"},
    "claimant":{"name": "ONS/DWP — Claimant count (Nomis NM_162, May 2026)",
                "url": "https://www.nomisweb.co.uk/datasets/cc"},
    "neet":    {"name": "DfE — Participation & NEET, age 16–17, by local authority (2025/26)",
                "url": "https://explore-education-statistics.service.gov.uk/find-statistics/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2025-26"},
    "gdp":     {"name": "ONS — Regional GDP: local authorities (2023)",
                "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductlocalauthorities"},
}

# A geography value: (value|None, place-label, per-geography note)
def g(v, place, note=""):
    return {"v": v, "p": place, "note": note}

# ---- the indicators, in life-course order ---------------------------------
# a = Bristol bar ; b = benchmark bar (England where published, else Manchester
# peer for the England-null IMD domains) ; comp = the "across England" strip
# (highest / lowest English LA, London region, Manchester LA).
IND = [
 # ============ EARLY (0-5) · the household a child is born into ============
 dict(id="child_low_income", stage="early", icon="coins", unit="%", polarity="lower_better",
   label="Children in relative low income families",
   asOf="FYE 2024", src="clif",
   a=g(23.0,"Bristol"), b=g(21.8,"UK"),
   note="Children under 16 in relative low-income families, Before Housing Costs (DWP CLIF). Read from sheet '3_Relative_Local_Authority', column 'Percentage of children FYE 2024 (%)'. DWP publishes no England-total row, so the benchmark uses the published UK figure (21.8%); an England estimate from the 9 regions is ~22.1%. Bristol's ward extreme reaches 54% (Lawrence Hill).",
   comp=dict(england=g(21.8,"UK","No England row is published; UK figure shown."),
             london=g(17.8,"London","Sheet '1_Relative_Gov_Office_Region'."),
             manchester=g(40.7,"Manchester"),
             highest=g(44.6,"Pendle","Most-deprived English LA; matches gov.uk commentary."),
             lowest=g(5.6,"Richmond upon Thames","Least-deprived English LA."))),
 dict(id="child_low_income_abs", stage="early", icon="coins", unit="%", polarity="lower_better",
   label="Children in absolute low income families",
   asOf="FYE 2024", src="clif",
   a=g(19.8,"Bristol"), b=g(18.7,"UK"),
   note="The absolute-low-income measure (fixed 2010/11 real-terms line), Before Housing Costs. Sheet '4_Absolute_Local_Authority'. Benchmark = published UK figure (18.7%); no England row is published.",
   comp=dict(england=g(18.7,"UK","No England row is published; UK figure shown."),
             london=g(15.1,"London","Sheet '2_Absolute_Gov_Office_Region'."),
             manchester=g(36.0,"Manchester"),
             highest=g(40.7,"Pendle"),
             lowest=g(4.7,"Richmond upon Thames"))),
 dict(id="idaci", stage="early", icon="hand-heart", unit="%", polarity="lower_better",
   label="Children in income-deprived families (IDACI)",
   asOf="2019", src="iod",
   a=g(20.6,"Bristol"), b=g(29.7,"Manchester"),
   note="IDACI average score (IoD2019 File 10, 'IDACI' sheet) = proportion of children 0–15 in income-deprived families, shown here ×100 as a %. Bristol 0.206 ranks 64th of 317 English LAs (1 = most deprived). England/London have no published IDACI score (the index is relative and England-only), so Bristol is benchmarked against Manchester, a peer core city.",
   comp=dict(england=None,
             london=None,
             manchester=None,  # shown as the benchmark bar
             highest=g(32.7,"Middlesbrough","Most-deprived LA (rank 1)."),
             lowest=g(3.2,"Isles of Scilly","Least-deprived LA (rank 317); tiny-population authority."))),

 # ============ PRIMARY (5-11) · the household economy around school ========
 dict(id="fsm", stage="primary", icon="book-open", unit="%", polarity="lower_better",
   label="Pupils eligible for free school meals",
   asOf="2024/25", src="fsm",
   a=g(30.2,"Bristol"), b=g(25.7,"England"),
   note="% of pupils known to be eligible for free school meals (DfE Schools, Pupils & their Characteristics, Jan 2025 census). Read from spc_pupils_fsm.csv, phase_type_grouping=Total. Bristol 30.2% is well above England 25.7%.",
   comp=dict(england=g(25.7,"England"),
             london=g(27.9,"London"),
             manchester=g(47.2,"Manchester"),
             highest=g(47.2,"Manchester","Manchester is the highest-FSM English LA (47.24%); next is Islington 45.8%."),
             lowest=g(10.2,"Wokingham","Lowest substantive LA; Isles of Scilly 3.2% is an 8-pupil outlier."))),
 dict(id="fuel_poverty", stage="primary", icon="octagon-alert", unit="%", polarity="lower_better",
   label="Households in fuel poverty",
   asOf="2024", src="fuel",
   a=g(10.6,"Bristol"), b=g(10.0,"England"),
   note="Low Income Low Energy Efficiency (LILEE) households (DESNZ sub-regional, 2026 report / 2024 data), Table 2. England fell to 9.95% in this release (from 11.4% on 2023 data). Bristol 10.56% sits just above England.",
   comp=dict(england=g(10.0,"England","9.95% unrounded."),
             london=g(9.6,"London"),
             manchester=g(12.0,"Manchester","11.98% unrounded."),
             highest=g(14.8,"Stoke-on-Trent","Highest substantive LA; Isles of Scilly 17.3% is a small outlier."),
             lowest=g(5.6,"Wokingham"))),
 dict(id="imd_income", stage="primary", icon="scale-balance", unit="%", polarity="lower_better",
   label="Population who are income-deprived (IMD income domain)",
   asOf="2019", src="iod",
   a=g(14.1,"Bristol"), b=g(12.9,"England"),
   note="IMD2019 Income domain average score (File 10) ×100 = share of the whole population who are income-deprived. Bristol 0.141 ranks 92nd of 317. England 0.1286 is the national population-weighted mean (recomputed from File 7, reproducing Bristol & Manchester exactly); London 0.138 derived from borough LSOAs.",
   comp=dict(england=g(12.9,"England","National population-weighted mean (0.1286)."),
             london=g(13.8,"London","Derived from London borough LSOAs."),
             manchester=g(21.9,"Manchester"),
             highest=g(25.1,"Middlesbrough","Most income-deprived LA (rank 1)."),
             lowest=g(2.9,"Isles of Scilly","Least income-deprived LA (rank 317)."))),

 # ============ SECONDARY (11-16) · the working household ===================
 dict(id="gdhi", stage="secondary", icon="coins", unit="£", polarity="higher_better",
   label="Disposable income per head (GDHI)",
   asOf="2023", src="gdhi",
   a=g(24696,"Bristol"), b=g(25425,"England"),
   note="Gross disposable household income per head (ONS regional GDHI, LA dataset Table 3, 2023 provisional). Despite the city's high output, Bristol households keep just below the England average — and well below London (£35,361). UK reference £24,836.",
   comp=dict(england=g(25425,"England","From the GDHI bulletin headline (no country row in the LA table)."),
             london=g(35361,"London"),
             manchester=g(18945,"Manchester"),
             highest=g(110651,"Kensington & Chelsea","Highest residential LA; City of London (£129,429) excluded as a ~8k-population artefact."),
             lowest=g(16067,"Leicester"))),
 dict(id="imd_employment", stage="secondary", icon="briefcase", unit="%", polarity="lower_better",
   label="Working-age adults who are employment-deprived (IMD)",
   asOf="2019", src="iod",
   a=g(10.2,"Bristol"), b=g(13.9,"Manchester"),
   note="IMD2019 Employment domain average score (File 10) ×100 = share of working-age people who are involuntarily out of work through unemployment, sickness or disability. Bristol 0.102 ranks 105th of 317; less employment-deprived than Manchester (0.139). No England/London score is published (relative, England-only), so the benchmark is Manchester.",
   comp=dict(england=None,
             london=None,
             manchester=None,  # benchmark bar
             highest=g(20.9,"Blackpool","Most employment-deprived LA (rank 1)."),
             lowest=g(1.9,"Isles of Scilly","Least deprived (rank 317); small-N."))),
 dict(id="nssec_routine", stage="secondary", icon="weight", unit="%", polarity="lower_better",
   label="Residents in routine & semi-routine occupations",
   asOf="2021", src="ts062",
   a=g(21.1,"Bristol"), b=g(23.3,"England"),
   note="Census 2021 TS062: NS-SeC L12 (semi-routine) + L13 (routine) as a share of all residents aged 16+. Lower-paid, less-secure occupational classes. Bristol 21.1% is below England 23.3% — a relatively professional city on average.",
   comp=dict(england=g(23.3,"England"),
             london=g(17.4,"London"),
             manchester=g(21.8,"Manchester"),
             highest=g(38.9,"Boston","Most routine/semi-routine LA."),
             lowest=g(10.1,"Richmond upon Thames","Lowest substantive LA; City of London 6.8% is a tiny-population outlier."))),
 dict(id="house_price_earnings", stage="secondary", icon="house", unit="×", polarity="lower_better",
   label="House price to earnings ratio (affordability)",
   asOf="2025", src="afford",
   a=g(8.33,"Bristol"), b=g(7.63,"England"),
   note="Median house price ÷ median gross annual workplace earnings (ONS affordability, 2025; house prices to Sep 2025). A home in Bristol costs 8.3× local earnings, above England (7.6×) — housing pressure on working families.",
   comp=dict(england=g(7.63,"England"),
             london=g(10.61,"London"),
             manchester=g(6.11,"Manchester"),
             highest=g(25.22,"Kensington & Chelsea","Least affordable English LA."),
             lowest=g(4.08,"Hyndburn","Most affordable English LA."))),

 # ============ TRANSITION (16-25) · into the labour market =================
 dict(id="employment_rate", stage="transition", icon="briefcase", unit="%", polarity="higher_better",
   label="Employment rate (ages 16–64)",
   asOf="2025", src="aps",
   a=g(79.6,"Bristol"), b=g(75.8,"England"),
   note="ONS Annual Population Survey (Nomis NM_17_5, variable 45), residence-based, year ending Dec 2025. Bristol 79.6% is comfortably above England 75.8%.",
   comp=dict(england=g(75.8,"England"),
             london=g(74.9,"London"),
             manchester=g(75.0,"Manchester"),
             highest=g(90.0,"Mole Valley","Small district, wide CI; robust high ≈ Richmondshire 89.6%."),
             lowest=g(58.3,"Gravesham","Small district, wide CI; robust low ≈ Hartlepool 64.2%."))),
 dict(id="econ_inactivity", stage="transition", icon="gauge", unit="%", polarity="lower_better",
   label="Economic inactivity (ages 16–64)",
   asOf="2025", src="aps",
   a=g(16.9,"Bristol"), b=g(20.5,"England"),
   note="Share of 16–64s neither in work nor looking for work (APS NM_17_5, variable 111, YE Dec 2025). Bristol 16.9% is below England 20.5% — a high-participation city. Gravesham is both the highest-inactivity and lowest-employment district (internally consistent).",
   comp=dict(england=g(20.5,"England"),
             london=g(20.1,"London"),
             manchester=g(21.0,"Manchester"),
             highest=g(34.1,"Gravesham"),
             lowest=g(9.8,"Harborough"))),
 dict(id="pay_median", stage="transition", icon="coins", unit="£", polarity="higher_better",
   label="Median gross weekly pay (full-time)",
   asOf="2025", src="ashe",
   a=g(670.8,"Bristol"), b=g(648.4,"England"),
   note="ASHE full-time gross weekly pay by residence (Nomis NM_30_1, sex=7 item=2 pay=1, 2025 provisional). Anchor reproduced exactly. Bristol £670.8 is above England £648.4 but below London £767.4.",
   comp=dict(england=g(648.4,"England"),
             london=g(767.4,"London"),
             manchester=g(589.3,"Manchester"),
             highest=g(955.2,"Kensington & Chelsea"),
             lowest=g(515.0,"Melton"))),
 dict(id="low_pay", stage="transition", icon="scale-balance", unit="%", polarity="lower_better",
   label="Jobs paid below the real Living Wage",
   asOf="2025", src="lowpay",
   a=g(8.4,"Bristol"), b=g(14.7,"England"),
   note="% of employee jobs with hourly pay below the Living Wage Foundation rate (ONS ASHE/LWF, 2025 provisional, place-of-work basis — the residence table was not in the provisional edition). Bristol 8.4% is well below England 14.7%. Place-of-work basis inflates commuter-outflow boroughs (Redbridge 34.5%).",
   comp=dict(england=g(14.7,"England"),
             london=g(13.3,"London"),
             manchester=g(9.1,"Manchester"),
             highest=g(34.5,"Redbridge","Place-of-work basis; residents commute out."),
             lowest=g(2.8,"City of London"))),
 dict(id="claimant_count", stage="transition", icon="book", unit="%", polarity="lower_better",
   label="Claimant count (UC + JSA), 16–64",
   asOf="May 2026", src="claimant",
   a=g(3.6,"Bristol"), b=g(4.1,"England"),
   note="People claiming unemployment-related benefits as a % of residents aged 16–64 (Nomis NM_162, measure=2, May 2026, not seasonally adjusted). Bristol 3.6% is below England 4.1%.",
   comp=dict(england=g(4.1,"England"),
             london=g(5.7,"London"),
             manchester=g(6.1,"Manchester"),
             highest=g(10.1,"Birmingham"),
             lowest=g(1.7,"Harborough","Lowest normal-population LA; City of London 1.1% is a micro-LA outlier."))),
 dict(id="neet", stage="transition", icon="signpost", unit="%", polarity="lower_better",
   label="Young people NEET (age 16–17)",
   asOf="2025", src="neet",
   a=g(5.6,"Bristol"), b=g(3.4,"England"),
   note="Not in education, employment or training, 16–17 (DfE NEET by LA, 2025/26, NEET-only measure). Bristol 5.6% is well above England 3.4% and London 2.0% — the transition into work is where Bristol's advantage breaks down. (The combined NEET+not-known headline is Bristol 6.4%.)",
   comp=dict(england=g(3.4,"England"),
             london=g(2.0,"London"),
             manchester=g(5.3,"Manchester"),
             highest=g(7.1,"Derby"),
             lowest=g(0.3,"Enfield","City of London 0.0% excluded as a ~47-person cohort."))),

 # ============ CROSS-CUTTING · the adult economy ==========================
 dict(id="gva_head", stage="cross", icon="barchart", unit="£", polarity="higher_better",
   label="Economic output per head (GDP)",
   asOf="2023", src="gdp",
   a=g(47148,"Bristol"), b=g(40382,"England"),
   note="Balanced GDP per head, current prices, 2023 provisional (ONS Regional GDP LA dataset, Table 7). Bristol £47,148 is ~17% above England £40,382 — the most productive English core city — yet its households' disposable income trails England (see GDHI). LA GDP-per-head extremes (City of London £8.2m; Lewisham £16,866) are workplace-vs-residence artefacts and are not shown as a meaningful high/low.",
   comp=dict(england=g(40382,"England"),
             london=g(69077,"London"),
             manchester=g(65591,"Manchester"),
             highest=None,  # City of London £8.2m is a workplace artefact — omitted
             lowest=None)),
 dict(id="imd_decile", stage="cross", icon="map-pin", unit="%", polarity="lower_better",
   label="Neighbourhoods in England's most-deprived 10%",
   asOf="2019", src="iod",
   a=g(15.6,"Bristol"), b=g(10.0,"England"),
   note="% of the LA's LSOAs (small neighbourhoods) that fall in the most-deprived tenth of England overall (IMD2019 File 10). Bristol 15.6% — a sixth of the city — is above the 10% you'd expect by definition. This is where the city's prosperity fails to reach: 41 of Bristol's 263 neighbourhoods.",
   comp=dict(england=g(10.0,"England","10% by construction — the national bottom decile."),
             london=g(2.2,"London","Derived: ~107 of ~4,835 London LSOAs."),
             manchester=g(43.3,"Manchester"),
             highest=g(48.8,"Middlesbrough"),
             lowest=g(0.0,"123 LAs at 0%","No single lowest LA: 123 districts have no LSOA in the most-deprived decile."))),
 dict(id="inactivity_sick", stage="cross", icon="heart-pulse", unit="%", polarity="lower_better",
   label="Economic inactivity due to long-term sickness",
   asOf="2025", src="aps",
   a=g(22.1,"Bristol"), b=g(27.7,"England"),
   note="Long-term sick as a share of all economically inactive 16–64s (APS NM_17_5, variable 1496, YE Dec 2025). Bristol 22.1% is below England 27.7%. District extremes carry small APS samples and are unreliable (flagged).",
   comp=dict(england=g(27.7,"England"),
             london=g(18.9,"London"),
             manchester=g(20.6,"Manchester"),
             highest=g(63.5,"Allerdale","Small APS sample — unreliable extreme."),
             lowest=g(13.1,"Southwark","Small APS sample — unreliable extreme."))),
]

# ---- hero + intro charts (editorial, grounded in the indicators above) ----
HERO = [
    {"key":"gva_head",  "v":"£47,148", "label":"economic output per head — the most productive English core city, a sixth above England (£40,382)"},
    {"key":"imd_decile","v":"15.6%",   "label":"of Bristol's neighbourhoods are among the poorest 10% in England — deprivation is concentrated, not absent"},
    {"key":"gdhi",      "v":"£24,696", "label":"disposable income per head — below England (£25,425): the city's wealth doesn't reach its households"},
]
# England = 100 index: output/jobs/pay above the line, household income below it.
PARADOX = {
    "note":"Bristol relative to England (England = 100)",
    "rows":[
        {"label":"Output per head","idx":117,"pol":"higher_better","raw":"£47,148 vs £40,382"},
        {"label":"Employment rate","idx":105,"pol":"higher_better","raw":"79.6% vs 75.8%"},
        {"label":"Median weekly pay","idx":103,"pol":"higher_better","raw":"£670.8 vs £648.4"},
        {"label":"Disposable income / head","idx":97,"pol":"higher_better","raw":"£24,696 vs £25,425"},
    ],
    "src":"gdp",
}
# concentration: % of neighbourhoods in England's poorest 10%, across geographies
CONCENTRATION = {
    "title":"Neighbourhoods in England's most-deprived 10%",
    "unit":"%",
    "rows":[
        {"n":"Manchester","v":43.3,"t":"dep"},
        {"n":"Bristol","v":15.6,"t":"city"},
        {"n":"England","v":10.0,"t":"eng"},
        {"n":"London","v":2.2,"t":"aff"},
    ],
    "src":"iod",
}
# the intra-city divide (reused verified ward figures from the ONS/DWP CLIF store)
WARD_POV = {
    "title":"Children in relative low income, by Bristol ward",
    "unit":"%","src":"clif",
    "rows":[
        {"n":"Lawrence Hill","v":54.2,"t":"dep"},
        {"n":"Central","v":47.8,"t":"dep"},
        {"n":"Hartcliffe & Withywood","v":39.3,"t":"dep"},
        {"n":"Redland","v":3.1,"t":"aff"},
    ],
}

# =========================================================================
#   EMIT 1 — the auditable CSV store
# =========================================================================
AREA_ORDER = [("bristol","Bristol","a"),("england","England","comp"),
              ("london","London","comp"),("manchester","Manchester","comp"),
              ("highest","Highest","comp"),("lowest","Lowest","comp")]

def write_csv(path):
    rows = []
    for i in IND:
        s = SOURCES[i["src"]]
        # Bristol
        rows.append([i["id"], i["label"], "Bristol", i["a"]["p"], i["asOf"],
                     i["a"]["v"], i["unit"], s["name"], s["url"], i["note"]])
        # benchmark bar if it is Manchester (England-null domains) — captured via comp too
        for key, area, _ in AREA_ORDER[1:]:
            gv = i["comp"].get(key)
            if key == "manchester" and gv is None and i["b"]["p"] == "Manchester":
                gv = {"v": i["b"]["v"], "p": "Manchester", "note": "Benchmark peer (no England IMD score published)."}
            if not gv or gv["v"] is None:
                continue
            rows.append([i["id"], i["label"], area, gv["p"], i["asOf"],
                         gv["v"], i["unit"], s["name"], s["url"], gv.get("note","")])
    with io.open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["indicator","indicator_label","area","place","year","value","unit","source","source_url","notes"])
        w.writerows(rows)
    return len(rows)

# =========================================================================
#   EMIT 2 — bristol-economic.js  (window.BRISTOL_ECONOMY)
# =========================================================================
def write_js(path):
    # trim per-geography notes into the indicator objects the page reads
    inds = []
    for i in IND:
        comp = {}
        for key in ("england","london","manchester","highest","lowest"):
            gv = i["comp"].get(key)
            if gv and gv["v"] is not None:
                comp[key] = {"v": gv["v"], "area": gv["p"], "note": gv.get("note","")}
        inds.append({
            "id": i["id"], "stage": i["stage"], "icon": i["icon"], "label": i["label"],
            "unit": i["unit"], "polarity": i["polarity"], "asOf": i["asOf"], "src": i["src"],
            "a": {"p": i["a"]["p"], "v": i["a"]["v"]},
            "b": {"p": i["b"]["p"], "v": i["b"]["v"]},
            "note": i["note"], "comp": comp,
        })
    payload = {
        "updated": "July 2026",
        "scope": "ONS, Nomis, DWP, DESNZ & MHCLG (Indices of Deprivation 2019)",
        "sources": SOURCES,
        "hero": HERO,
        "paradox": PARADOX,
        "concentration": CONCENTRATION,
        "wardPov": WARD_POV,
        "indicators": inds,
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    js = ("/* =============================================================================\n"
          "   bristol-economic.js  —  window.BRISTOL_ECONOMY\n"
          "   GENERATED by compile_economic_sources.py — do not edit by hand.\n"
          "   The economic backbone of the Bristol deprivation story: ~19 indicators of\n"
          "   economic deprivation across the life course, each with six geographies\n"
          "   (Bristol · England/UK · London · Manchester · highest & lowest English LA),\n"
          "   verified against ONS / Nomis / DWP / DESNZ / IoD2019 sources (July 2026).\n"
          "============================================================================= */\n"
          "window.BRISTOL_ECONOMY = " + body + ";\n")
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(js)
    return len(inds)

if __name__ == "__main__":
    n_csv = write_csv("bristol_economic_sources.csv")
    n_js  = write_js("bristol-economic.js")
    print("wrote bristol_economic_sources.csv  (%d rows)" % n_csv)
    print("wrote bristol-economic.js           (%d indicators)" % n_js)
