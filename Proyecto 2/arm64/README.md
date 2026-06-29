# Grupo 15 · ARM64

Código ensamblador **ARM64/AArch64** que procesa datos reales del invernadero. Implementa los **dos componentes de la Fase 2** y comparte la biblioteca común `utils.s`. Todo se calcula en ARM64, con **enteros** y **divisiones truncadas** (sin punto flotante).

| Componente               | Archivo      | Entrada                                   | Salida                                   |
| ------------------------ | ------------ | ----------------------------------------- | ---------------------------------------- |
| **Motor en vivo**        | `motor.s`    | Una línea por **stdin**                   | Decisión estructurada por **stdout**     |
| **Analizador histórico** | `modulo_*.s` | `archivo inicio fin columna` (argumentos) | Archivo `.txt` en `../resultados_arm64/` |

---

## ▸ Estructura de la carpeta

```text
arm64/
├── motor.s            # Motor de decisión EN VIVO (stdin -> stdout)
├── motor/             # Submódulos del motor (array, promedio, tendencia, amplitud,
│                      #   temperatura, luz, gas, soil1, soil2, prioridades)
│
│   # Analizador histórico — módulos existentes
├── modulo_1_media.s         # media        (Claudia)
├── modulo_2_varianza.s      # varianza     (Elizabeth)
├── modulo_3_anomalias.s     # anomalías    (Kevin)
├── modulo_4_prediccion.s    # predicción   (Oswaldo)
├── modulo_5_tendencia.s     # tendencia    (Ricardo)
│
│   # Rutinas nuevas Fase 2 — pendientes
├── modulo_1_rmse.s          # RMSE                 (Claudia)
├── modulo_2_regresion.s     # regresión            (Ricardo)
├── modulo_3_prediccion.s    # predicción regresión (Oswaldo)
├── modulo_4_integral_error.s# integral del error   (Elizabeth)
├── modulo_5_derivada_local.s# derivada local       (Kevin)
│
├── utils.s            # Biblioteca común (archivo de includes)
├── utils/             # Submódulos de utils (ver más abajo)
├── Makefile           # Compilación y ejecución
└── build/             # Objetos y binarios generados (make)
```

---

## ◆ Componente A · Motor en vivo (`motor.s`)

Python envía la lectura actual por **stdin**, ARM64 actualiza su historial interno, calcula indicadores y devuelve una decisión por **stdout**.

- **Entrada (stdin):** `TEMP,HUM_AIRE,SOIL1,SOIL2,LUZ,GAS,MODO` (ej. `31,68,34,41,280,160,0`; `MODO` = `0` automático / `1` manual).
- **Historial:** un arreglo por sensor (`temp_buffer`, `hum_buffer`, `soil1_buffer`, `soil2_buffer`, `luz_buffer`, `gas_buffer`).
- **Indicadores:** promedio reciente, tendencia acumulada y amplitud reciente, sobre el historial completo.
- **Decisión:** una acción por lectura según prioridad — `ALARM_ON` › `RIEGO_1_ON` › `RIEGO_2_ON` › `LIGHT_ON` › `FAN_ON` › `LED_GREEN` › `NO_ACTION`.
- **Salida (stdout):** línea con `ACTION`, `TARGET`, `RISK`, `REASON`, `VALUE`, `INDICATOR`, `STATUS`. Ante entrada inválida responde `STATUS=ERROR`.

Los **umbrales de referencia** (`TEMP_ALTA`, `LUZ_BAJA`, `SOIL_BAJO`, `GAS_ALTO`, `GAS_AMP_ALTA`) están en la sección `.data` de `motor.s`. Los submódulos `motor/<sensor>.s` aplican la lógica por sensor y `motor/prioridades.s` resuelve la acción final.

---

## ∿ Componente B · Analizador histórico (`modulo_*.s`)

Cada módulo lee una **columna** dentro de un **rango de líneas** y la interpreta como serie temporal (eje Y = valores; eje X = orden de las lecturas). Trabaja con **cantidad variable de filas**.

- **Ejecución:** `./build/<modulo> <archivo> <inicio> <fin> <columna>` — ej. `./build/modulo_5_tendencia ../data/lecturas.csv 10 80 TEMP`.
- **Validaciones** (en `utils/`): el archivo existe, `inicio >= 1`, `fin >= inicio`, ambas líneas existen, la columna existe y los valores son numéricos. Ante error genera una salida estructurada.
- **Salida:** cada módulo escribe su propio `.txt` en `../resultados_arm64/`.

### Módulos existentes

| Archivo                 | Integrante | Cálculo             | Clave de salida            |
| ----------------------- | ---------- | ------------------- | -------------------------- |
| `modulo_1_media.s`      | Claudia    | Media               | `MODULE=WEIGHTED_MEAN`     |
| `modulo_2_varianza.s`   | Elizabeth  | Varianza            | `MODULE=VARIANCE`          |
| `modulo_3_anomalias.s`  | Kevin      | Anomalías           | `MODULE=ANOMALY_DETECTION` |
| `modulo_4_prediccion.s` | Oswaldo    | Predicción          | `MODULE=PREDICTION`        |
| `modulo_5_tendencia.s`  | Ricardo    | Tendencia acumulada | `MODULE=ADVANCED_TREND`    |

### Rutinas nuevas de Fase 2

