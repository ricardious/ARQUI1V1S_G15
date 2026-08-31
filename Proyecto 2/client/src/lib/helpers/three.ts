import * as THREE from "three";

/** Dispositivo táctil aproximado: bajamos pixelRatio y desactivamos antialias. */
export const IS_MOBILE =
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Crea un WebGLRenderer con pixelRatio y antialias adaptados al dispositivo.
 *  En móvil cap a 1.5 y sin MSAA; en escritorio cap a 2 con antialias. */
export function makeRenderer(
  opts?: THREE.WebGLRendererParameters,
): THREE.WebGLRenderer {
  const ren = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !IS_MOBILE,
    ...opts,
  });
  ren.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  return ren;
}

/** Avisa cuando `el` entra o sale del viewport. Devuelve la función de limpieza. **/
export function observeVisibility(
  el: Element,
  onChange: (visible: boolean) => void,
): () => void {
  const io = new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting),
    { threshold: 0.01 },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Libera geometrías y materiales de todos los objetos del árbol (dispose). */
export function disposeScene(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Pool de miniaturas 3D — un único contexto WebGL para muchos thumbnails.
 *
 * Los navegadores limitan los contextos WebGL simultáneos (~16 en Chrome).
 * Cuando se supera el límite, el navegador descarta los contextos más viejos
 * y esos canvas quedan en blanco. Para evitarlo, todas las miniaturas
 * comparten un solo WebGLRenderer offscreen: en cada frame se renderiza cada
 * escena y se copia el resultado al canvas 2D propio de la miniatura con
 * drawImage. Los contextos 2D no tienen ese límite.
 * ──────────────────────────────────────────────────────────────────────── */

/** Una miniatura registrada en el pool compartido. */
export interface ThumbItem {
  /** Canvas 2D visible en el DOM donde se copia el render. */
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** Tamaño en píxeles CSS (sin pixelRatio). */
  w: number;
  h: number;
  /** Actualiza la escena antes de renderizar (p. ej. rotación). */
  update: () => void;
  /** Si está fuera del viewport se omite para ahorrar GPU. */
  visible: boolean;
}

const POOL_RATIO = () =>
  typeof window === "undefined"
    ? 1
    : Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2);

let sharedRenderer: THREE.WebGLRenderer | null = null;
const thumbs = new Set<ThumbItem>();
let poolRaf = 0;

function getSharedRenderer(): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !IS_MOBILE,
      // Necesario para poder copiar el buffer con drawImage de forma fiable.
      preserveDrawingBuffer: true,
    });
    sharedRenderer.setPixelRatio(POOL_RATIO());
  }
  return sharedRenderer;
}

function poolLoop(): void {
  poolRaf = requestAnimationFrame(poolLoop);
  if (thumbs.size === 0) return;
  const ren = getSharedRenderer();
  const ratio = ren.getPixelRatio();
  for (const t of thumbs) {
    if (!t.visible || t.w === 0 || t.h === 0) continue;
    t.update();
    const dw = Math.floor(t.w * ratio);
    const dh = Math.floor(t.h * ratio);
    // Redimensiona el renderer compartido solo si cambió el tamaño objetivo.
    if (ren.domElement.width !== dw || ren.domElement.height !== dh) {
      ren.setSize(t.w, t.h, false);
    }
    ren.render(t.scene, t.camera);
    t.ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
    t.ctx.drawImage(ren.domElement, 0, 0, t.canvas.width, t.canvas.height);
  }
}

/** Registra una miniatura en el pool compartido. Devuelve la función de baja. */
export function registerThumb(item: ThumbItem): () => void {
  thumbs.add(item);
  if (!poolRaf) poolLoop();
  return () => {
    thumbs.delete(item);
    if (thumbs.size === 0 && poolRaf) {
      cancelAnimationFrame(poolRaf);
      poolRaf = 0;
    }
  };
}
