import Object3D from "../atoms/Object3D";
import type { Shape } from "@/lib/types/types";

/** Molecule: tarjeta de resultado de un módulo ARM64 con ejecución individual. */
export default function Arm64Card({
  file,
  label,
  headline,
  stats,
  foot,
  shape,
  color,
  danger,
  running,
  disabled,
  onRun,
}: {
  file: string;
  label: string;
  headline: string;
  stats: { k: string; v: string | undefined }[];
  foot: string;
  shape: Shape;
  color: string;
  danger: boolean;
  running: boolean;
  disabled: boolean;
  onRun: () => void;
}) {
  return (
    <div
      className={`tilt relative min-w-0 overflow-hidden rounded-2xl border bg-panel p-5 ${danger ? "border-danger/40" : "border-edge"}`}
    >
      {danger && (
        <span className="absolute right-0 top-0 size-16 bg-danger/15 blur-2xl" />
      )}
      <Object3D
        shape={shape}
        color={color}
        className="absolute top-2 right-2 size-16"
      />
      <p className="text-[11px] font-mono text-dim2 mb-3">{file}</p>
      <p className="text-[12px] text-dim">{label}</p>
      <p className="font-mono text-3xl font-bold mt-1" style={{ color }}>
        {headline}
      </p>

      {stats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {stats.map((s) => (
            <span key={s.k} className="text-[11px] font-mono text-dim2">
              {s.k} <span className="text-dim">{s.v ?? "—"}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-mono ${danger ? "text-danger" : "text-dim2"}`}
        >
          {foot}
        </span>
        <button
          onClick={onRun}
          disabled={disabled}
          className="shrink-0 rounded-lg border border-edge px-3 py-1 text-[11px] font-medium transition hover:border-white hover:text-white disabled:opacity-40"
        >
          {running ? "Ejecutando…" : "Ejecutar"}
        </button>
      </div>
    </div>
  );
}
