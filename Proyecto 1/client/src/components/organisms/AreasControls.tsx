import ZoneCard from "../molecules/ZoneCard";
import ControlPanel from "./ControlPanel";
import type { StateColor } from "@/lib/types/types";

/** Organism: áreas de cultivo + panel de control. */
export default function AreasControls({
  onEvent,
}: {
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
}) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4 xl:col-span-2">
        <ZoneCard
          zona="Zona 1"
          humedad={45}
          estadoLabel="NORMAL"
          estadoColor="white"
          barColor="#ffffff"
          riego="RIEGO_OFF"
        />
        <ZoneCard
          zona="Zona 2"
          humedad={28}
          estadoLabel="SECO"
          estadoColor="warn"
          barColor="#ffc400"
          riego="RIEGO_OFF"
        />
      </div>
      <ControlPanel onEvent={onEvent} />
    </section>
  );
}
