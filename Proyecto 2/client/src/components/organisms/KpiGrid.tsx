"use client";
import KpiCard from "../molecules/KpiCard";
import { KPIS } from "@/lib/constants/dashboard-data";
import { useMqttDashboard } from "@/lib/hooks/useMqttDashboard";
import { useLatestReading } from "@/services/readings/queries";

/** Organism: grilla de KPIs con lecturas reales. */
export default function KpiGrid() {
  const { sensors, connectionState } = useMqttDashboard();
  const latestReadingQ = useLatestReading();
  const latestValues = latestReadingQ.data?.valor;
  const vals: Record<string, number | null> = {
    temp: sensors.temperatura ?? latestValues?.temperatura ?? null,
    hum: sensors.humedad_ambiente ?? latestValues?.humedad_ambiente ?? null,
    luz: sensors.luz ?? latestValues?.luz ?? null,
    gas: sensors.gas ?? latestValues?.gas ?? null,
  };
  const sourceLabel =
    connectionState === "connected"
      ? "en vivo"
      : latestReadingQ.data
        ? "backend"
        : "sin datos";

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
      {KPIS.map((k, i) => (
        <KpiCard
          key={k.key}
          label={k.label}
          unit={k.unit}
          value={vals[k.key] ?? "--"}
          trend={vals[k.key] == null ? "sin lectura" : sourceLabel}
          trendColor={vals[k.key] == null ? "text-dim2" : k.trendColor}
          delay={i * 0.06}
        />
      ))}
    </section>
  );
}
