"use client";

import KpiCard from "../molecules/KpiCard";
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";
import { useLatestReading } from "@/services/readings/queries";

const SENSOR_DEFS = [
  { key: "temperatura",         label: "Temperatura (DHT22)",  unit: "°C",  trendColor: "text-warn"   },
  { key: "humedad_ambiente",    label: "Humedad ambiental",    unit: "%",   trendColor: "text-dim"    },
  { key: "humedad_suelo_area1", label: "Humedad suelo · Z1",   unit: "%",   trendColor: "text-info"   },
  { key: "humedad_suelo_area2", label: "Humedad suelo · Z2",   unit: "%",   trendColor: "text-warn"   },
  { key: "luz",                 label: "Nivel de luz (LDR)",   unit: "lx",  trendColor: "text-danger" },
  { key: "gas",                 label: "Gas MQ-2",             unit: "ppm", trendColor: "text-dim"    },
] as const;

/** Organism: grilla de 6 sensores con valores MQTT en tiempo real. */
export default function SensoresSection() {
  const { sensors, connectionState } = useMqttGreenPi();
  const latestReadingQ = useLatestReading();
  const latestValues = latestReadingQ.data?.valor;
  const values = {
    temperatura: sensors.temperatura ?? latestValues?.temperatura ?? null,
    humedad_ambiente: sensors.humedad_ambiente ?? latestValues?.humedad_ambiente ?? null,
    humedad_suelo_area1: sensors.humedad_suelo_area1 ?? latestValues?.humedad_suelo_area1 ?? null,
    humedad_suelo_area2: sensors.humedad_suelo_area2 ?? latestValues?.humedad_suelo_area2 ?? null,
    luz: sensors.luz ?? latestValues?.luz ?? null,
    gas: sensors.gas ?? latestValues?.gas ?? null,
  };

  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
      {SENSOR_DEFS.map((s, i) => {
        const value = values[s.key];
        const trend = value == null
          ? "sin lectura"
          : connectionState === "connected"
            ? "en vivo"
            : "backend";
        return (
          <KpiCard
            key={s.key}
            label={s.label}
            unit={s.unit}
            value={value ?? "--"}
            trend={trend}
            trendColor={value != null ? s.trendColor : "text-dim2"}
            delay={i * 0.06}
          />
        );
      })}
    </section>
  );
}
