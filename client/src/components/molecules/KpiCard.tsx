import IconBox from "../atoms/IconBox";

/** Molecule: tarjeta de indicador (KPI). */
export default function KpiCard({
  label,
  unit,
  value,
  trend,
  trendColor,
  delay = 0,
}: {
  label: string;
  unit: string;
  value: number | string;
  trend: string;
  trendColor: string;
  delay?: number;
}) {
  return (
    <div
      className="reveal tilt rounded-2xl border border-edge bg-panel p-5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-4">
        <IconBox>{unit}</IconBox>
        <span className={`text-[11px] font-mono ${trendColor}`}>{trend}</span>
      </div>
      <p className="text-[12px] text-dim">{label}</p>
      <p className="font-mono text-3xl font-bold mt-0.5">
        {value}
        <span className="text-dim2 text-lg">{unit}</span>
      </p>
    </div>
  );
}
