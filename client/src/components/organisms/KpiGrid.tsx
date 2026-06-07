"use client";
import KpiCard from "../molecules/KpiCard";
import { KPIS } from "@/lib/constants/dashboard-data";
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";
import { useLatestReading } from "@/services/readings/queries";

/** Organism: grilla de KPIs con lecturas reales. */
export default function KpiGrid() {
  const { sensors, connectionState } = useMqttGreenPi();
  const latestReadingQ = useLatestReading();
  const latestValues = latestReadingQ.data?.valor;
  const vals: Record<string, number | null> = {
    temp: sensors.temperatura ?? latestValues?.temp ?? null,
    hum:  sensors.humedad_ambiente ?? latestValues?.hum_aire ?? null,
    luz:  sensors.luz ?? latestValues?.luz ?? null,
    gas:  sensors.gas ?? latestValues?.gas ?? null,
  };
  const sourceLabel = connectionState === "connected" ? "en vivo" : latestReadingQ.data ? "backend" : "sin datos";

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
