"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { COMMANDS } from "@/lib/constants/commands";
import { useMqttDashboard } from "@/lib/hooks/useMqttDashboard";
import type { StateColor } from "@/lib/types/types";

type ActKey = "riego" | "vent" | "luces" | "alarma";
type ActType = "drip" | "fan" | "bulb" | "horn";
type RiegoTarget = "general" | "area1" | "area2";

type ActDef = {
  id: ActKey;
  name: string;
  type: ActType;
  color: string;
  onCommand?: string;
  offCommand: string;
};

type SceneObject = {
  mats: (THREE.LineBasicMaterial | THREE.MeshBasicMaterial)[];
  update: (dt: number, active: boolean) => void;
};

type SceneCtx = {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  ren: THREE.WebGLRenderer;
  stage: HTMLDivElement;
};

type LogItem = {
  time: string;
  topic: string;
  payload: string;
  color: string;
};

const CONTROL_TOPIC = "invernadero/control/manual";
const DIM = "#5a5a62";
const OFF = "#ffffff";

const RIEGO_TARGETS: { id: RiegoTarget; label: string; command: string }[] = [
  { id: "general", label: "General", command: COMMANDS.ACTIVAR_RIEGO },
  { id: "area1", label: "Área 1", command: COMMANDS.ACTIVAR_RIEGO_1 },
  { id: "area2", label: "Área 2", command: COMMANDS.ACTIVAR_RIEGO_2 },
];

const ACTS: ActDef[] = [
  {
    id: "riego",
    name: "Riego",
    type: "drip",
    color: "#2D9BFF",
    onCommand: COMMANDS.ACTIVAR_RIEGO,
    offCommand: COMMANDS.DESACTIVAR_RIEGO,
  },
  {
    id: "vent",
    name: "Ventilación",
    type: "fan",
    color: "#2D9BFF",
    onCommand: COMMANDS.ACTIVAR_VENTILADOR,
    offCommand: COMMANDS.DESACTIVAR_VENTILADOR,
  },
  {
    id: "luces",
    name: "Iluminación",
    type: "bulb",
    color: "#FFC400",
    onCommand: COMMANDS.ENCENDER_LUCES,
    offCommand: COMMANDS.APAGAR_LUCES,
  },
  {
    id: "alarma",
    name: "Alarma / Buzzer",
    type: "horn",
    color: "#FF2D2D",
    offCommand: COMMANDS.SILENCIAR_ALARMA,
  },
];

function wire(
  geo: THREE.BufferGeometry,
  color: string,
): THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial> {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: new THREE.Color(color) }),
  );
}

function initScene(stage: HTMLDivElement): SceneCtx {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  cam.position.set(0, 0, 5);

  const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  ren.setSize(w, h);
  ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ren.domElement.style.display = "block";
  ren.domElement.style.width = "100%";
  ren.domElement.style.height = "100%";
  stage.appendChild(ren.domElement);

  return { scene, cam, ren, stage };
}

function buildFan(ctx: SceneCtx): SceneObject {
  const group = new THREE.Group();
  group.rotation.x = -0.5;
  ctx.scene.add(group);

  const mats: SceneObject["mats"] = [];
  const front = wire(new THREE.TorusGeometry(1.35, 0.06, 10, 48), OFF);
  const back = wire(new THREE.TorusGeometry(1.35, 0.06, 10, 48), "#888888");
  front.position.z = 0.25;
  back.position.z = -0.25;
  group.add(front, back);
  mats.push(front.material, back.material);

  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.25),
          new THREE.Vector3(Math.cos(a) * 1.35, Math.sin(a) * 1.35, -0.25),
        ]),
        new THREE.LineBasicMaterial({ color: "#888888" }),
      ),
    );
  }

  const blades = new THREE.Group();
  group.add(blades);
  const hub = wire(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), OFF);
  hub.rotation.x = Math.PI / 2;
  blades.add(hub);
  mats.push(hub.material);

  const bladeShape = () => {
    const s = new THREE.Shape();
    s.moveTo(0.18, 0);
    s.quadraticCurveTo(0.55, 0.55, 0.3, 1.18);
    s.quadraticCurveTo(0.05, 1.3, -0.05, 1.15);
    s.quadraticCurveTo(-0.1, 0.5, 0.18, 0);
    return s;
  };

  for (let i = 0; i < 5; i++) {
    const blade = wire(
      new THREE.ExtrudeGeometry(bladeShape(), {
        depth: 0.06,
        bevelEnabled: false,
      }),
      OFF,
    );
    const pivot = new THREE.Group();
    blade.rotation.y = 0.5;
    pivot.rotation.z = i * Math.PI * 2 / 5;
    pivot.add(blade);
    blades.add(pivot);
    mats.push(blade.material);
  }

  return {
    mats,
    update: (dt, active) => {
      blades.rotation.z += (active ? 9 : 0.5) * dt;
    },
  };
}

