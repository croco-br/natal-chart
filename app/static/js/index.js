/**
 * index.js — form handler + method dispatch.
 *
 * Single POST /calculate with {date, time, city, name, method}.
 * - traditional → SVG natal wheel (12 signs) + aspect detail table
 * - hermetic    → SVG hermetic wheel (24 sectors) + hermetic detail table
 * - sephiroth   → Tree of Life (traditional Golden Dawn mapping)
 * - angels      → SVG 72-sector Shem HaMephorash wheel + angel detail table
 * - others      → raw JSON dump
 *
 * SVG/detail renderers live in natal.js (wheel, hermetic, angels) and
 * sephiroth.js (tree); this file owns fetch + layout.
 */

const METHOD_LABELS = {
    traditional:  'Astrologia Tradicional (12 Signos)',
    hermetic:     'Astrologia Hermética (24 Signos)',
    angels:       'Anjos Cabalísticos (72 Signos)',
    sephiroth:    'Astrologia Cabalística (Sephiroth)',
    agathadaimon: 'Agathadaimon (Nome do Anjo da Guarda)',
};

// Methods that get a visual SVG render instead of a raw JSON dump.
const VISUAL_METHODS = new Set(['traditional', 'hermetic', 'sephiroth', 'angels']);

async function calculate() {
    const button = document.getElementById('calculate-button');
    const container = document.getElementById('result');

    const payload = {
        date:   document.getElementById('birthdate').value,
        time:   document.getElementById('birthtime').value,
        city:   document.getElementById('city').value,
        name:   document.getElementById('name').value || null,
        method: document.getElementById('method').value,
    };

    button.classList.add('is-loading');
    container.innerHTML = '<progress class="progress is-small is-primary" max="100">calculando…</progress>';

    try {
        const res = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();

        if (VISUAL_METHODS.has(payload.method)) {
            renderVisual(data, container, payload.method);
        } else {
            renderRawJSON(data, container, payload.method);
        }
    } catch (err) {
        container.innerHTML = `
            <div class="notification is-danger is-light">
                <strong>Erro:</strong> ${err.message}
            </div>`;
    } finally {
        button.classList.remove('is-loading');
    }
}

/* ---------- visual (SVG) render path ---------- */

function renderVisual(data, container, method) {
    const chart = data.chart;
    const label = METHOD_LABELS[method] || method;

    container.innerHTML = `
        <div class="box">
            <h2 class="subtitle">${label}</h2>
            <div id="wheel-container" style="max-width: 540px; margin: 0 auto;"></div>
            <div class="buttons is-centered mt-4">
                <button class="button is-small" onclick="toggleDetails()">
                    Mostrar Detalhes
                </button>
            </div>
            <div id="details-container" class="is-hidden"></div>
        </div>`;

    const wheelContainer = document.getElementById('wheel-container');

    if (method === 'hermetic') {
        renderHermeticWheel(chart, wheelContainer);
    } else if (method === 'angels') {
        renderAngelsWheel(chart, wheelContainer);
    } else if (method === 'sephiroth') {
        renderSephiroticView(chart, container);
    } else {
        // traditional — renderWheel also returns the detected aspects.
        const { aspects } = renderWheel(chart, wheelContainer);
        wheelContainer.dataset.aspects = JSON.stringify(aspects);
    }

    // Stash chart + method for the details toggle.
    wheelContainer.dataset.method = method;
    wheelContainer.dataset.chart = JSON.stringify(chart);
}

function toggleDetails() {
    const detailsContainer = document.getElementById('details-container');
    const wheelContainer = document.getElementById('wheel-container');

    if (detailsContainer.classList.contains('is-hidden')) {
        const chart = JSON.parse(wheelContainer.dataset.chart);
        const method = wheelContainer.dataset.method;
        if (method === 'hermetic') {
            renderHermeticDetails(chart, detailsContainer);
        } else if (method === 'angels') {
            renderAngelsDetails(chart, detailsContainer);
        } else {
            const aspects = JSON.parse(wheelContainer.dataset.aspects || '[]');
            renderDetails(chart, detailsContainer, aspects);
        }
        detailsContainer.classList.remove('is-hidden');
    } else {
        detailsContainer.classList.add('is-hidden');
    }
}

/* ---------- sephiroth view (Tree of Life only, traditional scheme) ---------- */

function renderSephiroticView(chart, container) {
    container.innerHTML = `
        <div class="box">
            <h2 class="subtitle has-text-centered">${METHOD_LABELS.sephiroth}</h2>
            <div id="tree-container" style="max-width: 420px; margin: 0 auto;"></div>
            <div class="buttons is-centered mt-4">
                <button class="button is-small" onclick="toggleDetails()">
                    Mostrar Detalhes
                </button>
            </div>
            <div id="details-container" class="is-hidden"></div>
        </div>`;

    // No natal wheel — the Tree of Life is the whole view.
    // A wheel-container is still stashed so toggleDetails can find the chart.
    const stash = document.createElement('div');
    stash.id = 'wheel-container';
    stash.style.display = 'none';
    stash.dataset.method = 'sephiroth';
    stash.dataset.chart = JSON.stringify(chart);
    container.querySelector('.box').appendChild(stash);

    const treeContainer = document.getElementById('tree-container');
    renderTreeOfLife(chart, treeContainer);
}

/* ---------- raw JSON render path ---------- */

function renderRawJSON(data, container, method) {
    const label = METHOD_LABELS[method] || method;
    // Escape so the JSON is safe inside <pre>.
    const pretty = JSON.stringify(data, null, 2)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    container.innerHTML = `
        <div class="box">
            <h2 class="subtitle">${label}</h2>
            <pre style="background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto;max-height:600px;font-size:0.8rem;">${pretty}</pre>
        </div>`;
}
