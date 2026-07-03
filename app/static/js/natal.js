/**
 * natal.js — renders a canonical Chart (from POST /calculate) as:
 *   1. A hand-built SVG natal wheel (zodiac + points + intra-chart aspect lines).
 *   2. A Bulma detail table of every point.
 *
 * Fixed-zodiac orientation: Aries on the left (180° visual), signs increase
 * counter-clockwise around the ring. Absolute longitudes are plotted directly.
 *
 * API consumed: Chart.to_dict() -> { id, name, birth, points: {name -> PointData}, aspects, embedding }
 */

/* ---------- zodiac ring (fixed, counter-clockwise from Aries on the left) ---------- */

const SIGNS = [
    { key: "Ari", name: "Ari",    symbol: "♈", element: "fire"  },
    { key: "Tau", name: "Tau",    symbol: "♉", element: "earth" },
    { key: "Gem", name: "Gem",    symbol: "♊", element: "air"   },
    { key: "Can", name: "Can",    symbol: "♋", element: "water" },
    { key: "Leo", name: "Leo",    symbol: "♌", element: "fire"  },
    { key: "Vir", name: "Vir",    symbol: "♍", element: "earth" },
    { key: "Lib", name: "Lib",    symbol: "♎", element: "air"   },
    { key: "Sco", name: "Sco",    symbol: "♏", element: "water" },
    { key: "Sag", name: "Sag",    symbol: "♐", element: "fire"  },
    { key: "Cap", name: "Cap",    symbol: "♑", element: "earth" },
    { key: "Aqu", name: "Aqu",    symbol: "♒", element: "air"   },
    { key: "Pis", name: "Pis",    symbol: "♓", element: "water" },
];

/* Classic planet glyphs. kerykeion names -> glyph. */
const POINT_GLYPH = {
    sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
    jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
    asc: "↑",
};

/* Element tints (light-mode-friendly). Swap for dark as needed. */
const ELEMENT_FILL = {
    fire:  "#c2410c",
    earth: "#65a30d",
    air:   "#0369a1",
    water: "#0d9488",
};

const ASPECT_COLOR = {
    conjunction: "#0369a1",  // fusion
    sextile:     "#059669",  // harmony, light
    square:      "#b45309",  // tension, mild
    trine:       "#047857",  // harmony, strong
    opposition:  "#be123c",  // tension, strong
};

/* Aspect detection — matches the canonical algorithm in §03/§05. */
const ASPECTS = [
    { key: "conjunction", angle:   0, orb: 8 },
    { key: "sextile",     angle:  60, orb: 5 },
    { key: "square",      angle:  90, orb: 6 },
    { key: "trine",       angle: 120, orb: 7 },
    { key: "opposition",  angle: 180, orb: 8 },
];

/* ---------- geometry helpers ---------- */

function svgCoordsForAngle(angleDeg, radius) {
    // angleDeg = absolute ecliptic longitude (Aries = 0°). Visual: Aries on
    // the left, counter-clockwise. So visual polar angle = π − λ.
    const theta = Math.PI - angleDeg * Math.PI / 180;
    return { dx: Math.cos(theta), dy: -Math.sin(theta) };
}

function svgPoint(cx, cy, angleDeg, radius) {
    const { dx, dy } = svgCoordsForAngle(angleDeg, radius);
    return { x: cx + radius * dx, y: cy + radius * dy };
}

function circularSeparation(a, b) {
    // 0..180
    const d = Math.abs(((a - b) % 360 + 360) % 360);
    return Math.min(d, 360 - d);
}

function detectAspects(points) {
    // points: Map<string, {lon, sign, ...}>. Returns {a,b,aspect,orb}
    const names = Array.from(points.keys());
    const out = [];
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const pi = points.get(names[i]);
            const pj = points.get(names[j]);
            const sep = circularSeparation(pi.lon, pj.lon);
            for (const asp of ASPECTS) {
                const d = Math.abs(sep - asp.angle);
                if (d <= asp.orb) {
                    out.push({
                        a: names[i],
                        b: names[j],
                        aspect: asp.key,
                        orb: Math.round(d * 100) / 100,
                        isHarmony: asp.key === "sextile" || asp.key === "trine",
                    });
                    break; // first match wins
                }
            }
        }
    }
    return out;
}

/* ---------- SVG renderers ---------- */

