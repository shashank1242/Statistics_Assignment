// Builds one distribution page (inputs, statistic cards, probabilities for k,
// PMF chart and table) from a config. See js/pages.js for the three configs.
const DistPage = (function () {
  const MAX_BARS = 1001; // longest window drawn in the chart and table

  // Probabilities: fixed 6 decimals, scientific below 0.0001.
  function format(x) {
    if (x === 0) return "0";
    if (Math.abs(x) < 1e-4) return x.toExponential(3);
    return x.toFixed(6);
  }

  // Statistics: up to 4 decimals, trailing zeros dropped.
  function formatStat(x) {
    return String(Number(x.toFixed(4)));
  }

  // A round step (1, 2, 2.5 or 5 × 10^m) that splits `range` into at most `maxTicks` parts.
  function niceStep(range, maxTicks, integer) {
    const raw = range / maxTicks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]) {
      if (m * mag >= raw) return m * mag;
    }
    return 10 * mag;
  }

  // Smallest window [lo, hi] that holds all but ~1e-7 of the mass, always including k.
  function visibleRange(probs, k) {
    const tail = 1e-7;
    let lo = 0, hi = probs.length - 1, s = 0;
    while (lo < hi && s + probs[lo] < tail) s += probs[lo++];
    s = 0;
    while (hi > lo && s + probs[hi] < tail) s += probs[hi--];
    lo = Math.min(lo, k);
    hi = Math.max(hi, k);
    if (hi - lo + 1 > MAX_BARS) hi = Math.max(k, lo + MAX_BARS - 1);
    return [lo, hi];
  }

  // PMF as an SVG bar chart: grey bars, the selected k in the one hue,
  // a dashed reference line at the mean.
  function drawChart(container, probs, k, mean, onSelect) {
    const [lo, hi] = visibleRange(probs, k);
    const count = hi - lo + 1;
    // Draw at the container's real width so text stays 12px on a phone.
    const W = Math.max(300, container.clientWidth || 720);
    const H = W < 500 ? 220 : 300;
    const m = { top: 28, right: 8, bottom: 32, left: 44 };
    const plotW = W - m.left - m.right;
    const plotH = H - m.top - m.bottom;

    const maxP = Math.max.apply(null, probs.slice(lo, hi + 1)) || 1;
    const yStep = niceStep(maxP, 4);
    const yTop = Math.floor(maxP / yStep + 1e-9) * yStep + yStep; // top tick above the maximum
    const y = (v) => m.top + plotH - (v / yTop) * plotH;

    const slot = plotW / count;
    const barW = Math.max(1, slot * (count > 60 ? 0.9 : 0.72));
    const xCenter = (i) => m.left + (i - lo + 0.5) * slot;
    const xStep = Math.max(1, Math.ceil(niceStep(count, W < 500 ? 5 : 7, true)));
    const decimals = yStep < 0.01 ? 3 : 2;

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of P(X = k) for k from ${lo} to ${hi}" font-size="12">`;

    for (let v = 0; v <= yTop + 1e-9; v += yStep) {
      const yy = y(v);
      if (v > 0) svg += `<line x1="${m.left}" x2="${W - m.right}" y1="${yy}" y2="${yy}" stroke="var(--grid)"/>`;
      svg += `<text x="${m.left - 10}" y="${yy + 4}" text-anchor="end" fill="var(--muted)">${v.toFixed(decimals)}</text>`;
    }

    for (let i = lo; i <= hi; i++) {
      const top = y(probs[i]);
      const x = xCenter(i) - barW / 2;
      const fill = i === k ? "var(--hue)" : "var(--bar)";
      svg += `<rect class="bar" data-k="${i}" x="${x}" y="${top}" width="${barW}" height="${m.top + plotH - top}" fill="${fill}"><title>P(X = ${i}) = ${format(probs[i])}</title></rect>`;
      if (i % xStep === 0 || (i === lo && lo % xStep > xStep / 2)) {
        svg += `<text x="${xCenter(i)}" y="${H - 10}" text-anchor="middle" fill="var(--muted)">${i}</text>`;
      }
    }

    // Baseline: the one heavier line.
    svg += `<line x1="${m.left}" x2="${W - m.right}" y1="${m.top + plotH}" y2="${m.top + plotH}" stroke="var(--text)" stroke-width="1.5"/>`;

    // Reference line at the mean.
    if (mean >= lo - 0.5 && mean <= hi + 0.5) {
      const xm = m.left + (mean - lo + 0.5) * slot;
      const anchor = xm > W - 90 ? "end" : "start";
      const dx = anchor === "end" ? -6 : 6;
      // A paper-coloured line under a dashed ink line reads on both paper and ink bars.
      svg += `<line x1="${xm}" x2="${xm}" y1="${m.top - 12}" y2="${m.top + plotH}" stroke="var(--paper, #fff)" stroke-width="4"/>`;
      svg += `<line x1="${xm}" x2="${xm}" y1="${m.top - 12}" y2="${m.top + plotH}" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      svg += `<text x="${xm + dx}" y="${m.top - 4}" text-anchor="${anchor}" fill="var(--text)">Mean ${formatStat(mean)}</text>`;
    }
    svg += `</svg>`;

    container.innerHTML = svg;
    container.querySelectorAll(".bar").forEach(function (bar) {
      bar.style.cursor = "pointer";
      bar.addEventListener("click", function () { onSelect(Number(bar.dataset.k)); });
    });
    return [lo, hi];
  }

  // ---------- Markup ----------

  function fieldHtml(id, f) {
    return `
      <div class="field">
        <label for="${id}">${f.label}, <var>${f.sym}</var></label>
        <input type="number" id="${id}" step="${f.step}" value="${f.value}"
          inputmode="${f.integer ? "numeric" : "decimal"}" aria-describedby="${id}-hint">
        <p class="hint" id="${id}-hint">${f.hint}</p>
      </div>`;
  }

  function render(cfg) {
    const id = cfg.id;
    const selected = cfg.params
      .map((f) => `<var>${f.sym}</var> = <span class="num" data-param="${f.key}">${f.value}</span>`)
      .join(", ");
    const cards = cfg.stats
      .map((s) => `
        <div class="stat">
          <span class="stat-label">${s.label}</span>
          <span class="stat-formula">${s.formula}</span>
          <span class="stat-value num" data-stat="${s.key}"></span>
          <span class="stat-note" data-note="${s.key}"></span>
        </div>`)
      .join("");
    const kVal = `<span class="k-val">${cfg.k.value}</span>`;

    document.getElementById("page-" + id).innerHTML = `
      <div class="title-row">
        <p class="meta">Unit / ${cfg.unit} &nbsp;/// Discrete PMF</p>
        <h1>${cfg.title}</h1>
        <p class="selected" aria-live="polite"><var>X</var> ~ ${cfg.notation}(${selected})</p>
        <p class="subline formula">${cfg.formula}</p>
      </div>

      <div class="grid top">
        <form class="panel inputs" novalidate>
          <h2>Parameters</h2>
          ${cfg.params.map((f) => fieldHtml(id + "-" + f.key, f)).join("")}
          <p class="error" data-error="params" role="alert" hidden></p>
        </form>
        <div class="stats" aria-label="Statistics">${cards}</div>
      </div>

      <div class="panel results">
        <div class="k-field">
          ${fieldHtml(id + "-k", cfg.k)}
          <p class="error" data-error="k" role="alert" hidden></p>
        </div>
        <div class="kpis">
          <div class="kpi lead">
            <span class="label">P(<var>X</var> = ${kVal})</span>
            <span class="value num" data-prob="eq"></span>
          </div>
          <div class="kpi">
            <span class="label">P(<var>X</var> &le; ${kVal})</span>
            <span class="value num" data-prob="le"></span>
          </div>
          <div class="kpi">
            <span class="label">P(<var>X</var> &ge; ${kVal})</span>
            <span class="value num" data-prob="ge"></span>
          </div>
        </div>
      </div>

      <div class="grid bottom">
        <div class="panel chart-panel">
          <div class="panel-head">
            <h2>Probability mass function</h2>
            <p class="legend"><span class="swatch"></span><span>P(<var>X</var> = ${kVal})</span></p>
          </div>
          <div class="chart"></div>
        </div>
        <div class="panel table-panel">
          <div class="panel-head">
            <h2>Values</h2>
            <p class="muted" data-count></p>
          </div>
          <div class="table-scroll">
            <div class="table-inner">
              <table class="pmf">
                <thead><tr><th class="num">k</th><th class="num">P(X = k)</th><th class="num">P(X &le; k)</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ---------- Behaviour ----------

  // Reads and checks one input. Returns { value } or { error }.
  function readField(input, f, bounds) {
    const raw = input.value.trim();
    const v = Number(raw);
    if (raw === "" || isNaN(v)) return { error: `Enter the ${f.label.toLowerCase()}, ${f.symText || f.sym}.` };
    const min = bounds.min, max = bounds.max;
    const tooLow = f.minExclusive ? v <= min : v < min;
    if ((f.integer && !Number.isInteger(v)) || tooLow) return { error: f.error(bounds) };
    if (v > max) return { error: f.maxError(bounds) };
    return { value: v };
  }

  function mount(cfg) {
    render(cfg);
    const page = document.getElementById("page-" + cfg.id);
    const q = (sel) => page.querySelector(sel);
    const inputs = {};
    cfg.params.forEach((f) => { inputs[f.key] = q("#" + cfg.id + "-" + f.key); });
    const kInput = q("#" + cfg.id + "-k");
    const paramError = q('[data-error="params"]');
    const kError = q('[data-error="k"]');

    function setError(input, message) {
      page.querySelectorAll("input").forEach((el) => el.removeAttribute("aria-invalid"));
      paramError.hidden = kError.hidden = true;
      // Results keep the last valid values; grey them out while an input is invalid.
      page.classList.toggle("stale", Boolean(input));
      page.classList.toggle("stale-k", input === kInput);
      if (!input) return;
      const el = input === kInput ? kError : paramError;
      input.setAttribute("aria-invalid", "true");
      el.textContent = message;
      el.hidden = false;
    }

    function calculate() {
      const params = {};
      for (const f of cfg.params) {
        const r = readField(inputs[f.key], f, { min: f.min, max: f.max });
        if (r.error) return setError(inputs[f.key], r.error);
        params[f.key] = r.value;
      }

      // k: clamp to the support's upper limit (e.g. k ≤ n for the binomial) as it moves.
      const kMax = cfg.k.max(params);
      if (Number(kInput.value) > kMax) kInput.value = kMax;
      const rk = readField(kInput, cfg.k, { min: cfg.k.min, max: kMax });
      if (rk.error) return setError(kInput, rk.error);
      const k = rk.value;
      setError(null);

      page.querySelectorAll("[data-param]").forEach((el) => { el.textContent = params[el.dataset.param]; });
      page.querySelectorAll(".k-val").forEach((el) => { el.textContent = k; });

      // Statistic cards.
      const st = cfg.dist.stats(params);
      cfg.stats.forEach((s) => {
        const v = st[s.key];
        q(`[data-stat="${s.key}"]`).textContent = isNaN(v) ? "—" : formatStat(v);
        q(`[data-note="${s.key}"]`).textContent = s.note ? s.note(v, params) : "";
      });

      // Probabilities for k = 0 … max(k, upper tail).
      const kTop = Math.max(k, cfg.dist.upper(params));
      const probs = Distributions.pmfTable(cfg.dist, params, kTop);
      let sum = 0;
      const cumulative = probs.map((x) => { sum += x; return Math.min(sum, 1); });
      const pGe = Math.min(1, Math.max(0, 1 - (k > 0 ? cumulative[k - 1] : 0)));
      q('[data-prob="eq"]').textContent = format(probs[k]);
      q('[data-prob="le"]').textContent = format(cumulative[k]);
      q('[data-prob="ge"]').textContent = format(pGe);

      const [lo, hi] = drawChart(q(".chart"), probs, k, st.mean, (i) => {
        kInput.value = i;
        calculate();
      });

      const supportEnd = cfg.k.max(params);
      const fullRange = lo <= cfg.k.min && hi === supportEnd;
      q("[data-count]").textContent = fullRange
        ? hi - lo + 1 + " values"
        : `k = ${lo}–${hi} shown`;

      const tbody = q(".pmf tbody");
      let rows = "";
      for (let i = lo; i <= hi; i++) {
        const cls = i === k ? ' class="selected"' : "";
        rows += `<tr${cls}><td>${i}</td><td>${format(probs[i])}</td><td>${format(cumulative[i])}</td></tr>`;
      }
      tbody.innerHTML = rows;

      // Keep the selected row in view inside the table's own scroll area.
      const selectedRow = tbody.querySelector("tr.selected");
      const scroller = q(".table-inner");
      if (selectedRow && scroller) {
        const top = selectedRow.offsetTop - 36; // below the sticky header
        const bottom = selectedRow.offsetTop + selectedRow.offsetHeight;
        if (top < scroller.scrollTop) scroller.scrollTop = top;
        else if (bottom > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = bottom - scroller.clientHeight;
        }
      }
    }

    page.addEventListener("input", calculate);
    page.addEventListener("submit", (e) => e.preventDefault());
    calculate();
  }

  return { mount };
})();
