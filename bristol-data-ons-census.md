# `bristol-data-ons-census.js` — how to use it & how to verify every figure

This file is the **single source of truth** for the numbers shown in three pages:

| Page | Reads from |
|---|---|
| `Bristol Deprivation ONS-Census.html` (housing / ONS story) | `window.BRISTOL_DATA` |
| `Bristol Education Story.html` | `window.BRISTOL_DATA.education` |
| `index.html` (opening page) | *(no data — just links)* |

---

## 1. How the file is built

It is one self-running function that hangs a big object off `window.BRISTOL_DATA`. The parts:

| Object | What it feeds |
|---|---|
| `SOURCES` | the source name + link every card shows; each key (e.g. `ts067`) is referenced by `src:` elsewhere |
| `FIGURES` | the big hero numbers + the "two cities" bars (housing story) |
| `CHARTS` | the two Chart.js bar charts (housing story) |
| `DUMBBELLS` | the ward life-expectancy "lollipop" rows |
| `INDICATORS` | the indicator cards + life-stage acts (housing story) |
| `EARLY` | the early-years sub-page cards (housing story) |
| `WARDS` | the ward comparator chart (housing story) |
| `education: { … }` | the **whole** education story — `EDU_FIGURES`, `EDU_CHARTS`, `EDU_INDICATORS`, `EDU_EARLY`, `EDU_WARDS` |

### The shape of one indicator

```js
{ id:"overcrowd", icon:"house", theme:"employment", stage:"early",
  label:"Overcrowded households",
  a:{ p:"Bristol", v:5.05 },      // a = the local / disadvantaged value (shown in RED)
  b:{ p:"England", v:4.37 },      // b = the benchmark (shown in GREEN)
  unit:"%",                        // "%" | "yrs" | "£" | "" (plain number)
  src:"ts052",                     // must match a key in SOURCES
  asOf:"2021",                     // period / when checked
  note:"Occupancy rating of −1 or less …" }   // the sentence under the card
```

- `p` = the little label beside the number ("Bristol", "England", a ward name…).
- `v` = the number. Use `v:null` to show a dash `—` (an "unknown" value).
- `stage` = `early` · `primary` · `secondary` · `transition` · `cross` — controls which life-stage act the card appears in.
- `theme` = `education` · `health` · `employment` — used by the housing page's colour/label.

---

## 2. How to use it

**Change a number** → find the object, edit `v:` (and update `asOf:` and, if the meaning changed, `note:`/`about:`). Save, reload the HTML.

**Add an indicator** → copy a whole `{ … }` block into the right array, give it a unique `id`, point `src:` at an existing `SOURCES` key (or add a new one), set its `stage`. It appears automatically — no HTML change.

**Remove an indicator** → delete its `{ … }` block. Make sure the block **before the closing `]`** has no trailing comma issues (a trailing comma before `]` is fine in modern browsers, but keep it tidy).

**Add a source** → add a line to `SOURCES`:
```js
mykey: { name:"Shown on the card ↗", url:"https://…", g:"LA" },
```
`g` = geography badge used on the early-years sub-page: `LSOA` / `Ward` / `MSOA` (green), `LA` (gold), `National` (red).

**Check you didn't break the syntax** → open the page; if cards are blank the file has a JS error. In a terminal you can also load it headless and look for `SyntaxError`. Every `{ }` and `[ ]` must balance and every property needs a comma.

---

## 3. How to verify a figure — the method, by source

Each `src:` key tells you which family the number comes from. Verification always = **open the `url` in `SOURCES`, set the area to Bristol, and find the exact category/measure below.**

| Source family | `src` keys | How to get to Bristol | What to search for |
|---|---|---|---|
| **Census 2021 (Nomis)** | `ts003 ts007 ts011 ts037 ts038 ts039 ts045 ts046 ts052 ts054 ts062 ts066 ts067`, `census` | On the Nomis dataset page → **Query / area profile** → geography **"Bristol, City of" (E06000023)**; add **England** as comparison. For ward figures pick **2021 electoral wards**. | The **table code** (e.g. `TS067`) + the **category name** in the tables below |
| **ONS — Explore local statistics** | `ons` | Open the Bristol area page → find the indicator tile | The **indicator name** (e.g. "Health Index", "Gross disposable household income per head") |
| **ONS — life expectancy** | `ons_le` (local/ward), `ons_nlt` (England), `ons_hle` (healthy) | Open the bulletin → download the reference table → filter area | "Bristol, City of" / the **ward name**; column "**life expectancy at birth**" |
| **ONS · DWP — child poverty** | `ons_clif` | Open the release → the **local-area / ward** data file | "**Children in relative low income**", area Bristol, then the **ward** row |
| **Sutton Trust** | `sutton` | Open the named report PDF | the **phrase** in the tables below (national figures) |
| **DfE — Explore Education Statistics** | `dfe dfe_eyfsp dfe_phon dfe_ks2 dfe_ks4 dfe_abs dfe_excl dfe_wp dfe_neet` | On the release → **"View / explore data"** → filter **Local authority = Bristol** | the **measure name** in the tables below |
| **Office for Students (TUNDRA)** | `ofs` | Open "Young participation by area" → the TUNDRA data file | the **MSOA / area name** (e.g. "Hartcliffe"), column "**young participation**" |
| **Open Data Bristol** | `odb_edu` | Open the dataset → filter by ward | the **ward name** + measure ("suspensions", "Progress 8") |