function ringPath(arcStartDeg, arcEndDeg, rOuter, rInner, cx, cy) {
    // Two arcs, outer and inner, producing a ring segment.
    const a = svgPoint(cx, cy, arcStartDeg, rOuter);
    const b = svgPoint(cx, cy, arcEndDeg,   rOuter);
    const c = svgPoint(cx, cy, arcEndDeg,   rInner);
    const d = svgPoint(cx, cy, arcStartDeg, rInner);
    const largeArc = (arcEndDeg - arcStartDeg > 180) ? 1 : 0;
    return [
        `M ${a.x} ${a.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${b.x} ${b.y}`,
        `L ${c.x} ${c.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 1 ${d.x} ${d.y}`,
        `Z`,
    ].join(" ");
}

function signRing(cx, cy, rOuter, rInner) {
    // 12 sign slices, counter-clockwise from Aries-on-the-left.
    return SIGNS.map((s, i) => {
        const start = i * 30;
        const end   = (i + 1) * 30;
        const fill  = ELEMENT_FILL[s.element] + "22"; // light tint
        const stroke= ELEMENT_FILL[s.element] + "88";
        const label = svgPoint(cx, cy, start + 15, (rOuter + rInner) / 2);
        return `
            <path d="${ringPath(start, end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="1"/>
            <text x="${label.x}" y="${label.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="18" fill="${ELEMENT_FILL[s.element]}">${s.symbol}</text>
        `;
    }).join("");
}

function pointMarker(cx, cy, name, lon, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const glyph = POINT_GLYPH[name] || "·";
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
    const color = name === "asc" ? "#0369a1" : "#1c1917";
    return `
        <line x1="${tick.x}" y1="${tick.y}" x2="${base.x}" y2="${base.y}"
              stroke="${color}" stroke-width="1.2" opacity="0.7"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${name === 'asc' ? 16 : 18}" font-weight="${name === 'asc' ? 700 : 400}"
              fill="${color}">${glyph}</text>
    `;
}

function aspectLine(cx, cy, rAspect, pi, pj, aspectKey) {
    const a = svgPoint(cx, cy, pi.lon, rAspect);
    const b = svgPoint(cx, cy, pj.lon, rAspect);
    const color = ASPECT_COLOR[aspectKey] || "#888";
    const dash  = aspectKey === "square" || aspectKey === "opposition" ? "3 3" : "0";
    return `
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
              stroke="${color}" stroke-width="1" stroke-dasharray="${dash}" opacity="0.75"/>
    `;
}

function renderWheel(chart, target) {
    const cx = 250, cy = 250;
    const rOuter = 220, rInner = 180, rPoint = 150, rGlyph = 135, rAspect = 120;

    // Points as Map
    const points = new Map(Object.entries(chart.points));

    // Aspect lines (limit to major aspects; draw harmony lines first, tensions on top)
    const aspects = detectAspects(points);
    const harmonyLines = aspects.filter(a => a.isHarmony);
    const tensionLines = aspects.filter(a => !a.isHarmony);

    const svg = `
    <svg viewBox="0 0 500 500" width="100%" style="max-width: 540px;" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stop-color="#fbf8f0"/>
                <stop offset="100%" stop-color="#f1ead8"/>
            </radialGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 8}" fill="url(#wheelBg)" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter}"     fill="none"         stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rInner}"     fill="none"         stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rPoint + 4}" fill="none"         stroke="#c5b88a55" stroke-width="1" stroke-dasharray="2 3"/>
        ${signRing(cx, cy, rOuter, rInner)}
        ${harmonyLines.map((a) => aspectLine(cx, cy, rAspect, points.get(a.a), points.get(a.b), a.aspect)).join("")}
        ${tensionLines.map((a) => aspectLine(cx, cy, rAspect, points.get(a.a), points.get(a.b), a.aspect)).join("")}
        ${Array.from(points.entries()).map(([name, p]) => pointMarker(cx, cy, name, p.lon, rPoint, rGlyph)).join("")}
    </svg>`;
    target.innerHTML = svg;
    return { aspects };
}

/* ---------- hermetic wheel (24 sectors of 15°, suit-coloured) ---------- */

