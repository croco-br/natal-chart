/**
 * sephiroth.js — renders a canonical Chart as the Kabbalistic Tree of Life.
 *
 * 10 sephiroth (Kether..Malkuth) + the hidden Da'ath, drawn at fixed Kircher
 * positions on three pillars. 22 connecting paths carry the Hebrew letters.
 * Each natal point is placed on the sephirah it maps to via the fixed Golden
 * Dawn attribution (point.sephirah_traditional) — e.g. Sun→Tiferet,
 * Saturn→Binah, Uranus→Chockmah, Pluto→Da'ath.
 *
 * IMPORTANT: sephirah names must match the spelling emitted by app/sephiroth.py
 * exactly (it is the source of truth). In particular Python writes "Chockmah"
 * (two c's) for Uranus — not "Chokmah" — so the JS keys use that spelling.
 *
 * API consumed: Chart.to_dict() -> { points: {name -> PointData}, ... }
 * Exposed globally: renderTreeOfLife(chart, target).
 */

/* ---------- sephirah geometry + colour ---------- */

// Fixed Kircher layout on three pillars, in a 360×560 viewBox.
// Pillar of Mercy (right): Chockmah, Chesed, Netzach
// Pillar of Severity (left): Binah, Geburah, Hod
// Pillar of Equilibrium (middle): Kether, Da'ath, Tiferet, Yesod, Malkuth
const SEPHIROTH = {
    Kether:  { x: 180, y: 50,  hebrew: "כתר",     title: "Coroa" },
    Chockmah:{ x: 265, y: 105, hebrew: "חכמה",    title: "Sabedoria" },
    Binah:   { x: 95,  y: 105, hebrew: "בינה",     title: "Entendimento" },
    Daath:   { x: 180, y: 175, hebrew: "דעת",      title: "Conhecimento" },
    Chesed:  { x: 265, y: 230, hebrew: "חסד",      title: "Misericórdia" },
    Geburah: { x: 95,  y: 230, hebrew: "גבורה",    title: "Severidade" },
    Tiferet: { x: 180, y: 300, hebrew: "תפארת",   title: "Beleza" },
    Netzach: { x: 265, y: 380, hebrew: "נצח",      title: "Vitória" },
    Hod:     { x: 95,  y: 380, hebrew: "הוד",      title: "Glória" },
    Yesod:   { x: 180, y: 450, hebrew: "יסוד",     title: "Fundação" },
    Malkuth: { x: 180, y: 525, hebrew: "מלכות",   title: "Reino" },
};

// Traditional Qabalistic (Golden Dawn) colours per sephirah.
const SEPHIRAH_COLOR = {
    Kether:  "#f4e8a8",
    Chockmah:"#9aa6d8",
    Binah:   "#3b3f6e",
    Daath:   "#6b6f8c",
    Chesed:  "#3d7bd0",
    Geburah: "#c0392b",
    Tiferet: "#e6b800",
    Netzach: "#2e9e6b",
    Hod:     "#e67e22",
    Yesod:   "#7d5ba6",
    Malkuth: "#6b4f2e",
};

// The 22 paths of the Kircher tree: { from, to, letter }.
// letter is the Hebrew unicode assigned to that path (Aleph..Tav).
const PATHS = [
    { from: "Kether",  to: "Chockmah", letter: "א" },
    { from: "Kether",  to: "Binah",   letter: "ב" },
    { from: "Kether",  to: "Tiferet", letter: "ג" },
    { from: "Chockmah", to: "Chesed",  letter: "ד" },
    { from: "Binah",   to: "Geburah", letter: "ה" },
    { from: "Chockmah", to: "Binah",   letter: "ו" },
    { from: "Chockmah", to: "Tiferet", letter: "ז" },
    { from: "Binah",   to: "Tiferet", letter: "ח" },
    { from: "Chesed",  to: "Geburah", letter: "ט" },
    { from: "Chesed",  to: "Tiferet", letter: "י" },
    { from: "Chesed",  to: "Netzach", letter: "כ" },
    { from: "Geburah", to: "Tiferet", letter: "ל" },
    { from: "Geburah", to: "Hod",     letter: "מ" },
    { from: "Tiferet", to: "Netzach", letter: "נ" },
    { from: "Tiferet", to: "Yesod",  letter: "ס" },
    { from: "Netzach", to: "Hod",     letter: "ע" },
    { from: "Netzach", to: "Malkuth", letter: "פ" },
    { from: "Netzach", to: "Yesod",   letter: "צ" },
    { from: "Hod",     to: "Yesod",   letter: "ק" },
    { from: "Hod",     to: "Malkuth", letter: "ר" },
    { from: "Yesod",   to: "Malkuth", letter: "ש" },
    { from: "Tiferet", to: "Hod",     letter: "ת" },
];

