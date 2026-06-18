# 🤝 Cómo trabajamos en este repo — Grupo 15

Esta guía resume cómo trabajamos en el repositorio. Seguir estas reglas nos mantiene organizados y evita conflictos al integrar el trabajo de todos.

---

## 📑 Contenido

- [Lo esencial](#-lo-esencial)
- [Trabajamos con ramas](#-trabajamos-con-ramas)
- [Cómo escribir los commits](#-cómo-escribir-los-commits)
- [Pull Requests](#-pull-requests)
- [Qué NO subir](#-qué-no-subir)
- [Configurar Git (solo si hace falta)](#-configurar-git-solo-si-hace-falta)

---

## ✅ Lo esencial

- Usamos **Git Flow** (simplificado): `main` para entregas estables, `develop` para integrar el trabajo, y una rama por persona.
- Nada se sube directo a `main` ni a `develop`. Todo entra por una rama propia y un Pull Request.
- Cada quien hace sus propios commits desde su propia cuenta de GitHub.
- Cada quien sube su propio módulo ARM64. El de otro, no.
- Commits pequeños y seguido. Un commit gigante el último día no le gusta a nadie.

---

## 🌿 Trabajamos con ramas

Seguimos el modelo **Git Flow** en su versión simplificada. Tenemos dos ramas permanentes y una rama por integrante.

- `main` → solo versiones estables y entregables. Casi no se toca; recibe los cambios desde `develop`.
- `develop` → rama de integración. Aquí se junta el trabajo de todos.
- Tu rama → lleva tu nombre, sale de `develop` y vuelve a `develop` por Pull Request.

```text
feat/claudia ─┐
feat/kevin   ─┤→  develop  ──(al entregar)──→  main
feat/...     ─┘
```

Cada integrante trabaja en **una sola rama propia**. En esa rama va tanto su parte del invernadero como su módulo ARM64; lo que diferencia una cosa de otra es la etiqueta del commit (ver más abajo).

### Cómo nombrar la rama

```
feat/<tu-nombre>
```

Estas son las ramas que le corresponden a cada quien:

| Integrante | Su rama          | Qué incluye                                           |
| ---------- | ---------------- | ----------------------------------------------------- |
| Claudia    | `feat/claudia`   | Área de cultivo 1 + módulo media ponderada            |
| Elizabeth  | `feat/elizabeth` | Área de cultivo 2 + módulo varianza                   |
| Oswaldo    | `feat/oswaldo`   | Centro de control + módulo predicción lineal          |
| Kevin      | `feat/kevin`     | Sensores ambientales y ventilación + módulo anomalías |
| Ricardo    | `feat/ricardo`   | MQTT, MongoDB y dashboard + módulo tendencia          |

Otros prefijos según el caso: `fix/` para corregir bugs, `docs/` para documentación, `chore/` para configuración o limpieza.

### Los pasos

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear tu rama desde develop (solo la primera vez)
git checkout -b feat/tu-nombre

# 3. Trabajar y commitear
git add ruta/a/tu/archivo.py
git commit -m "feat(scope): descripcion breve de lo que hiciste"

# 4. Subir la rama
git push origin feat/tu-nombre
```

> El scope del commit ayuda a identificar la parte: `feat(sensores): ...`, `feat(arm64): ...`, `fix(riego): ...`, etc.

---

## 📝 Cómo escribir los commits

Formato:

```
<tipo>(<área>): <qué hiciste, corto y en presente>
```

Tipos: `feat` (algo nuevo), `fix` (corrección), `docs` (documentación), `chore` (config o limpieza), `refactor` (reordenar sin cambiar lo que hace), `test` (pruebas).

Ejemplos:

```
feat(sensores): lectura desde GPIO
feat(arm64): implementar conversion a entero
fix(actuadores): evitar activacion con valor fuera de rango
docs: agregar diagrama de flujo
chore: actualizar dependencias
```

Reglas mínimas:

- En español, claro y específico.
- Un commit equivale a un cambio lógico. Nada de "varios cambios" ni el clásico "asdf".
- No subir código que no compila.

---

## 🔀 Pull Requests

Cuando tu rama esté lista:

1. Abrí un Pull Request hacia `develop` (no hacia `main`) en GitHub.
2. Título claro y una breve descripción de qué hace el cambio.
3. Que otro integrante lo revise antes del merge.
4. Si hay conflictos, se resuelven en tu rama, no en `develop`.
5. Después del merge, podés borrar la rama.

`main` solo recibe un merge desde `develop` cuando hay una entrega estable lista; eso lo coordinamos en grupo.

Si vas a tocar `main.py` o algún archivo que usamos todos, avisá en el grupo antes para no chocar.

---

## 🚫 Qué NO subir

Vamos a usar un `.gitignore` para mantener el repo limpio. No suban:

- Compilados: `*.o`, `*.out`, ejecutables.
- Cosas de Python: `venv/`, `__pycache__/`.
- Las credenciales de MongoDB Atlas. Van en variables de entorno o en un `.env` ignorado, nunca en el repo.
- Archivos del editor: `.vscode/`, `.DS_Store`, etc.

Y si por accidente sube una credencial al repo: cámbienla de inmediato.

---

## 🔧 Configurar Git (solo si hace falta)

La mayoría ya lo tiene listo. Si es tu primera vez o tus commits no aparecen con tu perfil, revisá que tu identidad esté configurada con el mismo correo de GitHub:

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu-correo-de-github@ejemplo.com"
```
