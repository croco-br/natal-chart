/**
 * natal.js — renderização de um Chart (POST /calculate) como SVG + tabelas.
 *
 * Camadas:
 *   1. i18n: mapas e helpers para traduzir pontos, signos, aspectos e
 *      elementos para Português. As chaves canónicas (inglês curto) continuam
 *      a ser o identificador interno; só a apresentação ao utilizador é
 *      traduzida.
 *   2. Geometria SVG: roda zodiacal, rodas hermética e dos anjos.
 *   3. Tabelas de detalhes partilhadas (pointTable + aspectTable + detailPanel).
 *
 * O zodíaco é fixo: Áries à esquerda (180° visual), signos crescem no sentido
 * anti-horário. Longitudes absolutas são desenhadas diretamente.
 *
 * API: Chart.to_dict() -> { id, name, birth, points, aspects, embedding }
 */

/* ============================================================
 *  i18n — tradução dos termos astrológicos para Português
 *  (nomes das sephiroth mantêm-se como originais)
 * ============================================================ */

const POINT_PT = {
    sun: "Sol", moon: "Lua", mercury: "Mercúrio", venus: "Vénus",
    mars: "Marte", jupiter: "Júpiter", saturn: "Saturno",
    uranus: "Urano", neptune: "Netuno", pluto: "Plutão", asc: "Ascendente",
};

const SIGN_PT = {
    Ari: "Áries", Tau: "Touro", Gem: "Gêmeos", Can: "Câncer",
    Leo: "Leão", Vir: "Virgem", Lib: "Libra", Sco: "Escorpião",
    Sag: "Sagitário", Cap: "Capricórnio", Aqu: "Aquário", Pis: "Peixes",
};

const SIGN_PT_SHORT = {
    Ari: "Ári", Tau: "Tau", Gem: "Gêm", Can: "Cân",
    Leo: "Leã", Vir: "Vir", Lib: "Lib", Sco: "Esc",
    Sag: "Sag", Cap: "Cap", Aqu: "Aqu", Pis: "Pei",
};

const ASPECT_PT = {
    conjunction: "Conjunção", sextile: "Sextil",
    square: "Quadratura", trine: "Trígono", opposition: "Oposição",
};

const ELEMENT_PT = { fire: "Fogo", earth: "Terra", air: "Ar", water: "Água" };

const pointLabel  = k => POINT_PT[k]  || k;
const signLabel   = k => SIGN_PT[k]   || k;
const aspectLabel = k => ASPECT_PT[k] || k;
const elementLabel= k => ELEMENT_PT[k]|| k;

/* ============================================================
 *  Constantes zodiacais e planetárias
 * ============================================================ */

const SIGNS = [
    { key: "Ari", symbol: "♈", element: "fire"  },
    { key: "Tau", symbol: "♉", element: "earth" },
    { key: "Gem", symbol: "♊", element: "air"   },
    { key: "Can", symbol: "♋", element: "water" },
    { key: "Leo", symbol: "♌", element: "fire"  },
    { key: "Vir", symbol: "♍", element: "earth" },
    { key: "Lib", symbol: "♎", element: "air"   },
    { key: "Sco", symbol: "♏", element: "water" },
    { key: "Sag", symbol: "♐", element: "fire"  },
    { key: "Cap", symbol: "♑", element: "earth" },
    { key: "Aqu", symbol: "♒", element: "air"   },
    { key: "Pis", symbol: "♓", element: "water" },
];

const SIGN_GLYPH = Object.fromEntries(SIGNS.map(s => [s.key, s.symbol]));

/* Glifos planetários clássicos (notação universal, não é idioma). */
const POINT_GLYPH = {
    sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
    jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
    asc: "↑",
};

/* Tintas por elemento (paleta clara). */
const ELEMENT_FILL = {
    fire:  "#c2410c",
    earth: "#65a30d",
    air:   "#0369a1",
    water: "#0d9488",
};

const ASPECT_COLOR = {
    conjunction: "#0369a1",
    sextile:     "#059669",
    square:      "#b45309",
    trine:       "#047857",
    opposition:  "#be123c",
};

