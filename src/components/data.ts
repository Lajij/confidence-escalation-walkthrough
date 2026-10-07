// Simulated, deterministic example data for the Tasman Connect walkthrough.
// Tasman Connect is a fictional ANZ telco. No real customers, no API calls.

export const PRIMARY_MODEL = "typesafe-ai/jev";
export const FALLBACK_MODEL = "openai/gpt-6-astra";
export const DAILY_VOLUME = 120_000;

// Illustrative example pricing (USD per 1,000 decisions) for the walkthrough only.
export const PRICE_PER_1K = { primary: 0.35, fallback: 5.8 };

export type TeamKey = "billing" | "faults" | "sales" | "moves" | "contracts" | "enterprise";

export const TEAMS: Record<TeamKey, { label: string; criteria: string }> = {
  billing: { label: "Billing & credits", criteria: "Invoices, charges, credits and refunds" },
  faults: { label: "Faults & outages", criteria: "Services down, degraded or dropping" },
  sales: { label: "New services", criteria: "New lines, upgrades and quotes" },
  moves: { label: "Moves & porting", criteria: "Relocations and number porting" },
  contracts: { label: "Contracts & cancellations", criteria: "Terms, renewals and cancellations" },
  enterprise: { label: "Enterprise accounts", criteria: "Multi-site reviews and account management" },
};

const TEAM_KEYS = Object.keys(TEAMS) as TeamKey[];

const CUSTOMERS = [
  "Bondi Bakehouse Pty Ltd", "Southern Cross Freight", "Harcourt Dental Group", "Kiwi Orchard Co-op",
  "Parramatta Physio", "Coastline Hardware", "Fremantle Fishworks", "Northshore Legal",
  "Waitemata Marine", "Blue Gum Childcare", "Canberra Civil Works", "Riverina Grain Traders",
  "Te Aro Design Studio", "Hobart Harbour Hotels", "Gold Coast Surf Supply", "Geelong Auto Group",
  "Darwin Field Services", "Adelaide Vine Logistics", "Ballarat Builders", "Newcastle Steel Fab",
  "Wellington Health Partners", "Cairns Reef Tours", "Penrith Plumbing", "Launceston Mills",
  "Christchurch Print Co", "Toowoomba Farm Supply", "Manly Wharf Cafe", "Perth Mining Services",
  "Sunshine Coast Realty", "Auckland Uniform Hire",
];

const SUBURBS = ["Parramatta", "Chatswood", "Geelong", "Fortitude Valley", "Newmarket", "Subiaco", "Glenelg", "Docklands"];

const CLEAR: Record<TeamKey, string[]> = {
  billing: [
    "Invoice #{n} shows a double charge for our mobile fleet this month.",
    "Can we get copies of last quarter's invoices for our accountant?",
    "Direct debit failed. Need to update the card on account {n}.",
    "Why did our bill jump ${m} this month? Nothing changed on our side.",
  ],
  faults: [
    "Internet at our {s} store has been down since 7am. EFTPOS is offline.",
    "Calls to our 1300 number drop after about 10 seconds.",
    "Site router is flashing red and the whole office is offline.",
    "Mobile coverage at our {s} warehouse has been dead since Tuesday.",
  ],
  sales: [
    "Looking to add 25 mobile lines for a new sales team.",
    "Please quote 1Gbps fibre for our new {s} warehouse.",
    "Interested in SD-WAN across our 12 sites. Who can we talk to?",
    "We want to add a 4G backup to every store before Christmas.",
  ],
  moves: [
    "We're relocating our {s} office on the 1st and need internet at the new address.",
    "Please port our 8 numbers across from our old provider.",
    "Moving the {s} clinic next month. What do we need to do?",
  ],
  contracts: [
    "Our contract ends in March. What are the exit terms?",
    "Please cancel the spare 4G backup service on account {n}.",
    "Can we see the renewal options before our term rolls over?",
  ],
  enterprise: [
    "Board wants a consolidated telco review across all 40 sites before renewal.",
    "Requesting a quarterly business review with our account manager.",
    "We need one contact for our national rollout across 3 states.",
  ],
};