> **Tip:** for any Census number, the fastest check is the **Nomis "Area Profile"** for Bristol — search the code (`TS067`) on nomisweb.co.uk, choose Bristol + England, and every category is on one page.

---

## 4. Full verification reference — every data point

**Legend:** value shown as `Bristol → benchmark`. "Search for" = the exact category / measure to read at the source in `SOURCES[src].url`.

### 4.1 Housing / ONS story

#### `FIGURES` (hero + two-cities)

| key | value | src | Search for (at the source) |
|---|---|---|---|
| `heroAge` | 32.4 (Eng 40.4) | `ts007` | **TS007** "Median age" — area Bristol vs England |
| `heroLeGap` | 11.9 yrs | `ons_le` | derived: male LE **Lawrence Hill 71.6** minus **Westbury & Henleaze 83.5** (see `ons_le`) |
| `heroChildPov` | 54.2% | `ons_clif` | "Children in relative low income", **Lawrence Hill** ward |
| `degRedland` | 67% | `ts067` | **TS067** "Level 4 qualifications and above", ward **Redland** |
| `degHW` | 15.8% | `ts067` | **TS067** "Level 4 qualifications and above", ward **Hartcliffe & Withywood** |
| `povHigh` | 54.2% | `ons_clif` | child low income, **Lawrence Hill** |
| `povLow` | 3.1% | `ons_clif` | child low income, **Redland** |
| `qualL4` | 42.1% (Eng 33.9) | `ts067` | **TS067** "Level 4 qualifications and above", Bristol |
| `healthIndex` | 91.4 (Eng 100.8) | `ons` | Explore local statistics → "**Health Index**", Bristol (2021) |
| `deprived34` | 4.23% (Eng 3.94) | `ts011` | **TS011** sum of "deprived in **3 dimensions**" + "**4 dimensions**" |
| `socialRent` | 18.7% (Eng 17.1) | `ts054` | **TS054** "**Social rented**" total |
| `gdhi` | £24,696 (Eng £25,425) | `ons` | Explore local statistics → "**Gross disposable household income per head**" (2023) |
| `leCityM` | 78.14 (Eng 79.11) | `ons_le` | LE at birth, **males**, Bristol City of |
| `leCityF` | 82.69 (Eng 83.05) | `ons_le` | LE at birth, **females**, Bristol City of |
| `leMaleLow` | 71.6 | `ons_le` | LE males, ward **Lawrence Hill** |
| `leMaleHigh` | 83.5 | `ons_le` | LE males, ward **Westbury-on-Trym & Henleaze** |
| `leEngM` | 79.11 | `ons_nlt` | National life tables → England **males** 2021–2023 |
| `hleF` | 60.1 (Eng 61.3) | `ons_hle` | Healthy life expectancy at birth, **females**, Bristol |

#### `CHARTS`

| chart | values | src | Search for |
|---|---|---|---|
| `quals` | L4+ 42.1/33.9 · No quals 14.5/18.1 | `ts067` | **TS067** "Level 4 and above" and "**No qualifications**", Bristol vs Eng |
| `health` | Deprived 3–4 4.23/3.94 · Overcrowded 5.05/4.37 · No car 26.15/23.54 · Social rent 18.7/17.09 | `census` | **TS011** (3–4 dims), **TS052** (occupancy −1 or less), **TS045** (no cars or vans), **TS054** (social rented) |
| `age` | 32.4 / 40.4 | `ts007` | **TS007** median age |

#### `DUMBBELLS` (ward life expectancy — all `ons_le`)

Search `ons_le` for **LE at birth by ward**; read each ward:

| row | low → high |
|---|---|
| men | Lawrence Hill **71.6** → Westbury & Henleaze **83.5** |
| men | Central **71.3** → Hotwells & Harbourside **83.7** |
| women | St George West **78.6** → Troopers Hill **87.9** |
| women | Filwood **79.3** → Clifton Down **88.7** |