/* Definição de aspectos (espelha a lógica canónica do backend). */
const ASPECTS = [
    { key: "conjunction", angle:   0, orb: 8 },
    { key: "sextile",     angle:  60, orb: 5 },
    { key: "square",      angle:  90, orb: 6 },
    { key: "trine",       angle: 120, orb: 7 },
    { key: "opposition",  angle: 180, orb: 8 },
];

const ASPECT_HARMONY = new Set(["sextile", "trine"]);

/* ============================================================
 *  Geometria SVG
 * ============================================================ */

function svgCoordsForAngle(angleDeg) {
    // longitude absoluta (Áries = 0°). Visual: Áries à esquerda, anti-horário.
    // ângulo polar visual = π − λ.
    const theta = Math.PI - angleDeg * Math.PI / 180;
    return { dx: Math.cos(theta), dy: -Math.sin(theta) };
}

function svgPoint(cx, cy, angleDeg, radius) {
    const { dx, dy } = svgCoordsForAngle(angleDeg);
    return { x: cx + radius * dx, y: cy + radius * dy };
}

function circularSeparation(a, b) {
    const d = Math.abs(((a - b) % 360 + 360) % 360);
    return Math.min(d, 360 - d);
}

function ringPath(arcStartDeg, arcEndDeg, rOuter, rInner, cx, cy) {
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
        "Z",
    ].join(" ");
}

/* ============================================================
 *  Helpers de apresentação (texto)
 * ============================================================ */

const _HOUSE_NUM = {
    First: 1, Second: 2, Third: 3, Fourth: 4, Fifth: 5, Sixth: 6,
    Seventh: 7, Eighth: 8, Ninth: 9, Tenth: 10, Eleventh: 11, Twelfth: 12,
};

function houseNumber(house) {
    if (!house || house === "None") return "—";
    const m = /^(\w+)_House$/.exec(house);
    if (m && _HOUSE_NUM[m[1]] !== undefined) return _HOUSE_NUM[m[1]];
    return house;
}

function degreeLabel(position) {
    const d = Math.floor(position);
    const m = Math.round((position % 1) * 60);
    return `${d}° ${m}'`;
}

function birthLine(birth) {
    return `Nascimento: <strong>${birth.date}</strong> ${birth.time} em ` +
           `<strong>${birth.city}</strong> <small class="has-text-grey">(${birth.tz})</small>`;
}

function retroTag(p) {
    return p.retrograde ? ' <span class="tag is-light" title="Retrógrado">R</span>' : "";
}

/* ============================================================
 *  Detecção de aspectos (intra-mapa)
 * ============================================================ */

function detectAspects(points) {
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
                        a: names[i], b: names[j],
                        aspect: asp.key,
                        orb: Math.round(d * 100) / 100,
                        isHarmony: ASPECT_HARMONY.has(asp.key),
                    });
                    break;
                }
            }
        }
    }
    return out;
}

/* ============================================================
 *  Tabelas de detalhes partilhadas
 * ============================================================ */

/* Uma coluna = { header, cell(key, point), center? }.
 * As colunas reutilizáveis abaixo cobrem todos os métodos. */

const COL_PONTO     = { header: "Ponto",   cell: (k, p) =>
    `<span style="font-size:18px;margin-right:6px">${POINT_GLYPH[k] || "·"}</span>` +
    `<strong>${pointLabel(k)}</strong>${retroTag(p)}` };

const COL_SIGNO     = { header: "Signo",   cell: (k, p) => signLabel(p.sign) };

const COL_GRAU      = { header: "Grau",    cell: (k, p) =>
    `${degreeLabel(p.position)} <small class="has-text-grey">(${p.lon.toFixed(2)}°)</small>` };

const COL_SEPHIROTH = { header: "Sephiroth", cell: (k, p) => p.sephirah_traditional };

const COL_CASA      = { header: "Casa",    cell: (k, p) => houseNumber(p.house) };

const COL_TITULO    = { header: "Título Hermético", cell: (k, p) =>
    p.hermetic_title
        ? `<span class="tag is-warning is-light">${p.hermetic_title}</span>`
        : `<span class="has-text-grey">—</span>` };