/*
 * Hermetic astrology splits each zodiac sign into two 15° halves — an "early"
 * half [0,15) and a "late" half [15,30] — each ruled by a tarot court card.
 * The 24 resulting sectors are the "24 signs" of the hermetic system. The
 * wheel draws those 24 sectors, coloured by suit (Wands=Fire, Coins=Earth,
 * Swords=Air, Cups=Water), with the court-card title in each slice. Planets
 * are plotted by absolute longitude; any planet whose degree falls in a
 * cuspal band (≤5° or ≥25°) — where a hermetic title is actually assigned —
 * is highlighted.
 *
 * The court-card assignment mirrors app/hermetic.py: _EARLY (pos≤5) and
 * _LATE (pos≥25). The mid-sector (6–24°) carries no title; the sign itself
 * is shown there so the ring reads as 24 readable slices.
 */

// sign index -> {early, late} court-card titles (mirrors app/hermetic.py)
const HERMETIC_SECTORS = [
    { sign: "Ari", early: "Rainha de Bastões",   late: "Principe de Moedas" },
    { sign: "Tau", early: "Principe de Moedas",  late: "Rei de Espadas" },
    { sign: "Gem", early: "Rei de Espadas",      late: "Rainha de Taças" },
    { sign: "Can", early: "Rainha de Taças",     late: "Príncipe de Bastões" },
    { sign: "Leo", early: "Príncipe de Bastões", late: "Rei de Moedas" },
    { sign: "Vir", early: "Rei de Moedas",       late: "Rainha de Espadas" },
    { sign: "Lib", early: "Rainha de Espadas",   late: "Príncipe de Taças" },
    { sign: "Sco", early: "Príncipe de Taças",   late: "Rei de Bastões" },
    { sign: "Sag", early: "Rei de Bastões",      late: "Rainha de Moedas" },
    { sign: "Cap", early: "Rainha de Moedas",    late: "Príncipe de Espadas" },
    { sign: "Aqu", early: "Príncipe de Espadas", late: "Rei de Taças" },
    { sign: "Pis", early: "Rei de Taças",        late: "Rainha de Bastões" },
];

// Suit -> element. Golden Dawn attribution: Wands=Fire, Coins=Earth, Swords=Air, Cups=Water.
const SUIT_ELEMENT = {
    "Bastões": "fire",
    "Moedas":  "earth",
    "Espadas": "air",
    "Taças":   "water",
};
function suitOf(title) {
    const m = / (Bastões|Moedas|Espadas|Taças)$/.exec(title || "");
    return m ? m[1] : null;
}

// Build the 24 sectors with absolute [start,end) degree ranges and colours.
function hermeticSectors() {
    const out = [];
    HERMETIC_SECTORS.forEach((s, i) => {
        const base = i * 30;
        const earlySuit = suitOf(s.early);
        const lateSuit  = suitOf(s.late);
        out.push(
            { start: base, end: base + 15, sign: s.sign, half: "early", title: s.early,
              element: SUIT_ELEMENT[earlySuit] || SIGNS[i].element,
              color: ELEMENT_FILL[SUIT_ELEMENT[earlySuit] || SIGNS[i].element] },
            { start: base + 15, end: base + 30, sign: s.sign, half: "late", title: s.late,
              element: SUIT_ELEMENT[lateSuit] || SIGNS[i].element,
              color: ELEMENT_FILL[SUIT_ELEMENT[lateSuit] || SIGNS[i].element] },
        );
    });
    return out;
}

function hermeticRing(cx, cy, rOuter, rInner) {
    return hermeticSectors().map(sec => {
        const fill   = sec.color + "22";
        const stroke = sec.color + "88";
        const mid    = (sec.start + sec.end) / 2;
        const label  = svgPoint(cx, cy, mid, (rOuter + rInner) / 2 + 6);
        const signLbl= svgPoint(cx, cy, mid, rInner - 14);
        // Rotate the title so it reads along the arc.
        const rot = (180 - mid) % 360;
        return `
            <path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="1"/>
            <text x="${signLbl.x}" y="${signLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="9" font-weight="700" fill="${sec.color}">${sec.sign}</text>
            <text x="${label.x}" y="${label.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="6.5" fill="${sec.color}"
                  transform="rotate(${rot}, ${label.x}, ${label.y})">
                  ${sec.title.replace(" de ", " ")}
            </text>
        `;
    }).join("");
}

