// Distribution maths. No DOM: also loaded by the Node tests.
// Each distribution provides:
//   pmf(k, params)         P(X = k)
//   upper(params)          a k beyond which the remaining mass is negligible (< ~1e-7)
//   stats(params)          { mean, variance, sd, secondMoment, skewness }
const Distributions = (function () {
  // ln(k!) via a cached table of partial sums.
  const logFactTable = [0];
  function logFactorial(k) {
    for (let i = logFactTable.length; i <= k; i++) logFactTable[i] = logFactTable[i - 1] + Math.log(i);
    return logFactTable[k];
  }

  // Shared: E[X²] = Var + Mean², sd = √Var.
  function moments(mean, variance, skewness) {
    return {
      mean,
      variance,
      sd: Math.sqrt(variance),
      secondMoment: variance + mean * mean,
      skewness,
    };
  }

  // X ~ B(n, p): successes in n independent trials.
  const binomial = {
    pmf(k, { n, p }) {
      if (k < 0 || k > n) return 0;
      if (p === 0) return k === 0 ? 1 : 0;
      if (p === 1) return k === n ? 1 : 0;
      const logC = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
      return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
    },
    upper({ n }) {
      return n;
    },
    stats({ n, p }) {
      const mean = n * p;                       // np
      const variance = n * p * (1 - p);         // np(1 - p)
      // (1 - 2p) / √(np(1 - p)); undefined when the variance is 0 (p = 0 or 1).
      const skewness = variance > 0 ? (1 - 2 * p) / Math.sqrt(variance) : NaN;
      return moments(mean, variance, skewness);
    },
  };

  // X ~ Pois(λ): events in a fixed interval at average rate λ.
  const poisson = {
    pmf(k, { lambda }) {
      if (k < 0) return 0;
      return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k));
    },
    upper({ lambda }) {
      // Walk past the mean until the remaining tail is negligible.
      let k = 0, cdf = 0;
      while (k < 100000) {
        cdf += poisson.pmf(k, { lambda });
        if (k >= lambda && 1 - cdf < 1e-7) break;
        k++;
      }
      return k;
    },
    stats({ lambda }) {
      // Mean = Var = λ; skewness = 1 / √λ.
      return moments(lambda, lambda, 1 / Math.sqrt(lambda));
    },
  };

  // X ~ Geom(p): trial on which the first success occurs (k = 1, 2, 3, …).
  const geometric = {
    pmf(k, { p }) {
      if (k < 1) return 0;
      if (p === 1) return k === 1 ? 1 : 0;
      return Math.exp((k - 1) * Math.log(1 - p)) * p;   // (1 - p)^(k-1) p
    },
    upper({ p }) {
      // P(X > k) = (1 - p)^k < 1e-7
      if (p === 1) return 1;
      return Math.max(1, Math.ceil(Math.log(1e-7) / Math.log(1 - p)));
    },
    stats({ p }) {
      const mean = 1 / p;                       // 1/p
      const variance = (1 - p) / (p * p);       // (1 - p)/p²
      // (2 - p) / √(1 - p); undefined when p = 1 (no variance).
      const skewness = p < 1 ? (2 - p) / Math.sqrt(1 - p) : NaN;
      return moments(mean, variance, skewness);
    },
  };

  // P(X = k) for k = 0 … kMax.
  function pmfTable(dist, params, kMax) {
    const probs = [];
    for (let k = 0; k <= kMax; k++) probs.push(dist.pmf(k, params));
    return probs;
  }

  return { binomial, poisson, geometric, pmfTable };
})();

if (typeof module !== "undefined") module.exports = Distributions;
