# Bristol deprivation data visualization

## Project structure

```
site/           Website files — open index.html to browse
support/        Build scripts, source data, and documentation
```

---

## site/ — the website

Open any HTML file directly in a browser. All JS and asset paths are relative, so the folder is self-contained.

| File | What it does |
|---|---|
| `index.html` | Landing page with a clickable image map linking to all sub-pages |
| `Bristol-Deprivation-Education.html` | Education story page — scrolls through early years, primary, secondary, transition, wards |
| `Bristol-Deprivation-Education-ranked.html` | Ranked comparator view of education indicators |
| `Bristol-Deprivation-Housing.html` | Housing and health story page |
| `Bristol-Deprivation-Housing-ranked.html` | Ranked comparator view of housing indicators |
| `Bristol-Deprivation-Economy.html` | Economic deprivation across the life course, with Chart.js charts |
| `Bristol-Deprivation-Early-Years.html` | Ages 0-5 indicator cards by theme |
| `Bristol-Deprivation-Trends.html` | "Ten years of change" — Bristol vs England trend lines |
| `Bristol-in-Context.html` | Static narrative framing Bristol relative to other areas |
| `Bristol Deprivation Story.dc.html` | DataCanvas version of the main story (uses `support.js` for `<x-dc>` components) |
| `Template Page.html` | Blank template with placeholder slots — duplicate and fill for new pages |
| `bristol-data-ons-census.js` | Data backbone for Housing and Education pages (ONS/Census 2021 sources) |
| `bristol-economic.js` | Economic domain data — 19 indicators across 6 geographies |
| `bristol-comparators.js` | Comparator geography data (highest/lowest LA, London, Manchester) |
| `bristol-trends.js` | Time-series data for trend charts (Bristol vs England, ~2013-2025) |
| `bristol-data.js` | Master data file for the DataCanvas story page |
| `bristol-themes.js` | Maps indicator IDs to themes (economic/health/education/employment) and life stages |
| `indicator-colours.js` | Colour logic (green/red/grey) based on indicator polarity |
| `datasource.js` | Placeholder data companion for `Template Page.html` |
| `support.js` | Runtime bundle powering the `<x-dc>` component system in the `.dc.html` story |
| `icons/` | SVG icons used across the story pages |
| `opening-circles.png` | Hero image for the landing page |

---

## support/ — build pipeline and reference

These files generate the JS data files in `site/`. Run the Python scripts from inside the `support/` directory. Their output JS/CSV files are written to the current working directory by default, so copy them to `site/` after generating.

### Data pipeline

The build process has three main pipelines:

**Comparators pipeline:**
1. `compile_comparator_sources.py` — Generates `highest.csv`, `lowest.csv`, `london.csv`, `manchester.csv` from hard-coded verified values with deep-link audit notes
2. `build_comparators_js.py` — Reads those four CSVs and emits `bristol-comparators.js`

**Economic pipeline:**
1. `compile_economic_sources.py` — Writes both `bristol_economic_sources.csv` (audit store) and `bristol-economic.js` in one step

**Trends pipeline:**
1. `scrape_bristol_trends.py` — Pulls employment/qualifications/pay series from Nomis APIs into `bristol_trends.csv`
2. `compile_trends.py` — Merges `manual_trends.json` (hand-curated DfE/ONS/DWP data) into `bristol_trends.csv`
3. `build_trends_js.py` — Converts `bristol_trends.csv` into `bristol-trends.js`

**Other scraping:**
- `scrape_bristol_data.py` — Fetches Census 2021 figures from Nomis REST API, emits `bristol_data_extracted.csv`

### Source data files

| File | Purpose |
|---|---|
| `bristol_trends.csv` | Long-format time-series (input to `build_trends_js.py`) |
| `manual_trends.json` | Hand-curated series not available from Nomis (life expectancy, child poverty, GCSE results) |
| `bristol_economic_sources.csv` | Auditable economic indicator store with source deep-links |
| `bristol_education_sources.csv` | Auditable education indicator store with source deep-links |
| `bristol_data_extracted.csv` | Scraped Census/ONS headline numbers |
| `highest.csv` / `lowest.csv` / `london.csv` / `manchester.csv` | Comparator geography values per indicator |

### Documentation

| File | Purpose |
|---|---|
| `bristol-data-ons-census.md` | Developer reference for the ONS/Census data file structure and update process |
| `bristol-economic-sources.md` | Narrative description of the economic domain pipeline and its 19 indicators |
| `Text for the data dashboard.docx` | Source text and editorial content for the dashboard pages |
| `.thumbnail` | Project thumbnail metadata |

### Verification data

| Folder | Purpose |
|---|---|
| `dfe_verify_tables/` | DfE source CSVs used to cross-check education indicator values (KS2, KS4, NEET, suspensions) |