> Ward-level life expectancy is modelled small-area data; if you can't find it in the ONS bulletin table, cross-check the **Bristol JSNA "Life expectancy" profile**, which republishes the same ONS figures by ward.

#### `INDICATORS`

| id | value | src | Search for (category / measure) |
|---|---|---|---|
| `child_share` | Barton Hill 30 / city avg 17.5 | `census` | **TS007** aged **0–15** as % of all ages, by ward |
| `child_pov` | Lawrence Hill 54.2 / Redland 3.1 | `ons_clif` | "Children in relative low income", those wards |
| `overcrowd` | 5.05 / 4.37 | `ts052` | **TS052** "**Occupancy rating of bedrooms: −1 or less**" |
| `no_heating` | 1.62 / 1.50 | `ts046` | **TS046** "**No central heating**" |
| `deprived_34` | 4.23 / 3.94 | `ts011` | **TS011** deprived in **3** + **4** dimensions |
| `deprived_any` | 49.83 / 50.05 | `ts011` | **TS011** = 100 − "not deprived in any dimension" (i.e. 1+ dimensions) |
| `social_rent` | 18.7 / 17.09 | `ts054` | **TS054** "Social rented" |
| `no_car` | 26.15 / 23.54 | `ts045` | **TS045** "**No cars or vans in household**" |
| `lone_parent` | 10.34 / 11.07 | `ts003` | **TS003** "**One-parent family**" households |
| `nssec_rout` | 20.99 / 23.27 | `ts062` | **TS062** "**Routine / Semi-routine**" (L12–L13) |
| `own_outright` | 25.1 / 32.52 | `ts054` | **TS054** "**Owned: Owns outright**" |
| `gdhi` | £24,696 / £25,425 | `ons` | Explore local statistics → "Gross disposable household income per head" |
| `health_bad` | 4.96 / 5.15 | `ts037` | **TS037** "**Bad**" + "**Very bad**" general health |
| `quals_l4` | 42.1 / 33.9 | `ts067` | **TS067** "Level 4 and above" |
| `quals_none` | 14.5 / 18.1 | `ts067` | **TS067** "**No qualifications**" |
| `employment` | 76.1 / 76.0 | `ons` | Explore local statistics → "**Employment rate**" (16–64, APS 2023) |
| `inactivity` | 20.8 / 21.0 | `ons` | Explore local statistics → "**Economic inactivity rate**" (16–64) |
| `pay` | £670.8 / £648.4 | `ons` | Explore local statistics → "**Gross median weekly pay**" (ASHE 2025) |
| `median_age` | 32.4 / 40.4 | `ts007` | **TS007** median age |
| `fsm_uni` | White Brit FSM 18 / Black African FSM 62 | `sutton` | "Crossing Paths" — "**entering university by 19**" by ethnicity |
| `fsm_bristol` | Bristol NW **3** / Eng White FSM 18 | `sutton` | Opportunity Index — "**Bristol North West**" white-FSM degree by 22 (matches the education story) |
| `health_index` | 91.4 / 100.8 | `ons` | Explore local statistics → "Health Index" |
| `disability` | 17.1 / 17.31 | `ts038` | **TS038** "**Disabled under the Equality Act**" (limited a lot + a little) |
| `unpaid_care` | 7.83 / 9.26 | `ts039` | **TS039** "**Provides unpaid care**" (any hours) |
| `le_city_m` | 78.14 / 79.11 | `ons_le` | LE males, Bristol |
| `le_male` | Lawrence Hill 71.6 / Westbury & Henleaze 83.5 | `ons_le` | LE males, those wards |
| `le_female` | St George West 78.6 / Troopers Hill 87.9 | `ons_le` | LE females, those wards |
| `hle_f` | 60.1 / 61.3 | `ons_hle` | Healthy LE females, Bristol |

#### `EARLY` (early-years sub-page)

| id | value | src | Search for |
|---|---|---|---|
| `ey_childpov` | Bristol 25.6 / Redland 3.1 | `ons_clif` | "Children in relative low income" — Bristol (after-housing-costs 25.6) and ward Redland |
| `ey_overcrowd` | 5.05 / 4.37 | `ts052` | **TS052** occupancy −1 or less |
| `ey_heating` | 1.62 / 1.50 | `census` | **TS046** no central heating |
| `ey_deprived` | 4.23 / 3.94 | `ts011` | **TS011** 3–4 dimensions |
| `ey_ready` | Disadvantaged 51.5 / Eng avg 67.7 | `sutton` | "school ready" / "**good level of development**" for disadvantaged; the "**19-month**" gap |
| `ey_earlyaccess` | Under £20k 20 / Over £45k 80 | `sutton` | early education access — "**1 in 5**" lowest-income vs "**4 in 5**" |
| `ey_le_birth` | 78.14 / 79.11 | `ons_le` | LE males at birth |
| `ey_le_birthf` | 82.69 / 83.05 | `ons_le` | LE females at birth |
| `ey_disab` | 17.1 / 17.31 | `ts038` | **TS038** disabled under Equality Act |

