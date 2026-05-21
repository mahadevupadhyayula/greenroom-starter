export type ParserCase = {
  name: string;
  notes: string;
  expected: {
    guarantee: number | null;
    percentage: number | null;
    basis: "gross" | "net" | null;
    expenseCap: number | null;
    hospitalityCap: number | null;
    hasAmbiguity: boolean;
    hasBlocker: boolean;
    hasNonStandard: boolean;
  };
};

export const parserCases: ParserCase[] = [
  {
    name: "standard vs gross with caps",
    notes: "Vs guarantee $2,500 vs 85% of gross. Expense cap $400. Hospitality cap $150.",
    expected: {
      guarantee: 2500,
      percentage: 85,
      basis: "gross",
      expenseCap: 400,
      hospitalityCap: 150,
      hasAmbiguity: false,
      hasBlocker: false,
      hasNonStandard: false,
    },
  },
  {
    name: "net basis no caps",
    notes: "Guarantee: $3000, 80% net after approved expenses",
    expected: {
      guarantee: 3000,
      percentage: 80,
      basis: "net",
      expenseCap: null,
      hospitalityCap: null,
      hasAmbiguity: false,
      hasBlocker: false,
      hasNonStandard: false,
    },
  },
  {
    name: "ambiguous multi percentage",
    notes: "VS guarantee $2,000 then 80% or 85% gross depending on sellout",
    expected: {
      guarantee: 2000,
      percentage: null,
      basis: "gross",
      expenseCap: null,
      hospitalityCap: null,
      hasAmbiguity: true,
      hasBlocker: true,
      hasNonStandard: false,
    },
  },
  {
    name: "conflicting basis",
    notes: "Min $1,750 vs 82% gross / 82% net per settlement sheet",
    expected: {
      guarantee: 1750,
      percentage: 82,
      basis: null,
      expenseCap: null,
      hospitalityCap: null,
      hasAmbiguity: true,
      hasBlocker: true,
      hasNonStandard: false,
    },
  },
  {
    name: "non standard walkout",
    notes: "Guarantee $1,000 vs 70% gross with walkout after 200 paid",
    expected: {
      guarantee: 1000,
      percentage: 70,
      basis: "gross",
      expenseCap: null,
      hospitalityCap: null,
      hasAmbiguity: false,
      hasBlocker: false,
      hasNonStandard: true,
    },
  },
  {
    name: "ambiguous language tbd",
    notes: "Vs deal around $2200 and maybe 80% gross, final terms TBD",
    expected: {
      guarantee: null,
      percentage: 80,
      basis: "gross",
      expenseCap: null,
      hospitalityCap: null,
      hasAmbiguity: true,
      hasBlocker: true,
      hasNonStandard: false,
    },
  },
];
