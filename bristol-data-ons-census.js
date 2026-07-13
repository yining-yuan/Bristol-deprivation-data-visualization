/* =============================================================================
   bristol-data-ons-census.js
   ONS + CENSUS 2021 ONLY  —  data backbone for "Bristol Deprivation ONS-Census.html"
   -----------------------------------------------------------------------------
   This is a filtered + expanded copy of bristol-data.js. It keeps ONLY indicators
   whose data comes from:
       • the Office for National Statistics (ONS) — incl. "Explore local statistics",
         national life tables, and small-area life expectancy; and
       • the Census 2021 (run by ONS; accessed via ONS datasets / Nomis).

   Every value below was checked against a published ONS or Census 2021 source
   (July 2026). Where a figure is not yet pinned to a confirmed number, v:null is
   used — the page then shows "—" and still links to the live source so the exact
   figure can be read at the smallest geography that source publishes.

       v  value      unit  how to display        src   key into SOURCES
       a  local (Bristol / deprived ward)         b     benchmark (England / better ward)
       asOf when published/checked   about  plain-English explainer (hover)
============================================================================= */
(function () {

  var SOURCES = {
    // ---- ONS ----
    ons:      { name: "ONS — Explore local statistics (Bristol)", url: "https://www.ons.gov.uk/explore-local-statistics/areas/E06000023-bristol-city-of", g: "LA" },
    ons_le:   { name: "ONS — Life expectancy for local areas of the UK", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/lifeexpectancyforlocalareasoftheuk/between2001to2003and2021to2023", g: "Ward" },
    ons_nlt:  { name: "ONS — National life tables, England (2021–2023)", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/bulletins/nationallifetablesunitedkingdom/2021to2023", g: "National" },
    ons_hle:  { name: "ONS — Health state life expectancies, UK", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/healthstatelifeexpectanciesuk/between2011to2013and2021to2023", g: "LA" },
    ons_clif: { name: "ONS · DWP — Children in low income families, local area", url: "https://www.gov.uk/government/statistics/children-in-low-income-families-local-area-statistics-2022-to-2025/children-in-low-income-families-local-area-statistics-financial-year-ending-2025", g: "Ward" },

    // ---- Sutton Trust ----
    sutton:   { name: "Sutton Trust — research & the Opportunity Index", url: "https://www.suttontrust.com/our-research/", g: "National" },

    // ---- Education (DfE — Explore Education Statistics, & Open Data Bristol) ----
    dfe:       { name: "DfE — Explore education statistics", url: "https://explore-education-statistics.service.gov.uk/", g: "LA" },
    dfe_eyfsp: { name: "DfE — Early years foundation stage profile (2024/25)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/early-years-foundation-stage-profile-results/2024-25", g: "LA" },
    dfe_phon:  { name: "DfE — Phonics screening check", url: "https://explore-education-statistics.service.gov.uk/find-statistics/phonics-screening-check-and-key-stage-1-assessments", g: "LA" },
    dfe_ks2:   { name: "DfE — Key stage 2 attainment (2024/25 revised)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25-revised", g: "LA" },
    dfe_ks4:   { name: "DfE — Key stage 4 performance (2024/25)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance/2024-25", g: "LA" },
    dfe_abs:   { name: "DfE — Pupil absence in schools (2023/24)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/pupil-absence-in-schools-in-england/2023-24", g: "LA" },
    dfe_excl:  { name: "DfE — Suspensions & permanent exclusions", url: "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england", g: "LA" },
    dfe_dest:  { name: "DfE — Level 2 & 3 attainment by age 19 / 16–18 destinations", url: "https://explore-education-statistics.service.gov.uk/find-statistics/level-2-and-3-attainment-age-16-to-25", g: "LA" },
    dfe_wp:    { name: "DfE — Widening participation in higher education (2023/24)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/widening-participation-in-higher-education/2023-24", g: "LA" },
    dfe_neet:  { name: "DfE — Participation & NEET, age 16–17, by local authority (2024/25)", url: "https://explore-education-statistics.service.gov.uk/find-statistics/participation-in-education-training-and-neet-age-16-to-17-by-local-authority/2024-25", g: "Ward" },
    ofs:       { name: "Office for Students — Young participation by area (TUNDRA)", url: "https://www.officeforstudents.org.uk/data-and-analysis/young-participation-by-area/", g: "MSOA" },
    odb_edu:   { name: "Open Data Bristol — attainment & exclusions by ward", url: "https://opendata.bristol.gov.uk/explore/dataset/progress-8-and-attainment-8-scores-in-bristol/", g: "Ward" },

    // ---- Census 2021 (ONS) — headline area comparison ----
    census:   { name: "Census 2021 (ONS)", url: "https://www.ons.gov.uk/visualisations/censusareachanges/E06000023/", g: "LA" },

    // ---- Census 2021 topic tables (Nomis) — read down to LSOA / ward ----
    ts067: { name: "Census 2021 · TS067 Highest qualification (Nomis)", url: "https://www.nomisweb.co.uk/datasets/c2021ts067", g: "LSOA" },
    ts011: { name: "Census 2021 · TS011 Household deprivation (Nomis)",  url: "https://www.nomisweb.co.uk/datasets/c2021ts011", g: "LSOA" },
    ts037: { name: "Census 2021 · TS037 General health (Nomis)",         url: "https://www.nomisweb.co.uk/datasets/c2021ts037", g: "LSOA" },
    ts038: { name: "Census 2021 · TS038 Disability (Nomis)",             url: "https://www.nomisweb.co.uk/datasets/c2021ts038", g: "LSOA" },
    ts039: { name: "Census 2021 · TS039 Unpaid care (Nomis)",            url: "https://www.nomisweb.co.uk/datasets/c2021ts039", g: "LSOA" },
    ts045: { name: "Census 2021 · TS045 Car or van availability (Nomis)",url: "https://www.nomisweb.co.uk/datasets/c2021ts045", g: "LSOA" },
    ts052: { name: "Census 2021 · TS052 Occupancy / overcrowding (Nomis)",url:"https://www.nomisweb.co.uk/datasets/c2021ts052", g: "LSOA" },
    ts054: { name: "Census 2021 · TS054 Tenure (Nomis)",                 url: "https://www.nomisweb.co.uk/datasets/c2021ts054", g: "LSOA" },
    ts066: { name: "Census 2021 · TS066 Economic activity (Nomis)",      url: "https://www.nomisweb.co.uk/datasets/c2021ts066", g: "LSOA" },
    ts062: { name: "Census 2021 · TS062 NS-SeC occupational class (Nomis)", url: "https://www.nomisweb.co.uk/datasets/c2021ts062", g: "LSOA" },
    ts003: { name: "Census 2021 · TS003 Household composition (Nomis)",   url: "https://www.nomisweb.co.uk/datasets/c2021ts003", g: "LSOA" },
    ts046: { name: "Census 2021 · TS046 Central heating (Nomis)",         url: "https://www.nomisweb.co.uk/datasets/c2021ts046", g: "LSOA" },
    ts007: { name: "Census 2021 · TS007 Age / median age (Nomis)",       url: "https://www.nomisweb.co.uk/datasets/c2021ts007a", g: "LSOA" }
  };

  // ---- headline figures used in the narrative -------------------------------
  var FIGURES = {
    // Hero
    heroAge:      { v: 32.4, unit: "",     src: "census",  asOf: "2021",    about: "Bristol's median age (Census 2021) — one of England's youngest big cities; the England median is 40.4." },
    heroLeGap:    { v: 11.9, unit: " yrs", src: "ons_le",  asOf: "2021-23", about: "Gap in male life expectancy between Bristol's lowest ward (Lawrence Hill, 71.6) and highest (Westbury & Henleaze, 83.5)." },
    heroChildPov: { v: 54.2, unit: "%",    src: "ons_clif",asOf: "FYE 2024",about: "Children in relative low-income families in Lawrence Hill — the highest ward in the city (Redland is 3.1%)." },

    // Two cities (Census 2021 — qualifications by ward)
    degRedland:   { v: 67,   unit: "%",    src: "ts067",   asOf: "2021",    about: "Adults with a Level 4+ (degree-level) qualification in Redland — the highest-qualified ward." },
    degHW:        { v: 15.8, unit: "%",    src: "ts067",   asOf: "2021",    about: "Adults with a Level 4+ qualification in Hartcliffe & Withywood — the lowest in the city." },
    povHigh:      { v: 54.2, unit: "%",    src: "ons_clif",asOf: "FYE 2024",about: "Children in relative low income, Lawrence Hill ward." },
    povLow:       { v: 3.1,  unit: "%",    src: "ons_clif",asOf: "FYE 2024",about: "Children in relative low income, Redland ward — the lowest." },

    // City-wide Census context
    qualL4:       { v: 42.1, unit: "%",    src: "ts067",   asOf: "2021",    about: "Bristol adults (16+) with Level 4+ qualifications — above the England figure of 33.9%, and the highest of the English core cities." },
    healthIndex:  { v: 91.4, unit: "",     src: "ons",     asOf: "2021",    about: "ONS Health Index for Bristol (England = 100.8) — a composite of health outcomes, risk factors and the wider determinants of health. Lower is worse." },
    deprived34:   { v: 4.23, unit: "%",    src: "ts011",   asOf: "2021",    about: "Bristol households deprived in three or four of the Census deprivation dimensions (England 3.94%)." },
    socialRent:   { v: 18.7, unit: "%",    src: "ts054",   asOf: "2021",    about: "Bristol households in social rented housing (England 17.1%)." },
    gdhi:         { v: 24696,unit: "",     src: "ons",     asOf: "2023",    about: "Gross disposable household income per head in Bristol (England £25,425) — the money households have to spend or save." },

    // Life expectancy detail (ONS)
    leCityM:      { v: 78.14,unit: "",     src: "ons_le",  asOf: "2021-23", about: "Bristol male life expectancy at birth (England 79.11)." },
    leCityF:      { v: 82.69,unit: "",     src: "ons_le",  asOf: "2021-23", about: "Bristol female life expectancy at birth (England 83.05)." },
    leMaleLow:    { v: 71.6, unit: "",     src: "ons_le",  asOf: "2021-23", about: "Male life expectancy at birth, Lawrence Hill — the lowest ward in Bristol." },
    leMaleHigh:   { v: 83.5, unit: "",     src: "ons_le",  asOf: "2021-23", about: "Male life expectancy at birth, Westbury-on-Trym & Henleaze — the highest." },
    leEngM:       { v: 79.11,unit: "",     src: "ons_nlt", asOf: "2021-23", about: "England male life expectancy at birth." },
    hleF:         { v: 60.1, unit: " yrs", src: "ons_hle", asOf: "2022-24", about: "Female healthy life expectancy in Bristol (England 61.3) — years lived in good health." }
  };

  // ---- charts (data-driven) --------------------------------------------------
  var CHARTS = {
    // Qualifications — Bristol vs England (Census TS067) — Bristol is better-qualified
    quals: { labels: ["Level 4+ (degree)", "No qualifications"], bristol: [42.1, 14.5], england: [33.9, 18.1], src: "ts067" },
    // Where Bristol carries MORE pressure than England (Census TS011/TS052/TS045/TS054)
    health: { labels: ["Deprived in 3–4 ways", "Overcrowded", "No car/van", "Social renting"], bristol: [4.23, 5.05, 26.15, 18.7], england: [3.94, 4.37, 23.54, 17.09], src: "census" },
    // Median age — Bristol vs England (Census TS007)
    age: { labels: ["Bristol", "England"], values: [32.4, 40.4], src: "ts007" }
  };

  // ---- ward life-expectancy dumbbells (ONS; axis runs 65–92) -----------------
  var DUMBBELLS = [
    { sex: "men",   low: { n: "Lawrence Hill",  v: 71.6 }, high: { n: "Westbury & Henleaze", v: 83.5 }, src: "ons_le" },
    { sex: "men",   low: { n: "Central",        v: 71.3 }, high: { n: "Hotwells & Harbourside", v: 83.7 }, src: "ons_le" },
    { sex: "women", low: { n: "St George West", v: 78.6 }, high: { n: "Troopers Hill",       v: 87.9 }, src: "ons_le" },
    { sex: "women", low: { n: "Filwood",        v: 79.3 }, high: { n: "Clifton Down",        v: 88.7 }, src: "ons_le" }
  ];

  // ---- dashboard indicators (ONS + Census 2021 only) ------------------------
  //  Bristol's CITY-WIDE averages mostly match or beat England (a young, qualified
  //  city). The deprivation shows up (a) between wards, and (b) in health outcomes.
  //  stage: early (0–5) · primary (5–11) · secondary (11–16) · transition (16–25) · cross
  //  With Census/ONS being a point-in-time picture, the primary/secondary acts use the
  //  household conditions children live through at those ages (the official-data lens).
  var INDICATORS = [
    // ---- Ages 0–5 · the home a child is born into ----
    { id:"child_share",icon:"baby",           theme:"employment", stage:"early",     label:"Children (0–15) as a share of population",    a:{p:"Barton Hill",v:30}, b:{p:"City average",v:17.5}, unit:"%", src:"census", asOf:"2021", note:"Child population is heavily concentrated in the most deprived wards (Census TS007)." },
    { id:"child_pov",  icon:"coins",          theme:"health",     stage:"early",     label:"Children in relative low income (ward extremes)", a:{p:"Lawrence Hill",v:54.2}, b:{p:"Redland",v:3.1}, unit:"%", src:"ons_clif", asOf:"FYE 2024", note:"Citywide 25.6% after housing costs; Central 47.8%, Hartcliffe & W. 39.3%, Filwood 36.9%." },
    { id:"overcrowd",  icon:"house",          theme:"employment", stage:"early",     label:"Overcrowded households",                     a:{p:"Bristol",v:5.05}, b:{p:"England",v:4.37}, unit:"%", src:"ts052", asOf:"2021", note:"Occupancy rating of −1 or less — above England (Census TS052); hits families with young children hardest." },
    { id:"no_heating", icon:"octagon-alert",  theme:"employment", stage:"early",     label:"Households with no central heating",          a:{p:"Bristol",v:1.62}, b:{p:"England",v:1.50}, unit:"%", src:"ts046", asOf:"2021", note:"A fuel-poverty signal for the youngest children — marginally above England (Census TS046)." },
    { id:"deprived_34",icon:"scale-balance",  theme:"employment", stage:"early",     label:"Households deprived in 3–4 dimensions",       a:{p:"Bristol",v:4.23}, b:{p:"England",v:3.94}, unit:"%", src:"ts011", asOf:"2021", note:"The deepest household deprivation — above England (8,099 households)." },

    // ---- Ages 5–11 · household conditions around primary school ----
    { id:"deprived_any",icon:"scale-balance", theme:"employment", stage:"primary",   label:"Households deprived in 1+ dimension",         a:{p:"Bristol",v:49.83},b:{p:"England",v:50.05},unit:"%", src:"ts011", asOf:"2021", note:"About half of households show at least one of employment, education, health or housing deprivation (Census TS011)." },
    { id:"social_rent",icon:"house",          theme:"employment", stage:"primary",   label:"Households in social rented housing",         a:{p:"Bristol",v:18.7}, b:{p:"England",v:17.09},unit:"%", src:"ts054", asOf:"2021", note:"Above England; a marker of housing need (Census TS054)." },
    { id:"no_car",     icon:"map-pin",        theme:"employment", stage:"primary",   label:"Households with no car or van",               a:{p:"Bristol",v:26.15},b:{p:"England",v:23.54},unit:"%", src:"ts045", asOf:"2021", note:"Above England; central wards fall below 50% car availability (Census TS045)." },
    { id:"lone_parent",icon:"hand-heart",     theme:"employment", stage:"primary",   label:"Lone-parent households",                     a:{p:"Bristol",v:10.34},b:{p:"England",v:11.07},unit:"%", src:"ts003", asOf:"2021", note:"Slightly below England city-wide (Census TS003)." },

    // ---- Ages 11–16 · the household economy behind secondary school ----
    { id:"nssec_rout", icon:"briefcase",      theme:"employment", stage:"secondary", label:"Routine & semi-routine occupations",         a:{p:"Bristol",v:20.99},b:{p:"England",v:23.27},unit:"%", src:"ts062", asOf:"2021", note:"Lower-paid occupational classes (NS-SeC L12–L13) — below England city-wide (Census TS062)." },
    { id:"own_outright",icon:"house",         theme:"employment", stage:"secondary", label:"Households owning outright",                  a:{p:"Bristol",v:25.1}, b:{p:"England",v:32.52},unit:"%", src:"ts054", asOf:"2021", note:"Well below England — fewer households hold housing wealth outright." },
    { id:"gdhi",       icon:"coins",          theme:"employment", stage:"secondary", label:"Disposable income per head",                 a:{p:"Bristol",v:24696},b:{p:"England",v:25425},unit:"£", src:"ons", asOf:"2023", note:"Gross disposable household income per head — just below England (ONS regional GDHI)." },
    { id:"health_bad", icon:"heart-pulse",    theme:"health",     stage:"secondary", label:"Bad or very bad general health",             a:{p:"Bristol",v:4.96}, b:{p:"England",v:5.15}, unit:"%", src:"ts037", asOf:"2021", note:"Unadjusted self-reported health (Census TS037) — flattered by Bristol's young age profile." },

    // ---- Ages 16–25 · qualifications & the transition to work ----
    { id:"quals_l4",   icon:"graduation-cap", theme:"education",  stage:"transition",label:"Adults with Level 4+ qualifications",        a:{p:"Bristol",v:42.1}, b:{p:"England",v:33.9}, unit:"%", src:"ts067", asOf:"2021", note:"A city strength — the highest of the English core cities — but hides a 51-point gap between wards (Redland 67%, Hartcliffe & W. 15.8%)." },
    { id:"quals_none", icon:"pencil",         theme:"education",  stage:"transition",label:"Adults with no qualifications",              a:{p:"Bristol",v:14.5}, b:{p:"England",v:18.1}, unit:"%", src:"ts067", asOf:"2021", note:"Below England city-wide, but concentrated in the most deprived wards (Census TS067)." },
    { id:"employment", icon:"briefcase",      theme:"employment", stage:"transition",label:"Employment rate (16–64)",                    a:{p:"Bristol",v:76.1}, b:{p:"England",v:76.0}, unit:"%", src:"ons", asOf:"2023", note:"Broadly level with England (ONS Annual Population Survey)." },
    { id:"inactivity", icon:"trending-up",    theme:"employment", stage:"transition",label:"Economic inactivity (16–64)",                a:{p:"Bristol",v:20.8}, b:{p:"England",v:21.0}, unit:"%", src:"ons", asOf:"2023", note:"In line with England overall (ONS APS)." },
    { id:"pay",        icon:"coins",          theme:"employment", stage:"transition",label:"Median weekly pay",                          a:{p:"Bristol",v:670.8},b:{p:"England",v:648.4},unit:"£", src:"ons", asOf:"2025", note:"Full-time gross weekly pay — above England (ONS ASHE)." },
    { id:"median_age", icon:"hourglass",      theme:"employment", stage:"transition",label:"Median age",                                 a:{p:"Bristol",v:32.4}, b:{p:"England",v:40.4}, unit:"yrs", src:"ts007", asOf:"2021", note:"One of the youngest big-city populations in England (Census TS007)." },
    { id:"fsm_uni",    icon:"graduation-cap", theme:"education",  stage:"transition",label:"FSM pupils entering university by 19",         a:{p:"White British FSM",v:18}, b:{p:"Black African FSM",v:62}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust: disadvantaged White British pupils are the least likely of any group to reach university (Indian FSM 58%)." },
    { id:"fsm_bristol",icon:"graduation-cap", theme:"education",  stage:"transition",label:"FSM pupils holding a degree by 22",             a:{p:"Bristol North West",v:3}, b:{p:"England (FSM)",v:16}, unit:"%", src:"sutton", asOf:"2025", note:"Sutton Trust Opportunity Index (all-FSM % with a degree by 22): Bristol North West ~3% is among England's lowest; England all-FSM average 16%, London 27% (Bristol South ranks 538th of 543). NB the Index measures all FSM pupils, not White-FSM only." },

    // ---- Across the life course · outcomes ----
    { id:"health_index",icon:"heart-pulse",   theme:"health",     stage:"cross",     label:"ONS Health Index (England = 100.8)",         a:{p:"Bristol",v:91.4}, b:{p:"England",v:100.8},unit:"", src:"ons", asOf:"2021", note:"Composite of health outcomes, risk factors and wider determinants — Bristol sits well below the national baseline." },
    { id:"disability", icon:"shield",         theme:"health",     stage:"cross",     label:"Disabled under the Equality Act",            a:{p:"Bristol",v:17.1}, b:{p:"England",v:17.31},unit:"%", src:"ts038", asOf:"2021", note:"Day-to-day activities limited a lot or a little (Census TS038)." },
    { id:"unpaid_care",icon:"hand-heart",     theme:"health",     stage:"cross",     label:"Providing unpaid care",                      a:{p:"Bristol",v:7.83}, b:{p:"England",v:9.26}, unit:"%", src:"ts039", asOf:"2021", note:"Unpaid carers aged 5+ (Census TS039)." },
    { id:"le_city_m",  icon:"heart-pulse",    theme:"health",     stage:"cross",     label:"Male life expectancy (city)",                a:{p:"Bristol",v:78.14},b:{p:"England",v:79.11},unit:"yrs", src:"ons_le", asOf:"2021-23", note:"Bristol's citywide male life expectancy trails England by nearly a year." },
    { id:"le_male",    icon:"heart-pulse",    theme:"health",     stage:"cross",     label:"Male life expectancy (ward extremes)",       a:{p:"Lawrence Hill",v:71.6}, b:{p:"Westbury & Henleaze",v:83.5}, unit:"yrs", src:"ons_le", asOf:"2021-23", note:"Nearly 12 years apart within one city (England average 79.1)." },
    { id:"le_female",  icon:"heart-pulse",    theme:"health",     stage:"cross",     label:"Female life expectancy (ward extremes)",     a:{p:"St George West",v:78.6}, b:{p:"Troopers Hill",v:87.9}, unit:"yrs", src:"ons_le", asOf:"2021-23", note:"A 9.3-year gap between wards (England average 83.0)." },
    { id:"hle_f",      icon:"heart",          theme:"health",     stage:"cross",     label:"Healthy life expectancy (female)",           a:{p:"Bristol",v:60.1}, b:{p:"England",v:61.3}, unit:"yrs", src:"ons_hle", asOf:"2022-24", note:"Years lived in good health — falling nationally and locally." }
  ];

  // ---- EARLY-YEARS SUB-PAGE (ages 0–5) ---------------------------------------
  //  The deprivation a child is born into: the household (Census), the horizon
  //  (ONS life expectancy) and the early gap that opens before school (Sutton Trust).
  var EARLY = [
    // ---------------- Economic circumstances ----------------
    { id:"ey_childpov",  icon:"coins",         cluster:"Economic circumstances", theme:"health",     label:"Children in low income (after housing costs)", a:{p:"Bristol",v:25.6}, b:{p:"Redland ward",v:3.1}, unit:"%", src:"ons_clif", asOf:"FYE 2024", note:"Citywide a quarter of children; in Lawrence Hill it reaches 54%." },
    { id:"ey_overcrowd", icon:"house",         cluster:"Economic circumstances", theme:"health",     label:"Overcrowded households",                     a:{p:"Bristol",v:5.05}, b:{p:"England",v:4.37}, unit:"%", src:"ts052", asOf:"2021", note:"Occupancy rating −1 or less — hits families with young children hardest (Census TS052)." },
    { id:"ey_heating",   icon:"octagon-alert", cluster:"Economic circumstances", theme:"health",     label:"Households with no central heating",          a:{p:"Bristol",v:1.62}, b:{p:"England",v:1.50}, unit:"%", src:"census", asOf:"2021", note:"A cold-home risk for infants — above England (Census TS046)." },
    { id:"ey_deprived",  icon:"scale-balance", cluster:"Economic circumstances", theme:"health",     label:"Households deprived in 3–4 dimensions",       a:{p:"Bristol",v:4.23}, b:{p:"England",v:3.94}, unit:"%", src:"ts011", asOf:"2021", note:"The deepest household deprivation — above England (Census TS011)." },

    // ---------------- Education & learning ----------------
    { id:"ey_ready",     icon:"blocks",        cluster:"Education & learning",   theme:"education",  label:"Disadvantaged children ‘school ready’ at 5", a:{p:"Disadvantaged",v:51.5}, b:{p:"England average",v:67.7}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust: a 19-month development gap opens between the richest and poorest children by age 5." },
    { id:"ey_earlyaccess",icon:"seedling",     cluster:"Education & learning",   theme:"education",  label:"Low-income families reaching funded early education", a:{p:"Under £20k income",v:20}, b:{p:"Over £45k income",v:80}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust: just 1 in 5 of the lowest-income families access the funded offer, against 4 in 5 of the best-off." },

    // ---------------- Health & wellbeing ----------------
    { id:"ey_le_birth",  icon:"heart-pulse",   cluster:"Health & wellbeing",     theme:"health",     label:"Life expectancy at birth (male)",            a:{p:"Bristol",v:78.14}, b:{p:"England",v:79.11}, unit:"yrs", src:"ons_le", asOf:"2021-23", note:"ONS small-area life tables — the horizon a boy born today faces." },
    { id:"ey_le_birthf", icon:"heart",         cluster:"Health & wellbeing",     theme:"health",     label:"Life expectancy at birth (female)",          a:{p:"Bristol",v:82.69}, b:{p:"England",v:83.05}, unit:"yrs", src:"ons_le", asOf:"2021-23", note:"ONS small-area life tables — female life expectancy at birth." },
    { id:"ey_disab",     icon:"shield",        cluster:"Health & wellbeing",     theme:"health",     label:"Disability in the population",               a:{p:"Bristol",v:17.1}, b:{p:"England",v:17.31}, unit:"%", src:"ts038", asOf:"2021", note:"Household disability shapes an infant's early environment (Census TS038)." }
  ];

  // ---- ward comparator metrics (ONS + Census only) ---------------------------
  var WARDS = {
    life_w:       { title:"Life expectancy at birth — women (years)", unit:"years", src:"ons_le", wards:[ {n:"Troopers Hill, St George",v:87.9,t:"aff"}, {n:"Clifton Down",v:88.7,t:"aff"}, {n:"Filwood",v:79.3,t:"dep"}, {n:"St George West",v:78.6,t:"dep"} ] },
    child_pov:    { title:"Children in relative low income (%)",       unit:"%",     src:"ons_clif", wards:[ {n:"Lawrence Hill",v:54.2,t:"dep"}, {n:"Central",v:47.8,t:"dep"}, {n:"Hartcliffe & Withywood",v:39.3,t:"dep"}, {n:"Filwood",v:36.9,t:"dep"}, {n:"Westbury-on-Trym & Henleaze",v:3.4,t:"aff"}, {n:"Redland",v:3.1,t:"aff"} ] },
    children_pct: { title:"Children (0–15) as a share of population",  unit:"%",     src:"census", wards:[ {n:"Barton Hill",v:30,t:"dep"}, {n:"Hartcliffe",v:27.6,t:"dep"}, {n:"Lawrence Weston",v:26,t:"dep"}, {n:"City average",v:17.5,t:"city"} ] },
    degree_w:     { title:"Adults with a Level 4+ qualification (%)",  unit:"%",     src:"ts067",  wards:[ {n:"Redland",v:67,t:"aff"}, {n:"Clifton",v:64,t:"aff"}, {n:"Hartcliffe & Withywood",v:15.8,t:"dep"}, {n:"Filwood",v:17,t:"dep"} ] }
  };

  /* ===========================================================================
     EDUCATION STORY  —  data for "Bristol Education Story.html"
     A deprivation story told through education, from reception to age 22.
     Sources: DfE (Explore Education Statistics), Sutton Trust, Census 2021 (ONS),
     and Open Data Bristol for ward-level attainment/exclusions.
  =========================================================================== */
  var EDU_FIGURES = {
    heroKs2:   { v: 60,  unit: "%",    src: "dfe_ks2",  asOf: "2024/25", about: "Bristol pupils meeting the expected standard in reading, writing & maths at the end of primary (2024/25) — below England's 63%." },
    heroGap:   { v: 28,  unit: "pp",   src: "dfe_ks2",  asOf: "2024/25", about: "Bristol's KS2 disadvantage gap — disadvantaged pupils 41% vs their peers 69%. Wider than England's 22-point gap." },
    heroFsm:   { v: 3,   unit: "%",    src: "sutton",   asOf: "2024",    about: "White British FSM pupils in Bristol North West who hold a degree by age 22 — the lowest rate in England." },
    degRedland:{ v: 67,  unit: "%",    src: "ts067",    asOf: "2021",    about: "Adults with a Level 4+ qualification in Redland — the highest-qualified ward." },
    degHW:     { v: 15.8,unit: "%",    src: "ts067",    asOf: "2021",    about: "Adults with a Level 4+ qualification in Hartcliffe & Withywood — the lowest in the city." }
  };
  var EDU_CHARTS = {
    // Meeting the expected standard through the journey — Bristol vs England
    journey: { labels: ["Reception (GLD)", "KS2 (RWM)", "Primary good/outst."], bristol: [68.7, 60, 86], england: [68.3, 63, 93], src: "dfe" },
    // Grade 5+ in English & maths at GCSE, by disadvantage (Bristol, 2024/25)
    gap:     { labels: ["Disadvantaged", "Their peers"], values: [23.2, 57.1], src: "dfe_ks4" }
  };
  //  The through-line: Bristol's headline results are near the England average,
  //  but its DISADVANTAGE GAP is wider than England's at every single stage.
  var EDU_INDICATORS = [
    // ---- Ages 0–5 · Early years ----
    { id:"eyfsp_gld",   icon:"seedling",       theme:"education", stage:"early",     label:"Good Level of Development at reception", a:{p:"Bristol",v:68.7}, b:{p:"England",v:68.3}, unit:"%", src:"dfe_eyfsp", asOf:"2024/25", note:"Level with England on the headline — but a wide disadvantage gap opens before school (nationally FSM 51.3% vs 72.5%)." },
    { id:"eyfsp_gap",   icon:"scale-balance",  theme:"education", stage:"early",     label:"School readiness, by disadvantage (Bristol)", a:{p:"Disadvantaged (FSM)",v:49.9}, b:{p:"Their peers",v:74.5}, unit:"%", src:"dfe_eyfsp", asOf:"2023/24", note:"The gap opens before school: a 24.6-point divide at reception, wider than England's 20.5." },
    { id:"early_access",icon:"hand-heart",     theme:"education", stage:"early",     label:"Low-income families reaching funded early education", a:{p:"Under £20k income",v:20}, b:{p:"Over £45k income",v:80}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust: 1 in 5 of the lowest-income families reach the funded offer, against 4 in 5 of the best-off; the poorest start ~11 months behind." },

    // ---- Ages 5–11 · Primary ----
    { id:"phonics",     icon:"pencil",         theme:"education", stage:"primary",   label:"Year 1 phonics — meeting the standard", a:{p:"Bristol",v:77}, b:{p:"England",v:80}, unit:"%", src:"dfe_phon", asOf:"2023/24", note:"Bristol trails England; the FSM gap here is 21 points against England's 16." },
    { id:"ks2_rwm",     icon:"book-open",      theme:"education", stage:"primary",   label:"Meeting the expected standard at KS2 (RWM)", a:{p:"Bristol",v:59}, b:{p:"England",v:63}, unit:"%", src:"dfe_ks2", asOf:"2024/25", note:"Reading, writing & maths combined — Bristol sits four points below England (59% vs 63%). DfE revised 2024/25." },
    { id:"ks2_gap",     icon:"scale-balance",  theme:"education", stage:"primary",   label:"KS2 attainment, by disadvantage (Bristol)", a:{p:"Disadvantaged",v:40}, b:{p:"Their peers",v:68}, unit:"%", src:"dfe_ks2", asOf:"2024/25", note:"A 28-point gap by the end of primary (40% vs 68%) — wider than England's 21 (2024/25 provisional)." },
    { id:"prim_oo",     icon:"award",          theme:"education", stage:"primary",   label:"Primary schools rated good or outstanding", a:{p:"Bristol",v:86.4}, b:{p:"England",v:91.6}, unit:"%", src:"dfe", asOf:"2023/24", note:"Fewer good/outstanding primary places than the national picture (Ofsted Table 5c, as at 31 Aug 2024)." },

    // ---- Ages 11–16 · Secondary ----
    { id:"attainment8", icon:"award",          theme:"education", stage:"secondary", label:"Attainment 8 score", a:{p:"Bristol",v:46.4}, b:{p:"England",v:46.0}, unit:"", src:"dfe_ks4", asOf:"2024/25", note:"Bristol's average GCSE score is now level with England — but its disadvantage gap (18.6 points: 33.9 vs 52.5) is far wider than England's 15.5." },
    { id:"gcse5_em",    icon:"book-open",      theme:"education", stage:"secondary", label:"Grade 5+ in English & maths, by disadvantage (Bristol)", a:{p:"Disadvantaged",v:23.2}, b:{p:"Their peers",v:57.1}, unit:"%", src:"dfe_ks4", asOf:"2024/25", note:"Bristol's disadvantaged pupils are far less likely to get a good pass — a 33.9-point gap (23.2% vs 57.1%) against England's ~27." },
    { id:"progress8",   icon:"trending-up",    theme:"education", stage:"secondary", label:"Progress 8, by disadvantage (Bristol)", a:{p:"Disadvantaged",v:-0.59}, b:{p:"Their peers",v:0.26}, unit:"", src:"dfe_ks4", asOf:"2023/24", note:"Latest published year: Progress 8 is not produced for 2024/25 (this cohort has no KS2 baseline). Hartcliffe & Withywood scored −1.06, against Cotham's +0.82." },
    { id:"absence",     icon:"calendar-x",     theme:"education", stage:"secondary", label:"Persistent absence (all pupils)", a:{p:"Bristol",v:24.7}, b:{p:"England",v:20.0}, unit:"%", src:"dfe_abs", asOf:"2023/24", note:"Missing 10%+ of sessions — absence in Bristol's most-deprived decile (11.1%) is double the least-deprived (5.5%)." },
    { id:"suspensions", icon:"octagon-alert",  theme:"education", stage:"secondary", label:"Suspension rate (per 100 pupils)", a:{p:"Bristol",v:14.95}, b:{p:"England",v:11.31}, unit:"", src:"dfe_excl", asOf:"2023/24", note:"Well above England; the secondary rate is higher still (Bristol 31.5 vs 22.6 per 100)." },

    // ---- Ages 16–25 · Transition ----
    { id:"he_prog",     icon:"graduation-cap", theme:"education", stage:"transition",label:"FSM pupils progressing to HE by 19", a:{p:"Bristol FSM",v:21.8}, b:{p:"England FSM",v:28.9}, unit:"%", src:"dfe_wp", asOf:"2023/24", note:"Bristol's disadvantaged young people are far less likely to reach university; just 2.6% reach a high-tariff university, against 13.9% of the rest." },
    { id:"fsm_uni",     icon:"graduation-cap", theme:"education", stage:"transition",label:"FSM pupils entering university by 19, by ethnicity", a:{p:"White British FSM",v:18}, b:{p:"Black African FSM",v:62}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust: disadvantaged White British pupils are the least likely of any group to reach university (Indian FSM 58%)." },
    { id:"fsm_bristol", icon:"graduation-cap", theme:"education", stage:"transition",label:"FSM pupils holding a degree by 22", a:{p:"Bristol North West",v:3}, b:{p:"Highest area",v:41}, unit:"%", src:"sutton", asOf:"2025", note:"Sutton Trust Opportunity Index (all-FSM % with a degree by 22): Bristol North West ~3% is among England's lowest; highest area (Stratford & Bow) 41%, England all-FSM average 16%; Bristol South ranks 538th of 543. NB the Index measures all FSM pupils, not White-FSM only." },
    { id:"neet",        icon:"briefcase",      theme:"education", stage:"transition",label:"NEET at 16–17", a:{p:"Bristol",v:6.0}, b:{p:"England",v:3.4}, unit:"%", src:"dfe_neet", asOf:"2024/25", note:"Above England, and far higher in deprived wards — Hartcliffe & Withywood 17.2%, Filwood 16.0%." },
    { id:"excl_gcse",   icon:"octagon-alert",  theme:"education", stage:"transition",label:"Good GCSEs after permanent exclusion", a:{p:"Excluded pupils",v:7}, b:{p:"All pupils",v:46}, unit:"%", src:"dfe_excl", asOf:"2019", note:"Only 7% of permanently excluded pupils leave with good GCSEs in English and maths (Timpson Review)." },

    // ---- Cross-cutting · the adult result (Census 2021) ----
    { id:"quals_l4",    icon:"graduation-cap", theme:"education", stage:"cross",     label:"Adults with Level 4+ qualifications", a:{p:"Bristol",v:42.1}, b:{p:"England",v:33.9}, unit:"%", src:"ts067", asOf:"2021", note:"The highest of the English core cities — but hides a 51-point gap between wards." },
    { id:"quals_none",  icon:"pencil",         theme:"education", stage:"cross",     label:"Adults with no qualifications", a:{p:"Bristol",v:14.5}, b:{p:"England",v:18.1}, unit:"%", src:"ts067", asOf:"2021", note:"Below England city-wide, but reaches 30.4% in Hartcliffe & Withywood (Census TS067)." },
    { id:"degree_ward", icon:"scale-balance",  theme:"education", stage:"cross",     label:"Degree-qualified adults (ward extremes)", a:{p:"Hartcliffe & W.",v:15.8}, b:{p:"Redland",v:67}, unit:"%", src:"ts067", asOf:"2021", note:"A 51-point gap in Level 4+ qualifications within one city (Census TS067)." }
  ];
  var EDU_EARLY = [
    { id:"ee_gld",       icon:"seedling",      cluster:"Reaching the standard",  theme:"education", label:"Good Level of Development at reception", a:{p:"Bristol",v:68.7}, b:{p:"England",v:68.3}, unit:"%", src:"dfe_eyfsp", asOf:"2024/25", note:"Bristol is level with England on the headline — the gap is by disadvantage, not city average." },
    { id:"ee_ready",     icon:"blocks",        cluster:"Reaching the standard",  theme:"education", label:"School readiness, by disadvantage (Bristol)", a:{p:"Disadvantaged (FSM)",v:49.9}, b:{p:"Their peers",v:74.5}, unit:"%", src:"dfe_eyfsp", asOf:"2023/24", note:"A 24.6-point gap at reception — wider than England's 20.5." },
    { id:"ee_access",    icon:"hand-heart",    cluster:"Access to early education", theme:"education", label:"Low-income families reaching funded early education", a:{p:"Under £20k",v:20}, b:{p:"Over £45k",v:80}, unit:"%", src:"sutton", asOf:"2024", note:"Sutton Trust — 1 in 5 vs 4 in 5." },
    { id:"ee_childpov",  icon:"coins",         cluster:"Access to early education", theme:"education", label:"Children in low income (ward extremes)", a:{p:"Lawrence Hill",v:54.2}, b:{p:"Redland",v:3.1}, unit:"%", src:"ons_clif", asOf:"FYE 2024", note:"The poverty a child brings to the classroom, by ward." },
    { id:"ee_overcrowd", icon:"house",         cluster:"Home conditions",        theme:"education", label:"Overcrowded households", a:{p:"Bristol",v:5.05}, b:{p:"England",v:4.37}, unit:"%", src:"ts052", asOf:"2021", note:"Nowhere quiet to learn — above England (Census TS052)." },
    { id:"ee_deprived",  icon:"scale-balance", cluster:"Home conditions",        theme:"education", label:"Households deprived in 3–4 dimensions", a:{p:"Bristol",v:4.23}, b:{p:"England",v:3.94}, unit:"%", src:"ts011", asOf:"2021", note:"The deepest household deprivation (Census TS011)." }
  ];
  var EDU_WARDS = {
    degree_w:     { title:"Adults with a Level 4+ qualification (%)", unit:"%", src:"ts067", wards:[ {n:"Redland",v:67,t:"aff"}, {n:"Clifton",v:64,t:"aff"}, {n:"Filwood",v:17,t:"dep"}, {n:"Hartcliffe & Withywood",v:15.8,t:"dep"} ] },
    he_part:      { title:"Young people entering higher education (TUNDRA, %)", unit:"%", src:"ofs", wards:[ {n:"Westbury Park",v:77.6,t:"aff"}, {n:"Redland",v:72.4,t:"aff"}, {n:"Highridge",v:11.6,t:"dep"}, {n:"Hartcliffe",v:8.7,t:"dep"} ] },
    suspensions:  { title:"Pupils suspended per 1,000", unit:"per 1,000", src:"odb_edu", wards:[ {n:"Hartcliffe & Withywood",v:110.8,t:"dep"}, {n:"Filwood",v:101.7,t:"dep"}, {n:"Lawrence Hill",v:97.2,t:"dep"} ] },
    child_pov:    { title:"Children in relative low income (%)", unit:"%", src:"ons_clif", wards:[ {n:"Lawrence Hill",v:54.2,t:"dep"}, {n:"Central",v:47.8,t:"dep"}, {n:"Hartcliffe & Withywood",v:39.3,t:"dep"}, {n:"Redland",v:3.1,t:"aff"} ] }
  };

  window.BRISTOL_DATA = {
    updated: "July 2026",
    liveUrl: null,
    scope: "ONS, Census 2021, Sutton Trust & DfE",
    sources: SOURCES,
    figures: FIGURES,
    charts: CHARTS,
    dumbbells: DUMBBELLS,
    indicators: INDICATORS,
    wards: WARDS,
    early: EARLY,
    // ---- education story (separate HTML) ----
    education: {
      figures: EDU_FIGURES,
      charts: EDU_CHARTS,
      indicators: EDU_INDICATORS,
      early: EDU_EARLY,
      wards: EDU_WARDS
    }
  };
  // expose under a second name too, so the standalone page can find it
  window.BRISTOL_ONS_DATA = window.BRISTOL_DATA;
})();
