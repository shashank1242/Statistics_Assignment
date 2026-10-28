// Page configs for the three distributions; DistPage builds each page from these.
(function () {
  const { binomial, poisson, geometric } = Distributions;

  const skewNote = (v) =>
    isNaN(v) ? "" : v > 1e-12 ? "Right-skewed" : v < -1e-12 ? "Left-skewed" : "Symmetric";

  // Statistic cards shared by all three; each page supplies the formulas.
  function statCards(f) {
    return [
      { key: "mean", label: "Mean", formula: f.mean },
      { key: "variance", label: "Variance", formula: f.variance },
      { key: "sd", label: "Standard deviation", formula: "&sigma; = &radic;&sigma;&sup2;" },
      { key: "secondMoment", label: "Second moment", formula: "E[<var>X</var>&sup2;] = &sigma;&sup2; + &mu;&sup2;" },
      {
        key: "skewness", label: "Skewness", formula: f.skewness,
        note: (v) => (isNaN(v) ? f.skewUndefined : skewNote(v)),
      },
    ];
  }

  DistPage.mount({
    id: "binomial",
    unit: "D-01",
    title: "Binomial distribution",
    notation: "B",
    formula: `P(<var>X</var> = <var>k</var>) = C(<var>n</var>, <var>k</var>) &middot;
      <var>p</var><sup><var>k</var></sup> &middot; (1 &minus; <var>p</var>)<sup><var>n</var>&minus;<var>k</var></sup>,
      &nbsp;<var>k</var> = 0, 1, &hellip;, <var>n</var>`,
    dist: binomial,
    params: [
      {
        key: "n", sym: "n", label: "Number of trials", integer: true, step: 1, value: 20,
        min: 1, max: 1000, hint: "Positive whole number, up to 1,000",
        error: () => "n must be a positive whole number (1, 2, 3, …).",
        maxError: () => "n can be at most 1,000.",
      },
      {
        key: "p", sym: "p", label: "Probability of success", step: 0.01, value: 0.35,
        min: 0, max: 1, hint: "From 0 to 1",
        error: () => "p must be between 0 and 1.",
        maxError: () => "p must be between 0 and 1.",
      },
    ],
    k: {
      sym: "k", label: "Number of successes", integer: true, step: 1, value: 7,
      min: 0, max: ({ n }) => n, hint: "Whole number from 0 to <var>n</var>",
      error: (b) => `k must be a whole number from 0 to ${b.max}.`,
      maxError: (b) => `k must be a whole number from 0 to ${b.max}.`,
    },
    stats: statCards({
      mean: "&mu; = <var>np</var>",
      variance: "&sigma;&sup2; = <var>np</var>(1 &minus; <var>p</var>)",
      skewness: "(1 &minus; 2<var>p</var>) / &radic;(<var>np</var>(1 &minus; <var>p</var>))",
      skewUndefined: "Undefined when p = 0 or 1",
    }),
  });

  DistPage.mount({
    id: "poisson",
    unit: "D-02",
    title: "Poisson distribution",
    notation: "Pois",
    formula: `P(<var>X</var> = <var>k</var>) = <var>&lambda;</var><sup><var>k</var></sup>
      e<sup>&minus;<var>&lambda;</var></sup> / <var>k</var>!, &nbsp;<var>k</var> = 0, 1, 2, &hellip;`,
    dist: poisson,
    params: [
      {
        key: "lambda", sym: "&lambda;", symText: "λ", label: "Average rate", step: 0.1, value: 4,
        min: 0, minExclusive: true, max: 500, hint: "Greater than 0, up to 500",
        error: () => "λ must be greater than 0.",
        maxError: () => "λ can be at most 500.",
      },
    ],
    k: {
      sym: "k", label: "Number of events", integer: true, step: 1, value: 4,
      min: 0, max: () => 1000, hint: "Whole number from 0 to 1,000",
      error: () => "k must be a whole number from 0 to 1,000.",
      maxError: () => "k must be a whole number from 0 to 1,000.",
    },
    stats: statCards({
      mean: "&mu; = <var>&lambda;</var>",
      variance: "&sigma;&sup2; = <var>&lambda;</var>",
      skewness: "1 / &radic;<var>&lambda;</var>",
    }),
  });

  DistPage.mount({
    id: "geometric",
    unit: "D-03",
    title: "Geometric distribution",
    notation: "Geom",
    formula: `P(<var>X</var> = <var>k</var>) = (1 &minus; <var>p</var>)<sup><var>k</var>&minus;1</sup> <var>p</var>,
      &nbsp;<var>k</var> = 1, 2, 3, &hellip;`,
    dist: geometric,
    params: [
      {
        key: "p", sym: "p", label: "Probability of success", step: 0.01, value: 0.3,
        min: 0.001, max: 1, hint: "From 0.001 to 1",
        error: () => "p must be between 0.001 and 1.",
        maxError: () => "p must be between 0.001 and 1.",
      },
    ],
    k: {
      sym: "k", label: "Trial of the first success", integer: true, step: 1, value: 3,
      min: 1, max: () => 1000, hint: "Whole number from 1 to 1,000",
      error: () => "k must be a whole number from 1 to 1,000.",
      maxError: () => "k must be a whole number from 1 to 1,000.",
    },
    stats: statCards({
      mean: "&mu; = 1 / <var>p</var>",
      variance: "&sigma;&sup2; = (1 &minus; <var>p</var>) / <var>p</var>&sup2;",
      skewness: "(2 &minus; <var>p</var>) / &radic;(1 &minus; <var>p</var>)",
      skewUndefined: "Undefined when p = 1",
    }),
  });
})();
