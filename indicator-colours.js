/* =============================================================================
 * indicator-colours.js  —  ONE place that decides the comparison colours.
 * Loaded by Bristol-Deprivation-Trends.html, -Education.html and -Housing.html.
 * -----------------------------------------------------------------------------
 * Colour rule (as requested):
 *   • the mean / benchmark (England) is always GRAY.
 *   • Bristol is GREEN when it is doing BETTER than the mean, otherwise RED.
 *   • where "better" is genuinely ambiguous (no clear good direction), RED.
 *
 * Whether Bristol is "better" depends on the indicator's POLARITY — the only
 * thing you normally need to edit here:
 *   'higher_better'  bigger number = better  (pay, employment, attainment…)
 *   'lower_better'   smaller number = better (child poverty, absence…)
 *   'ambiguous'      no clear direction -> Bristol shown RED (median age, tenure…)
 *
 * The actual green/red is then computed from the live values, so it stays
 * correct when the data changes — nothing here is a hard-coded colour per card.
 * ========================================================================== */
window.INDICATOR_COLOURS = (function () {
  var GREEN = '#3f6b56';   // Bristol better than the mean  (same green as before)
  var RED   = '#b0432b';   // Bristol worse / ambiguous      (same red as before)
  var GRAY  = '#8a8d86';   // the mean / England benchmark
  var MISSING = '#c9c4bb'; // a value we don't have

  // ---- Comparator shades (highest/lowest English LA, London, Manchester) -----
  // Same green=good / red=bad logic, but two extra tonal families so the four
  // comparator geographies are distinguishable from Bristol/England on a card:
  //   • max/min city  = DEEP shades (the national extremes)
  //   • London/Manch. = SOFT shades (a second reading vs the England mean)
  var CITY_GOOD = '#1f6b43';  // national extreme at the GOOD end (by polarity)
  var CITY_BAD  = '#8f2f1c';  // national extreme at the BAD end
  var LM_GOOD   = '#74a98d';  // London/Manchester better than the mean
  var LM_BAD    = '#cf9384';  // London/Manchester worse than the mean

  // A few indicators are stored/shown as the DISADVANTAGED attainment level even
  // though their headline polarity is the (lower-is-better) gap. For colouring the
  // comparator bars — which carry the disadvantaged level — treat them as
  // higher-is-better.
  var CPOL_OVERRIDE = { ks2_gap:'higher_better', eyfsp_gap:'higher_better' };
  function cpolarity(id){ return CPOL_OVERRIDE[id] || polarity(id); }

  // Colour for a national extreme bar. isMax = this is the highest value.
  function cityExtreme(id, isMax){
    var pol = cpolarity(id);
    if (pol === 'lower_better') return isMax ? CITY_BAD : CITY_GOOD;
    if (pol === 'higher_better') return isMax ? CITY_GOOD : CITY_BAD;
    return CITY_BAD; // ambiguous -> treat like "worse/unclear"
  }
  // Colour for a London/Manchester bar vs a reference (England mean where known,
  // else the Bristol value). GREEN-ish when better than the reference.
  function benchShade(id, val, ref){
    if (val == null) return MISSING;
    var pol = cpolarity(id);
    if (pol === 'ambiguous' || ref == null) return LM_BAD;
    if (pol === 'higher_better') return val > ref ? LM_GOOD : LM_BAD;
    if (pol === 'lower_better')  return val < ref ? LM_GOOD : LM_BAD;
    return LM_BAD;
  }

  // ---- POLARITY: edit these to change how an indicator is judged ----------
  var POLARITY = {
    // ── Work & income ──────────────────────────────────────────────
    employment:  'higher_better',
    inactivity:  'lower_better',
    pay:         'higher_better',
    gdhi:        'higher_better',
    child_pov:   'lower_better',
    ey_childpov: 'lower_better',
    ee_childpov: 'lower_better',

    // ── Education & skills ────────────────────────────────────────
    quals_l4:    'higher_better',
    quals_none:  'lower_better',
    degree_ward: 'higher_better',
    he_part:     'higher_better',   // young HE participation (TUNDRA), by ward
    child_pov_ward:'lower_better',  // children in relative low income, by ward
    suspensions_ward:'lower_better',
    ks2_rwm:     'higher_better',
    ks2_gap:     'lower_better',     // a smaller disadvantage gap is better
    attainment8: 'higher_better',
    progress8:   'higher_better',
    gcse5_em:    'higher_better',
    eyfsp_gld:   'higher_better',
    eyfsp_gap:   'lower_better',
    ee_gld:      'higher_better',
    ee_ready:    'higher_better',
    ey_ready:    'higher_better',
    phonics:     'higher_better',
    prim_oo:     'higher_better',
    absence:     'lower_better',
    suspensions: 'lower_better',
    neet:        'lower_better',
    he_prog:     'higher_better',
    fsm_uni:     'higher_better',
    fsm_bristol: 'higher_better',
    excl_gcse:   'higher_better',
    early_access:'higher_better',
    ee_access:   'higher_better',
    ey_earlyaccess:'higher_better',

    // ── Health & wellbeing ────────────────────────────────────────
    le_male:     'higher_better',
    le_female:   'higher_better',
    le_city_m:   'higher_better',
    ey_le_birth: 'higher_better',
    ey_le_birthf:'higher_better',
    hle_f:       'higher_better',
    health_index:'higher_better',
    health_bad:  'lower_better',
    disability:  'ambiguous',
    ey_disab:    'ambiguous',
    unpaid_care: 'ambiguous',

    // ── Home & deprivation ────────────────────────────────────────
    deprived_34: 'lower_better',
    deprived_any:'lower_better',
    ey_deprived: 'lower_better',
    ee_deprived: 'lower_better',
    overcrowd:   'lower_better',
    ey_overcrowd:'lower_better',
    ee_overcrowd:'lower_better',
    no_heating:  'lower_better',
    ey_heating:  'lower_better',
    no_car:      'lower_better',
    social_rent: 'ambiguous',        // higher social renting isn't clearly better/worse
    own_outright:'higher_better',
    nssec_rout:  'lower_better',
    lone_parent: 'ambiguous',
    median_age:  'ambiguous',
    child_share: 'ambiguous',

    // ── Economy of deprivation (Bristol-Deprivation-Economy.html) ─────────
    child_low_income:     'lower_better',
    child_low_income_abs: 'lower_better',
    idaci:                'lower_better',
    fsm:                  'lower_better',
    fuel_poverty:         'lower_better',
    imd_income:           'lower_better',
    gdhi:                 'higher_better',   // (also used by the ONS-Census page)
    imd_employment:       'lower_better',
    nssec_routine:        'lower_better',
    house_price_earnings: 'lower_better',    // higher ratio = less affordable
    employment_rate:      'higher_better',
    econ_inactivity:      'lower_better',
    pay_median:           'higher_better',
    low_pay:              'lower_better',
    claimant_count:       'lower_better',
    neet:                 'lower_better',    // (shared id with education)
    gva_head:             'higher_better',
    imd_decile:           'lower_better',
    inactivity_sick:      'lower_better'
  };

  function polarity(id) { return POLARITY[id] || 'ambiguous'; }

  // Core rule for an explicit polarity string (used by charts whose bars carry
  // no indicator id). GREEN if Bristol is better than the mean, else RED.
  function byPolarity(pol, bristolVal, meanVal) {
    if (bristolVal == null) return MISSING;
    if (pol === 'ambiguous' || meanVal == null) return RED;
    if (pol === 'higher_better') return bristolVal > meanVal ? GREEN : RED;
    if (pol === 'lower_better')  return bristolVal < meanVal ? GREEN : RED;
    return RED;
  }

  // Bristol colour for an indicator id (looks up its polarity).
  function bristol(id, bristolVal, meanVal) {
    return byPolarity(polarity(id), bristolVal, meanVal);
  }

  function isBetter(id, bristolVal, meanVal) {
    return bristol(id, bristolVal, meanVal) === GREEN;
  }

  return {
    GREEN: GREEN, RED: RED, GRAY: GRAY, MISSING: MISSING,
    CITY_GOOD: CITY_GOOD, CITY_BAD: CITY_BAD, LM_GOOD: LM_GOOD, LM_BAD: LM_BAD,
    POLARITY: POLARITY, polarity: polarity, cpolarity: cpolarity,
    mean: function () { return GRAY; },
    bristol: bristol, byPolarity: byPolarity, isBetter: isBetter,
    cityExtreme: cityExtreme, benchShade: benchShade
  };
})();
