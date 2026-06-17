"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import LegendItem from "../molecules/LegendItem";

/** Organism: invernadero 3D wireframe interactivo. */
export default function Greenhouse3D() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const w = el.clientWidth,
      h = el.clientHeight;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 200);
    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);
    const root = new THREE.Group();
    scene.add(root);

    const lineMat = (hex: string, op = 0.9) =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(hex),
        transparent: true,
        opacity: op,
      });
    const boxEdges = (
      bw: number,
      bh: number,
      bd: number,
      hex: string,
      op?: number,
    ) =>
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(bw, bh, bd)),
        lineMat(hex, op),
      );
    const makeRoof = (
      rw: number,
      rd: number,
      baseY: number,
      peakH: number,
      hex: string,
      op?: number,
    ) => {
      const g = new THREE.Group();
      const hw = rw / 2,
        hd = rd / 2,
        py = baseY + peakH;
      const pts = [
        [-hw, baseY, -hd],
        [hw, baseY, -hd],
        [hw, baseY, hd],
        [-hw, baseY, hd],
        [0, py, -hd],
        [0, py, hd],
      ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const seg = (a: number, b: number) =>
        g.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pts[a], pts[b]]),
            lineMat(hex, op),
          ),
        );
      seg(0, 4);
      seg(3, 5);
      seg(1, 4);
      seg(2, 5);
      seg(4, 5);
      seg(0, 1);
      seg(3, 2);
      return g;
    };

    const W = 8,
      D = 4.4,
      Hh = 2.2,
      peak = 1.1,
      secW = W / 3;
    const colors = { z1: "#ffffff", z2: "#2D9BFF", cc: "#FFC400" };
    const floor = new THREE.GridHelper(W, 12, 0x232327, 0x161619);
    floor.scale.z = D / W;
    root.add(floor);

    (["z1", "cc", "z2"] as (keyof typeof colors)[]).forEach((key, idx) => {
      const cx = (idx - 1) * secW,
        col = colors[key],
        op = key === "cc" ? 0.95 : 0.8;
      const box = boxEdges(secW * 0.98, Hh, D, col, op);
      box.position.set(cx, Hh / 2, 0);
      const roof = makeRoof(secW * 0.98, D, Hh, peak, col, op);
      roof.position.set(cx, 0, 0);
      root.add(box, roof);
    });

    [-secW, secW].forEach((cx, idx) => {
      const col = idx === 0 ? colors.z1 : colors.z2;
      const bed = boxEdges(secW * 0.7, 0.25, D * 0.7, col, 0.5);
      bed.position.set(cx, 0.13, 0);
      root.add(bed);
      for (let i = -1; i <= 1; i++) {
        const stem = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(cx + i * 0.55, 0.25, 0),
            new THREE.Vector3(cx + i * 0.55, 0.9, 0),
          ]),
          lineMat(col, 0.7),
        );
        const leaf = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.28, 0)),
          lineMat(col, 0.85),
        );
        leaf.position.set(cx + i * 0.55, 1.05, 0);
        root.add(stem, leaf);
      }
    });

    const rack = boxEdges(0.9, 1.0, 0.7, colors.cc, 0.95);
    rack.position.set(0, 0.5, 0);
    const ant = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.0, 0),
        new THREE.Vector3(0, 1.7, 0),
      ]),
      lineMat(colors.cc, 0.9),
    );
    const tip = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.12, 0)),
      lineMat(colors.cc, 1),
    );
    tip.position.set(0, 1.78, 0);
    root.add(rack, ant, tip);
    root.position.y = -0.8;

    let rotY = -0.6,
      rotX = -0.35,
      zoom = 12,
      drag = false,
      px = 0,
      py = 0;
    const apply = () => {
      root.rotation.y = rotY;
      root.rotation.x = rotX;
      cam.position.set(0, 2.2, zoom);
      cam.lookAt(0, 0.4, 0);
    };
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!drag) rotY += 0.0024;
      apply();
      ren.render(scene, cam);
    };
    loop();

    const down = (e: PointerEvent) => {
      drag = true;
      px = e.clientX;
      py = e.clientY;
    };
    const up = () => {
      drag = false;
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      rotY += (e.clientX - px) * 0.01;
      rotX = Math.max(-1.2, Math.min(0.3, rotX + (e.clientY - py) * 0.01));
      px = e.clientX;
      py = e.clientY;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(7, Math.min(20, zoom + e.deltaY * 0.01));
    };
    const onResize = () => {
      const w2 = el.clientWidth,
        h2 = el.clientHeight;
      cam.aspect = w2 / h2;
      cam.updateProjectionMatrix();
      ren.setSize(w2, h2);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", onResize);
      ren.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-edge bg-panel overflow-hidden relative">
      <div className="absolute top-5 left-5 z-10">
        <p className="text-[11px] uppercase tracking-[.2em] text-dim2">
          Maqueta
        </p>
        <h2 className="font-display text-lg font-bold">
          Estructura del invernadero
        </h2>
        <p className="text-[12px] text-dim2 mt-0.5">
          2 áreas de cultivo · 1 centro de control
        </p>
      </div>
      <div className="absolute top-5 right-5 z-10 flex flex-col gap-1.5 text-[11px] font-mono">
        <LegendItem color="#ffffff" label="Zona 1" />
        <LegendItem color="#2D9BFF" label="Zona 2" />
        <LegendItem color="#FFC400" label="Centro de control" />
      </div>
      <div className="absolute bottom-4 left-5 z-10 text-[10px] text-dim2 font-mono">
        arrastrá para rotar · scroll para zoom
      </div>
      <div
        ref={elRef}
        className="h-90 sm:h-105 w-full cursor-grab active:cursor-grabbing"
      />
    </section>
  );
}
