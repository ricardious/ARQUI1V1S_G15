"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BW = 1.8, BH = 1.8, BD = 1.2;
const FILL_EASE = 4.5;

function clampHumidity(humidity: number | null) {
  return Math.max(0, Math.min(100, humidity ?? 0));
}

function setFillLevel(fill: THREE.Mesh | undefined, ratio: number) {
  if (!fill) return;
  fill.scale.y = ratio;
  fill.position.y = -(BH / 2) + (BH * ratio) / 2;
}

function buildZone(
  x: number,
  color: string,
  root: THREE.Group,
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
  root.add(box);

  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(BW - 0.14, BH, BD - 0.14),
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  fill.position.set(x, -(BH / 2), 0);
  fill.scale.y = 0;
  root.add(fill);

  const stemMat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.5,
  });
  const stemY0 = BH / 2;
  const stemTop = stemY0 + 0.75;
  root.add(
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
  root.add(leaf);

  return fill;
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
  const fillsRef = useRef<THREE.Mesh[]>([]);
  const fillLevelsRef = useRef([0, 0]);
  const fillTargetsRef = useRef([0, 0]);

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

    const root = new THREE.Group();
    scene.add(root);

    const grid = new THREE.GridHelper(8, 8, 0x1a1a1e, 0x1a1a1e);
    grid.position.y = -(BH / 2) - 0.04;
    root.add(grid);

    fillsRef.current = [
      buildZone(-1.8, "#ffffff", root),
      buildZone(1.8, "#ffc400", root),
    ];

    let rotY = -0.25,
      rotX = -0.12,
      zoom = 7,
      drag = false,
      px = 0,
      py = 0;
    const apply = () => {
      root.rotation.y = rotY;
      root.rotation.x = rotX;
      cam.position.set(0, 1.2, zoom);
      cam.lookAt(0, 0.4, 0);
    };

    let raf = 0;
    let lastTime = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const fillStep = 1 - Math.exp(-FILL_EASE * delta);
      fillsRef.current.forEach((fill, index) => {
        const levels = fillLevelsRef.current;
        levels[index] += (fillTargetsRef.current[index] - levels[index]) * fillStep;
        setFillLevel(fill, levels[index]);
      });

      if (!drag) rotY += 0.0025;
      apply();
      ren.render(scene, cam);
    };
    loop();

    const down = (e: PointerEvent) => {
      drag = true;
      px = e.clientX;
      py = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const up = (e: PointerEvent) => {
      drag = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      rotY += (e.clientX - px) * 0.01;
      rotX = Math.max(-0.9, Math.min(0.35, rotX + (e.clientY - py) * 0.01));
      px = e.clientX;
      py = e.clientY;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(4.8, Math.min(11, zoom + e.deltaY * 0.008));
    };
    const onResize = () => {
      const w2 = el.clientWidth, h2 = el.clientHeight;
      cam.aspect = w2 / h2;
      cam.updateProjectionMatrix();
      ren.setSize(w2, h2);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointermove", move);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", onResize);
      fillsRef.current = [];
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh | THREE.LineSegments | THREE.Line;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else {
          material?.dispose();
        }
      });
      ren.forceContextLoss();
      ren.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, []);

  useEffect(() => {
    fillTargetsRef.current = [
      clampHumidity(humedad1) / 100,
      clampHumidity(humedad2) / 100,
    ];
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
      <div
        ref={elRef}
        className="h-52 sm:h-64 w-full cursor-grab touch-none active:cursor-grabbing"
      />
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
