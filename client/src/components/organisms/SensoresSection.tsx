"use client";

import KpiCard from "../molecules/KpiCard";
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";

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

  return (
    <section className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {SENSOR_DEFS.map((s, i) => {
        const raw = sensors[s.key as keyof typeof sensors];
        const value = raw ?? 0;
        const trend = connectionState === "connected"
          ? (raw != null ? "● en vivo" : "sin datos")
          : "sin conexión";
        return (
          <KpiCard
            key={s.key}
            label={s.label}
            unit={s.unit}
            value={value}
            trend={trend}
            trendColor={raw != null ? s.trendColor : "text-dim2"}
            delay={i * 0.06}
          />
        );
      })}
    </section>
  );
}
