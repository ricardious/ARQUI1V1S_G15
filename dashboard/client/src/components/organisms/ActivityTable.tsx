import ActivityRow from "../molecules/ActivityRow";
import type { LogEntry } from "@/lib/types/types";

/** Organism: tabla de actividad reciente. */
export default function ActivityTable({ log }: { log: LogEntry[] }) {
  return (
    <section className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 p-5 border-b border-edge">
        <h3 className="font-display text-lg font-bold">Actividad reciente</h3>
        <div className="flex items-center gap-5 text-[13px] ml-2">
          <button className="font-medium border-b-2 border-white pb-0.5">
            Eventos
          </button>
          <button className="text-dim hover:text-white pb-0.5 transition">
            Comandos
          </button>
          <button className="text-dim hover:text-white pb-0.5 transition">
            Alertas
          </button>
        </div>
        <span className="ml-auto text-[11px] text-dim2 font-mono">
          colección · events
        </span>
      </div>
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
            {log.map((r, i) => (
              <ActivityRow key={i} entry={r} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
