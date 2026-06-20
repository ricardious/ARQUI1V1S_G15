"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Organism: fondo 3D protagonista de la pantalla de acceso.
 *  Invernadero wireframe (mismo modelo que el dashboard) + rejilla de suelo +
 *  campo de partículas, a pantalla completa y detrás de la tarjeta. */
export default function LoginScene3D() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let w = el.clientWidth,
      h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const cam = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    cam.position.set(0, 1.5, 8.2);
    cam.lookAt(0, 0.7, 0);

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(ren.domElement);

    // ── Helpers (portados de Greenhouse3D) ──────────────────────────────
    const lineMat = (hex: string, op = 0.9) =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(hex),
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    const boxEdges = (bw: number, bh: number, bd: number, hex: string, op?: number) =>
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
      seg(0, 4); seg(3, 5); seg(1, 4); seg(2, 5); seg(4, 5); seg(0, 1); seg(3, 2);
      return g;
    };

    const spin = new THREE.Group(); // gira
    const gh = new THREE.Group(); // invernadero
    spin.add(gh);
    spin.scale.setScalar(1.15);
    scene.add(spin);

    const W = 8, D = 4.4, Hh = 2.2, peak = 1.1, secW = W / 3;
    const colors = { z1: "#ffffff", z2: "#2D9BFF", cc: "#00ff6a" };

    const floor = new THREE.GridHelper(W * 1.6, 20, 0x2a5a40, 0x163424);
    floor.position.y = -0.8;
    (floor.material as THREE.Material).transparent = true;
    (floor.material as THREE.Material).opacity = 0.7;
    gh.add(floor);

    (["z1", "cc", "z2"] as (keyof typeof colors)[]).forEach((key, idx) => {
      const cx = (idx - 1) * secW,
        col = colors[key],
        op = key === "cc" ? 1.0 : 0.88;
      const box = boxEdges(secW * 0.98, Hh, D, col, op);
      box.position.set(cx, Hh / 2, 0);
      const roof = makeRoof(secW * 0.98, D, Hh, peak, col, op);
      roof.position.set(cx, 0, 0);
      gh.add(box, roof);
    });

    [-secW, secW].forEach((cx, idx) => {
      const col = idx === 0 ? colors.z1 : colors.z2;
      const bed = boxEdges(secW * 0.7, 0.25, D * 0.7, col, 0.45);
      bed.position.set(cx, 0.13, 0);
      gh.add(bed);
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
          lineMat(col, 0.95),
        );
        leaf.position.set(cx + i * 0.55, 1.05, 0);
        gh.add(stem, leaf);
      }
    });

    const rack = boxEdges(0.9, 1.0, 0.7, colors.cc, 0.95);
    rack.position.set(0, 0.5, 0);
    const ant = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.0, 0),
        new THREE.Vector3(0, 1.75, 0),
      ]),
      lineMat(colors.cc, 0.9),
    );
    const tip = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.13, 0)),
      lineMat(colors.cc, 1),
    );
    tip.position.set(0, 1.82, 0);
    gh.add(rack, ant, tip);
    gh.position.y = -0.3;

    // ── Campo de partículas ─────────────────────────────────────────────
    const N = 560,
      arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = Math.random() * 11 - 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15 - 1;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        color: 0xaaffcc,
        size: 0.065,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(pts);

    let raf = 0,
      t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.005;
      spin.rotation.y += 0.0016;
      gh.position.y = -0.3 + Math.sin(t) * 0.06;
      gh.rotation.x = -0.06;
      pts.rotation.y += 0.0004;
      ren.render(scene, cam);
    };
    loop();

    const onResize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ren.dispose();
      if (ren.domElement.parentNode === el) el.removeChild(ren.domElement);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Resplandores de marca detrás del 3D */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 38%, rgba(0,255,106,0.22) 0%, transparent 70%)," +
            "radial-gradient(50% 44% at 82% 80%, rgba(45,155,255,0.16) 0%, transparent 72%)," +
            "radial-gradient(42% 38% at 14% 22%, rgba(255,196,0,0.10) 0%, transparent 70%)",
        }}
      />
      {/* Canvas 3D */}
      <div ref={ref} className="absolute inset-0" />
      {/* Viñeta para enfocar el centro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(145% 105% at 50% 44%, transparent 62%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
