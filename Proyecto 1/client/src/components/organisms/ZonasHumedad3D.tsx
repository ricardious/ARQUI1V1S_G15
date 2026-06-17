"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BW = 1.8, BH = 1.8, BD = 1.2;

function buildZone(
  x: number,
  humidity: number,
  color: string,
  scene: THREE.Scene,
) {
  const col = new THREE.Color(color);

  const wireMat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.55,
  });
  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, BH, BD)),
    wireMat,
  );
  box.position.set(x, 0, 0);
  scene.add(box);

  const fillH = BH * (humidity / 100);
  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(BW - 0.14, fillH, BD - 0.14),
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  fill.position.set(x, -(BH / 2) + fillH / 2, 0);
  scene.add(fill);

  const stemMat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.5,
  });
  const stemY0 = BH / 2;
  const stemTop = stemY0 + 0.75;
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, stemY0, 0),
        new THREE.Vector3(x, stemTop, 0),
      ]),
      stemMat,
    ),
  );

  const leaf = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.28, 0)),
    new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8 }),
  );
  leaf.position.set(x, stemTop + 0.28, 0);
  scene.add(leaf);
}

/** Organism: dos zonas de cultivo en 3D con nivel de humedad visible. */
export default function ZonasHumedad3D({
  humedad1,
  humedad2,
}: {
  humedad1: number | null;
  humedad2: number | null;
}) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    cam.position.set(0, 1.2, 7);
    cam.lookAt(0, 0.4, 0);

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    const grid = new THREE.GridHelper(8, 8, 0x1a1a1e, 0x1a1a1e);
    grid.position.y = -(BH / 2) - 0.04;
    scene.add(grid);

    buildZone(-1.8, humedad1 ?? 0, "#ffffff", scene);
    buildZone(1.8, humedad2 ?? 0, "#ffc400", scene);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      scene.rotation.y += 0.004;
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
  }, [humedad1, humedad2]);

  return (
    <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="text-[11px] uppercase tracking-[.2em] text-dim2">3D · Zonas</p>
        <h2 className="font-display text-lg font-bold">Humedad por zona</h2>
        <p className="text-[12px] text-dim2">
          Nivel de agua en suelo · relleno = humedad actual
        </p>
      </div>
      <div ref={elRef} className="h-52 sm:h-64 w-full" />
      <div className="grid grid-cols-2 border-t border-edge">
        <div className="flex flex-col items-center gap-1 py-3 border-r border-edge">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="text-[10px] font-mono text-dim2">Zona 1</span>
          <span className="text-[11px] font-mono font-bold text-white">
            {humedad1 == null ? "--" : `${humedad1}%`}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 py-3">
          <span className="h-2 w-2 rounded-full" style={{ background: "#ffc400" }} />
          <span className="text-[10px] font-mono text-dim2">Zona 2</span>
          <span
            className="text-[11px] font-mono font-bold"
            style={{ color: "#ffc400" }}
          >
            {humedad2 == null ? "--" : `${humedad2}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
