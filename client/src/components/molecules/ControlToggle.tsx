"use client";
import StatusDot from "../atoms/StatusDot";

/** Molecule: interruptor de un actuador. */
export default function ControlToggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full rounded-xl border bg-panel2 px-4 py-3 transition"
      style={{ borderColor: on ? "#ffffff" : "#232327" }}
    >
      <span className="flex items-center gap-2.5 text-[13px]">
        <StatusDot color={on ? "#ffffff" : "#5a5a62"} />
        {label}
      </span>
      <span
        className="text-[11px] font-mono"
        style={{ color: on ? "#ffffff" : "#5a5a62" }}
      >
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}