function buildBulb(ctx: SceneCtx, color: string): SceneObject {
  const group = new THREE.Group();
  ctx.scene.add(group);

  const bulb = wire(new THREE.IcosahedronGeometry(0.85, 1), OFF);
  const base = wire(new THREE.CylinderGeometry(0.3, 0.4, 0.4, 12), OFF);
  base.position.y = -1;
  group.add(bulb, base);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 24, 24),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(halo);

  return {
    mats: [bulb.material, base.material],
    update: (dt, active) => {
      group.rotation.y += 0.6 * dt;
      const mat = halo.material;
      const target = active ? 0.35 + Math.sin(performance.now() / 200) * 0.1 : 0;
      mat.opacity += (target - mat.opacity) * 0.1;
    },
  };
}

function buildDrip(ctx: SceneCtx, color: string): SceneObject {
  const group = new THREE.Group();
  group.position.y = 0.35;
  ctx.scene.add(group);

  const head = wire(new THREE.CylinderGeometry(0.42, 0.16, 0.45, 14), OFF);
  const nozzle = wire(new THREE.CylinderGeometry(0.16, 0.24, 0.28, 12), OFF);
  head.position.y = 0.55;
  nozzle.position.y = 0.25;
  group.add(head, nozzle);

  const count = 60;
  const arr = new Float32Array(count * 3);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);

  const reset = (i: number) => {
    arr[i * 3] = 0;
    arr[i * 3 + 1] = 0.1;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    vx[i] = (Math.random() - 0.5) * 1.5;
    vy[i] = -(0.4 + Math.random() * 0.6);
  };

  for (let i = 0; i < count; i++) {
    reset(i);
    arr[i * 3 + 1] = Math.random() * 1.6 - 1.4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.16,
      transparent: true,
      opacity: 0,
    }),
  );
  group.add(points);

  return {
    mats: [head.material, nozzle.material],
    update: (dt, active) => {
      const pos = points.geometry.attributes.position.array as Float32Array;
      const mat = points.material;
      mat.opacity += ((active ? 1 : 0) - mat.opacity) * 0.12;
      if (!active) return;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += vx[i] * dt;
        pos[i * 3 + 1] += vy[i] * dt;
        vy[i] -= 2.2 * dt;
        if (pos[i * 3 + 1] < -1.7) reset(i);
      }
      points.geometry.attributes.position.needsUpdate = true;
    },
  };
}