// Genuinely ambiguous enquiries: [true team, plausible decoy, text]
const AMBIGUOUS: [TeamKey, TeamKey, string][] = [
  ["moves", "contracts", "Moving the {s} office. Cancel the old lines but keep our numbers."],
  ["billing", "contracts", "We were charged an early-exit fee after your outage. Reverse it please."],
  ["billing", "moves", "The new {s} site isn't connected yet but we're already being billed for it."],
  ["sales", "faults", "Internet has crawled since we added 20 staff. Do we need a bigger plan?"],
  ["enterprise", "faults", "Our 30-site renewal is due and two stores keep dropping out."],
  ["sales", "contracts", "Upgrade us to fibre and get rid of the old ADSL at {s}."],
  ["faults", "moves", "Numbers we ported last week aren't receiving calls since Monday."],
  ["billing", "faults", "Need a credit for the 3-day outage at our {s} store."],
  ["enterprise", "billing", "We're consolidating three accounts under the parent company."],
  ["contracts", "sales", "Thinking of dropping 15 lines, unless there's a better plan for us?"],
  ["faults", "sales", "Our 4G backup never kicked in during yesterday's outage. Is it even set up?"],
  ["moves", "faults", "Since moving into {s} last week the phones have been patchy."],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Decision = {
  id: string;
  customer: string;
  text: string;
  truth: TeamKey;
  confidence: number; // Jev's confidence in its own Choice answer
  jevAnswer: TeamKey;
  fallbackAnswer: TeamKey;
  jevMs: number;
  fallbackMs: number;
};

function fill(t: string, rnd: () => number) {
  return t
    .replace("{n}", String(40000 + Math.floor(rnd() * 59999)))
    .replace("{m}", String(80 + Math.floor(rnd() * 900)))
    .replace("{s}", SUBURBS[Math.floor(rnd() * SUBURBS.length)]);
}

function otherTeam(t: TeamKey, rnd: () => number): TeamKey {
  const rest = TEAM_KEYS.filter((k) => k !== t);
  return rest[Math.floor(rnd() * rest.length)];
}

export function generateDecisions(count = 600, seed = 20261008): Decision[] {
  const rnd = mulberry32(seed);
  const out: Decision[] = [];
  for (let i = 0; i < count; i++) {
    const hard = rnd() < 0.26;
    let truth: TeamKey;
    let decoy: TeamKey;
    let text: string;
    let confidence: number;
    if (hard) {
      const [t, d, tpl] = AMBIGUOUS[Math.floor(rnd() * AMBIGUOUS.length)];
      truth = t;
      decoy = d;
      text = fill(tpl, rnd);
      confidence = 0.28 + 0.44 * rnd();
    } else {
      truth = TEAM_KEYS[Math.floor(rnd() * TEAM_KEYS.length)];
      decoy = otherTeam(truth, rnd);
      const pool = CLEAR[truth];
      text = fill(pool[Math.floor(rnd() * pool.length)], rnd);
      confidence = 0.66 + 0.33 * Math.pow(rnd(), 0.7);
    }
    const pJev =
      confidence >= 0.85 ? 0.985 : confidence >= 0.7 ? 0.94 : confidence >= 0.6 ? 0.78 : confidence >= 0.5 ? 0.55 : 0.4;
    const pFallback = hard ? 0.9 : 0.965;
    const jevAnswer = rnd() < pJev ? truth : decoy;
    const fallbackAnswer = rnd() < pFallback ? truth : decoy;
    const jevMs = Math.round(208 + 140 * Math.pow(rnd(), 1.6) + (rnd() < 0.05 ? 160 : 0));
    const fallbackMs = Math.round(830 + 560 * Math.pow(rnd(), 1.4) + (rnd() < 0.05 ? 450 : 0));
    out.push({
      id: `ENQ-${(10421 + i).toString()}`,
      customer: CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)],
      text,
      truth,
      confidence: Math.round(confidence * 100) / 100,
      jevAnswer,
      fallbackAnswer,
      jevMs,
      fallbackMs,
    });
  }
  // Put a couple of uncertain enquiries near the top so escalation shows up early in the walkthrough.
  for (const slot of [2, 6]) {
    const j = out.findIndex((d, k) => k > 8 && d.confidence < 0.5);
    if (j > 0) [out[slot], out[j]] = [out[j], out[slot]];
  }
  out.forEach((d, k) => (d.id = `ENQ-${10421 + k}`));
  return out;
}

export type Strategy = "fast" | "frontier" | "escalate";

export type Outcome = {
  escalated: boolean;
  answer: TeamKey;
  correct: boolean;
  ms: number;
  cost: number; // USD for this single decision
};

export function outcome(d: Decision, strategy: Strategy, threshold: number): Outcome {
  if (strategy === "fast") {
    return { escalated: false, answer: d.jevAnswer, correct: d.jevAnswer === d.truth, ms: d.jevMs, cost: PRICE_PER_1K.primary / 1000 };
  }
  if (strategy === "frontier") {
    return {
      escalated: false,
      answer: d.fallbackAnswer,
      correct: d.fallbackAnswer === d.truth,
      ms: d.fallbackMs,
      cost: PRICE_PER_1K.fallback / 1000,
    };
  }
  const escalated = d.confidence < threshold;
  if (!escalated) {
    return { escalated, answer: d.jevAnswer, correct: d.jevAnswer === d.truth, ms: d.jevMs, cost: PRICE_PER_1K.primary / 1000 };
  }
  // Fallback reruns the full decision; both stages run sequentially and both are billed.
  return {
    escalated,
    answer: d.fallbackAnswer,
    correct: d.fallbackAnswer === d.truth,
    ms: d.jevMs + d.fallbackMs,
    cost: (PRICE_PER_1K.primary + PRICE_PER_1K.fallback) / 1000,
  };
}

export type Tally = {
  n: number;
  medianMs: number;
  p95Ms: number;
  avgMs: number;
  costPer1k: number;
  accuracy: number;
  fallbackRate: number;
  misroutedPerDay: number;
  costPerDay: number;
};

function pct(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function tally(ds: Decision[], strategy: Strategy, threshold: number): Tally {
  const n = ds.length;
  if (!n) return { n: 0, medianMs: 0, p95Ms: 0, avgMs: 0, costPer1k: 0, accuracy: 0, fallbackRate: 0, misroutedPerDay: 0, costPerDay: 0 };
  const outs = ds.map((d) => outcome(d, strategy, threshold));
  const ms = outs.map((o) => o.ms).sort((a, b) => a - b);
  const correct = outs.filter((o) => o.correct).length;
  const esc = outs.filter((o) => o.escalated).length;
  const cost = outs.reduce((s, o) => s + o.cost, 0);
  const accuracy = correct / n;
  const costPer1k = (cost / n) * 1000;
  return {
    n,
    medianMs: pct(ms, 50),
    p95Ms: pct(ms, 95),
    avgMs: ms.reduce((s, x) => s + x, 0) / n,
    costPer1k,
    accuracy,
    fallbackRate: esc / n,
    misroutedPerDay: Math.round((1 - accuracy) * DAILY_VOLUME),
    costPerDay: (costPer1k * DAILY_VOLUME) / 1000,
  };
}
