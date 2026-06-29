"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  disposeScene,
  makeRenderer,
  observeVisibility,
} from "@/lib/helpers/three";
import { useArm64Results } from "@/services/arm64/queries";
import { ARM64_MODULES } from "@/lib/arm64";
import type { Arm64Result, Shape } from "@/lib/types/types";

function makeGeo(shape: Shape): THREE.BufferGeometry {
  switch (shape) {
    case "ico":
      return new THREE.IcosahedronGeometry(0.55, 0);
    case "octa":
      return new THREE.OctahedronGeometry(0.55, 0);
    case "tetra":
      return new THREE.TetrahedronGeometry(0.65, 0);
    case "torus":
      return new THREE.TorusGeometry(0.4, 0.16, 6, 12);
    default:
      return new THREE.BoxGeometry(0.78, 0.78, 0.78);
  }
}

// Posiciones derivadas del nº de módulos: se reparten a lo ancho y flotan a
// distintas alturas. Así al agregar módulos no hay que tocar coordenadas; el
// espaciado es fijo y la cámara se aleja según cuántos haya.
const N = ARM64_MODULES.length;
const SPACING = 1.2;
const X_POS = ARM64_MODULES.map((_, i) => (i - (N - 1) / 2) * SPACING);
const FLOAT_BASE = [0, 0.5, -0.3, 0.7, -0.15, 0.4, 1.0];
const FLOAT_Y = ARM64_MODULES.map((_, i) => FLOAT_BASE[i % FLOAT_BASE.length]);
const CAM_Z = Math.max(10, (N - 1) * SPACING * 0.62 + 4.5);

/** Organism: cristales 3D por módulo ARM64 — formas y colores por tarjeta. */
export default function Arm64Viz3D() {
  const elRef = useRef<HTMLDivElement>(null);
  const resultsQ = useArm64Results(30);
  const latestByModule = (resultsQ.data ?? []).reduce<Record<string, Arm64Result>>(
    (acc, r) => {
      if (r.module && !(r.module in acc)) acc[r.module] = r;
      return acc;
    },
    {},
  );
  const cards = ARM64_MODULES.map((module) => {
    const doc = latestByModule[module.key];
    const fields = doc?.result?.fields ?? {};
    const value = (doc ? module.headline(fields) : undefined) ?? "—";
    const danger = doc ? (module.danger?.(fields) ?? false) : false;
    return {
      key: module.key,
      label: module.label,
      value,
      color: danger ? "#FF2D2D" : value === "—" ? "#5a5a62" : "#ffffff",
      danger,
    };
  });

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth,
      h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(44, w / h, 0.1, 100);
    cam.position.set(0, 1.6, CAM_Z);
    cam.lookAt(0, 0.5, 0);

    const ren = makeRenderer();
    ren.setSize(w, h);
    el.appendChild(ren.domElement);

    const grid = new THREE.GridHelper(10, 10, 0x1a1a1e, 0x1a1a1e);
    grid.position.y = -1.2;
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);

    const groups: THREE.Group[] = [];

    ARM64_MODULES.forEach((card, i) => {
      const geo = makeGeo(card.shape);
      const edges = new THREE.EdgesGeometry(geo);
      geo.dispose(); // EdgesGeometry copia los datos; la base ya no se usa
      const g = new THREE.Group();
      g.position.set(X_POS[i], FLOAT_Y[i], 0);

      g.add(
        new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: new THREE.Color("#ffffff"),
            transparent: true,
            opacity: 0.78,
          }),
        ),
      );

      groups.push(g);
      root.add(g);
    });

    let visible = true;
    const unobserve = observeVisibility(el, (v) => (visible = v));
    let raf = 0,
      t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      t += 0.016;
      root.rotation.y += 0.004;
      groups.forEach((g, i) => {
        g.rotation.y += 0.012 + i * 0.002;
        g.rotation.x += 0.007;
        g.position.y = FLOAT_Y[i] + Math.sin(t * 1.2 + i * 0.9) * 0.12;
      });
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
      unobserve();
      window.removeEventListener("resize", onResize);
      disposeScene(scene);
      ren.forceContextLoss();
      ren.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="text-[11px] uppercase tracking-[.2em] text-dim2">
          3D · Módulos
        </p>
        <h2 className="font-display text-lg font-bold">
          Cristales de análisis
        </h2>
        <p className="text-[12px] text-dim2">
          Cada forma corresponde a un módulo ARM64
        </p>
      </div>
      <div ref={elRef} className="h-52 sm:h-64 w-full" />
      <div
        className="grid border-t border-edge"
        style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
      >
        {cards.map((c) => (
          <div
            key={c.key}
            className="flex flex-col items-center gap-1 py-3 border-r border-edge last:border-r-0"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: c.color }}
            />
            <span
              className="text-[10px] font-mono text-center px-1 leading-tight"
              style={{ color: c.danger ? c.color : "#5a5a62" }}
            >
              {c.label}
            </span>
            <span
              className="text-[11px] font-mono font-bold"
              style={{ color: c.color }}
            >
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
