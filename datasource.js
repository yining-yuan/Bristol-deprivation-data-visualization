/* =============================================================================
   datasource.js  —  FILL-IN DATA FILE for the Template Page
   -----------------------------------------------------------------------------
   This is the "one place to put the numbers" that goes with Template Page.html.
   It is written for a NON-TECHNICAL editor. You only ever change the text that
   sits inside the "quotation marks". Never change the words in CAPITALS on the
   left, and never remove a comma or a curly bracket { }.

   THE SIX KINDS OF SLOT YOU FILL:
       TITLE        a heading                 e.g. "How things happen here"
       ANALYSE      a sentence of story       e.g. "The gap opens early..."
       FIGURE       one number to show big    e.g. "37%"  (keep the % or yrs)
       DATA         a short label / number    e.g. "Bristol"
       DATA_SOURCE  who published it          e.g. "Census 2021"
       LINK         the web address           e.g. "https://www.ons.gov.uk/..."

   A GOOD RULE: if you are unsure, just type the words a reader should see.
   Leave a slot as "[TO FILL]" if you do not have it yet — the page will show
   it in magenta so you can find it later.
============================================================================= */

window.PAGE_DATA = {

  /* ---- Top of the page -------------------------------------------------- */
  brand:   "[DATA — organisation / brand]",   // small text, top-left of the hero
  date:    "[DATA — date, e.g. July 2026]",   // shown as "A data story · ..."

  hero: {
    kicker:   "[TITLE — small line above the headline]",
    headline: "[TITLE — the big headline of the whole story]",
    intro:    "[ANALYSE TEXT — one or two sentences that set up the story]",
    // The three big numbers on the hero. Add or remove blocks to taste.
    figures: [
      { value: "[FIGURE]", label: "[DATA — what this number means]" },
      { value: "[FIGURE]", label: "[DATA — what this number means]" },
      { value: "[FIGURE]", label: "[DATA — what this number means]" }
    ]
  },

  /* ---- Intro section: text + two little comparison charts --------------- */
  intro: {
    label:    "[TITLE — section label]",
    headline: "[TITLE — section headline]",
    para1:    "[ANALYSE TEXT — first paragraph]",
    para2:    "[ANALYSE TEXT — second paragraph]",
    callout:  "[ANALYSE TEXT — a short 'how to read this' note]",
    // Each comparison shows two bars: a local figure and a benchmark figure.
    comparisons: [
      {
        title:      "[TITLE — what this chart shows]",
        rowA:       { label: "[DATA — label]", value: "[FIGURE]" },   // shown in red
        rowB:       { label: "[DATA — label]", value: "[FIGURE]" },   // shown in green
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      },
      {
        title:      "[TITLE — what this chart shows]",
        rowA:       { label: "[DATA — label]", value: "[FIGURE]" },
        rowB:       { label: "[DATA — label]", value: "[FIGURE]" },
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      }
    ]
  },

  /* ---- Numbered chapters (the "acts" of the story) --------------------- */
  /* Copy a whole { ... } block to add another chapter, or delete one.      */
  chapters: [
    {
      label:    "[TITLE — chapter label]",
      headline: "[TITLE — chapter headline]",
      intro:    "[ANALYSE TEXT — introduce this chapter]",
      // Three stat cards: one big number, a description, a context line.
      cards: [
        { value: "[FIGURE]", title: "[DATA — what the number describes]", note: "[ANALYSE TEXT — one sentence of context]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" },
        { value: "[FIGURE]", title: "[DATA — what the number describes]", note: "[ANALYSE TEXT — one sentence of context]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" },
        { value: "[FIGURE]", title: "[DATA — what the number describes]", note: "[ANALYSE TEXT — one sentence of context]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" }
      ]
    },
    {
      label:    "[TITLE — chapter label]",
      headline: "[TITLE — chapter headline]",
      intro:    "[ANALYSE TEXT — introduce this chapter]",
      // A chart plus two mini-cards beside it.
      chart: {
        title:      "[TITLE — what this chart shows]",
        subLabel:   "[DATA — sub-label / years covered]",
        // The chart's own numbers. Labels and values must line up in order.
        labels:     ["[DATA — point 1]", "[DATA — point 2]"],
        values:     ["[FIGURE]", "[FIGURE]"],
        reading:    "[ANALYSE TEXT — one line reading the chart]",
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      },
      beforeAfter: {
        from:  { value: "[FIGURE]", label: "[DATA — label]" },
        to:    { value: "[FIGURE]", label: "[DATA — label]" },
        note:  "[ANALYSE TEXT — what the change means]",
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      },
      localVsBenchmark: {
        local:     { value: "[FIGURE]", label: "[DATA — label]" },
        benchmark: { value: "[FIGURE]", label: "[DATA — benchmark label]" },
        note:  "[ANALYSE TEXT — what the comparison means]",
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      }
    },
    {
      label:    "[TITLE — chapter label]",
      headline: "[TITLE — chapter headline]",
      intro:    "[ANALYSE TEXT — introduce this chapter]",
      // A set of ranked horizontal bars.
      bars: {
        title: "[TITLE — what these bars measure]",
        rows: [
          { label: "[DATA — row label]", value: "[FIGURE]" },
          { label: "[DATA — row label]", value: "[FIGURE]" },
          { label: "[DATA — row label]", value: "[FIGURE]" }
        ],
        summary:    "[ANALYSE TEXT — what the bars add up to]",
        sourceName: "[DATA SOURCE]",
        sourceLink: "[LINK]"
      }
    }
  ],

  /* ---- "Range" section: each row shows a lowest and a highest value ----- */
  ranges: {
    label:     "[TITLE — section label]",
    headline:  "[TITLE — section headline]",
    intro:     "[ANALYSE TEXT — introduce this section]",
    lowLabel:  "[DATA — low label]",    // e.g. "Lowest area"
    highLabel: "[DATA — high label]",   // e.g. "Highest area"
    rows: [
      { lowName: "[DATA — low name]", highName: "[DATA — high name]", low: "[FIGURE]", high: "[FIGURE]", gap: "[FIGURE]" },
      { lowName: "[DATA — low name]", highName: "[DATA — high name]", low: "[FIGURE]", high: "[FIGURE]", gap: "[FIGURE]" }
    ],
    sourceName: "[DATA SOURCE]",
    sourceLink: "[LINK]"
  },

  /* ---- The big grid of indicator cards --------------------------------- */
  explorer: {
    label:    "[TITLE — section label]",
    headline: "[TITLE — section headline]",
    intro:    "[ANALYSE TEXT — introduce the full data set]",
    // One entry per card. Copy a line to add more.
    indicators: [
      { category: "[DATA — category]", name: "[TITLE — indicator name]", aLabel: "[DATA — label]", aValue: "[FIGURE]", bLabel: "[DATA — benchmark label]", bValue: "[FIGURE]", note: "[ANALYSE TEXT — short note]", date: "[DATA — date]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" },
      { category: "[DATA — category]", name: "[TITLE — indicator name]", aLabel: "[DATA — label]", aValue: "[FIGURE]", bLabel: "[DATA — benchmark label]", bValue: "[FIGURE]", note: "[ANALYSE TEXT — short note]", date: "[DATA — date]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" },
      { category: "[DATA — category]", name: "[TITLE — indicator name]", aLabel: "[DATA — label]", aValue: "[FIGURE]", bLabel: "[DATA — benchmark label]", bValue: "[FIGURE]", note: "[ANALYSE TEXT — short note]", date: "[DATA — date]", sourceName: "[DATA SOURCE]", sourceLink: "[LINK]" }
    ]
  },

  /* ---- Green "what next / awaiting data" section ------------------------ */
  closing: {
    label:    "[TITLE — section label]",
    headline: "[TITLE — section headline]",
    items: [
      { name: "[TITLE — item name]", note: "[ANALYSE TEXT — one line about it]" },
      { name: "[TITLE — item name]", note: "[ANALYSE TEXT — one line about it]" },
      { name: "[TITLE — item name]", note: "[ANALYSE TEXT — one line about it]" }
    ],
    placeholderHeading: "[TITLE — placeholder heading]",
    placeholderText:    "[ANALYSE TEXT — describe what will go here later]"
  },

  /* ---- Sources list + footer ------------------------------------------- */
  sourcesSection: {
    label:    "[TITLE — section label]",
    headline: "[TITLE — section headline]",
    note:     "[ANALYSE TEXT — note on where the data comes from and how it is kept up to date]",
    // The full list of sources shown at the bottom. Add as many as you need.
    list: [
      { name: "[DATA SOURCE]", link: "[LINK]" },
      { name: "[DATA SOURCE]", link: "[LINK]" },
      { name: "[DATA SOURCE]", link: "[LINK]" },
      { name: "[DATA SOURCE]", link: "[LINK]" },
      { name: "[DATA SOURCE]", link: "[LINK]" },
      { name: "[DATA SOURCE]", link: "[LINK]" }
    ]
  },

  footer: {
    title:        "[TITLE — the story title, repeated]",
    description:  "[ANALYSE TEXT — one line about the project]",
    organisation: "[DATA — organisation]",
    date:         "[DATA — date]"
  }

};
