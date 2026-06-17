"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Shape } from "@/lib/types/types";

/** Atom: figura 3D wireframe reutilizable (logo, tarjetas ARM64). */
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

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cam.position.z = 2.7;
    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    let geo: THREE.BufferGeometry;
    if (shape === "octa") geo = new THREE.OctahedronGeometry(1.15, 0);
    else if (shape === "tetra") geo = new THREE.TetrahedronGeometry(1.2, 0);
    else if (shape === "torus")
      geo = new THREE.TorusGeometry(0.72, 0.3, 10, 18);
    else if (shape === "box") geo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
    else geo = new THREE.IcosahedronGeometry(1.1, 1);

    const mesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.85,
      }),
    );
    scene.add(mesh);

    const sx = 0.008 + Math.random() * 0.006,
      sy = 0.011 + Math.random() * 0.006;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      mesh.rotation.x += sx;
      mesh.rotation.y += sy;
      ren.render(scene, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ren.dispose();
      geo.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, [shape, color]);

  return <div ref={ref} className={className} />;
}
