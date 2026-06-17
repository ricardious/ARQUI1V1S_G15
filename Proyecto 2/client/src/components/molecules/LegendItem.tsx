import StatusDot from "../atoms/StatusDot";

/** Molecule: ítem de leyenda (color + etiqueta). */
export default function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2 text-dim">
      <StatusDot color={color} />
      {label}
    </span>
  );
}
