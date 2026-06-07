"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ESTADOS, ESTADO_COLOR, KPIS } from "@/lib/constants/dashboard-data";
import type { EstadoKey, StateColor } from "@/lib/types/types";

/** Organism: hero de estado global con orbe 3D y mini-KPIs vivos. */
export default function EstadoGlobal({
  onEvent,
}: {
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
}) {
  const orbRef = useRef<HTMLDivElement>(null);
  const matsRef = useRef<THREE.Material[]>([]);
  const [estado, setEstado] = useState<EstadoKey>("NORMAL");
  const [kpiVals, setKpiVals] = useState<Record<string, number>>(
    Object.fromEntries(KPIS.map((k) => [k.key, k.base])),
  );

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    cam.position.z = 3.4;

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
    );
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 }),
    );
    group.add(wire, inner);

    const N = 150, arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 1.45 + Math.random() * 0.55;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i * 3 + 2] = r * Math.cos(p);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.035,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      }),
    );
    group.add(pts);
    matsRef.current = [
      wire.material as THREE.Material,
      inner.material as THREE.Material,
      pts.material as THREE.Material,
    ];

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      group.rotation.y += 0.004;
      group.rotation.x += 0.0016;
      pts.rotation.y -= 0.0022;
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
    const id = setInterval(() => {
      setKpiVals(
        Object.fromEntries(
          KPIS.map((k) => [k.key, Math.round(k.base + (Math.random() - 0.5) * k.spread)]),
        ),
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const c = new THREE.Color(ESTADOS[estado].hex);
    matsRef.current.forEach((m) => ((m as THREE.LineBasicMaterial).color = c));
  }, [estado]);

  const e = ESTADOS[estado];
  const change = (k: EstadoKey) => {
    setEstado(k);
    onEvent("sistema", "Cambio de estado global", ESTADOS[k].label, ESTADO_COLOR[k]);
  };

  return (
    <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* ── Orbe 3D ───────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center lg:w-72 shrink-0 py-6"
          style={{
            background: `radial-gradient(ellipse at center, rgba(${e.rgb},0.08) 0%, transparent 70%)`,
          }}
        >
          <div ref={orbRef} className="size-52" />
        </div>

        {/* ── Panel derecho ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-5 p-6 border-t lg:border-t-0 lg:border-l border-edge">
          {/* Header */}
          <div>
            <p className="text-[11px] uppercase tracking-[.2em] text-dim2">
              Estado global del sistema
            </p>
            <div className="flex items-center gap-3 mt-1">
              <h2
                className="font-display text-3xl font-extrabold leading-none"
                style={{ color: e.hex }}
              >
                {e.label}
              </h2>
              <span
                className="h-2.5 w-2.5 rounded-full pulse shrink-0"
                style={{ background: e.hex }}
              />
            </div>
            <p className="text-[13px] text-dim2 mt-1">{e.sub}</p>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {KPIS.map((k) => (
              <div key={k.key} className="rounded-xl border border-edge bg-ink px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[.12em] text-dim2 truncate">
                  {k.label}
                </p>
                <p className="font-mono text-2xl font-bold mt-1 leading-none">
                  {kpiVals[k.key]}
                  <span className="text-[11px] text-dim2 ml-0.5">{k.unit}</span>
                </p>
                <p className={`text-[10px] mt-1 ${k.trendColor}`}>{k.trend}</p>
              </div>
            ))}
          </div>

          {/* Botones de estado */}
          <div>
            <p className="text-[11px] uppercase tracking-[.2em] text-dim2 mb-2">
              Simular estado
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
              <button
                onClick={() => change("NORMAL")}
                className="rounded-lg border border-edge py-2 hover:border-white hover:text-white transition"
              >
                Normal
              </button>
              <button
                onClick={() => change("ADVERTENCIA")}
                className="rounded-lg border border-edge py-2 hover:border-warn hover:text-warn transition"
              >
                Advertencia
              </button>
              <button
                onClick={() => change("RIEGO_ACTIVO")}
                className="rounded-lg border border-edge py-2 hover:border-info hover:text-info transition"
              >
                Riego activo
              </button>
              <button
                onClick={() => change("EMERGENCIA")}
                className="rounded-lg border border-edge py-2 hover:border-danger hover:text-danger transition"
              >
                Emergencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
