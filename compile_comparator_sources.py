#!/usr/bin/env python3
# =============================================================================
# compile_comparator_sources.py
# -----------------------------------------------------------------------------
# Builds FOUR comparator CSVs that mirror bristol_education_sources.csv but swap
# the Bristol/England pair for a comparator geography:
#
#   highest.csv     -> English LOCAL AUTHORITY with the max value per indicator
#   lowest.csv      -> English LOCAL AUTHORITY with the min value per indicator
#   london.csv      -> London REGION average (E12000007)
#   manchester.csv  -> Manchester LA (E08000003)
#
# Same 9-col schema as bristol_education_sources.csv / bristol_trends.csv:
#   indicator, indicator_label, area, year, value, unit, source, source_url, notes
#
# Values were verified by research agents directly against the source data
# (deep links / underlying CSVs). This script ONLY writes the 4 new files; it
# never touches bristol_education_sources.csv.
#
# Extremes = literal verified max/min across standard English LAs. Where the
# extreme is a tiny/degenerate authority, the note keeps the caveat + the more
# robust runner-up. Ward-level indicators use ward/MSOA granularity; for London
# & Manchester those files carry the highest AND lowest ward within that area.
# National-only report indicators carry a blank value + an explanatory note.
# =============================================================================
import csv

# indicator id -> (label, unit)
META = {
 "eyfsp_gld":   ("EYFSP Good Level of Development at reception", "%"),
 "eyfsp_gap":   ("EYFSP GLD by disadvantage", "%"),
 "early_access":("Low-income families reaching funded early education", "%"),
 "phonics":     ("Year 1 phonics meeting the expected standard", "%"),
 "ks2_rwm":     ("KS2 reading, writing & maths (expected standard)", "%"),
 "ks2_gap":     ("KS2 RWM by disadvantage", "%"),
 "prim_oo":     ("Primary schools rated good or outstanding", "%"),
 "attainment8": ("GCSE Average Attainment 8 score", "score"),
 "gcse5_em":    ("Grade 5+ in English & maths by disadvantage", "%"),
 "progress8":   ("GCSE Progress 8 by disadvantage", "score"),
 "absence":     ("Persistent absence (10%+ of sessions)", "%"),
 "suspensions": ("Suspension rate (per 100 pupils)", "per 100 pupils"),
 "he_prog":     ("FSM pupils progressing to HE by 19", "%"),
 "fsm_uni":     ("FSM pupils entering university by 19, by ethnicity", "%"),
 "fsm_bristol": ("White FSM holding a degree by 22", "%"),
 "neet":        ("NEET at 16-17", "%"),
 "excl_gcse":   ("Good GCSEs after permanent exclusion", "%"),
 "quals_l4":    ("Adults with Level 4+ qualifications", "%"),
 "quals_none":  ("Adults with no qualifications", "%"),
 "degree_ward": ("Degree-qualified adults, by ward", "%"),
 "child_pov_ward":("Children in relative low income, by ward", "%"),
 "ee_overcrowd":("Overcrowded households", "%"),
 "ee_deprived": ("Households deprived in 3-4 dimensions", "%"),
 "he_part":     ("Young people entering HE (TUNDRA), by ward", "%"),
 "suspensions_ward":("Pupils suspended per 1,000, by ward", "per 1,000"),
}

# order to emit rows (mirrors bristol_education_sources.csv SPEC order)
ORDER = ["eyfsp_gld","eyfsp_gap","early_access","phonics","ks2_rwm","ks2_gap",
 "prim_oo","attainment8","gcse5_em","progress8","absence","suspensions",
 "he_prog","fsm_uni","fsm_bristol","neet","excl_gcse","quals_l4","quals_none",
 "degree_ward","child_pov_ward","ee_overcrowd","ee_deprived","he_part","suspensions_ward"]

