"use client";

import { useState } from "react";
import DashboardLayout from "@/components/templates/DashboardLayout";
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
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";
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

function zoneEstado(hum: number | null): { label: string; color: "white" | "warn" | "danger" | "info"; barColor: string } {
  if (hum == null) return { label: "SIN DATOS", color: "info",   barColor: "#2D9BFF" };
  if (hum < 25)    return { label: "SECO",      color: "danger", barColor: "#FF2D2D" };
  if (hum < 35)    return { label: "SECO",      color: "warn",   barColor: "#FFC400" };
  if (hum > 75)    return { label: "SATURADO",  color: "warn",   barColor: "#FFC400" };
  return              { label: "NORMAL",     color: "white",  barColor: "#ffffff" };
}

export default function Page() {
  const [log, setLog] = useState<LogEntry[]>(SEED_LOG);
  const { sensors, actuators } = useMqttGreenPi();

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
      white: "OK", warn: "WARN", info: "INFO", danger: "ALERT", dim: "OFF",
    };
    setLog((prev) =>
      [{ hora, origen, evento, valor, color, estado: stateByColor[color] }, ...prev].slice(0, 12),
    );
  };

  // Actuator states mapped to the 4 shapes in ActuadoresViz3D
  const actuadorStates: Record<string, boolean> = {
    riego:  actuators.riego || actuators.riego_area1 || actuators.riego_area2,
    vent:   actuators.ventilador,
    luz:    actuators.luces,
    alarma: actuators.alarma,
  };

  const z1 = zoneEstado(sensors.humedad_suelo_area1);
  const z2 = zoneEstado(sensors.humedad_suelo_area2);

  return (
    <DashboardLayout>
      {/* ── Dashboard ─────────────────────────────────────────────── */}
      <section id="dashboard" className="space-y-6 scroll-mt-20">
        <EstadoGlobal onEvent={pushEvent} />
        <Greenhouse3D />
        <TempChart />
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
            humedad={sensors.humedad_suelo_area1 ?? 0}
            estadoLabel={z1.label}
            estadoColor={z1.color}
            barColor={z1.barColor}
            riego={actuators.riego_area1 ? "RIEGO_ON" : "RIEGO_OFF"}
          />
          <ZoneCard
            zona="Zona 2"
            humedad={sensors.humedad_suelo_area2 ?? 0}
            estadoLabel={z2.label}
            estadoColor={z2.color}
            barColor={z2.barColor}
            riego={actuators.riego_area2 ? "RIEGO_ON" : "RIEGO_OFF"}
          />
        </div>
        <ZonasHumedad3D
          humedad1={sensors.humedad_suelo_area1 ?? 45}
          humedad2={sensors.humedad_suelo_area2 ?? 28}
        />
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ControlPanel onEvent={pushEvent} />
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
