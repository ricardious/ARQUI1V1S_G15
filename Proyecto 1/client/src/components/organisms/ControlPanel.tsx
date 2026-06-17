"use client";

import { useState } from "react";
import ControlToggle from "../molecules/ControlToggle";
import { COMMANDS, CONTROL_DEFS } from "@/lib/constants/commands";
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";
import type { StateColor } from "@/lib/types/types";

/** Organism: panel de control remoto — envía comandos MQTT en texto plano. */
export default function ControlPanel({
  onEvent,
}: {
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
}) {
  const { actuators, sendCommand, connectionState } = useMqttGreenPi();
  const [manual, setManual] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  };

  const toggle = (key: keyof typeof actuators, label: string, cmdOn: string, cmdOff: string) => {
    const next = !actuators[key];
    const cmd = next ? cmdOn : cmdOff;
    sendCommand(cmd);
    showFeedback(`${cmd} enviado`);
    onEvent("comando", `${label} ${next ? "activado" : "apagado"}`, next ? "ON" : "OFF", next ? "white" : "dim");
  };

  const connected = connectionState === "connected";

  return (
    <div className="rounded-2xl border border-edge bg-panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-bold">Control remoto</h3>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            connected
              ? "border-ok/40 text-ok"
              : "border-edge text-dim2"
          }`}
        >
          {connected ? "MQTT ON" : connectionState.toUpperCase()}
        </span>
      </div>
      <p className="text-[12px] text-dim2 mb-4">
        Modo{" "}
        <span className="text-white font-medium">
          {manual ? "Manual" : "Automático"}
        </span>
      </p>

      {feedback && (
        <p className="mb-3 rounded-lg bg-white/5 border border-edge px-3 py-1.5 text-[11px] font-mono text-dim">
          {feedback}
        </p>
      )}

      <div className="space-y-2.5 flex-1">
        {CONTROL_DEFS.map((c) => (
          <ControlToggle
            key={c.key}
            label={c.label}
            on={!!actuators[c.key as keyof typeof actuators]}
            onToggle={() =>
              toggle(
                c.key as keyof typeof actuators,
                c.label,
                c.cmdOn,
                c.cmdOff,
              )
            }
          />
        ))}
      </div>

      <button
        onClick={() => {
          const m = !manual;
          setManual(m);
          const cmd = m ? COMMANDS.CAMBIAR_MODO_MANUAL : COMMANDS.CAMBIAR_MODO_AUTOMATICO;
          sendCommand(cmd);
          showFeedback(`${cmd} enviado`);
          onEvent("comando", "Modo de operación", m ? "MANUAL" : "AUTO", m ? "info" : "white");
        }}
        className="mt-4 w-full rounded-xl bg-white text-ink font-semibold text-[13px] py-3 hover:bg-white/90 transition disabled:opacity-40"
        disabled={!connected}
      >
        {manual ? "Cambiar a Automático" : "Cambiar a Manual"}
      </button>
    </div>
  );
}
