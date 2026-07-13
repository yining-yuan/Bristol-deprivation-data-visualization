# Bristol economic-deprivation data — sources & scraping process

The economic domain of the Bristol deprivation story (`Bristol-Deprivation-Economy.html`)
tells the *economy of deprivation* across the life course. Its through-line:

> Bristol out-produces and out-earns almost every English city outside London, yet a
> sixth of its neighbourhoods sit among the poorest in the country, its households keep
> **less** than the England average, and that labour-market advantage never quite reaches
> the children born into its most deprived wards. **A wealthy city that doesn't share its
> wealth.**

Every figure is a published official statistic, read at the smallest geography each source
offers, for **six geographies**: Bristol (E06000023) · England (E92000001, or UK where only
UK is published) · London region (E12000007) · Manchester LA (E08000003) · the **highest**
and **lowest** English local authority for each indicator.

---

## Pipeline (mirrors the education/trends pipelines)

```
research (5 parallel passes, one per life stage)
   │   ONS · Nomis · DWP · DESNZ · MHCLG Indices of Deprivation 2019
   ▼
compile_economic_sources.py   ← single source of truth (all values + deep links + notes)
   ├─►  bristol_economic_sources.csv   (auditable long-format store, 108 rows)
   └─►  bristol-economic.js            (window.BRISTOL_ECONOMY, read by the page)
   ▼
indicator-colours.js   ← economic ids added to the POLARITY map (green=better/red=worse)
   ▼
Bristol-Deprivation-Economy.html   ← self-contained; embeds its own comparator strip
```

Re-run: `python3 compile_economic_sources.py` (regenerates both the CSV and the JS from the
Python data block). No network access is needed to rebuild — the verified values are held in
the script; only re-verification against source needs the web.

**Store schema** (`bristol_economic_sources.csv`, one row per geography per indicator):
`indicator, indicator_label, area, place, year, value, unit, source, source_url, notes`
— `area` ∈ {Bristol, England, London, Manchester, Highest, Lowest}; `place` is the specific
LA name for the extremes (e.g. `Highest → Pendle`).

---

## Indicators, by life stage (19)

| stage | id | measure | Bristol | benchmark | source |
|---|---|---|---|---|---|
| Born into (0–5) | `child_low_income` | children in relative low income (%) | 23.0 | UK 21.8 | DWP CLIF |
| | `child_low_income_abs` | children in absolute low income (%) | 19.8 | UK 18.7 | DWP CLIF |
| | `idaci` | children in income-deprived families, IDACI (%) | 20.6 | Manch 29.7 | IoD2019 |
| Growing up (5–11) | `fsm` | free-school-meal eligibility (%) | 30.2 | Eng 25.7 | DfE SPC |
| | `fuel_poverty` | households in fuel poverty, LILEE (%) | 10.6 | Eng 10.0 | DESNZ |
| | `imd_income` | population income-deprived, IMD income (%) | 14.1 | Eng 12.9 | IoD2019 |
| Household (11–16) | `gdhi` | disposable income per head (£) | 24,696 | Eng 25,425 | ONS GDHI |
| | `imd_employment` | working-age employment-deprived, IMD (%) | 10.2 | Manch 13.9 | IoD2019 |
| | `nssec_routine` | routine & semi-routine occupations (%) | 21.1 | Eng 23.3 | Census TS062 |
| | `house_price_earnings` | house price ÷ earnings (×) | 8.33 | Eng 7.63 | ONS affordability |
| Into work (16–25) | `employment_rate` | employment rate 16–64 (%) | 79.6 | Eng 75.8 | ONS APS |
| | `econ_inactivity` | economic inactivity 16–64 (%) | 16.9 | Eng 20.5 | ONS APS |
| | `pay_median` | median weekly full-time pay (£) | 670.8 | Eng 648.4 | ONS ASHE |
| | `low_pay` | jobs below the real Living Wage (%) | 8.4 | Eng 14.7 | ONS ASHE/LWF |
| | `claimant_count` | claimant count 16–64 (%) | 3.6 | Eng 4.1 | ONS/DWP Nomis |
| | `neet` | NEET 16–17 (%) | 5.6 | Eng 3.4 | DfE |
| The adult city (cross) | `gva_head` | GDP output per head (£) | 47,148 | Eng 40,382 | ONS Regional GDP |
| | `imd_decile` | neighbourhoods in England's poorest 10% (%) | 15.6 | Eng 10.0 | IoD2019 |
| | `inactivity_sick` | inactivity due to long-term sickness (%) | 22.1 | Eng 27.7 | ONS APS |

Where **England has no published value** (the relative, England-only IMD domains `idaci` and
`imd_employment`), Bristol is benchmarked against **Manchester**, a peer core city, and the
card says so.

---

## Source-by-source scraping notes

Deep links and the exact sheet / column / filter used are recorded in each indicator's
`note` (visible on hover in the page, and in the CSV `notes` column). Summary of the read
method per source:

### DWP — Children in Low Income Families, local area (FYE 2024) `clif`
- Landing: `.../children-in-low-income-families-local-area-statistics-financial-year-ending-2024`
- Method: download the underlying ODS, parse sheets `3_Relative_Local_Authority` /
  `4_Absolute_Local_Authority` (LAs) and `1_/2_..._Gov_Office_Region` (London); read column
  *"Percentage of children FYE 2024 (%)"*. Under-16s, Before Housing Costs.
- Caveat: **no England-total row is published** — the benchmark uses the UK figure (relative
  21.8%, absolute 18.7%). Extremes match the gov.uk commentary (Pendle high, Richmond low).

### MHCLG — English Indices of Deprivation 2019 `iod`
- File 10 (LA District Summaries, lower-tier), asset:
  `.../File_10_-_IoD2019_Local_Authority_District_Summaries__lower-tier__.xlsx`
