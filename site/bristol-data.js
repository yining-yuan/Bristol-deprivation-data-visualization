/* =============================================================================
   bristol-data.js  —  SINGLE SOURCE OF TRUTH for "How deprivation happens in Bristol"
   -----------------------------------------------------------------------------
   Every number shown in the page lives here. To update the story when a data
   source is refreshed, edit the value (and the "asOf" date) below — nothing in
   the HTML needs to change.

   There is no single API that serves all of these metrics: they are published by
   ~15 different organisations (ONS, Open Data Bristol, LG Inform, Sutton Trust,
   IFS, Trussell Trust, etc.), several of which release PDFs or dashboards rather
   than machine-readable feeds. Each figure therefore carries:
       v      the value          unit   how to display it
       src    a key into SOURCES  asOf   when it was last checked / published
       about  a plain-English explainer (shown on hover for visual help)

   AUTO-UPDATE (optional): host a JSON file with the same shape as this object on
   a CORS-enabled URL and set  liveUrl  below. On load the page will fetch it and
   merge it over these defaults, so a hosted feed can drive the page without
   editing this file. Leave it null to use the values below.
============================================================================= */
(function () {
  var SOURCES = {
    ons:      { name: "ONS — Explore local statistics (Bristol)", url: "https://www.ons.gov.uk/explore-local-statistics/areas/E06000023-bristol-city-of" },
    odb:      { name: "Open Data Bristol",                        url: "https://opendata.bristol.gov.uk/" },
    bcc:      { name: "Bristol City Council — statistics and census", url: "https://www.bristol.gov.uk/council-and-mayor/statistics-census-information" },
    ward:     { name: "Bristol Ward Profile Tool",               url: "https://www.bristol.gov.uk/council-and-mayor/statistics-census-information/deprivation" },
    lginform: { name: "LG Inform (LGA)",                         url: "https://lginform.local.gov.uk/" },
    sport:    { name: "Sport England — Active Lives",            url: "https://www.sportengland.org/research-and-data/data/active-lives" },
    trussell: { name: "Trussell Trust — latest stats",          url: "https://www.trussell.org.uk/news-and-research/latest-stats" },
    sutton:   { name: "Sutton Trust — Opportunity Index",       url: "https://www.suttontrust.com/our-research/" },
    lw:       { name: "Learning and Work Institute",              url: "https://learningandwork.org.uk/resources/" },
    kindred:  { name: "Kindred² — School Readiness Survey",     url: "https://kindredsquared.org.uk/school-readiness/" },
    nuffield: { name: "Nuffield Foundation",                    url: "https://www.nuffieldfoundation.org/" },
    ifs:      { name: "Institute for Fiscal Studies",           url: "https://ifs.org.uk/" },
    census:   { name: "Census 2021 (ONS)",                      url: "https://www.ons.gov.uk/census" },
    milburn:  { name: "Youth participation review (gov.uk)",    url: "https://www.gov.uk/government/publications" },
    dfe:      { name: "DfE — Explore education statistics",     url: "https://explore-education-statistics.service.gov.uk/" },
    ncmp:     { name: "NHS — National Child Measurement Programme", url: "https://digital.nhs.uk/data-and-information/publications/statistical/national-child-measurement-programme" },

    // ---- Early-years sub-page ----
    ey_overcrowd:  { name: "Census 2021 · TS052 Occupancy rating (Nomis)",        url: "https://www.nomisweb.co.uk/datasets/c2021ts052",                                                                                          g: "LSOA" },
    ey_clif:       { name: "DWP · Children in Low Income Families (FYE 2025)",     url: "https://www.gov.uk/government/statistics/children-in-low-income-families-local-area-statistics-2022-to-2025/children-in-low-income-families-local-area-statistics-financial-year-ending-2025", g: "LSOA" },
    ey_idaci:      { name: "Indices of Deprivation 2025 · IDACI (Bristol LSOAs)",  url: "https://open-data-bristol-bcc.hub.arcgis.com/datasets/indices-of-deprivation-2025/explore",                                            g: "LSOA" },
    ey_earlyhelp:  { name: "Bristol Ward Profiles · Children's Services",          url: "https://www.bristol.gov.uk/council/statistics-census-information/ward-profile-data",                                                     g: "Ward" },
    ey_asq:        { name: "OHID · Child development at 2–2½ years (2023/24)",     url: "https://www.gov.uk/government/statistics/child-development-outcomes-at-2-to-2-and-a-half-years-april-2023-to-march-2024-annual-2023-to-2024", g: "LA" },
    ey_eyfsp:      { name: "Open Data Bristol · Good Level of Development by ward", url: "https://opendata.bristol.gov.uk/explore/dataset/early-years-pupils-achieving-a-good-level-of-development-in-bristol/",                   g: "Ward" },
    ey_rba:        { name: "DfE · Reception Baseline Assessment",                  url: "https://www.gov.uk/government/collections/reception-baseline-assessment",                                                                g: "None" },
    ey_funded:     { name: "Bristol · Childcare Sufficiency Assessment 2024",      url: "https://www.bristol.gov.uk/files/documents/9901-bristol-city-council-childcare-sufficiency-assessment-2024-final/file",                  g: "Ward" },
    ey_lbw:        { name: "OHID Fingertips · Child and Maternal Health",            url: "https://fingertips.phe.org.uk/profile/child-health-profiles",                                                                            g: "LA" },
    ey_satod:      { name: "NHS England · Smoking at Time of Delivery (SATOD)",    url: "https://digital.nhs.uk/data-and-information/data-collections-and-data-sets/data-collections/smoking-status-at-time-of-delivery-satod-data-collection", g: "LA" },
    ey_socialcare: { name: "Open Data Bristol · Children in social care by ward",  url: "https://opendata.bristol.gov.uk/maps/bcc::children-in-social-care-within-bristol-by-ward",                                              g: "Ward" },
    ey_ncmp:       { name: "OHID Fingertips · NCMP small-area (ward/MSOA)",        url: "https://fingertips.phe.org.uk/profile/obesity-physical-activity-nutrition",                                                              g: "Ward" },
    ey_play:       { name: "Bristol Quality of Life Survey · ward view",          url: "https://opendata.bristol.gov.uk/pages/quality_of_life_results_202021/ward-view",                                                         g: "Ward" },
    ey_hle:        { name: "LG Inform · Healthy life expectancy at birth (Bristol)", url: "https://lginform.local.gov.uk/reports/lgastandard?mod-area=E06000023&mod-metric=3156&mod-group=AllSingleTierAndCountyLaInCountry_England&mod-type=namedComparisonGroup", g: "LA" },
    ey_prem:       { name: "OHID Fingertips · Pregnancy and birth (preterm)",        url: "https://fingertips.phe.org.uk/profile/child-health-profiles/supporting-information/pregnancy-and-birth",                                g: "LA" },
    ey_dental:     { name: "OHID · Oral health survey of 5-year-olds (2024)",      url: "https://www.gov.uk/government/statistics/oral-health-survey-of-5-year-old-schoolchildren-2024",                                          g: "LA" },
    ey_kindred:    { name: "Kindred² · School Readiness Survey (Jan 2026)",        url: "https://kindredsquared.org.uk/wp-content/uploads/2026/01/School-Readiness-Survey-January-2026-Kindred-Squared.pdf",                       g: "National" }
  };

  // ---- every figure used in the narrative ------------------------------------
  var FIGURES = {
    // Hero
    heroAge:        { v: 33,   unit: "",     src: "ons",     asOf: "2021",    about: "Bristol's median age — one of England's youngest big cities (the South West median is 43)." },
    heroPoverty:    { v: 37,   unit: "%",    src: "bcc",     asOf: "2025",    about: "Share of Bristol children in income-deprived households — over 30,400 children." },
    heroLeGap:      { v: 11,   unit: " yrs", src: "ward",    asOf: "2024",    about: "Difference in life expectancy between Bristol's most and least advantaged wards." },

    // Two cities
    degRedland:     { v: 67,   unit: "%",    src: "census",  asOf: "2021",    about: "Adults with a degree in Redland — the highest-qualified ward." },
    degHW:          { v: 15.8, unit: "%",    src: "census",  asOf: "2021",    about: "Adults with a degree in Hartcliffe and Withywood — the lowest in the city." },
    povBristol:     { v: 25.6, unit: "%",    src: "ons",     asOf: "2023",    about: "Children in relative poverty after housing costs, Bristol." },
    povBath:        { v: 16.3, unit: "%",    src: "ons",     asOf: "2023",    about: "The same measure for neighbouring Bath and North East Somerset." },

    // Early years
    notReady:       { v: 36,   unit: "%",    src: "kindred", asOf: "2025",    about: "Reception children in the South West that staff judge not 'school ready'." },
    notReadyPrev:   { v: 33,   unit: "%",    src: "kindred", asOf: "2024",    about: "The same figure a year earlier — the trend is rising." },
    eyAbs:          { v: 22.2, unit: "%",    src: "ons",     asOf: "2023/24", about: "Persistent school absence in Bristol — among the highest rates in England." },
    eyAbsBath:      { v: 16.8, unit: "%",    src: "ons",     asOf: "2023/24", about: "Persistent absence in Bath and North East Somerset for comparison." },
    premBirths:     { v: 74.8, unit: "",     src: "ons",     asOf: "2022-24", about: "Premature births per 1,000 — the South West has England's lowest rate." },

    // Primary
    actStart:       { v: 54.8, unit: "%",    src: "bcc",     asOf: "2021/22", about: "Peak share of children (5–16) active 60+ mins/day." },
    actNow:         { v: 40.8, unit: "%",    src: "bcc",     asOf: "2024/25", about: "Current share of children active — falling every year since the peak." },
    inactStart:     { v: 19.4, unit: "%",    src: "bcc",     asOf: "2021/22", about: "Share of children classed as less active in 2021/22." },
    inactNow:       { v: 37.1, unit: "%",    src: "bcc",     asOf: "2024/25", about: "Inactivity has nearly doubled in three years." },
    obReception:    { v: 10.8, unit: "%",    src: "ncmp",    asOf: "2023/24", about: "Children overweight or obese at reception." },
    obYear6:        { v: 20.8, unit: "%",    src: "ncmp",    asOf: "2023/24", about: "Children overweight or obese by Year 6 — nearly double the reception rate." },
    ks2Bristol:     { v: 59,   unit: "%",    src: "lginform",asOf: "2023/24", about: "Pupils meeting the expected KS2 standard in Bristol." },
    ks2Nat:         { v: 62,   unit: "%",    src: "lginform",asOf: "2023/24", about: "National median for the same measure." },

    // Secondary
    suspHW:         { v: 110.8,unit: "",     src: "ward",    asOf: "2023/24", about: "Pupils suspended per 1,000 in Hartcliffe and Withywood." },
    suspFil:        { v: 101.7,unit: "",     src: "ward",    asOf: "2023/24", about: "Pupils suspended per 1,000 in Filwood." },
    suspLH:         { v: 97.2, unit: "",     src: "ward",    asOf: "2023/24", about: "Pupils suspended per 1,000 in Lawrence Hill." },
    absAll:         { v: 22.8, unit: "%",    src: "lginform",asOf: "2023/24", about: "Persistent absence across all Bristol pupils (national median 17.9%)." },
    absInNeed:      { v: 54.9, unit: "%",    src: "lginform",asOf: "2023/24", about: "Persistent absence among children classed as 'in need'." },
    rankPos:        { v: 525,  unit: "",     src: "sutton",  asOf: "2024",    about: "Bristol South's national ranking for white working-class opportunity (of 543)." },
    rankTot:        { v: 543,  unit: "",     src: "sutton",  asOf: "2024",    about: "Total constituencies ranked." },
    exclGcse:       { v: 7,    unit: "%",    src: "dfe",     asOf: "2019",    about: "Permanently excluded pupils achieving good GCSEs in English and maths (Timpson Review)." },

    // Transition
    oppBristol:     { v: 47,   unit: "",     src: "lw",      asOf: "2024",    about: "Bristol's Youth Opportunity Index score (of 100) — ranked 112th nationally." },
    oppBath:        { v: 62,   unit: "",     src: "lw",      asOf: "2024",    about: "Bath and North East Somerset score — ranked 31st, in the same combined authority." },
    rankBristol:    { v: 112,  unit: "",     src: "lw",      asOf: "2024",    about: "Bristol's national rank on the Opportunity Index." },
    rankBath:       { v: 31,   unit: "",     src: "lw",      asOf: "2024",    about: "Bath and North East Somerset national rank." },
    neet2015:       { v: 26,   unit: "%",    src: "milburn", asOf: "2015",    about: "Young people not in education, employment or training (NEET) reporting a work-limiting health condition in 2015." },
    neet2025:       { v: 44,   unit: "%",    src: "milburn", asOf: "2025",    about: "The same figure in 2025 — a sharp rise." },
    core25:         { v: 43,   unit: "%",    src: "ifs",     asOf: "2023/24", about: "Share of 25-year-olds still living with parents." },
    core34:         { v: 9,    unit: "%",    src: "ifs",     asOf: "2023/24", about: "Share of 34-year-olds living with parents — the steep age gradient." },
    care:           { v: 81,   unit: "",     src: "bcc",     asOf: "2025",    about: "Children in care per 10,000 in Bristol (753 children, March 2025)." },
    careEng:        { v: 67,   unit: "",     src: "bcc",     asOf: "2025",    about: "England average, children in care per 10,000." },
    uniWhite:       { v: 18,   unit: "%",    src: "sutton",  asOf: "2024",    about: "White British pupils eligible for free school meals progressing to university." },
    uniBlack:       { v: 62,   unit: "%",    src: "sutton",  asOf: "2024",    about: "Black African pupils eligible for free school meals progressing to university." },
    degNW:          { v: 2,    unit: "%",    src: "sutton",  asOf: "2024",    about: "White pupils eligible for free school meals in Bristol North West holding a degree by age 22." }
  };

  // ---- charts (data-driven) --------------------------------------------------
  var CHARTS = {
    activity:    { years: ["2021/22", "2024/25"], active: [54.8, 40.8], inactive: [19.4, 37.1], src: "bcc" },
    opportunity: { labels: ["Bath and North East Somerset", "Bristol"], values: [62, 47], src: "lw" },
    neet:        { labels: ["2015", "2025"], values: [26, 44], src: "milburn" },
    coreside:    { labels: ["Age 25", "Age 34"], values: [43, 9], src: "ifs" }
  };

  // ---- ward life-expectancy dumbbells (axis runs 65–92) ----------------------
  var DUMBBELLS = [
    { sex: "men",   low: { n: "Central",          v: 71.3 }, high: { n: "Hotwells and Harbourside", v: 83.7 }, src: "ward" },
    { sex: "men",   low: { n: "Lawrence Hill",     v: 72.3 }, high: { n: "Westbury and Henleaze",     v: 83.4 }, src: "ward" },
    { sex: "women", low: { n: "St George West",    v: 78.5 }, high: { n: "Troopers Hill",           v: 89.5 }, src: "ward" },
    { sex: "women", low: { n: "Filwood",           v: 79.3 }, high: { n: "Clifton Down",            v: 88.7 }, src: "ward" }
  ];

  // ---- dashboard indicators --------------------------------------------------
  var INDICATORS = [
    { id:"school_ready", icon:"blocks", theme:"education",  stage:"early",      label:"Children not \u201Cschool ready\u201D at reception", a:{p:"South West",v:36}, b:{p:"Year before",v:33}, unit:"%", src:"kindred", asOf:"2025", note:"Rising every year; staff cite toilet-training and speech." },
    { id:"eyfs_abs", icon:"calendar-x",     theme:"education",  stage:"early",      label:"Persistent absence (early years)",                 a:{p:"Bristol",v:22.2}, b:{p:"Bath and North East Somerset",v:16.8}, unit:"%", src:"ons", asOf:"2023/24", note:"Among the highest rates in the country." },
    { id:"obesity", icon:"weight",      theme:"health",     stage:"primary",    label:"Children overweight by Year 6",                    a:{p:"Year 6",v:20.8}, b:{p:"Reception",v:10.8}, unit:"%", src:"ncmp", asOf:"2023/24", note:"Nearly doubles across primary school." },
    { id:"active", icon:"activity",       theme:"health",     stage:"primary",    label:"Children active 60+ mins/day (5\u201316)",          a:{p:"Now (24/25)",v:40.8}, b:{p:"Peak (21/22)",v:54.8}, unit:"%", src:"bcc", asOf:"2024/25", note:"Inactivity has nearly doubled to 37.1%." },
    { id:"ks2", icon:"book-open",          theme:"education",  stage:"primary",    label:"Pupils meeting KS2 standard",                      a:{p:"Bristol",v:59}, b:{p:"National median",v:62}, unit:"%", src:"lginform", asOf:"2023/24", note:"Attainment slips below the national line." },
    { id:"prim_oo", icon:"book-open",      theme:"education",  stage:"primary",    label:"Primary schools good/outstanding",                 a:{p:"Bristol",v:86}, b:{p:"National median",v:93}, unit:"%", src:"lginform", asOf:"2023/24", note:"Below the national median for primaries." },
    { id:"absence", icon:"calendar-x",      theme:"education",  stage:"secondary",  label:"Persistent absence (all pupils)",                  a:{p:"Bristol",v:22.8}, b:{p:"National median",v:17.9}, unit:"%", src:"lginform", asOf:"2023/24", note:"Reaches 54.9% among children \u201Cin need\u201D." },
    { id:"opp", icon:"trending-up",          theme:"employment",stage:"transition",  label:"Youth Opportunity Index (of 100)",                 a:{p:"Bristol",v:47}, b:{p:"Bath and North East Somerset",v:62}, unit:"score", src:"lw", asOf:"2024", note:"Bristol ranks 112th nationally; Bath and North East Somerset 31st." },
    { id:"neet_health", icon:"heart-pulse",  theme:"employment",stage:"transition",  label:"Young people not in education, employment or training with a health condition", a:{p:"2025",v:44}, b:{p:"2015",v:26}, unit:"%", src:"milburn", asOf:"2025", note:"A growing barrier to participation." },
    { id:"coreside", icon:"house",     theme:"employment",stage:"transition",  label:"Young adults living with parents",                 a:{p:"Age 25",v:43}, b:{p:"Age 34",v:9}, unit:"%", src:"ifs", asOf:"2023/24", note:"Almost half of the lowest-income 25\u201334s." },
    { id:"neverjob", icon:"briefcase",     theme:"employment",stage:"transition",  label:"Young people not in education, employment or training who have never had a job", a:{p:"Today",v:61.6}, b:{p:"20 yrs ago",v:42}, unit:"%", src:"milburn", asOf:"2025", note:"Economic inactivity is becoming \u201Csticky\u201D." },
    { id:"health2534", icon:"heart-pulse",   theme:"health",     stage:"transition", label:"Adults 25\u201334 with a long-term condition",      a:{p:"2025",v:31}, b:{p:"Pre-2020",v:17}, unit:"%", src:"ifs", asOf:"2024", note:"Half of the rise has come since 2020." },
    { id:"uni", icon:"graduation-cap",          theme:"education",  stage:"transition", label:"Disadvantaged pupils progressing to university",   a:{p:"White British",v:18}, b:{p:"Black African",v:62}, unit:"%", src:"sutton", asOf:"2024", note:"In Bristol NW, 2% of white pupils eligible for free school meals hold a degree by 22." },
    { id:"degree", icon:"graduation-cap",       theme:"education",  stage:"cross",      label:"Adults with a degree, by ward",                    a:{p:"Hartcliffe and W.",v:15.8}, b:{p:"Redland",v:67}, unit:"%", src:"census", asOf:"2021", note:"A 51-point gap within one city." },
    { id:"hle_f", icon:"heart-pulse",        theme:"health",     stage:"cross",      label:"Healthy life expectancy (female)",                 a:{p:"Bristol",v:60.1}, b:{p:"Bath and North East Somerset",v:65.6}, unit:"yrs", src:"lginform", asOf:"2022-24", note:"Healthy years are falling — a wider trend." },
    { id:"le_gap", icon:"heart-pulse",       theme:"health",     stage:"cross",      label:"Life expectancy, women (ward extremes)",           a:{p:"Filwood",v:79.3}, b:{p:"Clifton Down",v:88.7}, unit:"yrs", src:"ward", asOf:"2024", note:"Over nine years apart, miles apart." },
    { id:"pov_ahc", icon:"coins",      theme:"health",     stage:"cross",      label:"Children in poverty (after housing)",              a:{p:"Bristol",v:25.6}, b:{p:"Bath and North East Somerset",v:16.3}, unit:"%", src:"ons", asOf:"2023", note:"37% live in income-deprived households." },
    { id:"care", icon:"hand-heart",         theme:"health",     stage:"cross",      label:"Children in care",                                 a:{p:"Bristol",v:81}, b:{p:"England",v:67}, unit:"per10k", src:"bcc", asOf:"2025", note:"753 children in care as of March 2025." },
    { id:"sports", icon:"dumbbell",       theme:"health",     stage:"cross",      label:"Sports facilities per 10,000",                     a:{p:"Bristol",v:11.4}, b:{p:"Bath and North East Somerset",v:24.7}, unit:"per10k", src:"ons", asOf:"2024", note:"Less than half the access of neighbouring Bath." }
  ];

  // ---- ward comparator metrics ----------------------------------------------
  var WARDS = {
    life_w:       { title:"Life expectancy at birth — women (years)", unit:"years", src:"ward",   wards:[ {n:"Troopers Hill, St George",v:89.5,t:"aff"}, {n:"Clifton Down",v:88.7,t:"aff"}, {n:"Filwood",v:79.3,t:"dep"}, {n:"St George West",v:78.5,t:"dep"} ] },
    children_pct: { title:"Children (0–15) as a share of population",  unit:"%",     src:"census", wards:[ {n:"Barton Hill",v:30,t:"dep"}, {n:"Hartcliffe",v:27.6,t:"dep"}, {n:"Lawrence Weston",v:26,t:"dep"}, {n:"City average",v:17.5,t:"city"} ] },
    suspensions:  { title:"Pupils suspended per 1,000",               unit:"per 1,000", src:"ward", wards:[ {n:"Hartcliffe and Withywood",v:110.8,t:"dep"}, {n:"Filwood",v:101.7,t:"dep"}, {n:"Lawrence Hill",v:97.2,t:"dep"} ] },
    degree_w:     { title:"Adults with a degree (%)",                 unit:"%",     src:"census", wards:[ {n:"Redland",v:67,t:"aff"}, {n:"Hartcliffe and Withywood",v:15.8,t:"dep"} ] }
  };

  // ---- EARLY-YEARS SUB-PAGE (ages 0–5) --------------------------------------
  //  Every topic from the early-years brief, each local figure paired with its
  //  benchmark ("the median" — England, a neighbour LA, or the prior year), and
  //  each wired to its source at the SMALLEST geography that source publishes.
  //  v:null  → value not yet confirmed; the live source link is still shown so
  //            the number can be read straight from the publisher (smallest grain).
  var EARLY = [
    // ---------------- Economic circumstances ----------------
    { id:"ey_pov",       icon:"coins",         cluster:"Economic circumstances", theme:"health",     label:"Children in relative poverty (after housing costs)", a:{p:"Bristol",v:25.6}, b:{p:"Bath and North East Somerset",v:16.3}, unit:"%", src:"ey_clif", asOf:"FYE 2025", note:"DWP local child-poverty stats; LSOA + after-housing-costs via Stat-Xplore." },
    { id:"ey_idaci",     icon:"scale-balance", cluster:"Economic circumstances", theme:"health",     label:"Children in income-deprived households (IDACI)", a:{p:"Bristol",v:37}, b:{p:"England avg",v:null}, unit:"%", src:"ey_idaci", asOf:"IoD 2025", note:"Over 30,400 children. IDACI score by LSOA — the city's small-area backbone." },

    // ---------------- Education and learning ----------------
    { id:”ey_eyfsp”,     icon:”seedling”,      cluster:”Education and learning”,   theme:”education”,  label:”Good Level of Development (EYFSP)”,           a:{p:”Bristol”,v:68.7}, b:{p:”England”,v:67.7}, unit:”%”,  src:”ey_eyfsp”, asOf:”2024/25”, note:”School-readiness at reception. Published to ward on Open Data Bristol.” },
    { id:”ey_ready”,     icon:”blocks”,        cluster:”Education and learning”,   theme:”education”,  label:”Children not “school ready” at reception”, a:{p:”South West”,v:36}, b:{p:”Year before”,v:33}, unit:”%”, src:”ey_kindred”, asOf:”Jan 2026”, note:”National survey of reception teachers — not localisable below region.” },
    { id:”ey_toilet”,    icon:”alert”,         cluster:”Education and learning”,   theme:”education”,  label:”Not toilet-trained when starting reception”, a:{p:”This year”,v:26}, b:{p:”Year before”,v:24}, unit:”%”, src:”ey_kindred”, asOf:”Jan 2026”, note:”Teacher-reported national estimate; no Bristol breakdown.” },

    // ---------------- Health and wellbeing ----------------
    { id:”ey_social”,    icon:”shield”,        cluster:”Health and wellbeing”,     theme:”health”,     label:”Children known to social care (in care)”,    a:{p:”Bristol”,v:81}, b:{p:”England”,v:67}, unit:”per10k”, src:”ey_socialcare”, asOf:”2025”, note:”753 children in care, March 2025. Ward breakdown on Open Data Bristol.” },
    { id:”ey_obesity”,   icon:”weight”,        cluster:”Health and wellbeing”,     theme:”health”,     label:”Overweight/obese at reception”,              a:{p:”Bristol”,v:10.8}, b:{p:”England”,v:9.9}, unit:”%”,  src:”ey_ncmp”, asOf:”2023/24”, note:”NCMP. Small-area estimates to ward/MSOA on Fingertips (3-yr pooled).” },
    { id:”ey_hle”,       icon:”heart”,         cluster:”Health and wellbeing”,     theme:”health”,     label:”Healthy life expectancy at birth (female)”,  a:{p:”Bristol”,v:60.1}, b:{p:”Bath and North East Somerset”,v:65.6}, unit:”yrs”, src:”ey_hle”, asOf:”2022-24”, note:”Years lived in good health. Local-authority level (ONS via LG Inform).” },
    { id:”ey_prem”,      icon:”heart-pulse”,   cluster:”Health and wellbeing”,     theme:”health”,     label:”Premature births (per 1,000)”,               a:{p:”South West”,v:74.8}, b:{p:”England”,v:null}, unit:”per1k”, src:”ey_prem”, asOf:”2022-24”, note:”Births under 37 weeks. A regional bright spot — the SW rate is England's lowest.” }
  ];

  window.BRISTOL_DATA = {
    updated: "June 2026",
    liveUrl: null,          // ← set to a CORS-enabled JSON URL to auto-pull updates
    sources: SOURCES,
    figures: FIGURES,
    charts: CHARTS,
    dumbbells: DUMBBELLS,
    indicators: INDICATORS,
    wards: WARDS,
    early: EARLY
  };
})();
