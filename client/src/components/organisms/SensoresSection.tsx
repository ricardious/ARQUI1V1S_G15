"use client";

import { useEffect, useState } from "react";
import KpiCard from "../molecules/KpiCard";
import { SENSORS } from "@/lib/constants/dashboard-data";

/** Organism: grilla de los 6 sensores con simulación en vivo. */
export default function SensoresSection() {
  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(SENSORS.map((s) => [s.key, s.base])),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setVals(
        Object.fromEntries(
          SENSORS.map((s) => [
            s.key,
            Math.round(s.base + (Math.random() - 0.5) * s.spread),
          ]),
        ),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {SENSORS.map((s, i) => (
        <KpiCard
          key={s.key}
          label={s.label}
          unit={s.unit}
          value={vals[s.key]}
          trend={s.trend}
          trendColor={s.trendColor}
          delay={i * 0.06}
        />
      ))}
    </section>
  );
}
