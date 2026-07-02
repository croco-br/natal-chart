# Astrology Matcher — Build Plan

> Extends the existing `natal-chart` calculator (FastAPI + kerykeion) into a full
> astrology **matcher**: natal chart → sephirotic map → fast synastry-based
> compatibility search across N other charts.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Match logic | **Classical synastry** (inter-chart aspects, weighted) |
| Match engine | **Python + NumPy** (brute-force now) → **FAISS** pre-filter at scale |
| Scale | **Design for millions, seed small** (synthetic dataset for demo) |
| Frontend | **Extend the existing server-rendered front-end** (FastAPI + Jinja2 + Bulma + vanilla JS), progressively enhanced with hand-built SVG — no React, no SPA, no build step |
| Point set | **10 classical planets + Ascendant** (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, ASC) |
| Match types | **Romance, Friendship, Business** — three weight profiles over the same engine |
| Birth time | **Hard-required** (Ascendant/houses depend on it) |
| Sephirotic scheme | **Both** — decan-based (current) + traditional Golden Dawn, toggleable in the UI |

Out of scope for now: login, profiles, and any feature not listed above.

---

## 1. Architecture

```
                     ┌───────────────────────────────────────────────────────┐
                     │              FastAPI app  (single process)             │
                     │                                                        │
   ┌─────────┐  GET  │  Server-rendered UI            JSON API                │
   │ Browser │◄─────►│  ┌──────────────────────┐      ┌────────────────────┐  │
   │         │ HTML  │  │ Jinja2 templates      │ fetch│ /charts/calculate  │  │
   │         │       │  │  + Bulma + vanilla JS │◄────►│ /charts   /match   │  │
   │         │◄─────►│  │  + hand-built SVG     │ JSON │  → kerykeion +     │  │
   │         │ fetch │  │ (natal wheel, tree,   │      │    synastry ranker │  │
   └─────────┘ JSON  │  │  match list, bi-wheel)│      └────────────────────┘  │
                     │  └──────────────────────┘      ┌────────────────────┐  │
                     │                                 │ Chart store        │  │
                     │                                 │   (SQLite→Postgres)│  │
                     │                                 │ Embedding (.npy)   │  │
                     │                                 │ ANN index (FAISS —  │ │
                     │                                 │   scale phase)     │  │
                     │                                 └────────────────────┘  │
                     └───────────────────────────────────────────────────────┘
```

One FastAPI process serves **both** the HTML pages (Jinja2 templates + `/static`) and
the JSON API — exactly like today's `GET /` + `POST /calculate`. No separate frontend
server, bundler, or `node_modules`.

The existing `engine.py`, `sephiroth.py`, `hermetic.py`, `geocoder.py`, `extensions.py`
become the **chart-calculation library**, and the existing `templates/index.html` +
`static/js/index.js` become the **front-end we extend in place** (§6). The matcher,
persistence, and SVG rendering are the new parts.

---

## 2. Canonical data model

**The source of truth for a chart is a vector of absolute ecliptic longitudes (0–360°),
one per point.** Sign, decan, sephirah, and aspects are all *derived* from those
longitudes. This is what makes the matcher both astrologically correct and fast.

```jsonc
Chart {
  id, name?,
  birth: { date, time, city, lat, lon, tz },   // time REQUIRED; tz auto-derived from city
  points: {                                     // absolute longitude 0–360°
    sun, moon, mercury, venus, mars,
    jupiter, saturn, uranus, neptune, pluto,
    asc                                         // Ascendant (1st-house cusp)
  },
  derived: {
    sun: { sign, decan, quality, element, house,
           sephirah_decan, sephirah_traditional }, ...
  },
  aspects: [ { a:"sun", b:"moon", type:"trine", orb:1.2 }, ... ],
  embedding: [ ... ]                            // harmonic feature vector (§3.1)
}
```

Changes vs current code:
- Auto-derive `tz` from `city` (via `timezonefinder` or kerykeion/geonames) so user
  input is just `{ date, time, city }`.
- Store **absolute longitudes** as first-class fields (currently filtered out in
  `extensions.filter` — we need them back).
- Add both sephirah fields per point (see §4).
- Cleanup: `extensions.add_fiels` never initializes a `neptune` sephiroth key while
  `sephiroth.py` writes one — tidy this during the refactor.