| Rutina                          | Archivo sugerido            | Integrante |
| ------------------------------- | --------------------------- | ---------- |
| RMSE respecto a un valor ideal  | `modulo_1_rmse.s`           | Claudia    |
| Regresión lineal simple         | `modulo_2_regresion.s`      | Ricardo    |
| Predicción futura por regresión | `modulo_3_prediccion.s`     | Oswaldo    |
| Integral del error (trapecio)   | `modulo_4_integral_error.s` | Elizabeth  |
| Derivada local suavizada        | `modulo_5_derivada_local.s` | Kevin      |

---

## ◫ Biblioteca común `utils.s`

`utils.s` es un archivo de includes que agrupa los submódulos de `utils/`. No debe modificarse sin coordinación, porque todos los módulos dependen de la forma en que estas rutinas usan y devuelven registros.

| Submódulo                   | Responsabilidad                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `utils/utils_data.s`        | Datos y buffers comunes (sección `.data`)                                          |
| `utils/utils_args.s`        | Leer `archivo inicio fin columna` desde `argv` (`get_column_arg`)                  |
| `utils/utils_atoi.s`        | Conversión ASCII → entero (`atoi_csv`)                                             |
| `utils/utils_file.s`        | Abrir, leer y cerrar el archivo (`open_csv_read`, `read_file`, `close_file`)       |
| `utils/utils_csv.s`         | Parseo de CSV: localizar columna por nombre, saltar encabezado y columnas          |
| `utils/utils_read_column.s` | Cargar una columna dentro del rango al stack (`read_column_to_stack`)              |
| `utils/utils_stack.s`       | Guardar y recuperar valores en el stack                                            |
| `utils/utils_math.s`        | Operaciones enteras (incluye raíz cuadrada entera truncada)                        |
| `utils/utils_write.s`       | Escribir texto y enteros (`write_all`, `write_cstr`, `write_int`, `write_newline`) |
| `utils/utils_errors.s`      | Salidas de error estructuradas                                                     |

---

## ▤ Formato del CSV

El backend genera `../data/lecturas.csv` con este encabezado:

```csv
TEMP,HUM_AIRE,SOIL1,SOIL2,LUZ,GAS,MODO
31,68,34,41,280,160,0
```

- La columna se selecciona **por nombre** desde el encabezado (`TEMP`, `HUM_AIRE`, `SOIL1`, `SOIL2`, `LUZ`, `GAS`).
- El archivo puede tener **cantidad variable de filas**; el analizador procesa solo el rango `[inicio, fin]`.
- ARM64 trabaja únicamente con enteros no negativos; los decimales vienen truncados desde el backend.
- Python no calcula los resultados ARM64.

---

## ▶ Compilación y ejecución

Desde `arm64/`:

```bash
make all                # compila motor + analizador histórico (linkea con utils.s)
make motor              # solo el motor en vivo
make tendencia          # solo un módulo del analizador

# Motor en vivo (una línea por stdin)
echo "31,68,34,41,280,160,0" | ./build/motor

# Analizador histórico: archivo, línea inicial, línea final y columna
make run-tendencia LEC=../data/lecturas.csv INI=10 FIN=80 COL=TEMP
make run-regresion LEC=../data/lecturas.csv INI=1  FIN=30 COL=TEMP
make run-all            # ejecuta los analizadores con parámetros por defecto

make clean
```

Variables del Makefile: `LEC` (archivo), `INI`/`FIN` (rango de líneas) y `COL` (columna).

---

## ◈ Depuración con GDB

Los binarios ARM64 corren sobre x86 con **QEMU**, que abre un _gdbstub_, y se depuran con **gdb-multiarch** conectándose a ese puerto. Se usan **dos terminales en paralelo**: una levanta el emulador y otra controla el depurador. El procedimiento es el mismo para cualquier módulo (cambia el binario por el tuyo).

### Terminal 1 — Preparación y emulación (QEMU)

Prepara el entorno y deja el emulador esperando la conexión.

1. **Compilar el módulo:**
   ```bash
   make regresion
   ```
2. **Levantar QEMU** en el puerto `1234`, pasándole el ejecutable y sus argumentos (archivo de datos, inicio, fin y columna):
   ```bash
   qemu-aarch64 -g 1234 ./build/modulo_2_regresion ../data/lecturas.csv 1 30 GAS
   ```
   _(La terminal quedará en espera)._

### Terminal 2 — Depuración (GDB)

Abre otra terminal en la misma carpeta para conectarte al proceso anterior y controlar la ejecución.

1. **Iniciar el depurador:**
   ```bash
   gdb-multiarch ./build/modulo_2_regresion
   ```
2. **Conectar al emulador remoto** (dentro de GDB):
   ```gdb
   target remote localhost:1234
   ```
3. **Configurar descargas (debuginfod):** si GDB pregunta si deseas habilitar la descarga automática de símbolos, selecciona `n` y **Enter**.
4. **Establecer el punto de interrupción** en la entrada del programa:
   ```gdb
   break _start
   ```
5. **Avanzar paso a paso** e inspeccionar el estado:
   ```gdb
   stepi              # una instrucción (también sirve 's')
   info registers     # registros
   x/16x $sp          # memoria del stack
   continue           # seguir hasta el final
   ```
6. **Finalizar el debuggeo:** escribe `quit` y confirma con `y`.

> Repite el procedimiento por cada módulo que defiendas (`modulo_#_<nombre>`).
