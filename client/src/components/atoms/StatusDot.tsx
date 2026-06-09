/** Atom: punto de color (opcionalmente pulsante). */
export default function StatusDot({
  color = "#ffffff",
  pulse = false,
  className = "",
}: {
  color?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${pulse ? "pulse" : ""} ${className}`}
      style={{ background: color }}
    />
  );
}
