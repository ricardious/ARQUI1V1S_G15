import Object3D from "../atoms/Object3D";
import type { Shape } from "@/lib/types/types";

/** Molecule: tarjeta de resultado de un módulo ARM64. */
export default function Arm64Card({
  file,
  label,
  headline,
  stats,
  raw,
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
  raw?: string;
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
      <p className="font-mono text-3xl font-bold mt-1">{headline}</p>
      {stats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.map((stat) => (
            <span
              key={stat.k}
              className="rounded-lg border border-edge bg-ink/20 px-2 py-1 text-[11px] font-mono text-dim2"
            >
              {stat.k}: <span className="text-white">{stat.v}</span>
            </span>
          ))}
        </div>
      )}
      {raw && (
        <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-edge bg-ink/20 p-2 font-mono text-[10px] leading-relaxed text-dim2">
          {raw}
        </pre>
      )}
      <p
        className={`text-[11px] font-mono mt-3 ${danger ? "text-danger" : "text-dim2"}`}
      >
        {foot}
      </p>
      <button
        type="button"
        onClick={onRun}
        disabled={disabled}
        className="mt-4 rounded-xl border border-edge px-3 py-2 text-[12px] font-medium transition hover:border-white hover:text-white disabled:opacity-40"
      >
        {running ? "Ejecutando..." : "Ejecutar"}
      </button>
    </div>
  );
}
