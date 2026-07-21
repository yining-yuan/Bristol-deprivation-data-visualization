# DfE table verification — "England" figures on the dashboard

Downloaded from DfE Explore Education Statistics (EES) public API and checked against the
values shown on the Bristol dashboards. Date: 2026-07-07.

## Files here
- `ks2_attainment_region_and_la_2024-25_revised.csv` — full DfE KS2 "Attainment by region and
  local authority" data set (2024/25 **revised**). Dataset id `c62e9901-7b35-7272-9fd1-30ab9a527e10`.
  Download: `https://api.education.gov.uk/statistics/v1/data-sets/c62e9901-7b35-7272-9fd1-30ab9a527e10/csv` (gzip).
- `ks2_rwm_VERIFIED_extract.csv` — trimmed: RWM expected-standard % for England / London region /
  Bristol / Manchester / Richmond / Central Bedfordshire, all years.
- `ks4_attainment8_VERIFIED_extract.csv` — trimmed: all-pupil Attainment 8 average for England /
  London / Bristol / Manchester / Sutton / Knowsley, 2024/25. (Full KS4 file was 321 MB —
  not kept; dataset id `b3e19901-5d2b-b676-bb4c-e60937d74725`, same CSV-API pattern.)

## Findings

### KS2 RWM (expected standard), 2024/25 revised — CORRECTED
- **England = 63%** (all pupils). The dashboard's original 63 was right; an earlier "62" was
  wrong (62 = 2023/24). → reverted to 63.
- **Bristol = 59%** — dashboard said 60. → corrected to 59.
- **London region = 70%** — comparator said 71 (ONS provisional). → corrected to 70.
- Manchester 58, Richmond upon Thames 78 (highest LA), Central Bedfordshire 50 (lowest LA) — all confirmed.

### Attainment 8, 2024/25 revised — ALL CONFIRMED (no change)
- England **46.0**, Bristol 46.4, London 50.5, Manchester 44.8, Sutton 59.3 (high), Knowsley 34.4 (low).

### NEET 16–17 — DOWNLOADED + measure CONFIRMED
Files: `ud_neet_characteristics.csv` (full DfE table) + `neet_release_allfiles.zip` +
`neet_16to17_VERIFIED_extract.csv`. Downloaded from the DfE release "all files" ZIP:
`https://content.explore-education-statistics.service.gov.uk/api/releases/44c09b32-1c86-46be-bb94-85999e1fe19c/files?fromPage=ReleaseDownloads`
(the `?fromPage=` param is required — without it the endpoint returns HTTP 406).

The table has THREE distinct measures per area: `neet_percent` (NEET only), `nk_percent`
(activity not known), `neet_nk_percent` (the two combined = DfE's published headline).

England, 16-17, Total:
| period | NEET only | not known | NEET+NK (headline) |
|---|---|---|---|
| 2025 = **2024/25** | **3.4** | 2.2 | 5.6 |
| 2026 = 2025/26 | 3.4 | 2.4 | 5.8 |

**The dashboard's "NEET at 16-17" = 3.4 (England) / 6.0 (Bristol) is the `neet_percent`
(NEET-only) measure for 2024/25 — CONFIRMED CORRECT.** It is NOT the combined NEET/not-known
figure (5.6 England / 6.46 Bristol). Comparators also confirmed on the NEET-only measure:
London 1.9, Manchester 5.26→5.3, Derby 7.6 (highest), Barnet 0.6 (lowest). No change needed.
NB DfE's own *headline* emphasises the combined NEET/not-known rate (5.6%); the dashboard
reports the narrower, literal NEET rate.

## "England average" label audit (summary)
- Genuine reported all-pupil averages: EYFSP GLD 68.3, phonics 80, KS2 RWM 63, Attainment 8 46.0,
  absence 20.0, suspensions 11.31, NEET 3.4, primary good/outstanding 91.6, Level4+ 33.9, no-quals 18.1.
- Calculated (sum of two Census bands): overcrowding 4.37 (−1 + −2-or-less), deprived-3–4-dims 3.94 (3-dim + 4-dim).
- Subgroup (NOT the England average — relabelled in the ranked view): EYFSP gap 51.3 (FSM),
  KS2 gap 47 (disadvantaged), HE progression 28.9 (FSM), FSM-degree-by-22 16 (all-FSM; the old 18
  was White-FSM HE-entry-by-19 — wrong measure, now fixed).
