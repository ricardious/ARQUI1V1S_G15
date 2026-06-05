"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ESTADOS, ESTADO_COLOR } from "@/lib/constants/dashboard-data";
import type { EstadoKey, StateColor } from "@/lib/types/types";

/** Organism: estado global con núcleo 3D (orbe). */
export default function EstadoGlobal({
  onEvent,
}: {
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
}) {
  const orbRef = useRef<HTMLDivElement>(null);
  const matsRef = useRef<THREE.Material[]>([]);
  const [estado, setEstado] = useState<EstadoKey>("NORMAL");

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    const w = el.clientWidth,
      h = el.clientHeight;

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
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      }),
    );
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
      }),
    );
    group.add(wire, inner);

    const N = 150,
      arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 1.45 + Math.random() * 0.55,
        t = Math.random() * Math.PI * 2,
        p = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
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
      const w2 = el.clientWidth,
        h2 = el.clientHeight;
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
    const c = new THREE.Color(ESTADOS[estado].hex);
    matsRef.current.forEach((m) => ((m as THREE.LineBasicMaterial).color = c));
  }, [estado]);

  const e = ESTADOS[estado];
  const change = (k: EstadoKey) => {
    setEstado(k);
    onEvent(
      "sistema",
      "Cambio de estado global",
      ESTADOS[k].label,
      ESTADO_COLOR[k],
    );
  };

  return (
    <div className="rounded-2xl border border-edge bg-panel p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Estado global</h2>
        <span
          className="h-2.5 w-2.5 rounded-full pulse"
          style={{ background: e.hex }}
        />
      </div>
      <div className="flex-1 grid place-items-center py-2">
        <div
          className="relative rounded-full"
          style={{
            boxShadow: `0 0 70px -8px rgba(${e.rgb},${estado === "EMERGENCIA" ? 0.75 : 0.5})`,
          }}
        >
          <div ref={orbRef} className="size-57.5" />
          <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
            <div>
              <p
                className="font-display text-2xl font-extrabold"
                style={{ color: e.hex }}
              >
                {e.label}
              </p>
              <p className="text-[11px] text-dim2 mt-1">{e.sub}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] uppercase tracking-[.2em] text-dim2 mb-2">
        Simular estado
      </p>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
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
  );
}