#### `WARDS` (ward comparator)

| metric | wards | src | Search for |
|---|---|---|---|
| `life_w` | Troopers Hill 87.9 · Clifton Down 88.7 · Filwood 79.3 · St George West 78.6 | `ons_le` | LE **females** by ward |
| `child_pov` | Lawrence Hill 54.2 · Central 47.8 · Hartcliffe & W. 39.3 · Filwood 36.9 · Westbury & Henleaze 3.4 · Redland 3.1 | `ons_clif` | child low income by ward |
| `children_pct` | Barton Hill 30 · Hartcliffe 27.6 · Lawrence Weston 26 · city avg 17.5 | `census` | **TS007** aged 0–15 % by ward |
| `degree_w` | Redland 67 · Clifton 64 · Hartcliffe & W. 15.8 · Filwood 17 | `ts067` | **TS067** Level 4+ by ward |

### 4.2 Education story (`window.BRISTOL_DATA.education`)

> DfE figures: open the release in `SOURCES[src].url` → **explore data** → set **Local authority = "Bristol, City of"**, then read the named measure. Most are **2023/24**.

#### `EDU_FIGURES` / `EDU_CHARTS`

| key | value | src | Search for |
|---|---|---|---|
| `heroKs2` | 60% (Eng 63) | `dfe_ks2` | KS2 "**reading, writing & maths — expected standard**", Bristol (2024/25) |
| `heroGap` | 28 pp | `dfe_ks2` | KS2 RWM: **disadvantaged 41** vs **others 69**, Bristol (difference, 2024/25) |
| `heroFsm` | 3% | `sutton` | Opportunity Index — Bristol North West white-FSM degree by 22 |
| `degRedland` / `degHW` | 67 / 15.8 | `ts067` | **TS067** Level 4+, those wards |
| chart `journey` | GLD 68.7/68.3 · KS2 60/63 · Primary good-outstanding 86/93 | `dfe` | EYFSP GLD; KS2 RWM; **Ofsted "good or outstanding"** primary % (2024/25) |
| chart `gap` | Disadvantaged 23.2 / peers 57.1 | `dfe_ks4` | KS4 "**grade 5+ in English & maths**" by disadvantage, Bristol (2024/25) |

#### `EDU_INDICATORS`

| id | value | src | Search for (measure, area = Bristol) |
|---|---|---|---|
| `eyfsp_gld` | 68.7 / 68.3 | `dfe_eyfsp` | "**Good level of development**" (all pupils, 2024/25) |
| `eyfsp_gap` | FSM 49.9 / peers 74.5 | `dfe_eyfsp` | GLD split by "**disadvantaged / FSM**" (latest LA split = 2023/24) |
| `early_access` | 20 / 80 | `sutton` | early-education access "1 in 5 / 4 in 5" |
| `phonics` | 77 / 80 | `dfe_phon` | Year 1 phonics "**met expected standard**" (latest LA = 2023/24) |
| `ks2_rwm` | 60 / 63 | `dfe_ks2` | KS2 RWM expected standard (2024/25) |
| `ks2_gap` | disadv 41 / peers 69 | `dfe_ks2` | KS2 RWM by **disadvantage** (2024/25) |
| `prim_oo` | 86 / 93 | `dfe` | Ofsted primary "**good or outstanding**" |
| `attainment8` | 46.4 / 46.0 | `dfe_ks4` | "**Average Attainment 8 score**" (2024/25) |
| `gcse5_em` | disadv 23.2 / peers 57.1 | `dfe_ks4` | "**Grade 5 or above in English & maths**" by disadvantage (2024/25) |
| `progress8` | disadv −0.59 / peers 0.26 | `dfe_ks4` | "**Average Progress 8 score**" — **not published for 2024/25** (no KS2 baseline); latest = 2023/24 (ward −1.06/+0.82 = Open Data Bristol) |
| `absence` | 24.7 / 20.0 | `dfe_abs` | "**Persistent absentees (10%+ sessions)**" |
| `suspensions` | 14.95 / 11.31 | `dfe_excl` | "**Suspension rate (per 100 pupils)**" |
| `he_prog` | Bristol FSM 18.1 / Eng FSM 28.9 | `dfe_wp` | "**Progression to higher education by 19**", FSM |
| `fsm_uni` | White Brit FSM 18 / Black African FSM 62 | `sutton` | "Crossing Paths" university entry by ethnicity |
| `fsm_bristol` | Bristol NW 3 / highest area 41 | `sutton` | Opportunity Index — Bristol North West; "**Bristol South ranks 538 of 543**" |
| `neet` | 6.0 / 3.4 | `dfe_neet` | "**NEET**" 16–17 by LA (wards 17.2% / 16.0% in the same release) |
| `excl_gcse` | 7 / 46 | `dfe_excl` | **Timpson Review** — "**7%**" of permanently excluded pupils with good GCSEs |
| `quals_l4` | 42.1 / 33.9 | `ts067` | **TS067** Level 4+ |
| `quals_none` | 14.5 / 18.1 | `ts067` | **TS067** No qualifications (ward H&W 30.4%) |
| `degree_ward` | Hartcliffe & W. 15.8 / Redland 67 | `ts067` | **TS067** Level 4+ by ward |

