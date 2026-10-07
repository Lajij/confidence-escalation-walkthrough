"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DAILY_VOLUME,
  FALLBACK_MODEL,
  PRIMARY_MODEL,
  PRICE_PER_1K,
  TEAMS,
  generateDecisions,
  outcome,
  tally,
  type Decision,
  type Strategy,
  type Tally,
} from "./data";
import { Code, Panel, VercelMark } from "./ui";

const DECISIONS = generateDecisions();
const TOTAL = DECISIONS.length;
const CHANGELOG = "https://vercel.com/changelog/confidence-based-decision-fallbacks";
const DOCS = "https://vercel.com/docs/ai-gateway/models-and-providers/decision-fallbacks";

const STEPS = [
  { key: "issue", label: "The issue" },
  { key: "queue", label: "Live decisions" },
  { key: "tradeoff", label: "The numbers" },
  { key: "config", label: "What it takes" },
] as const;

const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`);
const fmtPct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const fmtUsd = (x: number) => `$${x.toFixed(2)}`;
const fmtInt = (x: number) => Math.round(x).toLocaleString("en-AU");
const fmtK = (x: number) => (x >= 1000 ? `$${Math.round(x / 1000).toLocaleString("en-AU")}k` : `$${Math.round(x)}`);

function shortModel(m: string) {
  return m === PRIMARY_MODEL ? "Jev" : "GPT-6 Astra";
}

export function Walkthrough() {
  const [step, setStep] = useState(0);
  const [threshold, setThreshold] = useState(0.6);
  const [processed, setProcessed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [escalating, setEscalating] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Deterministic queue engine.
  useEffect(() => {
    if (!playing) return;
    if (escalating) {
      const t = setTimeout(() => setEscalating(null), 900 / speed);
      return () => clearTimeout(t);
    }
    if (processed >= TOTAL) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const next = DECISIONS[processed];
      setProcessed(processed + 1);
      if (next.confidence < threshold) setEscalating(next.id);
    }, 520 / speed);
    return () => clearTimeout(t);
  }, [playing, escalating, processed, speed, threshold]);

  const goto = (i: number) => {
    setStep(i);
    if (i >= 1 && !started) {
      setStarted(true);
      setPlaying(true);
    }
  };

  const done = DECISIONS.slice(0, processed);
  const sample = processed >= 20 ? done : DECISIONS.slice(0, Math.max(processed, 1));
  const live = useMemo(
    () => ({
      fast: tally(sample, "fast", threshold),
      frontier: tally(sample, "frontier", threshold),
      escalate: tally(sample, "escalate", threshold),
    }),
    [sample, threshold],
  );
  const full = useMemo(
    () => ({
      fast: tally(DECISIONS, "fast", threshold),
      frontier: tally(DECISIONS, "frontier", threshold),
      escalate: tally(DECISIONS, "escalate", threshold),
    }),
    [threshold],
  );

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <VercelMark className="h-4 w-4" />
            <span className="text-subtle">/</span>
            <span className="text-sm font-medium">AI Gateway</span>
            <span className="text-subtle">/</span>
            <span className="text-sm text-muted">Decision fallbacks</span>
            <span className="rounded-full border border-blue/40 bg-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue">
              Beta
            </span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
              Simulated walkthrough · example data
            </span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-6 pb-3">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => goto(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                step === i ? "bg-white text-black" : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[11px] ${
                  step === i ? "bg-black text-white" : "border border-border"
                }`}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
        {step === 0 && <IssueStep full={full} onNext={() => goto(1)} />}
        {step === 1 && (
          <QueueStep
            processed={processed}
            threshold={threshold}
            setThreshold={setThreshold}
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
            escalating={escalating}
            selected={selected}
            setSelected={setSelected}
            live={live}
            onReset={() => {
              setProcessed(0);
              setEscalating(null);
              setSelected(null);
              setPlaying(true);
            }}
            onFinish={() => {
              setEscalating(null);
              setProcessed(TOTAL);
              setPlaying(false);
            }}
            onNext={() => goto(2)}
          />
        )}
        {step === 2 && (
          <TradeoffStep
            threshold={threshold}
            setThreshold={setThreshold}
            processed={processed}
            done={done}
            full={full}
            onNext={() => goto(3)}
          />
        )}
        {step === 3 && <ConfigStep threshold={threshold} setThreshold={setThreshold} full={full} />}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-subtle">
          <span>
            Simulated walkthrough. Tasman Connect is a fictional company; enquiries, outcomes and pricing are illustrative
            example data. No live model calls.
          </span>
          <span className="flex gap-4">
            <a className="hover:text-foreground" href={CHANGELOG} target="_blank" rel="noreferrer">
              Changelog
            </a>
            <a className="hover:text-foreground" href={DOCS} target="_blank" rel="noreferrer">
              Docs
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: the issue                                                   */
/* ------------------------------------------------------------------ */