function hermeticMarker(cx, cy, name, lon, position, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const glyph = POINT_GLYPH[name] || "·";
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
    // Cuspal bands: first 5° or last 5° of the sign => a hermetic title is set.
    const isCuspal = position <= 5 || position >= 25;
    const color = name === "asc" ? "#0369a1" : (isCuspal ? "#b45309" : "#1c1917");
    const ring = isCuspal
        ? `<circle cx="${base.x}" cy="${base.y}" r="9" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6"/>`
        : "";
    return `
        ${ring}
        <line x1="${tick.x}" y1="${tick.y}" x2="${base.x}" y2="${base.y}"
              stroke="${color}" stroke-width="1.2" opacity="0.7"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${name === 'asc' ? 16 : 18}" font-weight="${isCuspal ? 700 : 400}"
              fill="${color}">${glyph}</text>
    `;
}

function renderHermeticWheel(chart, target) {
    const cx = 250, cy = 250;
    const rOuter = 220, rInner = 170, rPoint = 145, rGlyph = 128;
    const points = Object.entries(chart.points);

    const svg = `
    <svg viewBox="0 0 500 500" width="100%" style="max-width: 540px;" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="hermBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stop-color="#fbf8f0"/>
                <stop offset="100%" stop-color="#f1ead8"/>
            </radialGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 8}" fill="url(#hermBg)" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rInner}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rPoint + 4}" fill="none" stroke="#c5b88a55" stroke-width="1" stroke-dasharray="2 3"/>
        ${hermeticRing(cx, cy, rOuter, rInner)}
        ${points.map(([name, p]) => hermeticMarker(cx, cy, name, p.lon, p.position, rPoint, rGlyph)).join("")}
        <circle cx="${cx}" cy="${cy}" r="3" fill="#1c1917"/>
    </svg>`;
    target.innerHTML = svg;
}

/* ---------- hermetic detail table ---------- */

