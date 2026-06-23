/** Atom: barra de progreso (humedad de suelo). */
export default function ProgressBar({
  value,
  color = "#ffffff",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-2 rounded-full bg-panel2 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}