const COL_ANJO      = { header: "Anjo", cell: (k, p) => {
    const idx = angelSectorForLon(p.lon);
    return ANGELS[idx] ? ANGELS[idx].angel : "—";
}};

function pointTable(points, columns) {
    const header = columns.map(c =>
        `<th class="has-text-centered">${c.header}</th>`).join("");
    const rows = Object.entries(points).map(([k, p]) =>
        `<tr>${columns.map(c => `<td class="has-text-centered">${c.cell(k, p)}</td>`).join("")}</tr>`).join("");
    return `
        <table class="table is-fullwidth is-narrow is-striped mt-4">
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function aspectTable(aspects) {
    const rows = aspects.length === 0
        ? `<tr><td colspan="4" class="has-text-grey">Nenhum aspecto detetado.</td></tr>`
        : aspects.map(a => {
            const tag = a.isHarmony
                ? `<span class="tag is-link is-light">${aspectLabel(a.aspect)}</span>`
                : `<span class="tag is-warning is-light">${aspectLabel(a.aspect)}</span>`;
            return `
                <tr>
                    <td>${POINT_GLYPH[a.a] || "·"} ${pointLabel(a.a)}</td>
                    <td>${tag}</td>
                    <td>${POINT_GLYPH[a.b] || "·"} ${pointLabel(a.b)}</td>
                    <td>${a.orb}°</td>
                </tr>`;
        }).join("");
    return `
        <h3 class="subtitle is-5 mt-5">Aspectos do Mapa</h3>
        <table class="table is-fullwidth is-narrow is-striped">
            <thead><tr><th class="has-text-centered">Ponto A</th><th class="has-text-centered">Aspecto</th><th class="has-text-centered">Ponto B</th><th class="has-text-centered">Orbe</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function detailPanel(chart, inner, opts = {}) {
    const { name } = chart;
    return `
        <div class="box">
            <h2 class="subtitle">${opts.title || "Detalhes do Mapa"} — ${name || "—"}</h2>
            <p class="is-size-6">${birthLine(chart.birth)}</p>
            ${opts.note ? `<p class="is-size-7 has-text-grey mt-1">${opts.note}</p>` : ""}
            ${inner}
        </div>`;
}

/* ============================================================
 *  Roda natal (12 signos)
 * ============================================================ */

function signRing(cx, cy, rOuter, rInner) {
    return SIGNS.map((s, i) => {
        const start = i * 30;
        const end   = (i + 1) * 30;
        const fill  = ELEMENT_FILL[s.element] + "22";
        const stroke= ELEMENT_FILL[s.element] + "88";
        const label = svgPoint(cx, cy, start + 15, (rOuter + rInner) / 2);
        return `
            <path d="${ringPath(start, end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="1"/>
            <text x="${label.x}" y="${label.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="18" fill="${ELEMENT_FILL[s.element]}">${s.symbol}</text>`;
    }).join("");
}

function pointMarker(cx, cy, name, lon, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
    const color = name === "asc" ? "#0369a1" : "#1c1917";
    return `
        <line x1="${tick.x}" y1="${tick.y}" x2="${base.x}" y2="${base.y}"
              stroke="${color}" stroke-width="1.2" opacity="0.7"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${name === 'asc' ? 16 : 18}" font-weight="${name === 'asc' ? 700 : 400}"
              fill="${color}">${POINT_GLYPH[name] || "·"}</text>`;
}

function aspectLine(cx, cy, rAspect, pi, pj, aspectKey) {
    const a = svgPoint(cx, cy, pi.lon, rAspect);
    const b = svgPoint(cx, cy, pj.lon, rAspect);
    const color = ASPECT_COLOR[aspectKey] || "#888";
    const dash  = (aspectKey === "square" || aspectKey === "opposition") ? "3 3" : "0";
    return `
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
              stroke="${color}" stroke-width="1" stroke-dasharray="${dash}" opacity="0.75"/>`;
}

function renderWheel(chart, target) {
    const cx = 250, cy = 250;
    const rOuter = 220, rInner = 180, rPoint = 150, rGlyph = 135, rAspect = 120;
    const points = new Map(Object.entries(chart.points));

    const aspects = detectAspects(points);
    const harmony  = aspects.filter(a =>  a.isHarmony);
    const tension  = aspects.filter(a => !a.isHarmony);

    const svg = `
    <svg viewBox="0 0 500 500" width="100%" style="max-width: 540px;" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stop-color="#fbf8f0"/>
                <stop offset="100%" stop-color="#f1ead8"/>
            </radialGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 8}" fill="url(#wheelBg)" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rInner}"     fill="none" stroke="#c5b88a" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="${rPoint + 4}" fill="none" stroke="#c5b88a55" stroke-width="1" stroke-dasharray="2 3"/>
        ${signRing(cx, cy, rOuter, rInner)}
        ${harmony.map(a => aspectLine(cx, cy, rAspect, points.get(a.a), points.get(a.b), a.aspect)).join("")}
        ${tension.map(a => aspectLine(cx, cy, rAspect, points.get(a.a), points.get(a.b), a.aspect)).join("")}
        ${Array.from(points.entries()).map(([name, p]) => pointMarker(cx, cy, name, p.lon, rPoint, rGlyph)).join("")}
    </svg>`;
    target.innerHTML = svg;
    return { aspects };
}

/* ============================================================
 *  Roda hermética (24 sectors de 15°)
 * ============================================================ */

/*
 * Cada signo é dividido em duas metades de 15° — primeira [0,15) e segunda
 * [15,30] — regadas por cartas de corte do tarô, associadas a um naipe:
 * Bastões=Fogo, Moedas=Terra, Espadas=Ar, Taças=Água. Planetas em graus
 * cuspais (≤5° ou ≥25°) recebem um título hermético e são destacados.
 * Espelha app/hermetic.py.
 */

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

const SUIT_ELEMENT = {
    "Bastões": "fire", "Moedas": "earth", "Espadas": "air", "Taças": "water",
};

function suitOf(title) {
    const m = / (Bastões|Moedas|Espadas|Taças)$/.exec(title || "");
    return m ? m[1] : null;
}

function hermeticSectors() {
    const out = [];
    HERMETIC_SECTORS.forEach((s, i) => {
        const base = i * 30;
        const earlySuit = suitOf(s.early);
        const lateSuit  = suitOf(s.late);
        const earlyElem = SUIT_ELEMENT[earlySuit] || SIGNS[i].element;
        const lateElem  = SUIT_ELEMENT[lateSuit]  || SIGNS[i].element;
        out.push(
            { start: base, end: base + 15, sign: s.sign, half: "early", title: s.early,
              element: earlyElem, color: ELEMENT_FILL[earlyElem] },
            { start: base + 15, end: base + 30, sign: s.sign, half: "late", title: s.late,
              element: lateElem, color: ELEMENT_FILL[lateElem] },
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
        const rot = (180 - mid) % 360;
        return `
            <path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="1"/>
            <text x="${signLbl.x}" y="${signLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="13" font-weight="700" fill="${sec.color}">${SIGN_GLYPH[sec.sign] || ""}</text>
            <text x="${label.x}" y="${label.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="6.5" fill="${sec.color}"
                  transform="rotate(${rot}, ${label.x}, ${label.y})">
                  ${sec.title.replace(" de ", " ")}
            </text>`;
    }).join("");
}

function hermeticMarker(cx, cy, name, lon, position, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
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
              fill="${color}">${POINT_GLYPH[name] || "·"}</text>`;
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

/* ============================================================
 *  Roda dos 72 Anjos do Shem HaMephorash (sectores de 5°)
 * ============================================================ */

/*
 * 72 anjos: 6 por signo, 1 por bin de 5° ([0,5), [5,10), ... [25,30]).
 * Os planetas natais caem no sector do seu anjo regente — esses sectors
 * são destacados. Espelha app/angels.py (fonte de verdade).
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

function angelSectors() {
    return ANGELS.map(a => {
        const signIdx = SIGNS.findIndex(s => s.key === a.sign);
        const base = signIdx * 30 + a.bin * 5;
        const elem = SIGNS[signIdx].element;
        return { ...a, start: base, end: base + 5, color: ELEMENT_FILL[elem], element: elem };
    });
}

function angelSectorForLon(lon) {
    const norm = ((lon % 360) + 360) % 360;
    return Math.floor(norm / 5);
}

function angelsRing(cx, cy, rOuter, rInner) {
    return angelSectors().map(sec => {
        const fill = sec.color + "16";
        const stroke = sec.color + "66";
        const mid = (sec.start + sec.end) / 2;
        const isSignBoundary = sec.bin === 0;
        const signLbl = svgPoint(cx, cy, mid, rInner - 14);
        const angelLbl = svgPoint(cx, cy, mid, (rOuter + rInner) / 2 + 6);
        const rot = (180 - mid) % 360;
        return `
            <path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                  fill="${fill}" stroke="${stroke}" stroke-width="${isSignBoundary ? 1.4 : 0.6}"/>
            ${isSignBoundary ? `<text x="${signLbl.x}" y="${signLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="12" font-weight="700" fill="${sec.color}">${SIGN_GLYPH[sec.sign] || ""}</text>` : ""}
            <text x="${angelLbl.x}" y="${angelLbl.y}"
                  text-anchor="middle" dominant-baseline="central"
                  font-size="5.5" fill="${sec.color}" opacity="0.9"
                  transform="rotate(${rot}, ${angelLbl.x}, ${angelLbl.y})">${sec.angel}</text>`;
    }).join("");
}

function angelMarker(cx, cy, name, lon, rPoint, rGlyph) {
    const base = svgPoint(cx, cy, lon, rPoint);
    const tick = svgPoint(cx, cy, lon, rPoint - 6);
    const labelPoint = svgPoint(cx, cy, lon, rGlyph);
    const color = name === "asc" ? "#0369a1" : "#1c1917";
    return `
        <line x1="${tick.x}" y1="${tick.y}" x2="${base.x}" y2="${base.y}"
              stroke="${color}" stroke-width="1.2" opacity="0.7"/>
        <text x="${labelPoint.x}" y="${labelPoint.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${name === 'asc' ? 16 : 18}" font-weight="${name === 'asc' ? 700 : 400}"
              fill="${color}">${POINT_GLYPH[name] || "·"}</text>`;
}

function renderAngelsWheel(chart, target) {
    const cx = 250, cy = 250;
    const rOuter = 220, rInner = 168, rPoint = 150, rGlyph = 132;
    const points = Object.entries(chart.points);
    const occupied = new Set(points.map(([, p]) => angelSectorForLon(p.lon)));

    const sectorsSvg = angelSectors().map((sec, i) => {
        if (!occupied.has(i)) return "";
        return `<path d="${ringPath(sec.start, sec.end, rOuter, rInner, cx, cy)}"
                      fill="${sec.color}33" stroke="${sec.color}" stroke-width="2" opacity="0.9"/>`;
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

/* ============================================================
 *  Tabelas de detalhes (um render por método)
 * ============================================================ */

function renderDetails(chart, target, aspects) {
    target.innerHTML = detailPanel(chart,
        pointTable(chart.points, [COL_PONTO, COL_SIGNO, COL_GRAU, COL_SEPHIROTH, COL_CASA]) +
        aspectTable(aspects),
        { title: "Detalhes do Mapa" });
}

function renderHermeticDetails(chart, target) {
    target.innerHTML = detailPanel(chart,
        pointTable(chart.points, [COL_PONTO, COL_SIGNO, COL_GRAU, COL_TITULO]),
        { title: "Detalhes Herméticos",
          note: "Títulos em destaque = graus cuspais (≤5° ou ≥25°)" });
}

function renderAngelsDetails(chart, target) {
    target.innerHTML = detailPanel(chart,
        pointTable(chart.points, [COL_PONTO, COL_SIGNO, COL_GRAU, COL_ANJO]),
        { title: "Anjos do Shem HaMephorash",
          note: "72 anjos — 6 por signo, 1 por intervalo de 5°. Sectores destacados = anjo regente do planeta." });
}

function renderSephirothDetails(chart, target) {
    target.innerHTML = detailPanel(chart,
        pointTable(chart.points, [COL_PONTO, COL_SIGNO, COL_GRAU, COL_SEPHIROTH, COL_CASA]),
        { title: "Detalhes do Mapa" });
}