- Method: parse with openpyxl; read *"… Average score"* and *"… Proportion of LSOAs in most
  deprived 10% nationally"* per domain sheet (Income, Employment, IDACI, IMD). Scores ×100
  shown as %. Rank column: **1 = most deprived of 317**.
- Caveats: it's a **relative, England-only** index — no national/region score row exists, so
  England/London are `null` for `idaci` and `imd_employment`. For `imd_income`/`imd_decile`
  the England value is the national mean / the 10% floor by construction (recomputed from
  File 7 to reproduce Bristol & Manchester exactly). "Lowest" on the decile measure is a tie
  of 123 LAs at 0%.

### DfE — Schools, Pupils and their Characteristics (2024/25) `fsm`
- Explore Education Statistics; method: `spc_pupils_fsm.csv` from *Download all data (ZIP)*,
  filter `time_period=202425, phase_type_grouping=Total`, measure *"% known to be eligible
  for FSM"*. Highest LA = Manchester itself (joint-top 47.2%) → distinct highest shown as
  Islington 45.8%. Isles of Scilly 3.2% is an 8-pupil outlier → lowest shown as Wokingham 10.2%.

### DESNZ — Sub-regional fuel poverty (2026 report / 2024 data) `fuel`
- LILEE metric, *Table 2 "Fuel Poverty by administrative area"*, column *"Proportion of
  households fuel poor (%)"*. Note the England headline **fell to 9.95%** in this release
  (from 11.4% on 2023 data). Isles of Scilly 17.3% is a small outlier → highest shown as
  Stoke-on-Trent 14.8%.

### ONS — Regional GDHI, local authorities (2023) `gdhi`
- Dataset xlsx, *Table 3 (GDHI per head)*, column 2023, matched by LAD code. The LA table has
  **no country/region rows** → England 25,425 and London 35,361 taken from the GDHI bulletin
  headline. Highest shown as Kensington & Chelsea 110,651 (City of London £129,429 excluded
  as an ~8k-population workplace artefact).

### Census 2021 · TS062 NS-SeC `ts062` (Nomis)
- Nomis API `NM_2079_1`, codes `c2021_nssec_10=6,7` (L12 semi-routine + L13 routine) as a
  share of all residents 16+. Combined from raw counts, rounded to 1 dp. Lowest shown as
  Richmond upon Thames 10.1% (City of London 6.8% is a tiny-population outlier).

### ONS — House price to workplace earnings ratio (2025) `afford`
- Dataset `aff1`, *Table 5c* (LA) and *Table 1c* (country/region), column 2025 (house prices
  to Sep 2025). Higher ratio = **less affordable** = worse.

### ONS — Annual Population Survey `aps` (Nomis `NM_17_5`, Jan–Dec 2025)
- `variable=45` employment rate; `variable=111` economic inactivity; `variable=1496`
  long-term-sick share of the inactive. `measures=20599`. Residence-based.
- Caveat: LA-level APS estimates carry wide confidence intervals; district extremes (Mole
  Valley / Gravesham for employment; Allerdale / Southwark for long-term sick) are volatile —
  flagged as small-sample in the notes, with robust runners-up given.

### ONS — ASHE `ashe` (Nomis `NM_30_1`, 2025 provisional)
- `sex=7 item=2 pay=1 measures=20100` = full-time median gross weekly pay by residence.
  **Anchor reproduced exactly** (Bristol £670.8, England £648.4) to confirm the read.

### ONS — Jobs below the real Living Wage `lowpay` (ASHE/LWF, 2025 provisional)
- *Table 7 "All"*, **place-of-work basis** (the residence table was not in the provisional
  edition). This inflates commuter-outflow boroughs (Redbridge 34.5%) — noted on the card.

### ONS/DWP — Claimant count `claimant` (Nomis `NM_162`, May 2026)
- `measure=2` = claimants as a proportion of residents 16–64, not seasonally adjusted at LA
  level. Lowest shown as Harborough 1.7% (City of London 1.1% is a micro-LA outlier).

### DfE — Participation & NEET age 16–17 by LA (2025/26) `neet`
- `ud_neet_characteristics.csv`, `age='16 to 17'`, `characteristic='Total'`, measure
  `neet_percent` (NEET-only). The combined *NEET + not-known* headline runs higher
  (Bristol 6.4%); the NEET-only measure is used consistently.

### ONS — Regional GDP: local authorities (2023) `gdp`
- Balanced GDP per head, current prices, *Table 7*. England 40,382 / London 69,077 from the
  regional GDP bulletin (not in the LA table). **LA GDP-per-head extremes are workplace-vs-
  residence artefacts** (City of London £8.2m; Lewisham £16,866) and are deliberately **not**
  shown as a meaningful high/low — the card carries only the four robust geographies.

---

## Verification anchors reproduced

- ASHE median full-time weekly pay 2025: Bristol **£670.8**, England **£648.4** (exact).
- IoD2019 income domain recomputed from File 7 reproduces Bristol 0.1406 & Manchester 0.2192.
- IoD2019 ranks cross-checked against the Statistical Release (Blackpool #1 overall,
  Middlesbrough #1 income/IDACI, Manchester #6 overall).
- GDHI per head Bristol £24,696 matches the value already used on the ONS-Census page.

## Known coverage gaps (honestly surfaced, not padded)

- **Children on Universal Credit** and **children in workless households**: only GB/region
  totals are published without an authenticated DWP Stat-Xplore query — dropped rather than
  shown at a misleading geography.
- **Food insecurity** (FRS) is region-only; Bristol's own region (South West) is the *least*
  food-insecure in England, which would mask intra-city deprivation — dropped as a card.
- **In-work poverty** has no LA-level official series (JRF/HBAI is UK-wide).
