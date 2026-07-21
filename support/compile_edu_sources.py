#!/usr/bin/env python3
# =============================================================================
# compile_edu_sources.py
# -----------------------------------------------------------------------------
# Builds bristol_education_sources.csv — every indicator shown on
# Bristol-Deprivation-Education.html (from bristol-data-ons-census.js), using
# the SAME column headings as bristol_trends.csv:
#
#   indicator, indicator_label, area, year, value, unit, source, source_url, notes
#
# source_url is a DEEP link where the value is visible (verified by research
# agents). LINKS below is filled from that research; SPEC holds the values that
# are shown on the page (from the .js data file).
# =============================================================================
import csv

# indicator id -> (deep source_url, source label, note-about-the-link)
# Filled from verified agent research. "" = fall back to the release page.
LINKS = {
    # ---- Direct "value shows on load" links -------------------------------
    "ks2_rwm":    ("https://www.ons.gov.uk/explore-local-statistics/indicators/pupils-at-expected-standards-end-primary-school?geo=ltla&areas=E06000023",
                   "ONS — Explore local statistics (KS2 RWM expected standard)",
                   "DfE revised 2024/25 KS2 (Attainment by region and LA): Bristol 59%, England 63%."),
    "absence":    ("https://www.ons.gov.uk/explore-local-statistics/indicators/persistent-absences-all-pupils?geo=ltla&areas=E06000023&years=2023-08-01",
                   "ONS — Explore local statistics (Persistent absence, all pupils)",
                   "Bristol preselected, pinned to 2023/24; value shows on load (24.8%). Drop the years param for latest."),
    "quals_l4":   ("https://www.ons.gov.uk/census/maps/choropleth/education/highest-level-of-qualification/highest-qualification-6a/highest-level-of-qualification-level-4-qualifications-or-above?lad=E06000023",
                   "ONS — Census 2021 maps · TS067 Level 4+ qualifications",
                   "Bristol preselected (lad=E06000023); value in the left info panel (42.1%)."),
    "quals_none": ("https://www.ons.gov.uk/census/maps/choropleth/education/highest-level-of-qualification/highest-qualification-6a/no-qualifications?lad=E06000023",
                   "ONS — Census 2021 maps · TS067 No qualifications",
                   "Bristol preselected; value in the left info panel (14.5%)."),
    "ee_overcrowd":("https://www.ons.gov.uk/census/maps/choropleth/housing/occupancy-rating-for-bedrooms/occupancy-rating-bedrooms-6a/occupancy-rating-of-bedrooms-minus-1-or-less?lad=E06000023",
                   "ONS — Census 2021 maps · TS052 Overcrowding",
                   "Bristol preselected; '-1 or less' = overcrowded; value in the left info panel (5.05%)."),
    "early_access":("https://www.suttontrust.com/wp-content/uploads/2024/01/Inequality-in-early-years-education.pdf",
                   "Sutton Trust — Inequality in early years education (Jan 2024)",
                   "Value on page 1 key findings (1 in 5 / 20% vs 4 in 5 / 80%)."),

    # ---- Best source page + exact filter to reach the Bristol value -------
    "eyfsp_gld":  ("https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2024-25",
                   "DfE — Early years foundation stage profile results (2024/25)",
                   "Table tool: Local authority = Bristol, City of > 'Good level of development' (all pupils) = 68.7%."),
    "eyfsp_gap":  ("https://explore-education-statistics.service.gov.uk/data-tables/early-years-foundation-stage-profile-results/2023-24",
                   "DfE — Early years foundation stage profile results (2023/24)",
                   "Table tool: LA = Bristol, City of > breakdown by FSM/disadvantage > GLD (49.9% FSM vs 74.5% peers)."),
    "phonics":    ("https://explore-education-statistics.service.gov.uk/data-tables/phonics-screening-check-attainment/2023-24",
                   "DfE — Phonics screening check attainment (2023/24)",
                   "Table tool: LA = Bristol, City of > Year 1 meeting expected standard = 77%."),
    "ks2_gap":    ("https://explore-education-statistics.service.gov.uk/data-tables/key-stage-2-attainment/2024-25",
                   "DfE — Key stage 2 attainment (2024/25)",
                   "Table tool: LA = Bristol, City of > RWM expected standard by disadvantage (40% disadvantaged vs 68% peers; 2024/25 provisional)."),
    "prim_oo":    ("https://www.gov.uk/government/statistics/state-funded-schools-inspections-and-outcomes-as-at-31-august-2024",
                   "Ofsted — State-funded schools inspections and outcomes (as at 31 Aug 2024)",
                   "Open the charts/tables spreadsheet (Table 5c, as at 31 Aug 2024) > local-authority table > 'Bristol, City of' > primary % good or outstanding = 86.4%; England = 91.6%."),
    "attainment8":("https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
                   "DfE — Key stage 4 performance (2024/25)",
                   "Table tool: LA = Bristol, City of > 'Average Attainment 8 score per pupil' = 46.4."),
    "gcse5_em":   ("https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2024-25",
                   "DfE — Key stage 4 performance (2024/25)",
                   "Table tool: LA = Bristol, City of > grade 5+ English & maths by disadvantage (23.2% disadvantaged vs 57.1% peers)."),
    "progress8":  ("https://explore-education-statistics.service.gov.uk/data-tables/key-stage-4-performance/2023-24",
                   "DfE — Key stage 4 performance (2023/24)",
                   "Table tool: LA = Bristol, City of > Progress 8 by disadvantage (-0.59 disadvantaged vs 0.26 peers)."),
    "suspensions":("https://explore-education-statistics.service.gov.uk/data-tables/suspensions-and-permanent-exclusions-in-england/2023-24",
                   "DfE — Suspensions and permanent exclusions in England (2023/24)",
                   "Table tool: LA = Bristol, City of > 'Suspension rate' (per 100 pupils) = 14.95."),
    "he_prog":    ("https://explore-education-statistics.service.gov.uk/data-tables/widening-participation-in-higher-education",
                   "DfE — Widening participation in higher education (2023/24 cohort)",
                   "Table tool: LA = Bristol, City of > FSM-eligible > HE progression by age 19 = 21.8% (2023/24 cohort; earlier 18.1% was the 2021/22 cohort)."),
    "neet":       ("https://explore-education-statistics.service.gov.uk/data-tables/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25",
                   "DfE — Participation & NEET age 16-17 by local authority (2024/25)",
                   "Table tool: LA = Bristol, City of > NEET (16-17) = 6.0%."),
    "degree_ward":("https://www.nomisweb.co.uk/datasets/c2021ts067",
                   "ONS/Nomis — Census 2021 TS067 (ward level)",
                   "Query data > geography = 2021 electoral wards in Bristol > Level 4+ (Hartcliffe & Withywood 15.8%, Redland 67%). Census Maps has no ward geography."),
    "ee_deprived":("https://www.nomisweb.co.uk/datasets/c2021ts011",
                   "ONS/Nomis — Census 2021 TS011 household deprivation",
                   "Query data > Bristol + England > sum 'deprived in 3 dimensions' + '4 dimensions' = 4.23% (Census Maps shows one dimension-count at a time)."),
    "child_pov_ward":("https://assets.publishing.service.gov.uk/media/67dc2c58c5528de3aa6711f9/children-in-low-income-families-local-area-statistics-2014-to-2024.ods",
                   "DWP — Children in low income families, local area statistics 2014-2024",
                   "Open the ODS > ward-level Relative (before housing costs) sheet, FYE2024 > Lawrence Hill 54.2%, Redland 3.1%."),
    "fsm_uni":    ("https://www.suttontrust.com/wp-content/uploads/2026/06/Crossing-Paths.pdf",
                   "Sutton Trust — Crossing Paths (2026)",
                   "PDF page 51, Figure 21: White British FSM 18%, Black African FSM 62% (national)."),
    "fsm_bristol":("https://www.suttontrust.com/wp-content/uploads/2025/05/The-Opportunity-Index.pdf",
                   "Sutton Trust — The Opportunity Index (May 2025)",
                   "PDF page 14: Bristol North West 3% (lowest); Table 2 (p6): Bristol South 538th of 543. NB Index measures all FSM pupils, not White-FSM only."),
    "he_part":    ("https://www.officeforstudents.org.uk/data-and-analysis/young-participation-by-area/maps-of-participation-in-higher-education/",
                   "Office for Students — TUNDRA young participation (maps)",
                   "Interactive map (TUNDRA MSOA): zoom to Bristol and hover an MSOA; or download msoalsoa_1216.xlsx. Areas are MSOA codes, not ward names."),
    "suspensions_ward":("https://opendata.bristol.gov.uk/datasets/bcc::school-suspensions-in-bristol-by-ward",
                   "Open Data Bristol — School suspensions by ward",
                   "Dataset table (renders after load): ward + period > per-1,000 rate (Hartcliffe & Withywood 110.8, Filwood 101.7)."),
    "excl_gcse":  ("https://www.gov.uk/government/publications/school-exclusions-review-report",
                   "DfE — Timpson Review of School Exclusion (2019)",
                   "National figure from the Timpson Review: 7% of permanently excluded pupils achieve good GCSEs in English & maths."),
}

