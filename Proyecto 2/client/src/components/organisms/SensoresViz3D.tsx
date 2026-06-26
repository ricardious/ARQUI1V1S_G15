"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useMqttDashboard } from "@/lib/hooks/useMqttDashboard";
import { useLatestReading } from "@/services/readings/queries";

const DEFS: {
  key: string;
  label: string;
  base: number;
  spread: number;
  unit: string;
  warnHi?: number;
  warnLo?: number;
  dangerHi?: number;
  dangerLo?: number;
}[] = [
  { key: "temp",    label: "Temp.",    base: 28,  spread: 3,  unit: "°C",  warnHi: 32, dangerHi: 36 },
  { key: "hum_amb", label: "Hum.Amb.", base: 66,  spread: 6,  unit: "%",   warnLo: 40, dangerLo: 30 },
  { key: "suelo_1", label: "Suelo Z1", base: 45,  spread: 4,  unit: "%",   warnLo: 35, dangerLo: 25 },
  { key: "suelo_2", label: "Suelo Z2", base: 28,  spread: 4,  unit: "%",   warnLo: 35, dangerLo: 20 },
  { key: "luz",     label: "Luz",      base: 260, spread: 40, unit: "lx",  warnLo: 200,dangerLo: 150 },
  { key: "gas",     label: "Gas",      base: 150, spread: 30, unit: "ppm", warnHi: 300,dangerHi: 400 },
];

function getHealth(def: (typeof DEFS)[0], v: number | null): "ok" | "warn" | "danger" | "dim" {
  if (v == null) return "dim";
  if (def.dangerHi !== undefined && v > def.dangerHi) return "danger";
  if (def.dangerLo !== undefined && v < def.dangerLo) return "danger";
  if (def.warnHi !== undefined && v > def.warnHi) return "warn";
  if (def.warnLo !== undefined && v < def.warnLo) return "warn";
  return "ok";
}

const HC = { ok: "#5a5a62", warn: "#FFC400", danger: "#FF2D2D", dim: "#2a2a2e" } as const;

/** Organism: constelación 3D de sensores con nodos reactivos. */
export default function SensoresViz3D() {
  const elRef = useRef<HTMLDivElement>(null);
  const matsRef = useRef<THREE.LineBasicMaterial[]>([]);
  const { sensors } = useMqttDashboard();
  const latestReadingQ = useLatestReading();
  const latestValues = latestReadingQ.data?.valor;
  const vals = useMemo<Record<string, number | null>>(
    () => ({
      temp:    sensors.temperatura ?? latestValues?.temperatura ?? null,
      hum_amb: sensors.humedad_ambiente ?? latestValues?.humedad_ambiente ?? null,
      suelo_1: sensors.humedad_suelo_area1 ?? latestValues?.humedad_suelo_area1 ?? null,
      suelo_2: sensors.humedad_suelo_area2 ?? latestValues?.humedad_suelo_area2 ?? null,
      luz:     sensors.luz ?? latestValues?.luz ?? null,
      gas:     sensors.gas ?? latestValues?.gas ?? null,
    }),
    [
      latestValues?.gas,
      latestValues?.humedad_ambiente,
      latestValues?.humedad_suelo_area1,
      latestValues?.humedad_suelo_area2,
      latestValues?.luz,
      latestValues?.temperatura,
      sensors.gas,
      sensors.humedad_ambiente,
      sensors.humedad_suelo_area1,
      sensors.humedad_suelo_area2,
      sensors.luz,
      sensors.temperatura,
    ],
  );

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    cam.position.set(0, 2.8, 8);
    cam.lookAt(0, 0, 0);

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    const root = new THREE.Group();
    scene.add(root);

    // center hub
    const hub = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.42, 0)),
      new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5 }),
    );
    root.add(hub);

    const R = 2.5;
    const nodeMats: THREE.LineBasicMaterial[] = [];

    DEFS.forEach((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * R;
      const z = Math.sin(angle) * R;

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(HC.ok),
        transparent: true,
        opacity: 0.7,
      });
      nodeMats.push(mat);

      const node = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.32, 0)),
        mat,
      );
      node.position.set(x, 0, z);
      root.add(node);

      root.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(x, 0, z),
          ]),
          new THREE.LineBasicMaterial({ color: "#2a2a2e", transparent: true, opacity: 0.5 }),
        ),
      );
    });
    matsRef.current = nodeMats;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      root.rotation.y += 0.006;
      hub.rotation.x += 0.008;
      hub.rotation.z += 0.005;
      ren.render(scene, cam);
    };
    loop();

    const onResize = () => {
      const w2 = el.clientWidth, h2 = el.clientHeight;
      cam.aspect = w2 / h2;
      cam.updateProjectionMatrix();
      ren.setSize(w2, h2);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ren.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, []);

  useEffect(() => {
    DEFS.forEach((def, i) => {
      const mat = matsRef.current[i];
      if (!mat) return;
      const h = getHealth(def, vals[def.key]);
      mat.color.set(HC[h]);
      mat.opacity = h === "dim" ? 0.35 : h === "ok" ? 0.65 : 0.95;
    });
  }, [vals]);

  return (
    <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="text-[11px] uppercase tracking-[.2em] text-dim2">Constelación</p>
        <h2 className="font-display text-lg font-bold">Red de sensores</h2>
        <p className="text-[12px] text-dim2">
          Cada nodo cambia de color según umbral
        </p>
      </div>
      <div ref={elRef} className="h-52 sm:h-64 w-full" />
      <div className="grid grid-cols-3 border-t border-edge">
        {DEFS.map((def) => {
          const h = getHealth(def, vals[def.key]);
          return (
            <div
              key={def.key}
              className="flex flex-col items-center gap-1 py-3 border-r border-edge [&:nth-child(3n)]:border-r-0"
            >
              <span
                className="h-2 w-2 rounded-full transition-colors duration-700"
                style={{ background: HC[h] }}
              />
              <span className="text-[10px] font-mono text-dim2">{def.label}</span>
              <span
                className="text-[11px] font-mono font-bold transition-colors duration-700"
                style={{ color: HC[h] }}
              >
                {vals[def.key] ?? "--"}
                {vals[def.key] == null ? "" : def.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