#### `EDU_EARLY`

| id | value | src | Search for |
|---|---|---|---|
| `ee_gld` | 68.4 / 67.7 | `dfe_eyfsp` | GLD all pupils |
| `ee_ready` | FSM 49.9 / peers 74.5 | `dfe_eyfsp` | GLD by disadvantage |
| `ee_access` | 20 / 80 | `sutton` | early-education access |
| `ee_childpov` | Lawrence Hill 54.2 / Redland 3.1 | `ons_clif` | child low income by ward |
| `ee_overcrowd` | 5.05 / 4.37 | `ts052` | TS052 occupancy −1 or less |
| `ee_deprived` | 4.23 / 3.94 | `ts011` | TS011 3–4 dimensions |

#### `EDU_WARDS`

| metric | wards | src | Search for |
|---|---|---|---|
| `degree_w` | Redland 67 · Clifton 64 · Filwood 17 · Hartcliffe & W. 15.8 | `ts067` | TS067 Level 4+ by ward |
| `he_part` | Westbury Park 77.6 · Redland 72.4 · Highridge 11.6 · Hartcliffe 8.7 | `ofs` | OfS TUNDRA "**young participation**" by MSOA/area |
| `suspensions` | Hartcliffe & W. 110.8 · Filwood 101.7 · Lawrence Hill 97.2 | `odb_edu` | Open Data Bristol — "**pupils suspended per 1,000**" by ward |
| `child_pov` | Lawrence Hill 54.2 · Central 47.8 · Hartcliffe & W. 39.3 · Redland 3.1 | `ons_clif` | child low income by ward |

---

## 5. Known caveats — double-check these

1. ✅ **RESOLVED.** ~~`nssec_rout` stored `src:"ts066"` but the number is NS-SeC = Census TS062.~~ A `ts062` key was added to `SOURCES` and `nssec_rout` now points to it. Verify against **TS062** "Routine / Semi-routine (L12–L13)".
2. ✅ **RESOLVED.** ~~`lone_parent` and `no_heating` used the generic `src:"census"` link.~~ `ts003` (household composition) and `ts046` (central heating) keys were added; `lone_parent` → `ts003`, `no_heating` → `ts046`.
3. ✅ **RESOLVED.** ~~`fsm_bristol` said 2% in the housing story and 3% in the education story.~~ Both now use **3%** (Sutton Trust Opportunity Index 2025), `asOf:"2025"`, with the "Bristol South 538th of 543" ranking in the note.
4. **Child poverty measure:** the citywide **25.6%** (`ey_childpov`) is **after housing costs**; the ward figures (54.2%, 3.1% …) are the DWP **"relative low income"** series. They are related but not the same measure — keep the labels honest if you swap one for the other.
5. **`health_bad` (4.96 / 5.15)** is the **unadjusted** Census self-reported figure and looks *better* than England because Bristol is young. For a deprivation signal use **age-standardised** health, `hle_f`, or the **Health Index** instead — don't present the raw figure as "Bristol is healthier".
6. **Ward-level life expectancy** in `DUMBBELLS`/`WARDS` is modelled small-area data; the ONS bulletin publishes LA-level cleanly but ward values are easiest to confirm via the **Bristol JSNA life-expectancy profile** (same ONS figures, republished by ward).
7. **`asOf` mixes years** (Census 2021, DfE 2023/24, pay 2025, NEET 2024/25). That's fine, but when you refresh, update `asOf` so the card's date stays truthful.
