"use client";

import { useState } from "react";
import DashboardLayout from "@/components/templates/DashboardLayout";
import KpiGrid from "@/components/organisms/KpiGrid";
import Greenhouse3D from "@/components/organisms/Greenhouse3D";
import TempChart from "@/components/organisms/TempChart";
import EstadoGlobal from "@/components/organisms/EstadoGlobal";
import ZoneCard from "@/components/molecules/ZoneCard";
import ZonasHumedad3D from "@/components/organisms/ZonasHumedad3D";
import SensoresSection from "@/components/organisms/SensoresSection";
import SensoresViz3D from "@/components/organisms/SensoresViz3D";
import ControlPanel from "@/components/organisms/ControlPanel";
import ActuadoresViz3D from "@/components/organisms/ActuadoresViz3D";
import ActivityTable from "@/components/organisms/ActivityTable";
import Arm64Section from "@/components/organisms/Arm64Section";
import Arm64Viz3D from "@/components/organisms/Arm64Viz3D";
import { SEED_LOG } from "@/lib/constants/dashboard-data";
import type { LogEntry, StateColor } from "@/lib/types/types";

function SectionLabel({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pt-6">
      <p className="text-[11px] uppercase tracking-[.2em] text-dim2">Sección</p>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {sub && <p className="text-[13px] text-dim2 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Page() {
  const [log, setLog] = useState<LogEntry[]>(SEED_LOG);
  const [actuadorStates, setActuadorStates] = useState<Record<string, boolean>>({});

  const pushEvent = (
    origen: string,
    evento: string,
    valor: string,
    color: StateColor,
  ) => {
    const now = new Date();
    const hora = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((v) => String(v).padStart(2, "0"))
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
      ].slice(0, 12),
    );
  };

  return (
    <DashboardLayout>
      {/* ── Dashboard ─────────────────────────────────────────────── */}
      <section id="dashboard" className="space-y-6 scroll-mt-20">
        <KpiGrid />
        <Greenhouse3D />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <TempChart />
          <EstadoGlobal onEvent={pushEvent} />
        </div>
      </section>

      {/* ── Áreas de cultivo ──────────────────────────────────────── */}
      <section id="areas" className="space-y-6 scroll-mt-20">
        <SectionLabel
          title="Áreas de cultivo"
          sub="Estado actual de las 2 zonas del invernadero"
        />
        <div className="grid sm:grid-cols-2 gap-4">
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
        <ZonasHumedad3D humedad1={45} humedad2={28} />
      </section>

      {/* ── Sensores ──────────────────────────────────────────────── */}
      <section id="sensores" className="space-y-6 scroll-mt-20">
        <SectionLabel
          title="Sensores"
          sub="Lecturas en tiempo real de todos los sensores activos"
        />
        <SensoresSection />
        <SensoresViz3D />
      </section>

      {/* ── Actuadores ────────────────────────────────────────────── */}
      <section id="actuadores" className="space-y-6 scroll-mt-20">
        <SectionLabel
          title="Actuadores"
          sub="Control remoto de dispositivos del invernadero"
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <ControlPanel onEvent={pushEvent} onStateChange={setActuadorStates} />
          <ActuadoresViz3D on={actuadorStates} />
        </div>
      </section>

      {/* ── Historial ─────────────────────────────────────────────── */}
      <section id="historial" className="space-y-6 scroll-mt-20">
        <SectionLabel
          title="Historial"
          sub="Registro de eventos, comandos y alertas del sistema"
        />
        <ActivityTable log={log} />
      </section>

      {/* ── Análisis ARM64 ────────────────────────────────────────── */}
      <section id="arm64" className="space-y-6 scroll-mt-20">
        <SectionLabel
          title="Análisis ARM64"
          sub="Resultados calculados en ensamblador · 30 datos"
        />
        <Arm64Section />
        <Arm64Viz3D />
      </section>

      <p className="pb-6 pt-2 text-center font-mono text-[11px] text-dim2">
        Invernadero Inteligente IoT · Grupo 15 · ARQUI1V1S
      </p>
    </DashboardLayout>
  );
}