function buildHorn(ctx: SceneCtx, color: string): SceneObject {
  const group = new THREE.Group();
  const bell = new THREE.Group();
  const mats: SceneObject["mats"] = [];
  ctx.scene.add(group);
  group.add(bell);

  const dome = wire(
    new THREE.SphereGeometry(0.8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    OFF,
  );
  const rim = wire(new THREE.TorusGeometry(0.8, 0.06, 8, 32), OFF);
  const top = wire(new THREE.SphereGeometry(0.12, 10, 10), OFF);
  const clapper = wire(new THREE.SphereGeometry(0.16, 10, 10), OFF);
  dome.position.y = 0.1;
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.1;
  top.position.y = 0.95;
  clapper.position.y = -0.35;
  bell.add(dome, rim, top, clapper);
  mats.push(dome.material, rim.material, top.material, clapper.material);

  const handle = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0, 1.25, 0),
    ]),
    new THREE.LineBasicMaterial({ color: OFF }),
  );
  bell.add(handle);
  mats.push(handle.material);

  const waves: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 3; i++) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.04, 6, 36),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
      }),
    );
    wave.rotation.x = Math.PI / 2.4;
    group.add(wave);
    waves.push(wave);
  }

  return {
    mats,
    update: (_dt, active) => {
      bell.rotation.z = active ? Math.sin(performance.now() / 45) * 0.22 : bell.rotation.z * 0.85;
      clapper.position.x = active ? Math.sin(performance.now() / 45) * 0.18 : clapper.position.x * 0.85;
      waves.forEach((wave, i) => {
        if (active) {
          const s = (performance.now() / 650 + i / 3) % 1;
          wave.scale.setScalar(0.5 + s * 2.2);
          wave.material.opacity = (1 - s) * 0.85;
          return;
        }
        wave.material.opacity += (0 - wave.material.opacity) * 0.1;
      });
    },
  };
}

function buildObject(type: ActType, ctx: SceneCtx, color: string): SceneObject {
  if (type === "fan") return buildFan(ctx);
  if (type === "bulb") return buildBulb(ctx, color);
  if (type === "drip") return buildDrip(ctx, color);
  return buildHorn(ctx, color);
}

function nowTime(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function ActuatorCard({
  def,
  active,
  manual,
  onToggle,
  extraControls,
}: {
  def: ActDef;
  active: boolean;
  manual: boolean;
  onToggle: (def: ActDef) => void;
  extraControls?: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const objectRef = useRef<SceneObject | null>(null);

  useEffect(() => {
    activeRef.current = active;
    const object = objectRef.current;
    if (!object) return;
    const color = active ? def.color : OFF;
    object.mats.forEach((mat) => {
      mat.color.set(color);
    });
  }, [active, def.color]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const ctx = initScene(stage);
    const object = buildObject(def.type, ctx, def.color);
    objectRef.current = object;

    let raf = 0;
    let last = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      object.update(dt, activeRef.current);
      ctx.ren.render(ctx.scene, ctx.cam);
    };
    loop();

    const syncSize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      ctx.cam.aspect = w / h;
      ctx.cam.updateProjectionMatrix();
      ctx.ren.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      object.mats.forEach((mat) => mat.dispose());
      ctx.ren.forceContextLoss();
      ctx.ren.dispose();
      if (ctx.ren.domElement.parentNode === stage) {
        stage.removeChild(ctx.ren.domElement);
      }
      objectRef.current = null;
    };
  }, [def.color, def.type]);

  const buttonText = def.id === "riego"
    ? active
      ? "Apagar riego"
      : "Encender Riego"
    : def.id === "alarma"
    ? active
      ? "Silenciar"
      : "Silenciado"
    : active
      ? "Apagar"
      : "Encender";
  const disablePrimary = def.id === "alarma" && !active;

  return (
    <article
      className={`min-w-0 rounded-2xl border border-edge bg-panel p-4 transition ${
        manual ? "" : "opacity-45 saturate-50"
      }`}
    >
      <div
        ref={stageRef}
        className="h-38 sm:h-40 rounded-xl bg-[radial-gradient(circle_at_50%_40%,#111_0%,#060606_70%)] overflow-hidden transition-shadow"
        style={{
          boxShadow: active ? `inset 0 0 40px -10px ${def.color}66` : undefined,
        }}
      />
      <div className="flex items-center justify-between gap-3 mt-4">
        <h3 className="font-display text-base font-bold">{def.name}</h3>
        <span
          className="font-mono text-[11px]"
          style={{ color: active ? def.color : DIM }}
        >
          {active ? "ON" : "OFF"}
        </span>
      </div>
      {extraControls}
      <button
        onClick={() => onToggle(def)}
        disabled={disablePrimary}
        className="mt-4 w-full rounded-xl border border-edge bg-[#131316] px-3 py-2.5 text-[13px] font-semibold transition hover:border-[#34343a] disabled:cursor-not-allowed"
        style={{ borderColor: active ? def.color : undefined }}
      >
        {buttonText}
      </button>
    </article>
  );
}