// POINT_GLYPH is declared globally by natal.js (loaded first via <script defer>).
// We can't re-declare it with `const` (shared global scope → "Identifier already
// declared"), so reuse the existing global, with a fallback for standalone loads.
const _POINT_GLYPH = (typeof POINT_GLYPH !== "undefined")
    ? POINT_GLYPH
    : { sun:"☉", moon:"☽", mercury:"☿", venus:"♀", mars:"♂",
        jupiter:"♃", saturn:"♄", uranus:"♅", neptune:"♆", pluto:"♇", asc:"↑" };

const NODE_R = 26;

/* ---------- planet placement ---------- */

function groupBySephirah(chart) {
    // Fixed Golden Dawn attribution: point.sephirah_traditional.
    const groups = {};
    for (const [name, p] of Object.entries(chart.points)) {
        const s = p.sephirah_traditional;
        if (!s || s === "Unknown") continue;
        (groups[s] = groups[s] || []).push({ name, point: p });
    }
    return groups;
}

/* ---------- SVG builders ---------- */

function pathLines() {
    return PATHS.map(p => {
        const a = SEPHIROTH[p.from];
        const b = SEPHIROTH[p.to];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return `
            <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
                  stroke="#c5b88a" stroke-width="1" opacity="0.55"/>
            <text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central"
                  font-size="12" fill="#8a7b4a" opacity="0.85">${p.letter}</text>`;
    }).join("");
}

function sephirahNode(name, planets) {
    const s = SEPHIROTH[name];
    if (!s) return "";
    const isDaath = name === "Daath";
    const fill = SEPHIRAH_COLOR[name] || "#888";
    const occupied = planets && planets.length > 0;
    const r = NODE_R + (occupied ? Math.min(planets.length, 3) * 2 : 0);

    // Place planet glyphs in a small cluster inside the node.
    const glyphHtml = (planets || []).map((p, i) => {
        const count = planets.length;
        // arrange in a horizontal row, wrapping at 3
        const col = i % 3;
        const row = Math.floor(i / 3);
        const spread = count > 1 ? (col - (Math.min(count, 3) - 1) / 2) * 13 : 0;
        const gx = s.x + spread;
        const gy = s.y - 6 + row * 14;
        const title = `${p.name} (${p.point.sign} ${p.point.position.toFixed(1)}°)`;
        return `<text x="${gx}" y="${gy}" text-anchor="middle" dominant-baseline="central"
                    font-size="16" fill="#1c1917" font-weight="700"><title>${title}</title>${_POINT_GLYPH[p.name] || "·"}</text>`;
    }).join("");

    return `
        <g class="sephirah" data-name="${name}">
            <circle cx="${s.x}" cy="${s.y}" r="${r}"
                    fill="${fill}" fill-opacity="${isDaath ? 0.25 : occupied ? 0.9 : 0.45}"
                    stroke="${isDaath ? '#9a93b0' : fill}" stroke-width="${occupied ? 2 : 1}"
                    stroke-dasharray="${isDaath ? '3 3' : '0'}"/>
            <text x="${s.x}" y="${s.y + r + 12}" text-anchor="middle"
                  font-size="11" font-weight="700" fill="#1c1917">${name}</text>
            <text x="${s.x}" y="${s.y + r + 24}" text-anchor="middle"
                  font-size="8" fill="#6b5d3a">${s.title}</text>
            ${glyphHtml}
        </g>`;
}

/* ---------- public entry point ---------- */

function renderTreeOfLife(chart, target) {
    const groups = groupBySephirah(chart);

    // Render all 10 sephiroth plus Da'ath (hidden; only fills when Pluto lands there).
    const names = ["Kether", "Chockmah", "Binah", "Daath", "Chesed", "Geburah",
                   "Tiferet", "Netzach", "Hod", "Yesod", "Malkuth"];

    const svg = `
    <svg viewBox="0 0 360 580" width="100%" style="max-width: 360px; margin: 0 auto; display:block;"
         xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="treeBg" cx="50%" cy="50%" r="60%">
                <stop offset="0%"  stop-color="#fbf8f0"/>
                <stop offset="100%" stop-color="#f1ead8"/>
            </radialGradient>
        </defs>
        <rect x="0" y="0" width="360" height="580" fill="url(#treeBg)" rx="8"/>
        ${pathLines()}
        ${names.map(n => sephirahNode(n, groups[n])).join("")}
    </svg>`;
    target.innerHTML = svg;
}

window.renderTreeOfLife = renderTreeOfLife;
