// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { poisson, geometric, pmfTable } = require("../js/distributions.js");

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

// Mean, E[X²] and skewness by summing over the PMF up to the negligible tail.
function sums(dist, params) {
  const probs = pmfTable(dist, params, dist.upper(params) + 200);
  const total = probs.reduce((a, q) => a + q, 0);
  const mean = probs.reduce((a, q, k) => a + k * q, 0);
  const m2 = probs.reduce((a, q, k) => a + k * k * q, 0);
  const sd = Math.sqrt(m2 - mean * mean);
  const m3 = probs.reduce((a, q, k) => a + (k - mean) ** 3 * q, 0);
  return { total, mean, m2, skewness: m3 / sd ** 3 };
}

test("Poisson λ = 4: mean 4, variance 4, E[X²] 20, skewness 0.5", () => {
  const s = poisson.stats({ lambda: 4 });
  close(s.mean, 4);
  close(s.variance, 4);
  close(s.secondMoment, 20);
  close(s.skewness, 0.5);
  close(poisson.pmf(4, { lambda: 4 }), 0.19536681481316454, 1e-12);
});

test("Poisson statistics agree with sums over the PMF", () => {
  for (const lambda of [0.3, 4, 17.5, 250]) {
    const s = poisson.stats({ lambda });
    const t = sums(poisson, { lambda });
    close(t.total, 1, 1e-6);
    close(t.mean, s.mean, 1e-5);
    close(t.m2, s.secondMoment, 1e-3);
    close(t.skewness, s.skewness, 1e-4);
  }
});

test("Geometric p = 0.3: mean 10/3, variance 70/9, P(X = 3) = 0.147", () => {
  const s = geometric.stats({ p: 0.3 });
  close(s.mean, 10 / 3);
  close(s.variance, 0.7 / 0.09);
  close(s.secondMoment, 1.7 / 0.09); // (2 - p) / p²
  close(s.skewness, 1.7 / Math.sqrt(0.7));
  close(geometric.pmf(3, { p: 0.3 }), 0.147, 1e-12);
  assert.equal(geometric.pmf(0, { p: 0.3 }), 0);
});

test("Geometric statistics agree with sums over the PMF", () => {
  for (const p of [0.05, 0.3, 0.5, 0.9]) {
    const s = geometric.stats({ p });
    const t = sums(geometric, { p });
    close(t.total, 1, 1e-6);
    close(t.mean, s.mean, 1e-4);
    close(t.m2, s.secondMoment, 1e-2);
    close(t.skewness, s.skewness, 1e-3);
  }
});

test("Geometric p = 1: always the first trial, skewness undefined", () => {
  assert.equal(geometric.pmf(1, { p: 1 }), 1);
  assert.equal(geometric.pmf(2, { p: 1 }), 0);
  close(geometric.stats({ p: 1 }).variance, 0);
  assert.ok(Number.isNaN(geometric.stats({ p: 1 }).skewness));
});
