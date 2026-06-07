"use client";
import { useState } from "react";
import ControlToggle from "../molecules/ControlToggle";
import { CONTROLS } from "@/lib/constants/dashboard-data";
import type { StateColor } from "@/lib/types/types";

/** Organism: panel de control remoto de actuadores. */
export default function ControlPanel({
  onEvent,
  onStateChange,
}: {
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
  onStateChange?: (on: Record<string, boolean>) => void;
}) {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [manual, setManual] = useState(false);

  const toggle = (key: string, label: string) => {
    const next = !on[key];
    const updated = { ...on, [key]: next };
    setOn(updated);
    onStateChange?.(updated);
    onEvent(
      "comando",
      `${label} ${next ? "activado" : "apagado"}`,
      next ? "ON" : "OFF",
      next ? "white" : "dim",
    );
  };

  return (
    <div className="rounded-2xl border border-edge bg-panel p-5 h-full flex flex-col">
      <h3 className="font-display text-lg font-bold mb-1">Control remoto</h3>
      <p className="text-[12px] text-dim2 mb-4">
        Modo{" "}
        <span className="text-white font-medium">
          {manual ? "Manual" : "Automático"}
        </span>
      </p>
      <div className="space-y-2.5 flex-1">
        {CONTROLS.map((c) => (
          <ControlToggle
            key={c.key}
            label={c.label}
            on={!!on[c.key]}
            onToggle={() => toggle(c.key, c.label)}
          />
        ))}
      </div>
      <button
        onClick={() => {
          const m = !manual;
          setManual(m);
          onEvent(
            "comando",
            "Modo de operación",
            m ? "MANUAL" : "AUTO",
            m ? "info" : "white",
          );
        }}
        className="mt-4 w-full rounded-xl bg-white text-ink font-semibold text-[13px] py-3 hover:bg-white/90 transition"
      >
        {manual ? "Cambiar a Automático" : "Cambiar a Manual"}
      </button>
    </div>
  );
}
