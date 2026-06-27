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
