"use client";
import { useEffect, useState } from "react";
import KpiCard from "../molecules/KpiCard";
import { KPIS } from "@/lib/constants/dashboard-data";

/** Organism: grilla de KPIs con simulación en vivo. */
export default function KpiGrid() {
  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(KPIS.map((k) => [k.key, k.base])),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setVals(
        Object.fromEntries(
          KPIS.map((k) => [
            k.key,
            Math.round(k.base + (Math.random() - 0.5) * k.spread),
          ]),
        ),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {KPIS.map((k, i) => (
        <KpiCard
          key={k.key}
          label={k.label}
          unit={k.unit}
          value={vals[k.key]}
          trend={k.trend}
          trendColor={k.trendColor}
          delay={i * 0.06}
        />
      ))}
    </section>
  );
}
