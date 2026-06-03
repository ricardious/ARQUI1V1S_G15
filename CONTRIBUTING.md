# 🤝 Cómo trabajamos en este repo — Grupo 15

Esta guía resume cómo trabajamos en el repositorio. Seguir estas reglas nos mantiene organizados y evita conflictos al integrar el trabajo de todos.

---

## 📑 Contenido

- [Lo esencial](#-lo-esencial)
- [Trabajamos con ramas](#-trabajamos-con-ramas)
- [Cómo escribir los commits](#-cómo-escribir-los-commits)
- [Pull Requests](#-pull-requests)
- [La parte de ARM64 (ojo aquí)](#-la-parte-de-arm64-ojo-aquí)
- [Qué NO subir](#-qué-no-subir)
- [Configurar Git (solo si hace falta)](#-configurar-git-solo-si-hace-falta)

---

## ✅ Lo esencial

- Nada se sube directo a `main`. Todo entra por una rama y un Pull Request.
- Cada quien hace sus propios commits desde su propia cuenta de GitHub.
- Cada quien sube su propio módulo ARM64. El de otro, no.
- Commits pequeños y seguido. Un commit gigante el último día no le gusta a nadie.

---

## 🌿 Trabajamos con ramas

Una rama por tarea, partiendo siempre de `main` actualizado.

- `main` → la versión estable. Solo entra por Pull Request.
- Tu rama → con un nombre que diga qué estás haciendo.

### Cómo nombrar la rama

```
feat/<área>-<descripción-corta>
```

Estas son las ramas que le corresponden a cada quien:

| Integrante | Rama de su parte IoT          | Rama de su módulo ARM64 |
| ---------- | ----------------------------- | ----------------------- |
| Claudia    | `feat/area-cultivo-1`         | `feat/arm64-media`      |
| Elizabeth   | `feat/area-cultivo-2`         | `feat/arm64-varianza`   |
| Oswaldo    | `feat/centro-control`         | `feat/arm64-prediccion` |
| Kevin      | `feat/sensores-ambientales`   | `feat/arm64-anomalias`  |
| Ricardo  | `feat/mqtt-mongodb-dashboard` | `feat/arm64-tendencia`  |

Otros prefijos según el caso: `fix/` para corregir bugs, `docs/` para documentación, `chore/` para configuración o limpieza.

### Los pasos

```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Crear tu rama
git checkout -b feat/arm64-media

# 3. Trabajar y commitear
git add .
git commit -m "feat(arm64): suma total y suma de pesos en modulo_1"

# 4. Subir la rama
git push origin feat/arm64-media
```

---

## 📝 Cómo escribir los commits

Formato:

```
<tipo>(<área>): <qué hiciste, corto y en presente>
```

Tipos: `feat` (algo nuevo), `fix` (corrección), `docs` (documentación), `chore` (config o limpieza), `refactor` (reordenar sin cambiar lo que hace), `test` (pruebas).

Ejemplos:

```
feat(sensores): lectura de DHT22 desde GPIO
feat(arm64): conversión ASCII a entero en utils.s
fix(riego): evitar activación con suelo saturado
docs(readme): agregar diagrama de estados
```

Reglas mínimas:

- En español, claro y específico.
- Un commit equivale a un cambio lógico. Nada de "varios cambios" ni el clásico "asdf".
- No subir a `main` código que no compila.

---

## 🔀 Pull Requests

Cuando tu rama esté lista:

1. Abrí un Pull Request hacia `main` en GitHub.
2. Título claro y una breve descripción de qué hace el cambio.
3. Que otro integrante lo revise antes del merge.
4. Si hay conflictos, se resuelven en tu rama, no en `main`.
5. Después del merge, podés borrar la rama.

Si vas a tocar `main.py` o algún archivo que usamos todos, avisá en el grupo antes para no chocar.

---

## ⚙️ La parte de ARM64 (ojo aquí)

Es donde más fácil se pierden puntos, así que vale la pena tenerlo claro. Cada quien:

- Sube su propio `.s` con commits desde su cuenta.
- Tiene que poder explicar su módulo: algoritmo, registros, ciclos, saltos y memoria.
- Usa la biblioteca común `utils.s` (la dejamos lista primero; queda a cargo de Ricardo como encargado de integración).
- Se asegura de que su módulo compile, corra y genere su `.txt`.
- Guarda su evidencia de depuración con GDB.

Lo que no se hace:

- Que una sola persona suba todos los `.s`.
- Calcular en Python lo que le corresponde a ARM64.

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
