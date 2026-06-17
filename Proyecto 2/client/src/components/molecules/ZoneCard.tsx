import Badge from "../atoms/Badge";
import ProgressBar from "../atoms/ProgressBar";
import type { StateColor } from "@/lib/types/types";

/** Molecule: tarjeta de un área de cultivo. */
export default function ZoneCard({
  zona,
  humedad,
  estadoLabel,
  estadoColor,
  barColor,
  riego,
}: {
  zona: string;
  humedad: number | null;
  estadoLabel: string;
  estadoColor: StateColor;
  barColor: string;
  riego: string;
}) {
  const humedadValue = humedad ?? 0;

  return (
    <div className="tilt min-w-0 rounded-2xl border border-edge bg-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[.2em] text-dim2">
            Área de cultivo
          </p>
          <h3 className="font-display text-lg font-bold">{zona}</h3>
        </div>
        <Badge color={estadoColor}>{estadoLabel}</Badge>
      </div>
      <p className="text-[12px] text-dim mb-1">Humedad de suelo</p>
      <p className="font-mono text-2xl font-bold mb-3">
        {humedad ?? "--"}
        {humedad != null && <span className="text-dim2 text-base">%</span>}
      </p>
      <ProgressBar value={humedadValue} color={barColor} />
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-edge text-[12px]">
        <span className="text-dim">Riego {zona.toLowerCase()}</span>
        <span className="font-mono text-dim2">{riego}</span>
      </div>
    </div>
  );
}
