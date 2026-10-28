# Discrete Probability Distributions

An interactive web app for an undergraduate AIML laboratory. It computes probabilities,
summary statistics and the probability mass function (PMF) of three discrete distributions.

**Author:** Shashank P

## Distributions

| Distribution | Parameters | P(X = k) | Mean | Variance | Skewness |
|---|---|---|---|---|---|
| Binomial `B(n, p)` | trials *n*, success probability *p* | C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ, k = 0 … n | np | np(1 − p) | (1 − 2p) / √(np(1 − p)) |
| Poisson `Pois(λ)` | average rate *λ* | λᵏ e⁻λ / k!, k = 0, 1, 2, … | λ | λ | 1 / √λ |
| Geometric `Geom(p)` | success probability *p* | (1 − p)ᵏ⁻¹ p, k = 1, 2, 3, … | 1 / p | (1 − p) / p² | (2 − p) / √(1 − p) |

For every distribution the second moment is E[X²] = Variance + Mean².

## Features

- Inputs are validated as you type, with a message under the field that is wrong.
- Statistic cards: mean, variance, standard deviation, second moment E[X²] and skewness.
- P(X = k), P(X ≤ k) and P(X ≥ k) for a chosen *k*.
- A PMF bar chart with the mean marked; click a bar to select that *k*.
- A table of P(X = k) and P(X ≤ k) for every *k* with non-negligible probability.
- Works on desktop and phone widths.

## Running it

No build step or install. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Fonts load from Google Fonts; without a network connection the page falls back to system fonts.

## Tests

The formulas are checked with Node's built-in test runner (Node 18+):

```bash
node --test tests/
```

The tests compare each closed-form statistic with sums over the PMF, and check the default
binomial case n = 20, p = 0.35 (mean 7, variance 4.55).

## Project structure

```
index.html              page shell, header and home page
css/style.css           styles
js/distributions.js     PMF and statistics for each distribution (no DOM; used by the tests)
js/dist-page.js         builds a distribution page: inputs, cards, chart, table
js/pages.js             settings for the Binomial, Poisson and Geometric pages
js/app.js               hash-based navigation between pages
tests/                  Node tests for the formulas
```
