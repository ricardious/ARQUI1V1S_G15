"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { IS_MOBILE, observeVisibility, registerThumb } from "@/lib/helpers/three";
import type { Shape } from "@/lib/types/types";

/** Atom: figura 3D wireframe reutilizable (logo, tarjetas ARM64).
 *  Comparte un único contexto WebGL con todas las demás miniaturas (ver
 *  registerThumb) para no superar el límite de contextos del navegador. */
export default function Object3D({
  shape,
  color,
  className,
}: {
  shape: Shape;
  color: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 64,
      h = el.clientHeight || 64;

    // Canvas 2D propio donde el pool copia el render compartido.
    const canvas = document.createElement("canvas");
    // Mismo pixelRatio que el renderer compartido para copiar 1:1 sin escalar.
    const ratio =
      typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2);
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cam.position.z = 2.7;

    let geo: THREE.BufferGeometry;
    if (shape === "octa") geo = new THREE.OctahedronGeometry(1.15, 0);
    else if (shape === "tetra") geo = new THREE.TetrahedronGeometry(1.2, 0);
    else if (shape === "torus")
      geo = new THREE.TorusGeometry(0.72, 0.3, 10, 18);
    else if (shape === "box") geo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
    else geo = new THREE.IcosahedronGeometry(1.1, 1);

    const edges = new THREE.EdgesGeometry(geo);
    geo.dispose(); // EdgesGeometry copia los datos; la base ya no se usa
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.LineSegments(edges, mat);
    scene.add(mesh);

    const sx = 0.008 + Math.random() * 0.006,
      sy = 0.011 + Math.random() * 0.006;

    const item = {
      canvas,
      ctx,
      scene,
      camera: cam,
      w,
      h,
      visible: true,
      update: () => {
        mesh.rotation.x += sx;
        mesh.rotation.y += sy;
      },
    };
    const unregister = registerThumb(item);
    const unobserve = observeVisibility(el, (v) => (item.visible = v));

    return () => {
      unregister();
      unobserve();
      edges.dispose();
      mat.dispose();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, [shape, color]);

  return <div ref={ref} className={className} />;
}
