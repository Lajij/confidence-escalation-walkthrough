import type { ReactNode } from "react";

export function VercelMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 76 65" fill="currentColor" aria-hidden>
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

export function Panel({
  title,
  badge,
  right,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title: ReactNode;
  badge?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {right}
          {badge ? (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

const TS_KEYWORDS = new Set([
  "import", "from", "as", "const", "await", "async", "return", "if", "else", "type", "export", "satisfies", "new",
]);

function highlightLine(line: string, key: number, highlight?: (tok: string) => boolean) {
  const out: ReactNode[] = [];
  const commentIdx = line.indexOf("//");
  const code = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const comment = commentIdx >= 0 ? line.slice(commentIdx) : "";
  const re = /('[^']*'|"[^"]*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][A-Za-z0-9_$]*\b|\s+|.)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    const tok = m[0];
    let cls = "";
    if (tok.startsWith("'") || tok.startsWith('"')) cls = "text-success";
    else if (/^\d/.test(tok)) cls = "text-warn";
    else if (TS_KEYWORDS.has(tok)) cls = "text-purple";
    else if (["decide", "decisionModel", "gateway", "experimental_decide"].includes(tok)) cls = "text-blue";
    if (highlight?.(tok)) cls = "rounded bg-white px-1 text-black font-semibold";
    out.push(
      <span key={i++} className={cls}>
        {tok}
      </span>,
    );
  }
  if (comment) out.push(<span key={i++} className="text-subtle">{comment}</span>);
  return (
    <div key={key} className="whitespace-pre">
      {out.length ? out : " "}
    </div>
  );
}

export function Code({
  code,
  emphasise = [],
  highlight,
}: {
  code: string;
  emphasise?: number[];
  highlight?: (tok: string) => boolean;
}) {
  const lines = code.split("\n");
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-black py-3 font-mono text-[12.5px] leading-[1.7]">
      {lines.map((l, i) => (
        <div
          key={i}
          className={`flex px-3 ${emphasise.includes(i + 1) ? "border-l-2 border-white bg-white/[0.06]" : "border-l-2 border-transparent"}`}
        >
          <span className="mr-4 w-5 shrink-0 select-none text-right text-subtle">{i + 1}</span>
          {highlightLine(l, i, highlight)}
        </div>
      ))}
    </div>
  );
}