# id -> (indicator_label, unit, year, [ (area, value), ... ], measure_note)
SPEC = [
 ("eyfsp_gld",   "EYFSP Good Level of Development at reception", "%", "2024/25",
   [("Bristol",68.7),("England",68.3)], "% of children achieving a Good Level of Development (all pupils)."),
 ("eyfsp_gap",   "EYFSP GLD by disadvantage (Bristol)", "%", "2023/24",
   [("Disadvantaged (FSM)",49.9),("Their peers",74.5)], "GLD split by disadvantage in Bristol."),
 ("early_access","Low-income families reaching funded early education", "%", "2024",
   [("Under £20k income",20),("Over £45k income",80)], "Sutton Trust: 1 in 5 vs 4 in 5 (national)."),
 ("phonics",     "Year 1 phonics meeting the expected standard", "%", "2023/24",
   [("Bristol",77),("England",80)], "% meeting the expected standard in the Year 1 phonics check."),
 ("ks2_rwm",     "KS2 reading, writing & maths (expected standard)", "%", "2024/25",
   [("Bristol",59),("England",63)], "% meeting the expected standard in RWM combined."),
 ("ks2_gap",     "KS2 RWM by disadvantage (Bristol)", "%", "2024/25",
   [("Disadvantaged",40),("Their peers",68)], "KS2 RWM split by disadvantage in Bristol."),
 ("prim_oo",     "Primary schools rated good or outstanding", "%", "2023/24",
   [("Bristol",86.4),("England",91.6)], "Ofsted 'good or outstanding' primary schools."),
 ("attainment8", "GCSE Average Attainment 8 score", "score", "2024/25",
   [("Bristol",46.4),("England",46.0)], "Average Attainment 8 score per pupil."),
 ("gcse5_em",    "Grade 5+ in English & maths by disadvantage (Bristol)", "%", "2024/25",
   [("Disadvantaged",23.2),("Their peers",57.1)], "Grade 5+ in English & maths, split by disadvantage."),
 ("progress8",   "GCSE Progress 8 by disadvantage (Bristol)", "score", "2023/24",
   [("Disadvantaged",-0.59),("Their peers",0.26)], "Average Progress 8 score, split by disadvantage."),
 ("absence",     "Persistent absence (10%+ of sessions)", "%", "2023/24",
   [("Bristol",24.7),("England",20.0)], "% of pupils missing 10%+ of sessions."),
 ("suspensions", "Suspension rate (per 100 pupils)", "per 100 pupils", "2023/24",
   [("Bristol",14.95),("England",11.31)], "Suspensions as a rate per 100 pupils."),
 ("he_prog",     "FSM pupils progressing to HE by 19", "%", "2023/24",
   [("Bristol FSM",21.8),("England FSM",28.9)], "Progression to higher education by 19, FSM pupils."),
 ("fsm_uni",     "FSM pupils entering university by 19, by ethnicity", "%", "2024",
   [("White British FSM",18),("Black African FSM",62)], "Sutton Trust 'Crossing Paths' (national)."),
 ("fsm_bristol", "White FSM holding a degree by 22", "%", "2025",
   [("Bristol North West",3),("Highest area",41)], "Sutton Trust Opportunity Index; Bristol South ranks 538th of 543."),
 ("neet",        "NEET at 16-17", "%", "2024/25",
   [("Bristol",6.0),("England",3.4)], "% not in education, employment or training at 16-17."),
 ("excl_gcse",   "Good GCSEs after permanent exclusion", "%", "2019",
   [("Excluded pupils",7),("All pupils",46)], "Timpson Review (national)."),
 ("quals_l4",    "Adults with Level 4+ qualifications", "%", "2021",
   [("Bristol",42.1),("England",33.9)], "Census 2021 TS067 Level 4+."),
 ("quals_none",  "Adults with no qualifications", "%", "2021",
   [("Bristol",14.5),("England",18.1)], "Census 2021 TS067 no qualifications."),
 ("degree_ward", "Degree-qualified adults, by ward", "%", "2021",
   [("Redland",67),("Clifton",64),("Filwood",17),("Hartcliffe & Withywood",15.8)], "Census 2021 TS067 Level 4+ by ward."),
 ("child_pov_ward","Children in relative low income, by ward", "%", "FYE 2024",
   [("Lawrence Hill",54.2),("Central",47.8),("Hartcliffe & Withywood",39.3),("Redland",3.1)], "DWP relative low income by ward."),
 ("ee_overcrowd","Overcrowded households", "%", "2021",
   [("Bristol",5.05),("England",4.37)], "Census 2021 TS052 occupancy rating -1 or less."),
 ("ee_deprived", "Households deprived in 3-4 dimensions", "%", "2021",
   [("Bristol",4.23),("England",3.94)], "Census 2021 TS011."),
 ("he_part",     "Young people entering HE (TUNDRA), by ward", "%", "2023",
   [("Westbury Park",77.6),("Redland",72.4),("Highridge",11.6),("Hartcliffe",8.7)], "OfS TUNDRA young participation."),
 ("suspensions_ward","Pupils suspended per 1,000, by ward", "per 1,000", "2023/24",
   [("Hartcliffe & Withywood",110.8),("Filwood",101.7),("Lawrence Hill",97.2)], "Open Data Bristol."),
]

def main():
    cols = ["indicator","indicator_label","area","year","value","unit","source","source_url","notes"]
    rows = []
    for iid, label, unit, year, parties, measure in SPEC:
        url, src, link_note = LINKS.get(iid, ("", "", ""))
        note = measure + ((" Link: " + link_note) if link_note else "")
        for area, val in parties:
            rows.append([iid, label, area, year, val, unit, src, url, note])
    with open("bristol_education_sources.csv","w",newline="",encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(cols); w.writerows(rows)
    missing = sorted({r[0] for r in rows if not r[7]})
    print(f"wrote bristol_education_sources.csv: {len(rows)} rows, {len(SPEC)} indicators")
    if missing:
        print(f"  ! {len(missing)} indicators still need a verified source_url: {', '.join(missing)}")

if __name__ == "__main__":
    main()
