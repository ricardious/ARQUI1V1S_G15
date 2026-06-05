import Badge from "../atoms/Badge";
import type { LogEntry } from "@/lib/types/types";

/** Molecule: fila de la tabla de actividad. */
export default function ActivityRow({ entry }: { entry: LogEntry }) {
  return (
    <tr className="hover:bg-panel2/60 transition">
      <td className="px-5 py-3 text-dim2">{entry.hora}</td>
      <td className="px-5 py-3 text-dim">{entry.origen}</td>
      <td className="px-5 py-3 text-white">{entry.evento}</td>
      <td className="px-5 py-3 text-dim">{entry.valor}</td>
      <td className="px-5 py-3 text-right">
        <Badge color={entry.color}>{entry.estado}</Badge>
      </td>
    </tr>
  );
}
