import type { StateColor } from "@/lib/types/types";

const styles: Record<StateColor, string> = {
  white: "bg-white/10 text-white border-edge",
  warn: "bg-warn/10 text-warn border-warn/25",
  info: "bg-info/10 text-info border-info/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  dim: "bg-panel2 text-dim2 border-edge",
};

/** Atom: pastilla de estado. */
export default function Badge({
  color,
  children,
}: {
  color: StateColor;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-mono ${styles[color]}`}
    >
      {children}
    </span>
  );
}
