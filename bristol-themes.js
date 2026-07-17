/* =============================================================================
 * bristol-themes.js — ONE place that categorises every indicator.
 * -----------------------------------------------------------------------------
 * Four themes (agreed taxonomy):
 *   economic    Economic circumstances
 *   health      Health and wellbeing
 *   education   Education and learning
 *   employment  Employment and independence
 *
 * Four life-course phases (labels used on every page):
 *   early       Early years
 *   primary     Primary phase
 *   secondary   Secondary phase
 *   transition  Transition to adulthood
 *   cross       Cross-cutting (indicators spanning the whole life course)
 * ========================================================================== */
window.BRISTOL_THEMES = (function () {

  var THEMES = {
    economic:   { label: 'Economic circumstances',      color: '#C02F38' },
    health:     { label: 'Health and wellbeing',        color: '#7d2733' },
    education:  { label: 'Education and learning',      color: '#1a1f1c' },
    employment: { label: 'Employment and independence', color: '#4a544e' }
  };

  var PHASES = {
    early:      'Early years',
    primary:    'Primary phase',
    secondary:  'Secondary phase',
    transition: 'Transition to adulthood',
    cross:      'Cross-cutting'
  };

  // indicator id -> theme key (covers bristol-data-ons-census.js,
  // bristol-economic.js and bristol-trends.js; ids shared across files agree)
  var BY_ID = {
    // ---- Economic circumstances ----
    child_share:'economic', child_pov:'economic', overcrowd:'economic',
    no_heating:'economic', deprived_34:'economic', deprived_any:'economic',
    social_rent:'economic', no_car:'economic', lone_parent:'economic',
    own_outright:'economic', gdhi:'economic', median_age:'economic',
    ey_childpov:'economic', ey_overcrowd:'economic', ey_heating:'economic',
    ey_deprived:'economic', ee_childpov:'economic', ee_overcrowd:'economic',
    ee_deprived:'economic',
    child_low_income:'economic', child_low_income_abs:'economic', idaci:'economic',
    fsm:'economic', fuel_poverty:'economic', imd_income:'economic',
    house_price_earnings:'economic', gva_head:'economic', imd_decile:'economic',

    // ---- Health and wellbeing ----
    health_bad:'health', health_index:'health', disability:'health',
    unpaid_care:'health', le_city_m:'health', le_male:'health',
    le_female:'health', hle_f:'health',
    ey_le_birth:'health', ey_le_birthf:'health', ey_disab:'health',
    inactivity_sick:'health',

    // ---- Education and learning ----
    quals_l4:'education', quals_none:'education', fsm_uni:'education',
    fsm_bristol:'education', degree_ward:'education',
    eyfsp_gld:'education', eyfsp_gap:'education', early_access:'education',
    phonics:'education', ks2_rwm:'education', ks2_gap:'education',
    prim_oo:'education', attainment8:'education', gcse5_em:'education',
    progress8:'education', absence:'education', suspensions:'education',
    he_prog:'education', excl_gcse:'education',
    ey_ready:'education', ey_earlyaccess:'education',
    ee_gld:'education', ee_ready:'education', ee_access:'education',

    // ---- Employment and independence ----
    nssec_rout:'employment', nssec_routine:'employment', employment:'employment',
    inactivity:'employment', pay:'employment', pay_median:'employment',
    imd_employment:'employment', employment_rate:'employment',
    econ_inactivity:'employment', low_pay:'employment',
    claimant_count:'employment', neet:'employment'
  };

  function themeKey(id){ return BY_ID[id] || null; }
  function themeLabel(id){ var k=BY_ID[id]; return k ? THEMES[k].label : ''; }
  function themeColor(id){ var k=BY_ID[id]; return k ? THEMES[k].color : '#4a544e'; }
  function phaseLabel(stage){ return PHASES[stage] || ''; }

  return { THEMES:THEMES, PHASES:PHASES, BY_ID:BY_ID,
           themeKey:themeKey, themeLabel:themeLabel, themeColor:themeColor,
           phaseLabel:phaseLabel };
})();
