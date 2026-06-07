"use client";

import { useEffect, useState } from "react";
import Object3D from "../atoms/Object3D";
import StatusDot from "../atoms/StatusDot";
import NavItem from "../molecules/NavItem";
import { NAV_ITEMS } from "@/lib/constants/dashboard-data";
import { useMqttGreenPi } from "@/lib/hooks/useMqttGreenPi";
import { ENV } from "@/lib/constants/env";

/** Organism: barra lateral de navegación con scroll-spy. */
export default function Sidebar() {
  const [activeId, setActiveId] = useState<string>("dashboard");
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const { connectionState } = useMqttGreenPi();
  const mqttOnline = connectionState === "connected";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "0px 0px -80% 0px" },
    );

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      try {
        const res = await fetch(`${ENV.API_URL}/api/health`, { cache: "no-store" });
        if (!cancelled) setBackendOnline(res.ok);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };

    checkBackend();
    const id = window.setInterval(checkBackend, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-8 px-5 py-6 border-r border-edge sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-1">
        <div className="h-10 w-10 rounded-xl border border-edge bg-panel">
          <Object3D shape="ico" color="#ffffff" className="h-full w-full" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold text-[15px] tracking-tight">
            GreenPi
          </p>
          <p className="text-[10px] text-dim2 tracking-[.2em] uppercase">
            Grupo&nbsp;15
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 text-[13px]">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[.2em] text-dim2">
          Panel
        </p>
        {NAV_ITEMS.map((it) => (
          <NavItem
            key={it.label}
            label={it.label}
            href={`#${it.id}`}
            active={activeId === it.id}
          />
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-edge bg-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <StatusDot color={mqttOnline ? "#00ff6a" : "#5a5a62"} pulse={mqttOnline} />
          <p className="text-[11px] text-dim">
            MQTT · {mqttOnline ? "en línea" : connectionState}
          </p>
        </div>
        <p className="font-mono text-[11px] text-dim2 leading-relaxed">
          Backend · {backendOnline == null ? "verificando" : backendOnline ? "en línea" : "desconectado"}
          <br />
          Datos · {backendOnline ? "MongoDB/API" : "sin backend"}
        </p>
      </div>
    </aside>
  );
}
