"use client";

import { useState } from "react";
import ActivityRow from "../molecules/ActivityRow";
import { useEvents } from "@/services/events/queries";
import { useCommands } from "@/services/commands/queries";
import { useActuatorLogs } from "@/services/actuator-logs/queries";
import {
  formatTimestamp,
  estadoRelacionadoToColor,
} from "@/lib/helpers/formatters";
import type { LogEntry } from "@/lib/types/types";

type Tab = "eventos" | "comandos" | "actuadores";

function recordsToLog(
  records: {
    timestamp: string;
    tipo_dato: string;
    valor: Record<string, unknown>;
    origen: string;
    estado_relacionado: string;
  }[],
): LogEntry[] {
  return records.map((r) => ({
    hora: formatTimestamp(r.timestamp),
    origen: r.origen,
    evento: r.tipo_dato.replace(/_/g, " "),
    valor: Object.values(r.valor).slice(0, 1).join(", ") || "—",
    color: estadoRelacionadoToColor(r.estado_relacionado),
    estado: r.estado_relacionado,
  }));
}

/** Organism: tabla de actividad con tabs — datos reales del backend. */
export default function ActivityTable() {
  const [tab, setTab] = useState<Tab>("eventos");

  const eventsQ = useEvents(20);
  const commandsQ = useCommands(20);
  const logsQ = useActuatorLogs(20);

  const activeQuery =
    tab === "eventos" ? eventsQ : tab === "comandos" ? commandsQ : logsQ;
  const rows: LogEntry[] = activeQuery.data
    ? recordsToLog(activeQuery.data)
    : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "eventos", label: "Eventos" },
    { id: "comandos", label: "Comandos" },
    { id: "actuadores", label: "Actuadores" },
  ];

  return (
    <section className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 p-5 border-b border-edge">
        <h3 className="font-display text-lg font-bold">Actividad reciente</h3>
        <div className="flex items-center gap-5 text-[13px] ml-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-0.5 transition ${
                tab === t.id
                  ? "font-medium border-b-2 border-white"
                  : "text-dim hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-dim2 font-mono">
          {activeQuery.isFetching
            ? "actualizando…"
            : activeQuery.isError
              ? "error al cargar"
              : `${rows.length} registros`}
        </span>
      </div>

      {activeQuery.isError && (
        <p className="px-5 py-4 text-[12px] text-dim2">
          Backend no disponible. No se muestran datos inventados.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-160">
          <thead>
            <tr className="text-dim2 text-[11px] uppercase tracking-wider">
              <th className="text-left font-medium px-5 py-3">Hora</th>
              <th className="text-left font-medium px-5 py-3">Origen</th>
              <th className="text-left font-medium px-5 py-3">Evento</th>
              <th className="text-left font-medium px-5 py-3">Valor</th>
              <th className="text-right font-medium px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge font-mono">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-6 text-center text-dim2 text-[12px]"
                >
                  Sin registros disponibles
                </td>
              </tr>
            ) : (
              rows.map((r, i) => <ActivityRow key={i} entry={r} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