# Each row tuple: (area, year, value, source, source_url, note)
# value may be "" for national-only / not-published.
# DATA[id][group] = list of row tuples (usually 1; 2 for gap splits & ward hi/lo).
DATA = {

 # ---- EYFSP GLD (LA-level) --------------------------------------------------
 "eyfsp_gld": {
  "highest":[("Wokingham","2024/25",77.3,"DfE — Early years foundation stage profile results (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2024-25",
     "Highest standard English LA (E06000041), all pupils Total. Isles of Scilly (92.3) and City of London (78.8) excluded as tiny-cohort anomalies. EES data set 019ac0fb..., time_period 202425, gld_children_percent=77.25.")],
  "lowest":[("Manchester","2024/25",60.3,"DfE — Early years foundation stage profile results (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2024-25",
     "Lowest English LA (E08000003), all pupils Total. EES data set 019ac0fb..., gld_children_percent=60.31.")],
  "london":[("London (region)","2024/25",70.7,"DfE — Early years foundation stage profile results (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2024-25",
     "London region average (E12000007), all pupils Total. EES data set 019ac0fb..., gld_children_percent=70.66.")],
  "manchester":[("Manchester","2024/25",60.3,"DfE — Early years foundation stage profile results (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2024-25",
     "Manchester LA (E08000003), all pupils Total. EES data set 019ac0fb..., gld_children_percent=60.31 (also the national low).")],
 },

 # ---- EYFSP gap (disadvantaged / peers split) -------------------------------
 "eyfsp_gap": {
  "highest":[
    ("City of London — Disadvantaged (FSM)","2023/24",100.0,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "LA with highest disadvantaged GLD (E09000001, 'Eligible for FSM'=100.0). CAVEAT: only ~5 disadvantaged children — statistical artifact; most robust high LA is Newham (E09000025) disadvantaged ~66.8. File 1_eyfsp_headline_measures_2022_2024.csv."),
    ("City of London — Their peers","2023/24",64.0,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "Same LA (E09000001), 'Not eligible for FSM'=64.0.")],
  "lowest":[
    ("Rutland — Disadvantaged (FSM)","2023/24",29.4,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "Lowest disadvantaged GLD of 152 LAs (E06000017='Eligible for FSM'=29.4). CAVEAT: small cohort (~17 children); next lowest Cambridgeshire & West Berkshire both 40.5. File 1_eyfsp_headline_measures_2022_2024.csv."),
    ("Rutland — Their peers","2023/24",74.1,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "Same LA (E06000017), 'Not eligible for FSM'=74.1.")],
  "london":[
    ("London (region) — Disadvantaged (FSM)","2023/24",58.3,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "London region (E12000007), 'Eligible for FSM'=58.3. File 1_eyfsp_headline_measures_2022_2024.csv."),
    ("London (region) — Their peers","2023/24",73.7,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "London region (E12000007), 'Not eligible for FSM'=73.7.")],
  "manchester":[
    ("Manchester — Disadvantaged (FSM)","2023/24",52.5,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "Manchester LA (E08000003), 'Eligible for FSM'=52.5. Bristol reads 49.9/74.5 in same file, confirming definition."),
    ("Manchester — Their peers","2023/24",66.0,"DfE — Early years foundation stage profile results (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2023-24",
     "Manchester LA (E08000003), 'Not eligible for FSM'=66.0.")],
 },

 # ---- early_access (Sutton Trust national only) -----------------------------
 "early_access": {
  "highest":[("N/A — national figure only","2024","","Sutton Trust — Inequality in early years education (Jan 2024)",
     "https://www.suttontrust.com/wp-content/uploads/2024/01/Inequality-in-early-years-education.pdf",
     "National figures only (under-£20k 20% vs over-£45k 80%). No LA/region breakdown of the access figure is published.")],
  "lowest":[("N/A — national figure only","2024","","Sutton Trust — Inequality in early years education (Jan 2024)",
     "https://www.suttontrust.com/wp-content/uploads/2024/01/Inequality-in-early-years-education.pdf",
     "Sutton Trust national figure; no LA/region breakdown published.")],
  "london":[("N/A — national figure only","2024","","Sutton Trust — Inequality in early years education (Jan 2024)",
     "https://www.suttontrust.com/wp-content/uploads/2024/01/Inequality-in-early-years-education.pdf",
     "Sutton Trust national figure; no LA/region breakdown published.")],
  "manchester":[("N/A — national figure only","2024","","Sutton Trust — Inequality in early years education (Jan 2024)",
     "https://www.suttontrust.com/wp-content/uploads/2024/01/Inequality-in-early-years-education.pdf",
     "Sutton Trust national figure; no LA/region breakdown published.")],
 },

 # ---- phonics (LA-level) ----------------------------------------------------
 "phonics": {
  "highest":[("Richmond upon Thames","2023/24",88,"DfE — Phonics screening check attainment (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/phonics-screening-check-attainment/2023-24",
     "Highest English LA (E09000027), Year 1 Total. EES data set b3bd9901..., expected_standard_pupil_percent=88.")],
  "lowest":[("Manchester","2023/24",74,"DfE — Phonics screening check attainment (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/phonics-screening-check-attainment/2023-24",
     "Lowest standard English LA (E08000003), Year 1 Total; City of London & Isles of Scilly suppressed ('c') and excluded. EES b3bd9901..., =74.")],
  "london":[("London (region)","2023/24",82,"DfE — Phonics screening check attainment (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/phonics-screening-check-attainment/2023-24",
     "London region average (E12000007), Year 1 Total. EES b3bd9901..., =82.")],
  "manchester":[("Manchester","2023/24",74,"DfE — Phonics screening check attainment (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/phonics-screening-check-attainment/2023-24",
     "Manchester LA (E08000003), Year 1 Total. EES b3bd9901..., =74 (also the national low).")],
 },

 # ---- KS2 RWM (LA-level) ----------------------------------------------------
 "ks2_rwm": {
  "highest":[("Richmond upon Thames","2024/25",78,"ONS — Explore local statistics (KS2 RWM expected standard)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/pupils-at-expected-standards-end-primary-school?geo=ltla&areas=E09000027",
     "Highest English LA (E09000027). ONS ELS CSV period 2024-09-01 value=78.")],
  "lowest":[("Central Bedfordshire","2024/25",50,"ONS — Explore local statistics (KS2 RWM expected standard)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/pupils-at-expected-standards-end-primary-school?geo=ltla&areas=E06000056",
     "Lowest standard English LA (E06000056)=50. The raw data lists West Somerset (E07000191) at 32, but that district was abolished in 2019 — a non-comparable historic-boundary artifact, excluded.")],
  "london":[("London (region)","2024/25",71,"ONS — Explore local statistics (KS2 RWM expected standard)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/pupils-at-expected-standards-end-primary-school?geo=rgn&areas=E12000007",
     "London region average (E12000007). ONS ELS CSV period 2024-09-01 value=71.")],
  "manchester":[("Manchester","2024/25",58,"ONS — Explore local statistics (KS2 RWM expected standard)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/pupils-at-expected-standards-end-primary-school?geo=ltla&areas=E08000003",
     "Manchester LA (E08000003). ONS ELS CSV period 2024-09-01 value=58.")],
 },

 # ---- KS2 gap (disadvantaged / peers) --------------------------------------
 "ks2_gap": {
  "highest":[
    ("Newham — Disadvantaged","2024/25",69,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "LA with highest disadvantaged RWM (E09000025)=69, all state funded, Total breakdowns. File ks2_regional_local_authority_and_pupil_characteristics_2019_to_2025_provisional.csv."),
    ("Newham — Their peers","2024/25",73,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "Same LA (E09000025), 'Not known to be disadvantaged'=73.")],
  "lowest":[
    ("Central Bedfordshire — Disadvantaged","2024/25",26,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "Lowest disadvantaged RWM of 151 LAs (E06000056)=26; next lowest West Berkshire 33, York 35."),
    ("Central Bedfordshire — Their peers","2024/25",55,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "Same LA (E06000056), 'Not known to be disadvantaged'=55.")],
  "london":[
    ("London (region) — Disadvantaged","2024/25",58,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "London region (E12000007) disadvantaged=58."),
    ("London (region) — Their peers","2024/25",74,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "London region (E12000007) 'Not known to be disadvantaged'=74.")],
  "manchester":[
    ("Manchester — Disadvantaged","2024/25",48,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "Manchester LA (E08000003) disadvantaged=48. NB provisional file reads Bristol 40/68 vs dashboard 41/69 (~1pp rounding); England national in file = 47/68."),
    ("Manchester — Their peers","2024/25",63,"DfE — Key stage 2 attainment (2024/25, provisional)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25",
     "Manchester LA (E08000003) 'Not known to be disadvantaged'=63.")],
 },

 # ---- Primary Ofsted good/outstanding (LA-level) ----------------------------
 "prim_oo": {
  "highest":[("Warrington","2023/24 (as at 31 Aug 2024)",100.0,"Ofsted — State-funded schools inspections and outcomes (as at 31 Aug 2024)",
     "https://assets.publishing.service.gov.uk/media/673f1b06b3f0df6d2ebaf02b/State-funded_schools_inspections_and_outcomes_as_at_31_August_2024_charts_and_tables.xlsx",
     "Table 5c (primary) %Outstanding+%Good=100.0. Tied at 100% across several LAs; Warrington (E06000007) has the largest inspected base (69 schools). Others at 100%: Lewisham, Richmond upon Thames, Camden, Hammersmith & Fulham, Kingston upon Thames, Slough, Bracknell Forest, Rutland, City of London.")],
  "lowest":[("Isle of Wight","2023/24 (as at 31 Aug 2024)",75.7,"Ofsted — State-funded schools inspections and outcomes (as at 31 Aug 2024)",
     "https://assets.publishing.service.gov.uk/media/673f1b06b3f0df6d2ebaf02b/State-funded_schools_inspections_and_outcomes_as_at_31_August_2024_charts_and_tables.xlsx",
     "Table 5c primary: Isle of Wight 5.4 Outstanding + 70.3 Good = 75.7% (37 schools) — lowest LA; next Southampton 81.5, North Lincolnshire 82.3.")],
  "london":[("London (region)","2023/24 (as at 31 Aug 2024)",96.5,"Ofsted — State-funded schools inspections and outcomes (as at 31 Aug 2024)",
     "https://assets.publishing.service.gov.uk/media/673f1b06b3f0df6d2ebaf02b/State-funded_schools_inspections_and_outcomes_as_at_31_August_2024_charts_and_tables.xlsx",
     "Table 5c primary, region row London = 96.5% (1778 schools inspected).")],
  "manchester":[("Manchester","2023/24 (as at 31 Aug 2024)",89.6,"Ofsted — State-funded schools inspections and outcomes (as at 31 Aug 2024)",
     "https://assets.publishing.service.gov.uk/media/673f1b06b3f0df6d2ebaf02b/State-funded_schools_inspections_and_outcomes_as_at_31_August_2024_charts_and_tables.xlsx",
     "Table 5c primary, Manchester = 89.6% (135 schools). NB this table gives England primary = 91.6% and Bristol = 86.4% (dashboard shows England 93 / Bristol 86).")],
 },

 # ---- Attainment 8 (LA-level) ----------------------------------------------
 "attainment8": {
  "highest":[("Sutton","2024/25",59.3,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Highest of 152 English LAs, all-pupils Total attainment8_average. Kingston upon Thames 59.2 close 2nd.")],
  "lowest":[("Knowsley","2024/25",34.4,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Lowest of 152 English LAs, all-pupils Total. Next Blackpool 37.0.")],
  "london":[("London (region)","2024/25",50.5,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "London region (E12000007) Total attainment8_average.")],
  "manchester":[("Manchester","2024/25",44.8,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Manchester LA (E08000003) Total attainment8_average.")],
 },

 # ---- GCSE 5+ E&M by disadvantage (grade 9-5) -------------------------------
 "gcse5_em": {
  "highest":[
    ("Newham — Disadvantaged","2024/25",48.2,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "LA with highest disadvantaged grade 9-5 E&M of 152 LAs (E09000025), engmath_95_percent."),
    ("Newham — Their peers","2024/25",58.7,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Same LA (E09000025), 'Not known to be disadvantaged'.")],
  "lowest":[
    ("Knowsley — Disadvantaged","2024/25",16.3,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Lowest substantive LA (E08000011). Literal min is Isles of Scilly 0.0% but its disadvantaged cohort is 1 pupil (artifact), so Knowsley used."),
    ("Knowsley — Their peers","2024/25",33.9,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Same LA (E08000011), 'Not known to be disadvantaged'.")],
  "london":[
    ("London (region) — Disadvantaged","2024/25",36.9,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "London region (E12000007) disadvantaged engmath_95_percent."),
    ("London (region) — Their peers","2024/25",61.1,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "London region (E12000007) 'Not known to be disadvantaged'.")],
  "manchester":[
    ("Manchester — Disadvantaged","2024/25",31.4,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Manchester LA (E08000003) disadvantaged engmath_95_percent."),
    ("Manchester — Their peers","2024/25",51.9,"DfE — Key stage 4 performance (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
     "Manchester LA (E08000003) 'Not known to be disadvantaged'.")],
 },

 # ---- Progress 8 by disadvantage (latest = 2023/24) -------------------------
 "progress8": {
  "highest":[
    ("Westminster — Disadvantaged","2023/24",0.27,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "LA with highest disadvantaged Progress 8 of 151 LAs (avg_p8score). P8 not published for 2024/25 (no KS2 baseline), so 2023/24 is latest."),
    ("Westminster — Their peers","2023/24",0.61,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "Same LA, non-disadvantaged avg_p8score.")],
  "lowest":[
    ("Blackpool — Disadvantaged","2023/24",-1.41,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "Lowest disadvantaged Progress 8 of English LAs; next Knowsley -1.28."),
    ("Blackpool — Their peers","2023/24",-0.51,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "Same LA, non-disadvantaged avg_p8score.")],
  "london":[
    ("London (region) — Disadvantaged","2023/24",-0.10,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "London region (E12000007) disadvantaged avg_p8score."),
    ("London (region) — Their peers","2023/24",0.47,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "London region (E12000007) non-disadvantaged avg_p8score.")],
  "manchester":[
    ("Manchester — Disadvantaged","2023/24",-0.22,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "Manchester LA (E08000003) disadvantaged avg_p8score."),
    ("Manchester — Their peers","2023/24",0.37,"DfE — Key stage 4 performance (2023/24)",
     "https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
     "Manchester LA (E08000003) non-disadvantaged avg_p8score.")],
 },

 # ---- Persistent absence (LA-level) ----------------------------------------
 "absence": {
  "highest":[("Knowsley","2023/24",26.9,"ONS — Explore local statistics (Persistent absence, all pupils)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/persistent-absences-all-pupils?geo=ltla&areas=E08000011&years=2023-08-01",
     "Highest of 153 upper-tier LAs (E08000011), AY2023/24, value 26.93.")],
  "lowest":[("City of London","2023/24",8.4,"ONS — Explore local statistics (Persistent absence, all pupils)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/persistent-absences-all-pupils?geo=ltla&areas=E09000001&years=2023-08-01",
     "Literal minimum LA (E09000001)=8.43. CAVEAT: tiny atypical authority (~1 school); use a more representative runner-up if excluding City of London.")],
  "london":[("London (region)","2023/24",17.9,"ONS — Explore local statistics (Persistent absence, all pupils)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/persistent-absences-all-pupils?geo=rgn&areas=E12000007&years=2023-08-01",
     "London region (E12000007), AY2023/24, value 17.94.")],
  "manchester":[("Manchester","2023/24",20.5,"ONS — Explore local statistics (Persistent absence, all pupils)",
     "https://www.ons.gov.uk/explore-local-statistics/indicators/persistent-absences-all-pupils?geo=ltla&areas=E08000003&years=2023-08-01",
     "Manchester LA (E08000003)=20.48. Bristol 24.79 / England 19.95 in same file, confirming definition.")],
 },

 # ---- Suspension rate (LA-level) -------------------------------------------
 "suspensions": {
  "highest":[("Redcar and Cleveland","2023/24",38.2,"DfE — Suspensions and permanent exclusions in England (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "Highest of 153 LAs (E06000003), education_phase=Total, susp_rate=38.20. File exc_nat_region_la.csv.")],
  "lowest":[("Kingston upon Thames","2023/24",2.13,"DfE — Suspensions and permanent exclusions in England (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "Lowest robust LA (E09000021)=2.13. Literal min is Isles of Scilly 0.0 (degenerate tiny authority) then City of London 0.41; Kingston used as the lowest with a meaningful base. File exc_nat_region_la.csv.")],
  "london":[("London (region)","2023/24",5.65,"DfE — Suspensions and permanent exclusions in England (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "London region, education_phase=Total, susp_rate=5.65. File exc_nat_region_la.csv.")],
  "manchester":[("Manchester","2023/24",12.36,"DfE — Suspensions and permanent exclusions in England (2023/24)",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "Manchester LA (E08000003), susp_rate=12.36. Bristol 14.95 / England 11.31 in same file, confirming definition.")],
 },

 # ---- FSM HE progression by 19 (LA-level) — pinned to 2023/24 --------------
 "he_prog": {
  "highest":[("Westminster","2023/24",61.9,"DfE — Widening participation in higher education (2023/24 cohort)",
     "https://explore-education-statistics.service.gov.uk/data-tables/widening-participation-in-higher-education",
     "Highest FSM progression-to-HE-by-19 of English LAs, fsm_status='Free School Meals'. File FSM.csv, time_period 202324.")],
  "lowest":[("Blackpool","2023/24",11.3,"DfE — Widening participation in higher education (2023/24 cohort)",
     "https://explore-education-statistics.service.gov.uk/data-tables/widening-participation-in-higher-education",
     "Lowest FSM progression of English LAs; next Herefordshire 12.5. File FSM.csv, time_period 202324.")],
  "london":[("London (region)","2023/24",48.3,"DfE — Widening participation in higher education (2023/24 cohort)",
     "https://explore-education-statistics.service.gov.uk/data-tables/widening-participation-in-higher-education",
     "London region (E12000007), fsm_status='Free School Meals'. File FSM.csv, time_period 202324.")],
  "manchester":[("Manchester","2023/24",36.2,"DfE — Widening participation in higher education (2023/24 cohort)",
     "https://explore-education-statistics.service.gov.uk/data-tables/widening-participation-in-higher-education",
     "Manchester LA (E08000003), FSM. England FSM=28.9 pins these to 2023/24. NB the dashboard's Bristol FSM 18.1 is the 2021/22 cohort; Bristol's 2023/24 FSM value in this file is 21.8.")],
 },

 # ---- fsm_uni (Sutton Trust national only) ----------------------------------
 "fsm_uni": {
  "highest":[("N/A — national figure only","2024","","Sutton Trust — Crossing Paths (2026)",
     "https://www.suttontrust.com/wp-content/uploads/2026/06/Crossing-Paths.pdf",
     "By-ethnicity university-entry-by-19 metric (Figure 21, p.51: White British FSM 18% / Black African FSM 62%) is national only; no regional/LA breakdown.")],
  "lowest":[("N/A — national figure only","2024","","Sutton Trust — Crossing Paths (2026)",
     "https://www.suttontrust.com/wp-content/uploads/2026/06/Crossing-Paths.pdf",
     "National only; no regional/LA breakdown of HE-progression-by-19 by ethnicity (Figure 21, p.51).")],
  "london":[("N/A — national figure only","2024","","Sutton Trust — Crossing Paths (2026)",
     "https://www.suttontrust.com/wp-content/uploads/2026/06/Crossing-Paths.pdf",
     "No London value for this metric. (Report's only London HE figure is a different metric — White British FSM degree by 22 = 11%, Figure 22 p.52.)")],
  "manchester":[("N/A — national figure only","2024","","Sutton Trust — Crossing Paths (2026)",
     "https://www.suttontrust.com/wp-content/uploads/2026/06/Crossing-Paths.pdf",
     "No Manchester value; metric is national only (Figure 21, p.51).")],
 },

 # ---- fsm_bristol / Opportunity Index (per-constituency) --------------------
 "fsm_bristol": {
  "highest":[("Stratford and Bow","2025",41,"Sutton Trust — The Opportunity Index (May 2025)",
     "https://www.suttontrust.com/wp-content/uploads/2025/05/The-Opportunity-Index.pdf",
     "Highest-ranked constituency for % of FSM pupils with a degree by 22. p.14 + Table 2: Stratford and Bow (London) = 41% vs Bristol North West 3%.")],
  "lowest":[("Bristol North West","2025",3,"Sutton Trust — The Opportunity Index (May 2025)",
     "https://www.suttontrust.com/wp-content/uploads/2025/05/The-Opportunity-Index.pdf",
     "Lowest-ranked constituency for degree by 22 (p.14) = 3%. (Bristol South is 538th of 543 on the composite index, 4% degree-by-22.)")],
  "london":[("London (region)","2025",27,"Sutton Trust — The Opportunity Index (May 2025)",
     "https://www.suttontrust.com/wp-content/uploads/2025/05/The-Opportunity-Index.pdf",
     "London regional average for FSM pupils with a degree by 22 = 27% (p.14 + Figure 5). London non-FSM = 39%.")],
  "manchester":[("N/A — not published","2025","","Sutton Trust — The Opportunity Index (May 2025)",
     "https://www.suttontrust.com/wp-content/uploads/2025/05/The-Opportunity-Index.pdf",
     "No Manchester constituency/LA figure published; report gives only region-level (North West FSM = 13%, Figure 5) plus top-20/bottom-20 constituency tables (none Manchester).")],
 },

 # ---- NEET 16-17 (LA-level) -------------------------------------------------
 "neet": {
  "highest":[("Derby","2024/25",7.6,"DfE — Participation & NEET age 16-17 by local authority (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25",
     "Highest NEET of English LAs, Age=16-17 Total, NEETprop=7.62%. Blackpool virtually tied at 7.62%.")],
  "lowest":[("Barnet","2024/25",0.6,"DfE — Participation & NEET age 16-17 by local authority (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25",
     "Lowest NEET of English LAs, NEETprop=0.65%; next Rutland 0.67%.")],
  "london":[("London (region)","2024/25",1.9,"DfE — Participation & NEET age 16-17 by local authority (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25",
     "Regional row published: geographic_level=Regional, region_code E12000007, NEETprop=1.9%.")],
  "manchester":[("Manchester","2024/25",5.3,"DfE — Participation & NEET age 16-17 by local authority (2024/25)",
     "https://explore-education-statistics.service.gov.uk/data-tables/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25",
     "Manchester LA (E08000003), NEETprop=5.26%. England National NEETprop=3.4% confirmed.")],
 },

 # ---- excl_gcse (Timpson Review national only) ------------------------------
 "excl_gcse": {
  "highest":[("N/A — national figure only","2019","","DfE — Timpson Review of School Exclusion (2019)",
     "https://www.gov.uk/government/publications/school-exclusions-review-report",
     "National figure only (7% of permanently excluded pupils achieve good GCSEs in E&M, p.8). No sub-national/LA breakdown of this outcome published.")],
  "lowest":[("N/A — national figure only","2019","","DfE — Timpson Review of School Exclusion (2019)",
     "https://www.gov.uk/government/publications/school-exclusions-review-report",
     "National only (7%, p.8); no LA/region breakdown of this outcome.")],
  "london":[("N/A — national figure only","2019","","DfE — Timpson Review of School Exclusion (2019)",
     "https://www.gov.uk/government/publications/school-exclusions-review-report",
     "National only (7%, p.8); no London breakdown.")],
  "manchester":[("N/A — national figure only","2019","","DfE — Timpson Review of School Exclusion (2019)",
     "https://www.gov.uk/government/publications/school-exclusions-review-report",
     "National only (7%, p.8); no Manchester breakdown.")],
 },

 # ---- quals L4+ (Census 2021, LA-level) -------------------------------------
 "quals_l4": {
  "highest":[("City of London","2021",74.2,"ONS/Nomis — Census 2021 TS067 (Level 4+)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Max across English LAs (E09000001). Tiny-population outlier; next standard LA Wandsworth (E09000032) 62.6%. Nomis NM_2084_1 c2021_hiqual_8=6, measures=percent.")],
  "lowest":[("Great Yarmouth","2021",18.2,"ONS/Nomis — Census 2021 TS067 (Level 4+)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Min across English LAs (E07000145)=18.2; next Castle Point 18.5, Boston/Fenland 19.0.")],
  "london":[("London (region)","2021",46.7,"ONS/Nomis — Census 2021 TS067 (Level 4+)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "London region (E12000007)=46.7.")],
  "manchester":[("Manchester","2021",37.6,"ONS/Nomis — Census 2021 TS067 (Level 4+)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Manchester LA (E08000003)=37.6. Bristol cross-check same query=42.1, matches.")],
 },

 # ---- quals none (Census 2021, LA-level) ------------------------------------
 "quals_none": {
  "highest":[("Sandwell","2021",28.9,"ONS/Nomis — Census 2021 TS067 (No qualifications)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Max across English LAs (E08000028)=28.9; next Boston 27.6, Leicester 26.7.")],
  "lowest":[("City of London","2021",6.6,"ONS/Nomis — Census 2021 TS067 (No qualifications)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Min across English LAs (E09000001)=6.6, tiny-population outlier; next standard LA Richmond upon Thames (E09000027) 9.1%.")],
  "london":[("London (region)","2021",16.2,"ONS/Nomis — Census 2021 TS067 (No qualifications)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "London region (E12000007)=16.2.")],
  "manchester":[("Manchester","2021",19.7,"ONS/Nomis — Census 2021 TS067 (No qualifications)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Manchester LA (E08000003)=19.7. Bristol cross-check=14.5, matches.")],
 },

 # ---- degree by ward (Census 2021 TS067, ward granularity) ------------------
 "degree_ward": {
  "highest":[("Belsize — Camden","2021",75.5,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Highest of 6,874 England wards (E05013652). Tied with Hampstead Town, Camden (E05013654) 75.5. Nomis NM_2084_1, geography TYPE153 (2022 wards).")],
  "lowest":[("Ingoldmells — East Lindsey","2021",11.3,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Lowest of 6,874 England wards (E05009886)=11.3.")],
  "london":[
    ("Belsize — Camden","2021",75.5,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Highest of 679 Greater London wards (E05013652)=75.5 (also the national high)."),
    ("Southall West — Ealing","2021",24.1,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Lowest of 679 Greater London wards (E05013539)=24.1.")],
  "manchester":[
    ("Didsbury West — Manchester","2021",71.0,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Highest of 32 Manchester City wards (E05011363)=71.0."),
    ("Woodhouse Park — Manchester","2021",21.8,"ONS/Nomis — Census 2021 TS067 (ward level)",
     "https://www.nomisweb.co.uk/datasets/c2021ts067",
     "Lowest of 32 Manchester City wards (E05011381)=21.8.")],
 },

 # ---- children in relative low income by ward (DWP, FYE2024) -----------------
 "child_pov_ward": {
  "highest":[("Newport — Middlesbrough","FYE 2024",85.2,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Highest of 6,871 England wards. Sheet 7_Relative_Ward, FYE2024 (E05009866)=85.2%.")],
  "lowest":[("Walton Manor — Oxford","FYE 2024",0.9,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Lowest England ward. Sheet 7_Relative_Ward, FYE2024 (E05013118)=0.9%.")],
  "london":[
    ("Bloomsbury — Camden","FYE 2024",45.2,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Highest of 678 Greater London wards (E05013653)=45.2%."),
    ("Northcote — Wandsworth","FYE 2024",1.8,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Lowest of 678 Greater London wards (E05014016)=1.8%.")],
  "manchester":[
    ("Levenshulme — Manchester","FYE 2024",59.0,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Highest of 32 Manchester City wards (E05011369)=59.0%."),
    ("Didsbury West — Manchester","FYE 2024",6.8,"DWP — Children in low income families, local area statistics 2014-2024",
     "https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
     "Lowest of 32 Manchester City wards (E05011363)=6.8%.")],
 },

 # ---- overcrowded households (Census 2021 TS052, LA-level) -------------------
 "ee_overcrowd": {
  "highest":[("Newham","2021",21.53,"ONS/Nomis — Census 2021 TS052 Overcrowding",
     "https://www.nomisweb.co.uk/datasets/c2021ts052",
     "Max across English LAs (E09000025). Overcrowded = occupancy rating -1 or less as % of households; next Barking and Dagenham 17.78.")],
  "lowest":[("North Kesteven","2021",0.93,"ONS/Nomis — Census 2021 TS052 Overcrowding",
     "https://www.nomisweb.co.uk/datasets/c2021ts052",
     "Min across English LAs (E07000139)=0.93%; near-tie with Rushcliffe (E07000176) also ~0.93%.")],
  "london":[("London (region)","2021",11.09,"ONS/Nomis — Census 2021 TS052 Overcrowding",
     "https://www.nomisweb.co.uk/datasets/c2021ts052",
     "London region (E12000007)=11.09%.")],
  "manchester":[("Manchester","2021",7.89,"ONS/Nomis — Census 2021 TS052 Overcrowding",
     "https://www.nomisweb.co.uk/datasets/c2021ts052",
     "Manchester LA (E08000003)=7.89%. Bristol cross-check same method=5.05%, matches.")],
 },

 # ---- households deprived 3-4 dims (Census 2021 TS011, LA-level) -------------
 "ee_deprived": {
  "highest":[("Knowsley","2021",7.66,"ONS/Nomis — Census 2021 TS011 household deprivation",
     "https://www.nomisweb.co.uk/datasets/c2021ts011",
     "Max across English LAs (E08000011). Deprived in 3+4 dimensions as % of households; next Liverpool 7.26.")],
  "lowest":[("Rutland","2021",1.23,"ONS/Nomis — Census 2021 TS011 household deprivation",
     "https://www.nomisweb.co.uk/datasets/c2021ts011",
     "Min across English LAs (E06000017)=1.23%; next Hart 1.37, Wokingham 1.39.")],
  "london":[("London (region)","2021",4.64,"ONS/Nomis — Census 2021 TS011 household deprivation",
     "https://www.nomisweb.co.uk/datasets/c2021ts011",
     "London region (E12000007)=4.64%.")],
  "manchester":[("Manchester","2021",6.40,"ONS/Nomis — Census 2021 TS011 household deprivation",
     "https://www.nomisweb.co.uk/datasets/c2021ts011",
     "Manchester LA (E08000003)=6.40%. Bristol cross-check same method=4.23%, matches.")],
 },

 # ---- TUNDRA young HE participation (MSOA granularity) ----------------------
 "he_part": {
  "highest":[("Harpenden Town (E02004926) — St Albans","2021",84.8,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Highest of 6,763 unsuppressed England MSOAs. Sheet 'MSOA Quintile', progression rate; MSOA E02004926=84.8%.")],
  "lowest":[("Hartcliffe (E02003064) — Bristol","2021",8.7,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Lowest England MSOA nationally (E02003064)=8.7% — this is Bristol's own MSOA, matching the dashboard's Hartcliffe 8.7.")],
  "london":[
    ("Pitshanger (E02000250) — Ealing","2021",79.2,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Highest of 967 Greater London MSOAs (E02000250)=79.2%."),
    ("Havering-atte-Bower & Chase Cross (E02000466) — Havering","2021",25.9,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Lowest of 967 Greater London MSOAs (E02000466)=25.9%.")],
  "manchester":[
    ("Chorlton South (E02001077) — Manchester","2021",69.9,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Highest of 54 Manchester City MSOAs (E02001077)=69.9%."),
    ("Benchill North & Sharston (E02001093) — Manchester","2021",22.9,"Office for Students — TUNDRA young participation (MSOA)",
     "https://www.officeforstudents.org.uk/media/5534/msoalsoa_1216.xlsx",
     "Lowest of 54 Manchester City MSOAs (E02001093)=22.9%.")],
 },

 # ---- ward suspensions (Bristol-only; no comparator data) -------------------
 "suspensions_ward": {
  "highest":[("N/A — not published","2023/24","","DfE — Suspensions and permanent exclusions in England",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "No ward-level suspension data published outside Bristol; DfE publishes suspensions at LA and school level only. National ward extreme cannot be derived.")],
  "lowest":[("N/A — not published","2023/24","","DfE — Suspensions and permanent exclusions in England",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "No ward-level suspension data published outside Bristol; LA/school level only.")],
  "london":[("N/A — not published","2023/24","","London Datastore / DfE",
     "https://data.london.gov.uk/dataset/permanent-exclusions-school-borough",
     "No ward-level suspension data published for London; Datastore holds exclusions at borough level only.")],
  "manchester":[("N/A — not published","2023/24","","DfE — Suspensions and permanent exclusions in England",
     "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england/2023-24",
     "No ward-level suspension data for Manchester; LA/school level only. Bristol's ward figures derive from pupil-residence data unique to Open Data Bristol.")],
 },
}

GROUPS = ["highest","lowest","london","manchester"]
COLS = ["indicator","indicator_label","area","year","value","unit","source","source_url","notes"]

def main():
    for group in GROUPS:
        rows = []
        for iid in ORDER:
            label, unit = META[iid]
            for (area, year, value, source, url, note) in DATA[iid][group]:
                rows.append([iid, label, area, year, value, unit, source, url, note])
        fname = f"{group}.csv"
        with open(fname, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f); w.writerow(COLS); w.writerows(rows)
        n_blank = sum(1 for r in rows if r[4] == "")
        print(f"wrote {fname}: {len(rows)} rows ({n_blank} blank/N-A)")

if __name__ == "__main__":
    main()
