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
    child_share: 'ambiguous'
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
    POLARITY: POLARITY, polarity: polarity,
    mean: function () { return GRAY; },
    bristol: bristol, byPolarity: byPolarity, isBetter: isBetter
  };
})();
