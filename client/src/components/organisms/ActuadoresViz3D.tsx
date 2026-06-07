"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ActKey = "riego" | "vent" | "luz" | "alarma";

const DEFS: { key: ActKey; label: string; colorOn: string; x: number }[] = [
  { key: "riego",  label: "Riego",       colorOn: "#2D9BFF", x: -3.6 },
  { key: "vent",   label: "Ventilación", colorOn: "#ffffff", x: -1.2 },
  { key: "luz",    label: "Iluminación", colorOn: "#FFC400", x:  1.2 },
  { key: "alarma", label: "Alarma",      colorOn: "#FF2D2D", x:  3.6 },
];
const OFF = "#1a1a1e";

function buildGeo(key: ActKey): THREE.BufferGeometry {
  if (key === "riego")  return new THREE.TorusGeometry(0.65, 0.18, 8, 28);
  if (key === "vent")   return new THREE.TorusKnotGeometry(0.5, 0.15, 48, 6, 2, 3);
  if (key === "luz")    return new THREE.OctahedronGeometry(0.82, 0);
  return new THREE.IcosahedronGeometry(0.76, 0);
}

/** Organism: escena Three.js con 4 actuadores 3D reactivos. */
export default function ActuadoresViz3D({ on }: { on: Record<string, boolean> }) {
  const elRef = useRef<HTMLDivElement>(null);
  const wireMatsRef = useRef<Partial<Record<ActKey, THREE.LineBasicMaterial>>>({});
  const innerMatsRef = useRef<Partial<Record<ActKey, THREE.MeshBasicMaterial>>>({});
  const groupsRef = useRef<Partial<Record<ActKey, THREE.Group>>>({});
  const onRef = useRef(on);
  onRef.current = on;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    cam.position.set(0, 0.6, 11);
    cam.lookAt(0, 0, 0);

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    DEFS.forEach(({ key, colorOn, x }) => {
      const group = new THREE.Group();
      group.position.set(x, 0, 0);

      const geo = buildGeo(key);
      const edges = new THREE.EdgesGeometry(geo);

      const wireMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(OFF),
        transparent: true,
        opacity: 0.28,
      });
      wireMatsRef.current[key] = wireMat;

      const innerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorOn),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      innerMatsRef.current[key] = innerMat;

      group.add(new THREE.LineSegments(edges, wireMat));
      group.add(new THREE.Mesh(geo, innerMat));
      groupsRef.current[key] = group;
      scene.add(group);
    });

    let raf = 0, t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.016;
      DEFS.forEach(({ key }, idx) => {
        const group = groupsRef.current[key];
        if (!group) return;
        const active = onRef.current[key];
        group.rotation.y += active ? 0.022 : 0.005;
        if (key === "vent") group.rotation.z += active ? 0.028 : 0.003;
        if (key === "alarma" && active) group.rotation.x += 0.014;
        group.position.y = active
          ? Math.sin(t * 1.9 + idx * 1.1) * 0.16
          : Math.sin(t * 0.45 + idx) * 0.04;
      });
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
    DEFS.forEach(({ key, colorOn }) => {
      const wm = wireMatsRef.current[key];
      const im = innerMatsRef.current[key];
      if (!wm || !im) return;
      const active = !!on[key];
      wm.color.set(active ? colorOn : OFF);
      wm.opacity = active ? 0.92 : 0.28;
      im.opacity = active ? 0.1 : 0;
    });
  }, [on]);

  return (
    <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="text-[11px] uppercase tracking-[.2em] text-dim2">
          Visualización 3D
        </p>
        <h2 className="font-display text-lg font-bold">Estado de actuadores</h2>
      </div>

      <div ref={elRef} className="h-52 sm:h-64 w-full" />

      <div className="grid grid-cols-4 border-t border-edge">
        {DEFS.map(({ key, label, colorOn }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1 py-3 border-r border-edge last:border-r-0"
          >
            <span
              className="h-2 w-2 rounded-full transition-colors duration-500"
              style={{ background: on[key] ? colorOn : "#232327" }}
            />
            <span
              className="text-[11px] font-mono transition-colors duration-500"
              style={{ color: on[key] ? colorOn : "#5a5a62" }}
            >
              {label}
            </span>
            <span className="text-[10px] font-mono text-dim2">
              {on[key] ? "ON" : "OFF"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