---

## 3. Matching algorithm — the crux

Classical **synastry**: score the angular relationships (aspects) between one person's
planets and another's. Two stages — a cheap recall filter, then an exact re-rank.

> Why not hash + Levenshtein: a chart is a set of points on a circle. Hashing destroys
> the geometry; Levenshtein measures string edits, not angular closeness. Both throw
> away exactly the structure that defines compatibility.

### 3.1 Stage 1 — Harmonic embedding (fast recall filter)

**Astrological aspects *are* harmonics of the circle:**

| Aspect | Angle | Harmonic k |
|---|---|---|
| Conjunction | 0° | 1 |
| Opposition | 180° | 2 |
| Trine | 120° | 3 |
| Square | 90° | 4 |
| Sextile | 60° | 6 |

Encode each planet longitude λ, for each harmonic k ∈ {1,2,3,4,6}, as
`wₚ · (cos kλ, sin kλ)`. The dot product of two charts' harmonic-k blocks for the same
planet yields `cos(k·Δλ)`, which **peaks exactly at that harmonic's aspect angles**. So
cosine similarity over the whole vector ≈ a weighted resonance score.

Vector length ≈ 11 points × 5 harmonics × 2 = **110 floats** — tiny, and exactly what
FAISS/HNSW indexes for millisecond nearest-neighbor search over millions.

**Honest limitation:** this captures *same-planet* resonance (my Sun ↔ your Sun) plus
overall chart shape. True synastry also scores *cross* pairs (my Venus ↔ your Mars) — a
P×P grid that doesn't linearize into one fixed vector. So Stage 1 is a **recall filter**
(millions → ~1k candidates), **not** the final score. Results stay defensible because
Stage 2 is the source of truth.

### 3.2 Stage 2 — Exact synastry re-rank (source of truth)

```
for each planet i in A, planet j in B:
    Δ = angular_distance(λ_Aᵢ, λ_Bⱼ)              # 0..180
    for each aspect (angle α, orb o, harmony±, weight):
        if |Δ − α| ≤ o:
            strength = 1 − |Δ − α| / o             # tighter orb = stronger
            score   += harmony · weight · wᵢ · wⱼ · strength

harmony_score = Σ positive hits   (trine, sextile, harmonious conjunctions)
tension_score = Σ negative hits   (square, opposition)
final = normalize(harmony_score − β·tension_score)   # report both subscores too
```

- 11×11 = 121 pairs × ~7 aspects = microseconds per pair. Vectorize with NumPy
  broadcasting to score **all candidates at once**.
- Aspect orbs/weights live in a **config file** — this is where all tuning happens.

### 3.3 Match-type weight profiles

Same engine, three planet-weight (`wₚ`) profiles selected per query:

| Profile | Emphasized points |
|---|---|
| **Romance** | Venus, Mars, Moon, Sun, Ascendant |
| **Friendship** | Moon, Mercury, Sun, Jupiter, Ascendant |
| **Business** | Saturn, Mercury, Mars, Sun, Jupiter |

Profiles also adjust aspect weighting (e.g. business tolerates tension/squares as
"drive"; romance prioritizes Venus–Mars trines/conjunctions). All in the config file.

### 3.4 Seed-small → millions, for free

Because a chart reduces to 11 longitudes, the whole dataset is one `(N × 11)` NumPy
array and Stage 2 is a single broadcast:

- **Now (thousands):** skip FAISS — NumPy-broadcast exact synastry over the whole
  dataset. **<100 ms**. Simple, exact, no index.
- **Later (millions):** insert the Stage-1 FAISS pre-filter before Stage 2. Same scorer,
  fewer inputs. **Nothing else changes.**

---

## 4. Sephirotic visual map

Cross-reference natal chart ↔ Kabbalah by placing each planet on the Tree of Life.

**Two correspondence schemes (both supported, UI toggle):**

1. **Decan-based (current `sephiroth.py`):** (quality × decan) → sephirah. Dynamic;
   depends on where each planet sits within its sign.
