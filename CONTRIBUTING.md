# 🤝 Cómo trabajamos en este repo — Grupo 15

Esta guía resume cómo trabajamos en el repositorio. Seguir estas reglas nos mantiene organizados y evita conflictos al integrar el trabajo de todos.

---

## 📑 Contenido

- [Lo esencial](#-lo-esencial)
- [Trabajamos con ramas](#-trabajamos-con-ramas)
- [Cómo escribir los commits](#-cómo-escribir-los-commits)
- [Qué hacer según tu parte](#-qué-hacer-según-tu-parte)
- [Pull Requests](#-pull-requests)
- [La parte de ARM64 (ojo aquí)](#-la-parte-de-arm64-ojo-aquí)
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
git checkout -b feat/claudia

# 3. Trabajar y commitear (separá invernadero y ARM64 en commits distintos)
git add iot_program/sensors/suelo_area1.py
git commit -m "feat(area-1): lectura del sensor de humedad de suelo"

git add arm64/modulo_1_media.s
git commit -m "feat(arm64): media ponderada en modulo_1"

# 4. Subir la rama
git push origin feat/claudia
```

> Aunque sea una sola rama, usá la etiqueta del commit para que se vea qué es qué: `feat(area-1): ...` para tu parte del invernadero y `feat(arm64): ...` para tu módulo. Así el historial queda ordenado y se distingue cada aporte.

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
- No subir código que no compila.

---

## 🧭 Qué hacer según tu parte

Antes de empezar, leé el README de la carpeta donde vas a trabajar:

| Parte                 | Leer primero            | Qué se hace ahí                                   |
| --------------------- | ----------------------- | ------------------------------------------------- |
| Sensores y actuadores | `iot_program/README.md` | Implementar hardware, probar MQTT y guardar datos |
| Backend               | `server/README.md`      | API, MongoDB, históricos y flujo ARM64            |
| Dashboard             | `client/README.md`      | Interfaz web y consumo de API/MQTT                |
| ARM64                 | `arm64/README.md`       | Módulos `.s`, Makefile, GDB y resultados `.txt`   |

### Sensores y actuadores

El trabajo de hardware está en `iot_program/`.

Cada quien trabaja su archivo individual. Ejemplos:

```text
iot_program/sensors/suelo_area1.py
iot_program/sensors/gas.py
iot_program/actuators/riego_area1.py
iot_program/actuators/ventilador.py
```

Después de implementar:

- Mantener nombres de clases y métodos que ya usa el manager.
- Ejecutar `python main.py` desde `iot_program/`.
- Probar con MQTTX usando `invernadero/#`.
- Revisar que salgan lecturas en `invernadero/sensores/*`.
- Revisar que salgan estados en `invernadero/actuadores/*`.
- Si hay MongoDB configurado, revisar `sensor_readings` y `actuator_logs`.

Para probar hardware real:

```env
SIMULATION_MODE=false
```

Con eso `main.py` usa:

```text
iot_program/sensors/raspberry_sensors.py
iot_program/actuators/raspberry_actuators.py
```

Esos archivos juntan todos los sensores y actuadores reales. Normalmente no los toca cada integrante; se tocan solo si hace falta pasar pines, buses o configuración especial.

### Backend

El backend no implementa sensores ni actuadores. Su trabajo es:

- consultar MongoDB,
- exponer endpoints,
- generar `data/lecturas.csv`,
- ejecutar ARM64,
- leer resultados de `resultados_arm64/`.

Leer `server/README.md` antes de tocar endpoints o servicios.

### ARM64

Cada quien crea y sube solo su módulo `.s`. No subir módulos de otro integrante.

Todos usan `arm64/utils.s` como apoyo común. Si necesitan cambiar `utils.s`, avisen antes porque puede afectar a todos.

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
