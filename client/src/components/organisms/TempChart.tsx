"use client";
import { useMemo, useRef, useState } from "react";

const DATA = [27, 29, 31, 33, 30, 26, 24, 27, 29, 28, 25, 30, 32, 34];
const LABELS = [
  "4a",
  "5a",
  "6a",
  "7a",
  "8a",
  "9a",
  "10a",
  "11a",
  "12p",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
];
const VW = 800,
  VH = 300,
  PAD = { l: 38, r: 24, t: 18, b: 22 },
  YMIN = 0,
  YMAX = 50;
const pw = VW - PAD.l - PAD.r,
  ph = VH - PAD.t - PAD.b;
const xAt = (i: number) => PAD.l + (i / (DATA.length - 1)) * pw;
const yAt = (v: number) => PAD.t + (1 - (v - YMIN) / (YMAX - YMIN)) * ph;

function smooth(p: { x: number; y: number }[]) {
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i],
      b = p[i],
      c = p[i + 1],
      e = p[i + 2] || c;
    const c1x = b.x + (c.x - a.x) / 6,
      c1y = b.y + (c.y - a.y) / 6;
    const c2x = c.x - (e.x - b.x) / 6,
      c2y = c.y - (e.y - b.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${c.x} ${c.y}`;
  }
  return d;
}

/** Organism: gráfica histórica de temperatura (SVG con tooltip). */
export default function TempChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(DATA.length - 1);
  const P = useMemo(
    () => DATA.map((v, i) => ({ x: xAt(i), y: yAt(v), v, label: LABELS[i] })),
    [],
  );
  const lineD = useMemo(() => smooth(P), [P]);
  const areaD = `${lineD} L ${P[P.length - 1].x} ${yAt(YMIN)} L ${P[0].x} ${yAt(YMIN)} Z`;

  const onMove = (e: React.MouseEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * VW;
    let best = 0,
      bd = 1e9;
    P.forEach((p, i) => {
      const d = Math.abs(p.x - rel);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setActive(best);
  };
  const ap = active != null ? P[active] : null;

  return (
    <div className="xl:col-span-2 rounded-2xl border border-edge bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div>
          <h2 className="font-display text-lg font-bold">
            Temperatura ambiental
          </h2>
          <p className="text-[12px] text-dim2">
            Histórico · últimas 14 lecturas
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-edge bg-panel2 p-1 text-[12px]">
          <button className="rounded-lg px-3 py-1.5 bg-white text-ink font-medium">
            Temp
          </button>
          <button className="rounded-lg px-3 py-1.5 text-dim hover:text-white transition">
            Humedad
          </button>
          <button className="rounded-lg px-3 py-1.5 text-dim hover:text-white transition">
            Suelo
          </button>
        </div>
      </div>

      <div
        className="relative mt-4 select-none"
        onMouseMove={onMove}
        onMouseLeave={() => setActive(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="#161619" strokeWidth={1}>
            {[0, 10, 20, 30, 40, 50].map((v) => (
              <line
                key={v}
                x1={PAD.l}
                x2={VW - PAD.r}
                y1={yAt(v)}
                y2={yAt(v)}
              />
            ))}
          </g>
          <g fontFamily="var(--font-jetbrains)" fontSize={11} fill="#5A5A62">
            {[0, 10, 20, 30, 40, 50].map((v) => (
              <text key={v} x={PAD.l - 8} y={yAt(v) + 3} textAnchor="end">
                {v}
              </text>
            ))}
          </g>
          <path d={areaD} fill="url(#fill)" />
          <path
            d={lineD}
            fill="none"
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {ap && (
            <line
              x1={ap.x}
              x2={ap.x}
              y1={PAD.t}
              y2={VH - PAD.b}
              stroke="#3a3a40"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          )}
        </svg>
        {ap && (
          <>
            <div
              className="absolute size-3.5 rounded-full bg-white ring-4 ring-white/15 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(ap.x / VW) * 100}%`,
                top: `${(ap.y / VH) * 100}%`,
              }}
            />
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full -mt-3 rounded-lg bg-white text-ink px-2.5 py-1.5 text-[12px] font-mono font-semibold whitespace-nowrap shadow-lg"
              style={{
                left: `${(ap.x / VW) * 100}%`,
                top: `${(ap.y / VH) * 100}%`,
              }}
            >
              {ap.label} · {ap.v}°C
            </div>
          </>
        )}
        <div className="flex justify-between mt-2 px-1 font-mono text-[10px] text-dim2">
          {LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