2. **Traditional (Golden Dawn), fixed planet ↔ sephirah:**
   Saturn→Binah, Jupiter→Chesed, Mars→Geburah, Sun→Tiferet, Venus→Netzach,
   Mercury→Hod, Moon→Yesod (+ Uranus/Chockmah, Neptune/Kether, Pluto/Da'ath by
   modern extension).

**Visual (vanilla JS + hand-built SVG, D3 optional via CDN):** 10 sephiroth at fixed
coordinates + 22 connecting paths, drawn by a `tree.js` ES module into an `<svg>` in the
page. Overlay planet glyphs on their sephirah; node intensity/size scales with how many
planets land there. A Bulma toggle (radio/buttons) switches placement between the two
schemes and re-renders.

---

## 5. API surface (FastAPI)

| Endpoint | Purpose |
|---|---|
| `POST /charts/calculate` | `{date, time, city, method}` → full chart JSON (reuses engine) |
| `POST /charts` | Persist chart, compute + store embedding, add to index |
| `GET /charts/{id}` | Fetch stored chart |
| `POST /match` | `{chart_id \| inline chart, type: romance\|friendship\|business, limit}` → ranked matches **with per-match shared-aspect breakdown** (so the UI can explain *why*) |
| `POST /admin/seed` (or CLI) | Generate synthetic charts, build embedding matrix + index |

---

## 6. Frontend (server-rendered + progressive enhancement)

Build **on the existing stack** — no React, no SPA, no build step:
- `app/templates/index.html` (Jinja2) + Bulma (CDN) + Font Awesome — already the
  birth-input form.
- `app/static/js/index.js` (vanilla JS) — already posts to the calculate endpoint; today
  it just dumps the JSON into a `<pre>`.

Extend this in place. Split the growing JS into small vanilla ES modules under
`app/static/js/` (e.g. `wheel.js`, `tree.js`, `match.js`) loaded from the template with
`<script type="module">`. Three core views, all reading the same chart JSON the API
returns and rendering it **client-side into SVG** (replacing the `<pre>` dump):

- **Natal wheel** — circular zodiac, planet glyphs, intra-chart aspect lines. Hand-built
  SVG drawn in `wheel.js`.
- **Tree of Life** — sephirotic map (§4) rendered by `tree.js`, with the scheme toggle.
- **Match view** — match-type selector (Bulma `select`/tabs → romance/friendship/business),
  ranked list (Bulma cards/table) with harmony/tension scores, and a **bi-wheel** (query
  inner ring, match outer) highlighting the shared aspects that produced the score.

SVG is drawn by hand in vanilla JS for full control over astrological geometry, rather than
a generic charting lib. If a geometry/scale helper is warranted, pull **D3 via CDN**
(same script-tag, no-build pattern as Bulma) instead of introducing a bundler. New pages
(e.g. the match view) are additional Jinja2 templates served by new `GET` routes, mirroring
today's `GET /`.

---

## 7. Phased milestones

| Phase | Deliverable |
|---|---|
| **0 — Refactor** | Extract engine into a clean lib; canonical Chart schema; auto-derive tz from city; keep absolute longitudes; JSON API scaffolding |
| **1 — Natal** | `/charts/calculate` + natal-wheel SVG rendered client-side (`wheel.js`), replacing the current `<pre>` JSON dump in `index.html` |
| **2 — Sephiroth** | Both correspondence schemes; Tree-of-Life SVG module (`tree.js`) with scheme toggle in the page |
| **3 — Matcher** | NumPy synastry scorer + harmonic embedding + 3 weight profiles + `/match` + synthetic seeder (brute-force, no FAISS yet) |
| **4 — Compare UI** | Match view (new Jinja2 template + route): match-type selector + match list + bi-wheel (`match.js`) + shared-aspect explanation |
| **5 — Scale** | FAISS pre-filter, batch ingest, benchmark toward millions |

---

## 8. Risks & tuning notes

- **Orbs & weights are subjective** — keep them in config; expect iteration. This is the
  primary "does it feel right" lever.
- **Embedding is recall, not truth** — always confirm with the Stage-2 exact scorer so
  results are astrologically defensible.
- **Synthetic seed realism** — sample plausible birth dates/times/places so match
  distributions aren't degenerate; planets aren't uniform on the ecliptic.
- **Time-zone / historical DST** — kerykeion/geonames handle most; verify edge cases for
  older birth dates.
