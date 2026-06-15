import Object3D from "../atoms/Object3D";
import type { Shape } from "@/lib/types/types";

/** Molecule: tarjeta de resultado de un módulo ARM64. */
export default function Arm64Card({
  file,
  label,
  value,
  foot,
  shape,
  color,
  danger,
}: {
  file: string;
  label: string;
  value: string;
  foot: string;
  shape: Shape;
  color: string;
  danger: boolean;
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
      <p className="font-mono text-3xl font-bold mt-1">{value}</p>
      <p
        className={`text-[11px] font-mono mt-3 ${danger ? "text-danger" : "text-dim2"}`}
      >
        {foot}
      </p>
    </div>
  );
}
