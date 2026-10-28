// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { binomial, pmfTable } = require("../js/distributions.js");

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

test("defaults n = 20, p = 0.35: mean 7, variance 4.55", () => {
  const s = binomial.stats({ n: 20, p: 0.35 });
  close(s.mean, 7);
  close(s.variance, 4.55);
  close(s.sd, Math.sqrt(4.55));
  close(s.secondMoment, 4.55 + 49); // 53.55
  close(s.skewness, 0.3 / Math.sqrt(4.55)); // ≈ 0.1406
});

test("statistics agree with sums over the PMF", () => {
  for (const [n, p] of [[20, 0.35], [10, 0.5], [57, 0.12], [400, 0.9]]) {
    const probs = pmfTable(binomial, { n, p }, n);
    const s = binomial.stats({ n, p });
    const mean = probs.reduce((acc, q, k) => acc + k * q, 0);
    const m2 = probs.reduce((acc, q, k) => acc + k * k * q, 0);
    const m3 = probs.reduce((acc, q, k) => acc + (k - mean) ** 3 * q, 0);
    close(mean, s.mean, 1e-8);
    close(m2, s.secondMoment, 1e-6);
    close(m3 / s.sd ** 3, s.skewness, 1e-6);
  }
});

test("p = 0.5 is symmetric; p = 0 or 1 has undefined skewness", () => {
  close(binomial.stats({ n: 10, p: 0.5 }).skewness, 0);
  assert.ok(Number.isNaN(binomial.stats({ n: 10, p: 0 }).skewness));
  assert.ok(Number.isNaN(binomial.stats({ n: 10, p: 1 }).skewness));
  close(binomial.stats({ n: 10, p: 1 }).secondMoment, 100);
});
