"use client";

import { useState } from "react";
import DashboardLayout from "@/components/templates/DashboardLayout";
import KpiGrid from "@/components/organisms/KpiGrid";
import Greenhouse3D from "@/components/organisms/Greenhouse3D";
import TempChart from "@/components/organisms/TempChart";
import EstadoGlobal from "@/components/organisms/EstadoGlobal";
import AreasControls from "@/components/organisms/AreasControls";
import ActivityTable from "@/components/organisms/ActivityTable";
import Arm64Section from "@/components/organisms/Arm64Section";
import { SEED_LOG } from "@/lib/constants/dashboard-data";
import type { LogEntry, StateColor } from "@/lib/types/types";

export default function Page() {
  const [log, setLog] = useState<LogEntry[]>(SEED_LOG);

  const pushEvent = (
    origen: string,
    evento: string,
    valor: string,
    color: StateColor,
  ) => {
    const now = new Date();
    const hora = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
    const stateByColor: Record<StateColor, string> = {
      white: "OK",
      warn: "WARN",
      info: "INFO",
      danger: "ALERT",
      dim: "OFF",
    };

    setLog((prev) =>
      [
        { hora, origen, evento, valor, color, estado: stateByColor[color] },
        ...prev,
      ].slice(0, 8),
    );
  };

  return (
    <DashboardLayout>
      <KpiGrid />
      <Greenhouse3D />
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TempChart />
        <EstadoGlobal onEvent={pushEvent} />
      </section>
      <AreasControls onEvent={pushEvent} />
      <ActivityTable log={log} />
      <Arm64Section />
      <p className="pb-4 pt-2 text-center font-mono text-[11px] text-dim2">
        Invernadero Inteligente IoT · Grupo 15 · ARQUI1V1S
      </p>
    </DashboardLayout>
  );
}