function renderHermeticDetails(chart, target) {
    const { points, birth, name } = chart;
    const rows = Object.entries(points).map(([n, p]) => {
        const deg = `${Math.floor(p.position)}° ${Math.round((p.position % 1) * 60)}'`;
        const title = p.hermetic_title
            ? `<span class="tag is-warning is-light">${p.hermetic_title}</span>`
            : `<span class="has-text-grey">—</span>`;
        return `
            <tr>
                <td><span style="font-size:18px;margin-right:6px">${POINT_GLYPH[n] || "·"}</span><strong>${n}</strong>
                    ${p.retrograde ? ' <span class="tag is-light">R</span>' : ''}</td>
                <td>${p.sign}</td>
                <td>${deg} <small class="has-text-grey">(${p.lon.toFixed(2)}°)</small></td>
                <td>${title}</td>
            </tr>`;
    }).join("");

    target.innerHTML = `
        <div class="box">
            <h2 class="subtitle">Detalhes Herméticos — ${name || "—"}</h2>
            <p class="is-size-6">Nascimento: <strong>${birth.date}</strong> ${birth.time} em
                <strong>${birth.city}</strong> <small class="has-text-grey">(${birth.tz})</small></p>
            <p class="is-size-7 has-text-grey">Títulos em destaque = graus cuspais (≤5° ou ≥25°)</p>
            <table class="table is-fullwidth is-narrow is-striped mt-4">
                <thead><tr><th>Ponto</th><th>Signo</th><th>Grau</th><th>Título Hermético</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

/* ---------- angels wheel (72 Shem HaMephorash sectors of 5°) ---------- */

/*
 * The 72 Angels of the Shem HaMephorash: 6 per zodiac sign, one per 5° bin
 * (half-open: [0,5), [5,10), [10,15), [15,20), [20,25), [25,30]). The wheel
 * draws all 72 sectors in a 5°-grid ring (counter-clockwise from 0° Aries,
 * matching the natal wheel's orientation), coloured by sign element. Each
 * sector carries its angel name; natal planets are plotted by absolute
 * longitude and land on the sector of their ruling angel — those sectors are
 * highlighted. The naming mirrors app/angels.py (_ANGELS), which is the source
 * of truth; the order here is sign-then-bin, CCW from 0° Aries.
 */

const ANGELS = [
    { sign: "Ari", bin: 0, angel: "Vehuiah" },
    { sign: "Ari", bin: 1, angel: "Jeliel" },
    { sign: "Ari", bin: 2, angel: "Sitael" },
    { sign: "Ari", bin: 3, angel: "Elemiah" },
    { sign: "Ari", bin: 4, angel: "Mahasiah" },
    { sign: "Ari", bin: 5, angel: "Lelahel" },
    { sign: "Tau", bin: 0, angel: "Achaiah" },
    { sign: "Tau", bin: 1, angel: "Cahethel" },
    { sign: "Tau", bin: 2, angel: "Haziel" },
    { sign: "Tau", bin: 3, angel: "Aladiah" },
    { sign: "Tau", bin: 4, angel: "Laoviah" },
    { sign: "Tau", bin: 5, angel: "Hahahiah" },
    { sign: "Gem", bin: 0, angel: "Yesalel" },
    { sign: "Gem", bin: 1, angel: "Mebahel" },
    { sign: "Gem", bin: 2, angel: "Hariel" },
    { sign: "Gem", bin: 3, angel: "Hekamiah" },
    { sign: "Gem", bin: 4, angel: "Lauviah" },
    { sign: "Gem", bin: 5, angel: "Caliel" },
    { sign: "Can", bin: 0, angel: "Leuviah" },
    { sign: "Can", bin: 1, angel: "Pahaliah" },
    { sign: "Can", bin: 2, angel: "Nelchael" },
    { sign: "Can", bin: 3, angel: "Ieiaiel" },
    { sign: "Can", bin: 4, angel: "Melahel" },
    { sign: "Can", bin: 5, angel: "Haheuiah" },
    { sign: "Leo", bin: 0, angel: "Nith-Haiah" },
    { sign: "Leo", bin: 1, angel: "Haaiah" },
    { sign: "Leo", bin: 2, angel: "Ierathel" },
    { sign: "Leo", bin: 3, angel: "Seheiah" },
    { sign: "Leo", bin: 4, angel: "Reyel" },
    { sign: "Leo", bin: 5, angel: "Omael" },
    { sign: "Vir", bin: 0, angel: "Lecabel" },
    { sign: "Vir", bin: 1, angel: "Vasahiah" },
    { sign: "Vir", bin: 2, angel: "Iehuiah" },
    { sign: "Vir", bin: 3, angel: "Lehaiah" },
    { sign: "Vir", bin: 4, angel: "Chavakiah" },
    { sign: "Vir", bin: 5, angel: "Menadel" },
    { sign: "Lib", bin: 0, angel: "Aniel" },
    { sign: "Lib", bin: 1, angel: "Haamiah" },
    { sign: "Lib", bin: 2, angel: "Rehael" },
    { sign: "Lib", bin: 3, angel: "Ieiazel" },
    { sign: "Lib", bin: 4, angel: "Hahahel" },
    { sign: "Lib", bin: 5, angel: "Mikael" },
    { sign: "Sco", bin: 0, angel: "Veuliah" },
    { sign: "Sco", bin: 1, angel: "Yelaiah" },
    { sign: "Sco", bin: 2, angel: "Sealiah" },
    { sign: "Sco", bin: 3, angel: "Ariel" },
    { sign: "Sco", bin: 4, angel: "Asaliah" },
    { sign: "Sco", bin: 5, angel: "Mihael" },
    { sign: "Sag", bin: 0, angel: "Vehuel" },
    { sign: "Sag", bin: 1, angel: "Daniel" },
    { sign: "Sag", bin: 2, angel: "Hahasiah" },
    { sign: "Sag", bin: 3, angel: "Imamiah" },
    { sign: "Sag", bin: 4, angel: "Nanael" },
    { sign: "Sag", bin: 5, angel: "Nithael" },
    { sign: "Cap", bin: 0, angel: "Mebaiah" },
    { sign: "Cap", bin: 1, angel: "Poiel" },
    { sign: "Cap", bin: 2, angel: "Nemamiah" },
    { sign: "Cap", bin: 3, angel: "Ieialel" },
    { sign: "Cap", bin: 4, angel: "Harahel" },
    { sign: "Cap", bin: 5, angel: "Mitzrael" },
    { sign: "Aqu", bin: 0, angel: "Umabel" },
    { sign: "Aqu", bin: 1, angel: "Iah-Hel" },
    { sign: "Aqu", bin: 2, angel: "Anauel" },
    { sign: "Aqu", bin: 3, angel: "Mehiel" },
    { sign: "Aqu", bin: 4, angel: "Damabiah" },
    { sign: "Aqu", bin: 5, angel: "Manakel" },
    { sign: "Pis", bin: 0, angel: "Ayel" },
    { sign: "Pis", bin: 1, angel: "Habuhiah" },
    { sign: "Pis", bin: 2, angel: "Rochel" },
    { sign: "Pis", bin: 3, angel: "Yabamiah" },
    { sign: "Pis", bin: 4, angel: "Haiaiel" },
    { sign: "Pis", bin: 5, angel: "Mumiah" },
];

// Absolute [start,end) degree range for each angel sector, CCW from 0° Aries.
function angelSectors() {
    return ANGELS.map((a, i) => {
        const signIdx = SIGNS.findIndex(s => s.key === a.sign);
        const base = signIdx * 30 + a.bin * 5;
        const elem = SIGNS[signIdx].element;
        return {
            ...a,
            start: base,
            end: base + 5,
            color: ELEMENT_FILL[elem],
            element: elem,
        };
    });
}

// Which sector index a planet lands in (mirrors _angel_bin + sign offset).
function angelSectorForLon(lon) {
    const norm = ((lon % 360) + 360) % 360;
    return Math.floor(norm / 5); // 0..71
}

function angelsRing(cx, cy, rOuter, rInner) {
    return angelSectors().map(sec => {
        const fill = sec.color + "16";
        const stroke = sec.color + "66";
        const mid = (sec.start + sec.end) / 2;
        // Sign boundary every 6 sectors gets a heavier divider.
        const isSignBoundary = sec.bin === 0;
        const signLbl = svgPoint(cx, cy, mid, rInner - 14);
        const angelLbl = svgPoint(cx, cy, mid, (rOuter + rInner) / 2 + 6);
        const rot = (180 - mid) % 360;
        return `
            <path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="${isSignBoundary ? 1.4 : 0.6}"/>
            ${sec.bin === 0 ? `<text x="${signLbl.x}" y="${signLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="10" font-weight="700" fill="${sec.color}">${sec.sign}</text>` : ""}
            <text x="${angelLbl.x}" y="${angelLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="5.5" fill="${sec.color}" opacity="0.9"
                  transform="rotate(${rot}, ${angelLbl.x}, ${angelLbl.y})">${sec.angel}</text>
        `;
    }).join("");
}

function angelMarker(cx, cy, name, lon, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const glyph = POINT_GLYPH[name] || "·";
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
    const color = name === "asc" ? "#0369a1" : "#1c1917";
    return `
        <line x1="${tick.x}" y1="${tick.y}" x2="${base.x}" y2="${base.y}"
              stroke="${color}" stroke-width="1.2" opacity="0.7"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${name === 'asc' ? 16 : 18}" font-weight="${name === 'asc' ? 700 : 400}"
              fill="${color}">${glyph}</text>
    `;
}

function renderAngelsWheel(chart, target) {
    const cx = 250, cy = 250;
    const rOuter = 220, rInner = 168, rPoint = 150, rGlyph = 132;
    const points = Object.entries(chart.points);

    // Highlight sectors occupied by a planet.
    const occupied = new Set(points.map(([, p]) => angelSectorForLon(p.lon)));

    const sectorsSvg = angelSectors().map((sec, i) => {
        if (!occupied.has(i)) return ""; // only highlight occupied sectors with a halo
        const fill = sec.color + "33";
        return `<path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                      fill="${fill}" stroke="${sec.color}" stroke-width="2" opacity="0.9"/>`;
    }).join("");

    const svg = `
    <svg viewBox="0 0 500 500" width="100%" style="max-width: 540px;" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="angBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stop-color="#fbf8f0"/>
                <stop offset="100%" stop-color="#f1ead8"/>
            </radialGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 8}" fill="url(#angBg)" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rInner}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        ${angelsRing(cx, cy, rOuter, rInner)}
        ${sectorsSvg}
        ${points.map(([name, p]) => angelMarker(cx, cy, name, p.lon, rPoint, rGlyph)).join("")}
        <circle cx="${cx}" cy="${cy}" r="3" fill="#1c1917"/>
    </svg>`;
    target.innerHTML = svg;
}

/* ---------- angels detail table ---------- */

function renderAngelsDetails(chart, target) {
    const { points, birth, name } = chart;
    const rows = Object.entries(points).map(([n, p]) => {
        const deg = `${Math.floor(p.position)}° ${Math.round((p.position % 1) * 60)}'`;
        const idx = angelSectorForLon(p.lon);
        const angelName = ANGELS[idx] ? ANGELS[idx].angel : "—";
        // p.angel is "Sign (AngelName)" from the API; show it directly.
        const tag = p.angel
            ? `<span class="tag is-info is-light">${p.angel}</span>`
            : `<span class="has-text-grey">—</span>`;
        return `
            <tr>
                <td><span style="font-size:18px;margin-right:6px">${POINT_GLYPH[n] || "·"}</span><strong>${n}</strong>
                    ${p.retrograde ? ' <span class="tag is-light">R</span>' : ''}</td>
                <td>${p.sign}</td>
                <td>${deg} <small class="has-text-grey">(${p.lon.toFixed(2)}°)</small></td>
                <td>${angelName}</td>
                <td>${tag}</td>
            </tr>`;
    }).join("");

    target.innerHTML = `
        <div class="box">
            <h2 class="subtitle">Anjos do Shem HaMephorash — ${name || "—"}</h2>
            <p class="is-size-6">Nascimento: <strong>${birth.date}</strong> ${birth.time} em
                <strong>${birth.city}</strong> <small class="has-text-grey">(${birth.tz})</small></p>
            <p class="is-size-7 has-text-grey">72 anjos — 6 por signo, 1 por bin de 5°. Setores destacados = anjo regente do planeta.</p>
            <table class="table is-fullwidth is-narrow is-striped mt-4">
                <thead><tr><th>Ponto</th><th>Signo</th><th>Grau</th><th>Anjo</th><th>API</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

/* ---------- detail list (Bulma table) ---------- */

function renderDetails(chart, target, aspects) {
    const { points, birth, name } = chart;

    const headerRow = `
        <tr>
            <th>Ponto</th>
            <th>Signo</th>
            <th>Grau</th>
            <th>Sephiroth</th>
            <th>Casa</th>
        </tr>`;

    const rows = Object.entries(points).map(([name, p]) => {
        const deg = `${Math.floor(p.position)}° ${Math.round((p.position % 1) * 60)}'`;
        return `
            <tr>
                <td>
                    <span style="font-size:18px;margin-right:6px">${POINT_GLYPH[name] || "·"}</span>
                    <strong>${name}</strong>
                    ${p.retrograde ? ' <span class="tag is-light">R</span>' : ''}
                </td>
                <td>${p.sign}</td>
                <td>${deg} <small class="has-text-grey">(${p.lon.toFixed(2)}° abs)</small></td>
                <td>${p.sephirah_traditional}</td>
                <td>${p.house || "—"}</td>
            </tr>`;
    }).join("");

    const aspectRows = aspects.length === 0
        ? `<tr><td colspan="4">Nenhum aspecto detectado.</td></tr>`
        : aspects.map(a => {
            const tag = a.isHarmony
                ? `<span class="tag is-link is-light">${a.aspect}</span>`
                : `<span class="tag is-warning is-light">${a.aspect}</span>`;
            return `
                <tr>
                    <td>${POINT_GLYPH[a.a] || "·"} ${a.a}</td>
                    <td>${tag}</td>
                    <td>${POINT_GLYPH[a.b] || "·"} ${a.b}</td>
                    <td>${a.orb}°</td>
                </tr>`;
        }).join("");

    target.innerHTML = `
        <div class="box">
            <h2 class="subtitle">Detalhes do Mapa — ${name || "—"}</h2>
            <p class="is-size-6">
                Nascimento: <strong>${birth.date}</strong> ${birth.time} in
                <strong>${birth.city}</strong> <small class="has-text-grey">(${birth.tz})</small>
            </p>

            <table class="table is-fullwidth is-narrow is-striped mt-4">
                <thead>${headerRow}</thead>
                <tbody>${rows}</tbody>
            </table>

            <h3 class="subtitle is-5 mt-5">Aspectos Intra-Chart</h3>
            <table class="table is-fullwidth is-narrow is-striped">
                <thead>
                    <tr><th>Ponto A</th><th>Aspecto</th><th>Ponto B</th><th>Orbe</th></tr>
                </thead>
                <tbody>${aspectRows}</tbody>
            </table>
        </div>
    `;
}