function IssueStep({ full, onNext }: { full: Record<Strategy, Tally>; onNext: () => void }) {
  return (
    <div className="fade-in">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Tasman Connect · business telco · ANZ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {fmtInt(DAILY_VOLUME)} AI decisions a day.
          <br />
          <span className="text-muted">Every one has to be fast, cheap and right.</span>
        </h1>
        <p className="mt-5 text-lg text-muted">
          Business customers email, chat and order all day. An AI decision routes each enquiry to the right team. Get it wrong
          and a café owner with no EFTPOS waits in the billing queue.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <IssueCard
          tone="danger"
          label="Fast model on every call"
          headline={`${fmtInt(full.fast.misroutedPerDay)} misroutes a day`}
          body="Quick and cheap, but it guesses on the messy, two-part enquiries. Those land with the wrong team and customers wait."
          stats={[
            ["Median", fmtMs(full.fast.medianMs)],
            ["Accuracy", fmtPct(full.fast.accuracy)],
          ]}
        />
        <IssueCard
          tone="warn"
          label="Frontier model on every call"
          headline={`${fmtK(full.frontier.costPerDay * 365)} a year`}
          body="Accurate, but every simple ‘where's my invoice’ pays frontier prices and waits a full second. The easy 80% subsidises the hard 20%."
          stats={[
            ["Median", fmtMs(full.frontier.medianMs)],
            ["Accuracy", fmtPct(full.frontier.accuracy)],
          ]}
        />
        <IssueCard
          tone="success"
          label="What Tasman Connect actually wants"
          headline="Juniors on the clear cases. Seniors on the unsure ones."
          body="Let the fast model answer when it's confident. Send only the uncertain decisions to the stronger model. Automatically."
          stats={[
            ["Today", "Pick one model"],
            ["Wanted", "Both, per decision"],
          ]}
        />
      </div>

      <button
        onClick={onNext}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
      >
        Run today&apos;s queue
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function IssueCard({
  tone,
  label,
  headline,
  body,
  stats,
}: {
  tone: "danger" | "warn" | "success";
  label: string;
  headline: string;
  body: string;
  stats: [string, string][];
}) {
  const dot = tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warn" : "bg-success";
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight">{headline}</div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        {stats.map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] uppercase tracking-wide text-subtle">{k}</div>
            <div className="mt-1 font-mono text-sm">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared: threshold slider                                            */
/* ------------------------------------------------------------------ */

function ThresholdSlider({
  threshold,
  setThreshold,
  compact = false,
}: {
  threshold: number;
  setThreshold: (n: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between">
        <label htmlFor="threshold" className="text-sm font-medium">
          Escalate when Jev&apos;s confidence is below
        </label>
        <span className="rounded-md bg-white px-2 py-0.5 font-mono text-sm font-semibold text-black">
          {threshold.toFixed(2)}
        </span>
      </div>
      <input
        id="threshold"
        type="range"
        min={0.3}
        max={0.9}
        step={0.05}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="mt-3 w-full accent-white"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-subtle">
        <span>0.30 · fewer escalations</span>
        <span>0.90 · more escalations</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: live queue                                                  */
/* ------------------------------------------------------------------ */

function QueueStep(props: {
  processed: number;
  threshold: number;
  setThreshold: (n: number) => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  speed: number;
  setSpeed: (n: number) => void;
  escalating: string | null;
  selected: string | null;
  setSelected: (s: string | null) => void;
  live: Record<Strategy, Tally>;
  onReset: () => void;
  onFinish: () => void;
  onNext: () => void;
}) {
  const { processed, threshold, escalating, selected, live } = props;
  const visible = DECISIONS.slice(Math.max(0, processed - 9), processed).reverse();
  const focus =
    DECISIONS.find((d) => d.id === selected) ?? (processed ? DECISIONS[processed - 1] : undefined);
  const escCount = DECISIONS.slice(0, processed).filter((d) => d.confidence < threshold).length;

  return (
    <div className="fade-in grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Inbound business enquiries</h2>
            <p className="mt-1 text-sm text-muted">
              Jev answers first. Below the threshold, AI Gateway reruns the decision on GPT-6 Astra.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => props.setPlaying(!props.playing)}
              disabled={processed >= TOTAL}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
            >
              {props.playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => props.setSpeed(props.speed === 1 ? 4 : 1)}
              className="rounded-full border border-border px-3 py-1.5 font-mono text-sm hover:bg-white/5"
            >
              {props.speed}×
            </button>
            <button
              onClick={props.onFinish}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-white/5"
            >
              Run all {TOTAL}
            </button>
            <button onClick={props.onReset} className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground">
              Reset
            </button>
          </div>
        </div>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${props.playing ? "pulse-dot bg-success" : "bg-subtle"}`} />
              Decision queue
            </span>
          }
          right={
            <span className="font-mono text-xs text-muted">
              {fmtInt(processed)} / {TOTAL} · {fmtInt(escCount)} escalated
            </span>
          }
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {visible.length === 0 && <div className="p-6 text-sm text-muted">Press Play to start the queue.</div>}
            {visible.map((d) => (
              <QueueRow
                key={d.id}
                d={d}
                threshold={threshold}
                pending={escalating === d.id}
                active={focus?.id === d.id}
                onClick={() => props.setSelected(d.id)}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-5">
        <ThresholdSlider threshold={threshold} setThreshold={props.setThreshold} />
        <LiveTally live={live} />
        {focus && <RoutingCard d={focus} threshold={threshold} pending={escalating === focus.id} />}
        <button
          onClick={props.onNext}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
        >
          See the numbers <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function ConfidenceBar({ value, threshold }: { value: number; threshold: number }) {
  const low = value < threshold;
  return (
    <div className="relative h-1.5 w-28 rounded-full bg-white/10">
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${low ? "bg-warn" : "bg-success"}`}
        style={{ width: `${value * 100}%` }}
      />
      <div className="absolute -top-1 h-3.5 w-px bg-white" style={{ left: `${threshold * 100}%` }} />
    </div>
  );
}

function QueueRow({
  d,
  threshold,
  pending,
  active,
  onClick,
}: {
  d: Decision;
  threshold: number;
  pending: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const o = outcome(d, "escalate", threshold);
  return (
    <button
      onClick={onClick}
      className={`row-in grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03] ${
        active ? "bg-white/[0.04]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-subtle">
          <span className="font-mono">{d.id}</span>
          <span>·</span>
          <span className="truncate">{d.customer}</span>
        </div>
        <div className="mt-1 truncate text-sm">{d.text}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">Jev confidence</span>
          <ConfidenceBar value={d.confidence} threshold={threshold} />
          <span className={`font-mono text-[11px] ${o.escalated ? "text-warn" : "text-success"}`}>
            {d.confidence.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="w-[230px] text-right">
        {pending ? (
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[11px] text-warn">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-warn" />
              Escalating to GPT-6 Astra
            </span>
            <span className="shimmer h-3 w-32 rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${
                o.escalated ? "border-blue/40 bg-blue/10 text-blue" : "border-success/40 bg-success/10 text-success"
              }`}
            >
              {o.escalated ? "Jev → GPT-6 Astra" : "Jev"} · {fmtMs(o.ms)}
            </span>
            <span className="text-sm">
              {TEAMS[o.answer].label}{" "}
              <span className={o.correct ? "text-success" : "text-danger"}>{o.correct ? "✓" : "✕"}</span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function LiveTally({ live }: { live: Record<Strategy, Tally> }) {
  const rows: [string, (t: Tally) => string][] = [
    ["Median latency", (t) => fmtMs(t.medianMs)],
    ["Cost / 1k decisions", (t) => fmtUsd(t.costPer1k)],
    ["Accuracy", (t) => fmtPct(t.accuracy)],
    ["Sent to fallback", (t) => fmtPct(t.fallbackRate, 0)],
  ];
  return (
    <Panel title={`Live tally · ${live.escalate.n} enquiries, three ways`} badge="sim" bodyClassName="p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-subtle">
            <th className="px-4 py-2 text-left font-normal" />
            <th className="px-2 py-2 text-right font-normal">Fast only</th>
            <th className="px-2 py-2 text-right font-normal">Frontier only</th>
            <th className="px-4 py-2 text-right font-normal text-foreground">Jev + fallback</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, f]) => (
            <tr key={label} className="border-t border-border">
              <td className="px-4 py-2 text-muted">{label}</td>
              <td className="px-2 py-2 text-right font-mono">{f(live.fast)}</td>
              <td className="px-2 py-2 text-right font-mono">{f(live.frontier)}</td>
              <td className="bg-white/[0.04] px-4 py-2 text-right font-mono font-semibold">{f(live.escalate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function RoutingCard({ d, threshold, pending }: { d: Decision; threshold: number; pending: boolean }) {
  const o = outcome(d, "escalate", threshold);
  const final = o.escalated ? FALLBACK_MODEL : PRIMARY_MODEL;
  const json = pending
    ? "// waiting for the fallback decision…"
    : JSON.stringify(
        {
          answers: {
            team: o.escalated
              ? { type: "choice", choice: o.answer }
              : { type: "choice", choice: o.answer, confidence: d.confidence },
          },
          response: { modelId: final },
          providerMetadata: {
            gateway: {
              routing: {
                originalModelId: PRIMARY_MODEL,
                canonicalSlug: final,
                modelAttempts: o.escalated
                  ? [
                      { canonicalSlug: PRIMARY_MODEL, success: true },
                      {
                        canonicalSlug: FALLBACK_MODEL,
                        success: true,
                        triggeredBy: [{ question: "team", reason: "confidence_below" }],
                      },
                    ]
                  : [{ canonicalSlug: PRIMARY_MODEL, success: true }],
              },
            },
          },
        },
        null,
        2,
      );
  return (
    <Panel title={`Why ${d.id} went where it went`} badge={pending ? "escalating" : shortModel(final)} bodyClassName="p-3">
      <p className="mb-2 px-1 text-xs text-muted">
        {pending
          ? `Jev was ${d.confidence.toFixed(2)} sure, below ${threshold.toFixed(2)}. AI Gateway is rerunning the decision.`
          : o.escalated
            ? `Jev was only ${d.confidence.toFixed(2)} sure, so GPT-6 Astra made the call. The trace says why.`
            : `Jev was ${d.confidence.toFixed(2)} sure. Answered in ${fmtMs(o.ms)}, no second model needed.`}
      </p>
      <pre className="max-h-60 overflow-auto rounded-lg border border-border bg-black p-3 font-mono text-[11px] leading-relaxed text-muted">
        {json}
      </pre>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3: the numbers                                                 */
/* ------------------------------------------------------------------ */

function TradeoffStep({
  threshold,
  setThreshold,
  processed,
  done,
  full,
  onNext,
}: {
  threshold: number;
  setThreshold: (n: number) => void;
  processed: number;
  done: Decision[];
  full: Record<Strategy, Tally>;
  onNext: () => void;
}) {
  const e = full.escalate;
  const f = full.frontier;
  const cheaper = 1 - e.costPer1k / f.costPer1k;
  const faster = f.avgMs / e.avgMs;
  const fewerMisroutes = full.fast.misroutedPerDay - e.misroutedPerDay;

  const batches = useMemo(() => {
    const src = processed >= 50 ? done : DECISIONS;
    const size = 25;
    const out: number[] = [];
    for (let i = 0; i < src.length; i += size) {
      const b = src.slice(i, i + size);
      out.push(b.filter((d) => d.confidence < threshold).length / b.length);
    }
    return out;
  }, [processed, done, threshold]);

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            Frontier-grade routing, at fast-model speed and a fraction of the cost.
          </h2>
          <p className="mt-1 text-sm text-muted">
            {TOTAL} sample enquiries, scaled to Tasman Connect&apos;s {fmtInt(DAILY_VOLUME)} a day. Move the threshold and
            watch the trade-off.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <ThresholdSlider threshold={threshold} setThreshold={setThreshold} compact />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Headline value={fmtPct(cheaper, 0)} label="cheaper than frontier on every call" />
        <Headline value={`${faster.toFixed(1)}×`} label="faster on average than frontier on every call" />
        <Headline value={fmtInt(fewerMisroutes)} label="fewer misroutes a day than fast-only" />
        <Headline value={fmtPct(e.fallbackRate, 0)} label="of decisions needed the stronger model" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StrategyCard title="Fast model on every call" sub={PRIMARY_MODEL} t={full.fast} />
        <StrategyCard title="Frontier model on every call" sub={FALLBACK_MODEL} t={full.frontier} />
        <StrategyCard
          title="Jev + decision fallback"
          sub={`${PRIMARY_MODEL} → ${FALLBACK_MODEL} below ${threshold.toFixed(2)}`}
          t={full.escalate}
          highlight
        />
      </div>

      <Panel
        title="Fallback rate over the day"
        badge="observability view · sim"
        right={<span className="font-mono text-xs text-muted">per 25 decisions</span>}
      >
        <div className="flex h-28 items-end gap-1">
          {batches.map((r, i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-end" title={fmtPct(r, 0)}>
              <div className="rounded-sm bg-blue/70" style={{ height: `${Math.max(2, r * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
          <span>triggeredBy: confidence_below</span>
          <span>primary: {PRIMARY_MODEL}</span>
          <span>fallback: {FALLBACK_MODEL}</span>
          <span>escalated: {fmtPct(e.fallbackRate, 1)}</span>
        </div>
      </Panel>

      <div>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
        >
          What it takes <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function Headline({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-muted">{label}</div>
    </div>
  );
}

function StrategyCard({ title, sub, t, highlight = false }: { title: string; sub: string; t: Tally; highlight?: boolean }) {
  const rows: [string, string][] = [
    ["Median latency", fmtMs(t.medianMs)],
    ["Average latency", fmtMs(t.avgMs)],
    ["Cost / 1k decisions", fmtUsd(t.costPer1k)],
    ["Cost / year at volume", fmtK(t.costPerDay * 365)],
    ["Routing accuracy", fmtPct(t.accuracy)],
    ["Misroutes / day", fmtInt(t.misroutedPerDay)],
    ["Sent to fallback", fmtPct(t.fallbackRate, 0)],
  ];
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-white bg-white/[0.05]" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{title}</div>
        {highlight && (
          <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-black">
            AI Gateway
          </span>
        )}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-subtle">{sub}</div>
      <dl className="mt-4 divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className={`font-mono ${highlight ? "font-semibold" : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4: config                                                      */
/* ------------------------------------------------------------------ */

function ConfigStep({
  threshold,
  setThreshold,
  full,
}: {
  threshold: number;
  setThreshold: (n: number) => void;
  full: Record<Strategy, Tally>;
}) {
  const code = `import { gateway } from '@ai-sdk/gateway';
import { experimental_decide as decide } from 'ai';

const result = await decide({
  model: gateway.decisionModel('${PRIMARY_MODEL}'),
  state: enquiry.text,
  questions: {
    team: {
      type: 'choice',
      instructions: 'Which Tasman Connect team should handle this?',
      criteria: {
        billing: 'Invoices, charges, credits and refunds',
        faults: 'Services down, degraded or dropping',
        sales: 'New lines, upgrades and quotes',
        moves: 'Relocations and number porting',
        contracts: 'Terms, renewals and cancellations',
        enterprise: 'Multi-site reviews and account management',
      },
    },
  },
  providerOptions: {
    gateway: {
      models: [
        { model: '${FALLBACK_MODEL}', when: { question: 'team', confidenceBelow: ${threshold.toFixed(2)} } },
      ],
    },
  },
});

route(enquiry, result.answers.team.choice);`;

  return (
    <div className="fade-in grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">One object in the request. That&apos;s the change.</h2>
          <p className="mt-1 text-sm text-muted">
            The same decision call Tasman Connect already runs through AI Gateway, plus one conditional fallback entry.
          </p>
        </div>
        <Code code={code} emphasise={[21, 22, 23, 24, 25, 26, 27]} highlight={(tok) => tok === threshold.toFixed(2)} />
        <p className="font-mono text-xs text-subtle">
          Mirrors the AI SDK example in the{" "}
          <a className="underline hover:text-foreground" href={CHANGELOG} target="_blank" rel="noreferrer">
            AI Gateway changelog
          </a>{" "}
          (decision fallbacks, beta).
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <ThresholdSlider threshold={threshold} setThreshold={setThreshold} />
        <ValueItem
          n="01"
          title="Fast where it can be"
          body={`${fmtPct(1 - full.escalate.fallbackRate, 0)} of enquiries answered by Jev in about ${fmtMs(full.escalate.medianMs)}.`}
        />
        <ValueItem
          n="02"
          title="Right where it matters"
          body={`The uncertain ${fmtPct(full.escalate.fallbackRate, 0)} get a second, stronger opinion. Routing accuracy ${fmtPct(full.escalate.accuracy)}.`}
        />
        <ValueItem
          n="03"
          title="Paid for only when needed"
          body={`${fmtUsd(full.escalate.costPer1k)} per 1k decisions vs ${fmtUsd(full.frontier.costPer1k)} for frontier on every call.`}
        />
        <ValueItem
          n="04"
          title="Every escalation explained"
          body="Each fallback carries triggeredBy in the routing metadata, and the fallback rate shows up in Vercel observability."
        />
        <div className="rounded-xl border border-border bg-card p-4 font-mono text-[11px] text-subtle">
          Example pricing in this walkthrough: Jev {fmtUsd(PRICE_PER_1K.primary)} and GPT-6 Astra{" "}
          {fmtUsd(PRICE_PER_1K.fallback)} per 1k decisions (illustrative).
        </div>
      </div>
    </div>
  );
}

function ValueItem({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      <span className="font-mono text-xs text-subtle">{n}</span>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted">{body}</div>
      </div>
    </div>
  );
}
