"use client";
import { useMemo, useRef, useState } from "react";
import { useReadingsHistory } from "@/services/readings/queries";

const VW = 800,
  VH = 300,
  PAD = { l: 44, r: 24, t: 18, b: 22 };
const pw = VW - PAD.l - PAD.r,
  ph = VH - PAD.t - PAD.b;

const METRICS = [
  { key: "temperatura", label: "Temperatura", title: "Temperatura ambiental", unit: "°C", min: 0, max: 50 },
  { key: "humedad_ambiente", label: "Humedad", title: "Humedad ambiental", unit: "%", min: 0, max: 100 },
  { key: "humedad_suelo_area1", label: "Suelo A1", title: "Humedad suelo Área 1", unit: "%", min: 0, max: 100 },
  { key: "humedad_suelo_area2", label: "Suelo A2", title: "Humedad suelo Área 2", unit: "%", min: 0, max: 100 },
  { key: "luz", label: "Luz", title: "Nivel de luz", unit: "lx", min: 0, max: 1024 },
  { key: "gas", label: "Gas", title: "Nivel de gas", unit: "ppm", min: 0, max: 1000 },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const xAt = (i: number, total: number) =>
  PAD.l + (total <= 1 ? 0.5 : i / (total - 1)) * pw;
const yAt = (v: number, min: number, max: number) =>
  PAD.t + (1 - (v - min) / (max - min)) * ph;

function smooth(p: { x: number; y: number }[]) {
  if (p.length === 0) return "";
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

function formatLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return [d.getHours(), d.getMinutes()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

/** Organism: gráfica histórica de temperatura (SVG con tooltip). */
export default function TempChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const readingsQ = useReadingsHistory(50);
  const [metricKey, setMetricKey] = useState<MetricKey>("temperatura");
  const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0];
  const ticks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) =>
        Math.round(metric.min + ((metric.max - metric.min) / 5) * i),
      ),
    [metric.max, metric.min],
  );
  const pointsData = useMemo(
    () =>
      (readingsQ.data ?? [])
        .slice()
        .reverse()
        .map((record) => ({
          v: record.valor[metricKey],
          label: formatLabel(record.timestamp),
        }))
        .filter((item): item is { v: number; label: string } => typeof item.v === "number"),
    [metricKey, readingsQ.data],
  );
  const [active, setActive] = useState<number | null>(null);
  const P = useMemo(
    () =>
      pointsData.map((item, i) => ({
        x: xAt(i, pointsData.length),
        y: yAt(item.v, metric.min, metric.max),
        v: item.v,
        label: item.label,
      })),
    [metric.max, metric.min, pointsData],
  );
  const lineD = useMemo(() => smooth(P), [P]);
  const areaD = P.length > 0
    ? `${lineD} L ${P[P.length - 1].x} ${yAt(metric.min, metric.min, metric.max)} L ${P[0].x} ${yAt(metric.min, metric.min, metric.max)} Z`
    : "";

  const onMove = (e: React.MouseEvent) => {
    if (P.length === 0) return;
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
  const ap = active != null ? P[active] : P[P.length - 1] ?? null;

  return (
    <div className="xl:col-span-2 rounded-2xl border border-edge bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div>
          <h2 className="font-display text-lg font-bold">
            {metric.title}
          </h2>
          <p className="text-[12px] text-dim2">
            Histórico · últimas 50 lecturas
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1 rounded-xl border border-edge bg-panel2 p-1 text-[12px]">
          {METRICS.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setMetricKey(item.key);
                setActive(null);
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                metricKey === item.key
                  ? "bg-white text-ink font-medium"
                  : "text-dim hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
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
            {ticks.map((v) => (
              <line
                key={v}
                x1={PAD.l}
                x2={VW - PAD.r}
                y1={yAt(v, metric.min, metric.max)}
                y2={yAt(v, metric.min, metric.max)}
              />
            ))}
          </g>
          <g fontFamily="var(--font-jetbrains)" fontSize={11} fill="#5A5A62">
            {ticks.map((v) => (
              <text key={v} x={PAD.l - 8} y={yAt(v, metric.min, metric.max) + 3} textAnchor="end">
                {v}
              </text>
            ))}
          </g>
          {areaD && <path d={areaD} fill="url(#fill)" />}
          {lineD && (
            <path
              d={lineD}
              fill="none"
              stroke="#fff"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
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
        {P.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <p className="font-mono text-[12px] text-dim2">
              {readingsQ.isLoading
                ? "cargando lecturas reales..."
                : readingsQ.isError
                  ? "backend no disponible"
                  : `sin lecturas reales de ${metric.title.toLowerCase()}`}
            </p>
          </div>
        )}
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
              {ap.label} · {ap.v}{metric.unit}
            </div>
          </>
        )}
        <div className="flex justify-between mt-2 px-1 font-mono text-[10px] text-dim2">
          {pointsData.map((item, index) => (
            <span key={`${item.label}-${index}`}>{item.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