export default function ActuadoresViz3D({
  on,
  onEvent,
}: {
  on: Record<string, boolean>;
  onEvent: (o: string, e: string, v: string, c: StateColor) => void;
}) {
  const { actuators, connectionState, sendCommand } = useMqttDashboard();
  const [manual, setManual] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const [localStates, setLocalStates] = useState<Partial<Record<ActKey, boolean>>>({});
  const [localRiegoStates, setLocalRiegoStates] = useState<Partial<Record<RiegoTarget, boolean>>>({});
  const [riegoTarget, setRiegoTarget] = useState<RiegoTarget>("general");

  const liveRiegoStates = useMemo<Record<RiegoTarget, boolean>>(
    () => ({
      general: on.riego ?? actuators.riego,
      area1: actuators.riego_area1,
      area2: actuators.riego_area2,
    }),
    [
      actuators.riego,
      actuators.riego_area1,
      actuators.riego_area2,
      on.riego,
    ],
  );

  const states = useMemo<Record<ActKey, boolean>>(
    () => ({
      riego: Boolean(
        (localRiegoStates.general ?? liveRiegoStates.general)
          || (localRiegoStates.area1 ?? liveRiegoStates.area1)
          || (localRiegoStates.area2 ?? liveRiegoStates.area2)
      ),
      vent: localStates.vent ?? on.vent ?? actuators.ventilador,
      luces: localStates.luces ?? on.luz ?? actuators.luces,
      alarma: localStates.alarma ?? on.alarma ?? actuators.alarma,
    }),
    [
      actuators.alarma,
      actuators.luces,
      actuators.ventilador,
      liveRiegoStates,
      localRiegoStates,
      localStates.alarma,
      localStates.luces,
      localStates.vent,
      on.alarma,
      on.luz,
      on.vent,
    ],
  );

  const addLog = (payload: string, color: string) => {
    setLog((prev) =>
      [{ time: nowTime(), topic: CONTROL_TOPIC, payload, color }, ...prev].slice(0, 12),
    );
  };

  const publish = (payload: string, color: string) => {
    sendCommand(payload);
    addLog(payload, color);
  };

  const setMode = (nextManual: boolean) => {
    setManual(nextManual);
    const payload = nextManual
      ? COMMANDS.CAMBIAR_MODO_MANUAL
      : COMMANDS.CAMBIAR_MODO_AUTOMATICO;
    publish(payload, nextManual ? "#2D9BFF" : "#ffffff");
    onEvent("comando", "Modo de operación", nextManual ? "MANUAL" : "AUTO", nextManual ? "info" : "white");
  };

  const resetLocalState = () => {
    setLocalStates({});
    setLocalRiegoStates({});
    addLog("RESTABLECER_VISTA", "#ffffff");
    onEvent("dashboard", "Restablecer vista", "MQTT", "white");
  };

  const toggle = (def: ActDef) => {
    if (!manual) setMode(true);
    if (def.id === "riego") {
      if (states.riego) {
        stopRiego();
        return;
      }
      startRiego(riegoTarget);
      return;
    }

    const active = states[def.id];
    const payload = def.id === "alarma"
      ? def.offCommand
      : active
        ? def.offCommand
        : def.onCommand ?? def.offCommand;
    setLocalStates((prev) => ({
      ...prev,
      [def.id]: def.id === "alarma" ? false : !active,
    }));
    publish(payload, active ? DIM : def.color);
    onEvent("comando", def.name, payload, active ? "dim" : "white");
  };

  const startRiego = (target: RiegoTarget) => {
    if (!manual) setMode(true);
    const def = ACTS[0];
    const riegoTargetDef = RIEGO_TARGETS.find((item) => item.id === target);
    const payload = riegoTargetDef?.command ?? COMMANDS.ACTIVAR_RIEGO;
    setLocalRiegoStates({
      general: target === "general",
      area1: target === "general" || target === "area1",
      area2: target === "general" || target === "area2",
    });
    publish(payload, def.color);
    onEvent("comando", `Riego ${riegoTargetDef?.label ?? "General"}`, payload, "white");
  };

  const selectRiegoTarget = (target: RiegoTarget) => {
    setRiegoTarget(target);
    if (states.riego) startRiego(target);
  };

  const stopRiego = () => {
    if (!manual) setMode(true);
    setLocalRiegoStates({ general: false, area1: false, area2: false });
    publish(COMMANDS.DESACTIVAR_RIEGO, DIM);
    onEvent("comando", "Riego", COMMANDS.DESACTIVAR_RIEGO, "dim");
  };

  const connected = connectionState === "connected";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-edge bg-panel px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-bold">Control remoto</h3>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                connected ? "border-ok/40 text-ok" : "border-edge text-dim2"
              }`}
            >
              MQTT · {connected ? "EN LINEA" : connectionState.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-dim2">
            Modo de operación:{" "}
            <span className="font-medium text-white">
              {manual ? "Manual" : "Automático"}
            </span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-dim2">
            {manual
              ? "control habilitado"
              : "en Automático el sistema decide - cambiá a Manual para controlar"}
          </p>
        </div>

        <div className="sm:ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-xl border border-edge">
            <button
              onClick={() => setMode(false)}
              className={`px-4 py-2 text-[13px] transition ${
                !manual ? "bg-white font-semibold text-ink" : "text-dim hover:text-white"
              }`}
            >
              Automático
            </button>
            <button
              onClick={() => setMode(true)}
              className={`px-4 py-2 text-[13px] transition ${
                manual ? "bg-white font-semibold text-ink" : "text-dim hover:text-white"
              }`}
            >
              Manual
            </button>
          </div>
          <button
            onClick={resetLocalState}
            className="rounded-xl border border-edge px-4 py-2 text-[13px] text-dim transition hover:border-[#34343a] hover:text-white"
          >
            Restablecer vista
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
        {ACTS.map((def) => (
          <ActuatorCard
            key={def.id}
            def={def}
            active={states[def.id]}
            manual={manual}
            onToggle={toggle}
            extraControls={
              def.id === "riego" ? (
                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-edge text-[11px]">
                  {RIEGO_TARGETS.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => selectRiegoTarget(target.id)}
                      className={`px-2 py-2 font-semibold transition ${
                        riegoTarget === target.id
                          ? "bg-info text-ink"
                          : "text-dim hover:text-white"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              ) : null
            }
          />
        ))}
      </div>

      <div className="rounded-2xl border border-edge bg-panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-edge px-5 py-3">
          <h3 className="font-display text-base font-bold">Comandos publicados</h3>
          <span className="ml-auto font-mono text-[11px] text-dim2">
            topic · {CONTROL_TOPIC}
          </span>
        </div>
        <div className="max-h-56 overflow-auto py-1 font-mono text-[12px]">
          {log.length === 0 ? (
            <p className="px-5 py-5 text-center text-dim2">Sin comandos publicados</p>
          ) : (
            log.map((item, index) => (
              <div
                key={`${item.time}-${item.payload}-${index}`}
                className="grid grid-cols-[72px_1fr_auto] gap-3 border-b border-[#161619] px-5 py-2 last:border-b-0"
              >
                <span className="text-dim2">{item.time}</span>
                <span className="min-w-0 truncate text-dim">{item.topic}</span>
                <span className="font-semibold" style={{ color: item.color }}>
                  {item.payload}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
