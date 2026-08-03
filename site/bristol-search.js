/* =============================================================================
 * bristol-search.js — fuzzy indicator search, shared by every page.
 * -----------------------------------------------------------------------------
 * Builds one index over every indicator in window.BRISTOL_DATA (the ONS/Census
 * "housing" story, its early-years subpage, and the education story with its
 * own early-years subpage), then mounts a search bar at the top of the page.
 *
 * Matching is deliberately forgiving — a typed query does NOT have to be an
 * exact substring of an indicator label:
 *     "overcrowdin"    -> Overcrowded households        (typo / truncation)
 *     "kids poverty"   -> Children in relative low income (synonym)
 *     "no quals"       -> Adults with no qualifications (abbreviation)
 *     "life expct"     -> Life expectancy at birth      (dropped letters)
 *
 * Usage
 *   BRISTOL_SEARCH.init({
 *     page:  'education' | 'housing' | 'index',
 *     reveal: function(entry){ ... return DOM element or null }   // page pages only
 *   });
 *
 * On the story pages the search bar jumps to the matching indicator card
 * (a card is found via its data-ind="<indicator id>" attribute). On index.html
 * it links out to the right story page with #i=<indicator id>, which that page
 * picks up on load.
 * ========================================================================== */
window.BRISTOL_SEARCH = (function () {

  var RED = '#C02F38', INK = '#1a1f1c', SOFT = '#4a544e', LINE = 'rgba(26,31,28,.16)';

  var PAGES = {
    education: { label: 'Education', href: 'Bristol-Deprivation-Education-ranked.html' },
    housing:   { label: 'Housing',   href: 'Bristol-Deprivation-Housing-ranked.html' }
  };

  var PHASES = {
    early: 'Early years', primary: 'Primary phase', secondary: 'Secondary phase',
    transition: 'Transition to adulthood', cross: 'Cross-cutting'
  };

  /* --- everyday words -> the vocabulary the indicator labels actually use ---
     Each query token is also tried as its expansions (at a slight discount),
     so a plain-English guess still finds the indicator. */
  var SYNONYMS = {
    kid: 'children child', kids: 'children child', children: 'child pupils',
    child: 'children pupils', baby: 'early years infant', babies: 'early years infant',
    toddler: 'early years', nursery: 'early years childcare access',
    poverty: 'low income deprived deprivation',
    poor: 'low income deprived poverty', deprived: 'deprivation low income poverty',
    money: 'income pay earnings disposable', income: 'pay earnings disposable money',
    pay: 'income earnings wage salary', wage: 'pay income earnings',
    salary: 'pay income earnings', benefits: 'low income universal credit',
    jobs: 'employment work occupation economic activity',
    job: 'employment work occupation', work: 'employment jobs occupation',
    unemployed: 'employment inactivity economic activity',
    unemployment: 'employment inactivity economic activity',
    housing: 'household home tenure rent overcrowded heating',
    house: 'household home tenure housing', home: 'household housing tenure',
    rent: 'rented tenure social rent housing', renting: 'rented tenure housing',
    landlord: 'rented tenure private rent', tenure: 'rented owning housing',
    crowded: 'overcrowded occupancy', overcrowding: 'overcrowded occupancy',
    heating: 'central heating fuel poverty', fuel: 'heating fuel poverty',
    car: 'car or van vehicle transport', cars: 'car or van vehicle transport',
    transport: 'car or van travel commute',
    health: 'general health illness disability wellbeing',
    ill: 'health bad health illness disability', illness: 'health disability',
    sick: 'health illness inactivity disability',
    disabled: 'disability health', disability: 'disabled health',
    care: 'unpaid care carer health', carer: 'unpaid care health',
    lifespan: 'life expectancy', longevity: 'life expectancy',
    death: 'life expectancy mortality', mortality: 'life expectancy',
    school: 'pupils education attainment schools',
    schools: 'pupils education attainment school',
    pupil: 'pupils school education', pupils: 'pupil school education',
    education: 'school qualifications attainment learning',
    learning: 'education school attainment',
    grades: 'attainment gcse progress key stage',
    gcse: 'attainment 8 progress 8 key stage 4 grade 5',
    results: 'attainment progress key stage',
    exams: 'attainment gcse key stage phonics',
    reading: 'phonics reading writing and maths key stage 2',
    maths: 'reading writing and maths key stage 2',
    absent: 'absence persistent absence attendance',
    absence: 'absent persistent attendance',
    attendance: 'absence absent persistent',
    truancy: 'absence persistent absent',
    excluded: 'exclusions suspensions suspended',
    exclusion: 'exclusions suspensions suspended',
    expelled: 'exclusions permanent suspensions',
    suspended: 'suspensions exclusions', suspension: 'suspensions exclusions',
    uni: 'university higher education degree',
    university: 'higher education degree progression',
    college: 'higher education level 3 further education',
    degree: 'level 4 qualifications university higher education graduate',
    graduate: 'degree level 4 qualifications',
    quals: 'qualifications level 4 no qualifications',
    qualification: 'qualifications level 4',
    qualifications: 'qualification level 4 degree',
    neet: 'not in education employment or training',
    apprenticeship: 'training level 3 employment',
    readiness: 'good level of development school ready early years foundation',
    ready: 'good level of development school ready',
    gld: 'good level of development early years foundation stage',
    fsm: 'free school meals disadvantaged',
    disadvantaged: 'free school meals gap deprived',
    gap: 'disadvantage gap difference disadvantaged',
    inequality: 'gap disadvantage deprivation',
    ward: 'wards area neighbourhood', wards: 'ward area neighbourhood',
    area: 'ward neighbourhood place', place: 'ward area neighbourhood',
    age: 'median age population', population: 'population share median age',
    ethnicity: 'ethnic group white black',
    single: 'lone parent', 'lone': 'lone parent single'
  };

  /* ------------------------------------------------------------------ utils */
  function norm(s) {
    return ('' + (s == null ? '' : s))
      .toLowerCase()
      .replace(/[‐-―−]/g, '-')       // fancy dashes -> hyphen
      .replace(/[‘’]/g, "'")
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  function tokens(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function esc(s) {
    return ('' + (s == null ? '' : s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // bounded Levenshtein — returns a number > max as soon as it is certain
  function editDist(a, b, max) {
    if (a === b) return 0;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur[0] = i;
      var best = cur[0];
      for (j = 1; j <= lb; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      for (j = 0; j <= lb; j++) prev[j] = cur[j];
    }
    return prev[lb];
  }

  // are the characters of q a (gappy) subsequence of t? -> quality 0..1
  function subseq(q, t) {
    var qi = 0, ti = 0, first = -1, last = -1;
    while (qi < q.length && ti < t.length) {
      if (q.charAt(qi) === t.charAt(ti)) { if (first < 0) first = ti; last = ti; qi++; }
      ti++;
    }
    if (qi < q.length) return 0;
    var span = last - first + 1;
    return q.length / span;                   // 1 = contiguous, lower = scattered
  }

  function tolerance(len) { return len >= 8 ? 2 : (len >= 5 ? 2 : (len >= 4 ? 1 : 0)); }

  // score one query token against one field (a token list + its joined text)
  function scoreToken(q, field) {
    var joined = field.text, ws = field.words, best = 0, i;
    if (!q) return 0;
    if (joined.indexOf(q) >= 0) {
      // word-start match beats a mid-word one
      for (i = 0; i < ws.length; i++) {
        if (ws[i] === q) return 1;
        if (ws[i].indexOf(q) === 0) best = Math.max(best, 0.94);
      }
      best = Math.max(best, 0.78);
    }
    if (best >= 0.94) return best;
    var tol = tolerance(q.length);
    for (i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (tol > 0 && Math.abs(w.length - q.length) <= tol) {
        var d = editDist(q, w, tol);
        if (d <= tol) best = Math.max(best, 0.86 - 0.13 * d);
      }
      // typed a prefix of a longer word with a typo in it ("overcrowdin")
      if (tol > 0 && w.length > q.length && q.length >= 4) {
        var d2 = editDist(q, w.slice(0, q.length), tol);
        if (d2 <= tol) best = Math.max(best, 0.72 - 0.12 * d2);
      }
      if (best < 0.6 && q.length >= 3) {
        var s = subseq(q, w);
        if (s > 0) best = Math.max(best, 0.34 + 0.24 * s);
      }
    }
    if (best === 0 && q.length >= 4) {
      var sj = subseq(q, joined);
      if (sj > 0) best = Math.max(best, 0.22 + 0.16 * sj);
    }
    return best;
  }

  /* multi-word phrases that mean one indicator's own vocabulary */
  var PHRASES = {
    'free school meals': 'fsm disadvantaged',
    'school ready': 'good level of development',
    'school readiness': 'good level of development',
    'not in education employment or training': 'neet',
    'social housing': 'social rented housing',
    'council housing': 'social rented housing',
    'higher education': 'university degree progression',
    'key stage 2': 'ks2 reading writing and maths',
    'key stage 4': 'ks4 attainment 8 gcse',
    'life expectancy': 'life expectancy birth',
    'good level of development': 'gld early years foundation'
  };

  function expansions(q) {
    var e = SYNONYMS[q];
    if (!e) {
      // also try the singular / plural of the typed word
      if (q.length > 3 && q.charAt(q.length - 1) === 's') e = SYNONYMS[q.slice(0, -1)];
      if (!e) e = SYNONYMS[q + 's'];
    }
    if (!e) return [];
    // drop very short expansion words ("no", "or", "in") — they match anything
    return e.split(' ').filter(function (w) { return w.length >= 4 && w !== q; });
  }

  // the typed query, plus one variant per phrase alias it contains
  function queryVariants(query) {
    var n = norm(query), list = [n.split(' ')];
    for (var p in PHRASES) {
      if (Object.prototype.hasOwnProperty.call(PHRASES, p) && n.indexOf(p) >= 0) {
        var v = norm(n.split(p).join(' ' + PHRASES[p] + ' '));
        if (v && v !== n) list.push(v.split(' '));
      }
    }
    return list;
  }

  /* ------------------------------------------------------------------ index */
  function field(text) { var n = norm(text); return { text: n, words: n ? n.split(' ') : [] }; }

  function makeEntry(i, page, where) {
    var TH = window.BRISTOL_THEMES;
    var themeLab = (TH && TH.themeLabel && TH.themeLabel(i.id)) ||
                   (TH && TH.THEMES && i.theme && TH.THEMES[i.theme] && TH.THEMES[i.theme].label) || '';
    var phaseLab = PHASES[i.stage] || '';
    var e = {
      id: i.id,
      label: i.label || i.id,
      note: i.note || '',
      cluster: i.cluster || '',
      theme: themeLab,
      phase: phaseLab,
      stage: i.stage || '',
      themeKey: i.theme || '',
      unit: i.unit || '',
      a: i.a, b: i.b,
      asOf: i.asOf || '',
      page: page,
      where: where                              // 'main' | 'early'
    };
    e.fields = [
      { w: 1.00, f: field(e.label) },
      { w: 0.78, f: field(e.id.replace(/_/g, ' ')) },
      { w: 0.44, f: field(e.theme + ' ' + e.phase + ' ' + e.cluster) },
      { w: 0.40, f: field(e.note) },
      { w: 0.30, f: field(((e.a && e.a.p) || '') + ' ' + ((e.b && e.b.p) || '') + ' ' + e.asOf) }
    ];
    return e;
  }

  function collect(pages) {
    var D = window.BRISTOL_DATA, out = [], seen = {};
    if (!D) return out;
    function add(list, page, where) {
      (list || []).forEach(function (i) {
        if (!i || !i.id) return;
        var k = page + '|' + i.id;
        if (seen[k]) return;
        seen[k] = 1;
        out.push(makeEntry(i, page, where));
      });
    }
    if (pages.indexOf('housing') >= 0) {
      add(D.indicators, 'housing', 'main');
      add(D.early, 'housing', 'early');
    }
    if (pages.indexOf('education') >= 0 && D.education) {
      add(D.education.indicators, 'education', 'main');
      add(D.education.early, 'education', 'early');
    }
    return out;
  }

  /* ----------------------------------------------------------------- search */
  function scoreEntry(e, qs, rawQuery) {
    var total = 0, matched = 0, hitLabel = 0;
    for (var t = 0; t < qs.length; t++) {
      var q = qs[t], best = 0, bestField = -1;
      for (var f = 0; f < e.fields.length; f++) {
        var s = scoreToken(q, e.fields[f].f) * e.fields[f].w;
        if (s > best) { best = s; bestField = f; }
      }
      var ex = expansions(q);
      for (var x = 0; x < ex.length; x++) {
        if (qs.indexOf(ex[x]) >= 0) continue;         // already a typed token
        for (var f2 = 0; f2 < e.fields.length; f2++) {
          var s2 = scoreToken(ex[x], e.fields[f2].f) * e.fields[f2].w * 0.8;
          if (s2 > best) { best = s2; bestField = f2; }
        }
      }
      if (best > 0.18) { matched++; total += best; if (bestField === 0) hitLabel++; }
    }
    if (!matched) return 0;
    // every token should land somewhere; if not, keep it but heavily penalised
    var coverage = matched / qs.length;
    var score = (total / qs.length) * (coverage === 1 ? 1 : coverage * 0.45);
    score += hitLabel * 0.06;                                     // prefer label hits
    var lab = norm(e.label), nq = norm(rawQuery);
    if (lab.indexOf(nq) === 0) score += 0.35;                     // whole-phrase prefix
    else if (lab.indexOf(nq) > 0) score += 0.18;
    if (norm(e.id) === nq) score += 0.6;                          // typed the id itself
    return score;
  }

  function search(index, query, limit) {
    if (norm(query).length < 2) return [];
    var variants = queryVariants(query).filter(function (v) { return v.length && v[0]; });
    if (!variants.length) return [];
    var results = [];
    for (var n = 0; n < index.length; n++) {
      var e = index[n], score = 0;
      for (var v = 0; v < variants.length; v++) {
        var s = scoreEntry(e, variants[v], query) * (v === 0 ? 1 : 0.97);
        if (s > score) score = s;
      }
      if (score > 0.2) results.push({ e: e, score: score });
    }
    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.e.label.length - b.e.label.length;
    });
    // the same indicator can sit in both a story and its early-years subpage —
    // show it once per page, keeping the better-scoring copy
    var seen = {}, out = [];
    for (var r = 0; r < results.length; r++) {
      var k = results[r].e.page + '|' + norm(results[r].e.label);
      if (seen[k]) continue;
      seen[k] = 1; out.push(results[r]);
      if (out.length >= (limit || 10)) break;
    }
    return out;
  }

  /* --------------------------------------------------------------- rendering */
  function injectCSS() {
    if (document.getElementById('bs-css')) return;
    var css =
      "#bs-wrap{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:140;width:min(560px,calc(100vw - 40px));font-family:'IBM Plex Sans',system-ui,sans-serif}" +
      "#bs-box{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid " + LINE + ";border-radius:999px;padding:9px 16px;box-shadow:0 8px 26px -18px rgba(26,31,28,.5);transition:border-color .18s ease,box-shadow .18s ease}" +
      "#bs-wrap.on #bs-box{border-color:" + RED + ";box-shadow:0 14px 34px -18px rgba(26,31,28,.55)}" +
      "#bs-in{flex:1;border:none;outline:none;background:transparent;font:400 14px/1.4 'IBM Plex Sans',system-ui,sans-serif;color:" + INK + "}" +
      "#bs-in::placeholder{color:#9a9389}" +
      "#bs-hint{font:500 10px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;color:#9a9389;border:1px solid rgba(26,31,28,.18);border-radius:4px;padding:4px 6px;white-space:nowrap}" +
      "#bs-clear{display:none;border:none;background:none;cursor:pointer;color:#9a9389;font-size:17px;line-height:1;padding:0 2px}" +
      "#bs-res{display:none;margin-top:8px;background:#fff;border:1px solid " + LINE + ";border-radius:6px;box-shadow:0 20px 44px -22px rgba(26,31,28,.6);max-height:min(62vh,520px);overflow-y:auto}" +
      "#bs-wrap.open #bs-res{display:block}" +
      ".bs-item{display:block;width:100%;text-align:left;border:none;background:none;cursor:pointer;padding:12px 16px;border-bottom:1px solid rgba(26,31,28,.08);text-decoration:none;color:inherit}" +
      ".bs-item:last-child{border-bottom:none}" +
      ".bs-item.sel,.bs-item:hover{background:rgba(192,47,56,.07)}" +
      ".bs-lab{font-size:14px;font-weight:600;line-height:1.35;color:" + INK + ";margin-bottom:4px}" +
      ".bs-meta{font:500 9.5px/1.5 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:" + SOFT + ";display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
      ".bs-badge{color:#fff;background:" + RED + ";border-radius:3px;padding:2px 5px}" +
      ".bs-val{font-family:'Newsreader',serif;font-size:14px;color:" + RED + ";text-transform:none;letter-spacing:0}" +
      ".bs-none{padding:16px;font-size:13.5px;color:" + SOFT + "}" +
      "@keyframes bs-flash{0%{box-shadow:0 0 0 3px rgba(192,47,56,.85)}70%{box-shadow:0 0 0 3px rgba(192,47,56,.85)}100%{box-shadow:0 0 0 3px rgba(192,47,56,0)}}" +
      ".bs-hit{animation:bs-flash 2.4s ease-out 1;border-color:" + RED + " !important}" +
      "@media(max-width:900px){#bs-wrap{width:calc(100vw - 24px)}#bs-hint{display:none}}";
    var st = document.createElement('style');
    st.id = 'bs-css'; st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  function fmt(v, u) {
    if (v == null) return '—';
    if (u === '%') return v + '%';
    if (u === 'yrs') return v + ' yrs';
    if (u === '£') return '£' + Number(v).toLocaleString();
    return '' + v;
  }

  function itemHTML(r, multiPage, selected) {
    var e = r.e;
    var bits = [];
    if (multiPage) bits.push("<span class='bs-badge'>" + esc(PAGES[e.page].label) + "</span>");
    if (e.phase) bits.push(esc(e.phase));
    if (e.theme) bits.push(esc(e.theme));
    if (e.where === 'early') bits.push('Early-years dataset');
    var val = (e.a && e.a.v != null)
      ? "<span class='bs-val'>" + esc((e.a.p || '') + ' ' + fmt(e.a.v, e.unit)) + "</span>" : '';
    return "<button class='bs-item" + (selected ? ' sel' : '') + "' data-i='" + r.idx + "' type='button'>" +
      "<div class='bs-lab'>" + esc(e.label) + "</div>" +
      "<div class='bs-meta'>" + bits.join('<span style="opacity:.4">·</span>') + (val ? '<span style="flex:1"></span>' + val : '') + "</div>" +
    "</button>";
  }

  /* ------------------------------------------------------------------- init */
  function init(opts) {
    opts = opts || {};
    var page = opts.page || 'index';
    var multiPage = (page === 'index');
    var pages = multiPage ? ['housing', 'education'] : [page];
    var index = collect(pages);
    if (!index.length) return null;

    injectCSS();

    var wrap = document.createElement('div');
    wrap.id = 'bs-wrap';
    wrap.innerHTML =
      "<div id='bs-box'>" +
        "<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='" + RED + "' stroke-width='2.2' stroke-linecap='round' aria-hidden='true'><circle cx='11' cy='11' r='7'></circle><line x1='16.5' y1='16.5' x2='21' y2='21'></line></svg>" +
        "<input id='bs-in' type='search' autocomplete='off' spellcheck='false' " +
          "placeholder='" + esc(opts.placeholder || 'Search indicators — try “child poverty”, “overcrowdin”, “no quals”') + "' " +
          "aria-label='Search indicators'>" +
        "<button id='bs-clear' type='button' title='Clear' aria-label='Clear search'>×</button>" +
        "<span id='bs-hint'>/</span>" +
      "</div>" +
      "<div id='bs-res' role='listbox'></div>";
    document.body.appendChild(wrap);

    var input = document.getElementById('bs-in');
    var resBox = document.getElementById('bs-res');
    var clear = document.getElementById('bs-clear');
    var hint = document.getElementById('bs-hint');
    var results = [], sel = -1;

    function close() { wrap.classList.remove('open'); sel = -1; }
    function open() { if (results.length) wrap.classList.add('open'); }

    function draw() {
      if (!results.length) {
        resBox.innerHTML = "<div class='bs-none'>No indicator matches that. Try a broader word — “poverty”, “housing”, “absence”, “degree”.</div>";
        wrap.classList.add('open');
        return;
      }
      resBox.innerHTML = results.map(function (r, n) { r.idx = n; return itemHTML(r, multiPage, n === sel); }).join('');
      [].forEach.call(resBox.querySelectorAll('.bs-item'), function (b) {
        b.onmousedown = function (ev) { ev.preventDefault(); };
        b.onclick = function () { go(results[+b.getAttribute('data-i')].e); };
      });
      wrap.classList.add('open');
    }

    function run() {
      var q = input.value;
      clear.style.display = q ? 'block' : 'none';
      hint.style.display = q ? 'none' : '';
      if (norm(q).length < 2) { results = []; close(); return; }
      results = search(index, q, 12);
      sel = results.length ? 0 : -1;
      draw();
    }

    function move(d) {
      if (!results.length) return;
      sel = (sel + d + results.length) % results.length;
      var items = resBox.querySelectorAll('.bs-item');
      [].forEach.call(items, function (b, n) {
        if (n === sel) { b.classList.add('sel'); b.scrollIntoView({ block: 'nearest' }); }
        else b.classList.remove('sel');
      });
    }

    function go(entry) {
      close();
      input.blur();
      if (multiPage || entry.page !== page) {
        window.location.href = PAGES[entry.page].href + '#i=' + encodeURIComponent(entry.id);
        return;
      }
      jumpTo(entry, opts.reveal);
    }

    input.addEventListener('input', run);
    input.addEventListener('focus', function () { if (norm(input.value)) run(); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); open(); move(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); open(); move(-1); }
      else if (ev.key === 'Enter') { ev.preventDefault(); if (results[sel]) go(results[sel].e); }
      else if (ev.key === 'Escape') { ev.preventDefault(); if (wrap.classList.contains('open')) close(); else { input.value = ''; run(); input.blur(); } }
    });
    input.addEventListener('blur', function () { setTimeout(close, 130); });
    input.addEventListener('focus', function () { wrap.classList.add('on'); });
    input.addEventListener('blur', function () { wrap.classList.remove('on'); });
    clear.onclick = function () { input.value = ''; run(); input.focus(); };

    document.addEventListener('keydown', function (ev) {
      var t = ev.target, tag = t && t.tagName;
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable);
      if ((ev.key === '/' && !typing) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k')) {
        ev.preventDefault(); input.focus(); input.select();
      }
    });

    // deep link from another page: #i=<indicator id>
    function fromHash() {
      var m = /(?:^|[#&])i=([^&]+)/.exec(window.location.hash || '');
      if (!m) return;
      var id = decodeURIComponent(m[1]);
      var hit = null;
      for (var n = 0; n < index.length; n++) if (index[n].id === id) { hit = index[n]; break; }
      if (hit) setTimeout(function () { jumpTo(hit, opts.reveal); }, 320);
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);

    return { index: index, search: function (q, n) { return search(index, q, n); }, input: input };
  }

  /* ----------------------------------------------------- jump to a card ---- */
  function jumpTo(entry, reveal) {
    var node = null;
    try { node = reveal ? reveal(entry) : null; } catch (e) { node = null; }
    if (!node) node = document.querySelector("[data-ind='" + entry.id + "']");
    if (!node) return false;

    var overlay = document.getElementById('ey-sub');
    var inOverlay = overlay && overlay.contains(node);

    setTimeout(function () {
      if (inOverlay) {
        var top = node.getBoundingClientRect().top - overlay.getBoundingClientRect().top + overlay.scrollTop;
        overlay.scrollTo({ top: Math.max(0, top - 90), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
      }
      node.classList.add('bs-hit');
      setTimeout(function () { node.classList.remove('bs-hit'); }, 2600);
    }, inOverlay ? 90 : 0);
    return true;
  }

  return { init: init, search: search, collect: collect, jumpTo: jumpTo };
})();
