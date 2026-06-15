# Módulo 3 — Detección estadística de anomalías

| Campo                          | Detalle                                           |
| ------------------------------ | ------------------------------------------------- |
| **Responsable**                | Kevin Rodrigo Sandoval Hernández                  |
| **Subsistema del invernadero** | Temperatura, humedad ambiental, gas y ventilación |
| **Archivo ARM64**              | `arm64/modulo_3_anomalias.s`                      |
| **Biblioteca común**           | `arm64/utils.s`                                   |
| **Salida**                     | `resultados_arm64/resultado_anomalias.txt`        |
| **Colección de resultados**    | `arm64_results`                                   |

---

## Explicación del algoritmo, registros, memoria y flujo

### 1. modulo_3_anomalias.s — Detección de Anomalías en ARM64

**Archivo:** `arm64/modulo_3_anomalias.s`  
**Lenguaje:** Ensamblador ARM64 (AArch64)  
**Propósito:** Leer `lecturas.csv` generado por el backend desde MongoDB, calcular media y MAD (Desviación Absoluta Media) para cada columna sensora, y detectar valores anómalos (outliers) usando el criterio `|valor - media| > MAD * 3`.

#### 1.1 Constantes (.equ — líneas 31-34)

| Constante | Valor | Propósito |
|-----------|:-----:|-----------|
| `CSV_MAX_BYTES` | 8192 | Tamaño máximo del buffer donde se carga el archivo CSV completo (~3600 bytes para 30 registros + margen) |
| `MAX_RECORDS` | 30 | Máximo de registros a procesar del CSV |
| `COLS_PER_RECORD` | 9 | Columnas por registro: ID, TEMP, HUM_AIRE, HUM_SUELO_1, HUM_SUELO_2, LUZ, GAS, RIEGO_1, RIEGO_2 |
| `MAD_MULTIPLIER` | 3 | Factor multiplicador de la MAD para calcular el umbral de anomalía |

#### 1.2 Sección .rodata — Mensajes de solo lectura (líneas 36-73)

Contiene todos los strings del programa: título, responsable, nombres de las 5 columnas (TEMP, HUM_AIRE, HUM_SUELO_1, LUZ, GAS), etiquetas ("Media:", "MAD:", "Anomalias:", "Registros:"), separador ", ", palabra "ninguno", y 3 mensajes de error (apertura CSV, lectura CSV, creación de resultado).

**Nota:** No existe `HUM_SUELO_2` porque el Área 2 de riego fue eliminada del análisis.

#### 1.3 Sección .bss — Variables no inicializadas (líneas 75-82)

| Etiqueta | Tamaño | Propósito |
|----------|:------:|-----------|
| `csv_buffer` | 8192 bytes | Almacena el contenido completo del CSV leído |
| `col_array` | 240 bytes (30×8) | Arreglo de 30 enteros de 64 bits. Almacena temporalmente los valores de una columna. Se reutiliza por cada columna |
| `anomaly_indices` | 240 bytes (30×8) | Arreglo de 30 enteros de 64 bits. Guarda los índices 1-based de registros anómalos en la columna actual. Se reutiliza |

El `.align 3` asegura que las direcciones sean múltiplos de 8 bytes, requerido por `ldr`/`str` de 64 bits en ARM64.

#### 1.4 Funciones externas (.extern — líneas 86-96)

| Función | Propósito |
|---------|-----------|
| `open_csv_read` | Abre `../data/lecturas.csv` para lectura, retorna fd en x0 |
| `open_anomalias_write` | Crea/abre archivo de resultados, retorna fd en x0 |
| `read_fd(fd, buf, size)` | Lee bytes de un fd a un buffer. Retorna bytes leídos en x0 |
| `close_fd(fd)` | Cierra un file descriptor |
| `write_cstr(fd, ptr)` | Escribe string null-terminated a un fd |
| `write_newline(fd)` | Escribe un salto de línea |
| `write_uint(fd, value)` | Convierte entero a texto ASCII y lo escribe |
| `skip_header(start, end)` | Busca el primer `\n` y retorna puntero post-encabezado |
| `load_column_30(start, end, col, dest)` | Extrae valores de una columna del CSV a un arreglo. Retorna contador |
| `count_records(start, end)` | Cuenta registros entre dos punteros |
| `exit_program(code)` | Sale del programa con código de retorno |

#### 1.5 Registros persistentes (líneas 98-109)

| Registro | Propósito | Nota |
|:--------:|-----------|------|
| x19 | fd del CSV | Se salva en stack al entrar al bucle de columnas, se reutiliza como umbral |
| x20 | Media de la columna actual | Callee-saved, sobrevive llamadas a write_cstr/write_uint |
| x21 | Puntero al fin del buffer CSV | Inicio + bytes_leídos |
| x22 | Puntero post-encabezado | Donde empiezan los datos del CSV |
| x23 | MAD de la columna actual | Reutiliza el registro que antes tenía record_count |
| x24 | fd del archivo de resultado | Donde se escribe el reporte |
| x25 | Total acumulado de anomalías | Se suma x28 al final de cada columna |
| x26 | Índice de columna actual | 1=TEMP, 2=HUM_AIRE, 3=HUM_SUELO_1, 5=LUZ, 6=GAS |
| x27 | Cantidad de valores cargados | Retornado por load_column_30 |
| x28 | Anomalías en columna actual | Contador dentro de detect_loop |
| x9-x16 | Temporales | No necesitan preservarse entre llamadas (caller-saved) |

#### 1.6 Flujo completo del programa

```
_start
  │
  ├─ open_csv_read() → x19 = fd CSV
  ├─ read_fd(x19, csv_buffer, 8192) → x0 = bytes leídos
  ├─ x20 = csv_buffer, x21 = csv_buffer + bytes_leídos
  ├─ skip_header(x20, x21) → x22 = post-header
  ├─ count_records(x22, x21) → x23 = cantidad registros
  ├─ open_anomalias_write() → x24 = fd resultado
  ├─ Escribe encabezado: título, responsable, "Registros procesados: N"
  ├─ stp x19, xzr, [sp, #-16]!  → guarda fd CSV en stack
  ├─ x25 = 0 (total anomalías), x26 = 1 (primera columna)
  │
  └─▶ column_loop ───────────────────────────────────────┐
       │                                                  │
       ├─ ¿x26 >= 7? ─── Sí ──▶ write_summary            │
       │                                                  │
       ├─ load_column_30(x22, x21, x26, col_array)        │
       ├─ x27 = cantidad de valores (si 0 → next_column)  │
       │                                                  │
       ├─ select_column_name → escribe "--- COL ---"      │
       │                                                  │
       ├─ sum_array(col_array, x27) → suma                │
       ├─ udiv media = suma / x27 → x20 = media           │
       ├─ Escribe "Media: N"                              │
       │                                                  │
       ├─ mad_sum(col_array, x27, media) → sum_desv       │
       ├─ udiv mad = sum_desv / x27 → x23 = MAD           │
       ├─ Escribe "MAD: N"                                │
       │                                                  │
       ├─ umbral = MAD * 3 → x19 = umbral                 │
       │                                                  │
       ├─ detect_loop: para cada valor en col_array       │
       │   ├─ diff = |valor - media|                      │
       │   ├─ ¿diff > umbral? → guarda índice en          │
       │   │   anomaly_indices, x28++                     │
       │   └─ siguiente valor                             │
       │                                                  │
       ├─ Escribe "Anomalias: x28"                        │
       ├─ Escribe "Registros: " + índices (o "ninguno")   │
       ├─ x25 += x28 (acumula al total)                   │
       │                                                  │
       └─ next_column:                                    │
           ├─ ¿x26 == 3? → x26 = 5 (salta Área 2)        │
           └─ sino → x26 += 1                             │
           └─ b column_loop ──────────────────────────────┘
```

#### 1.7 Lógica de salto del Área 2 (next_column)

Las columnas se procesan en orden: **1, 2, 3, salta 4, 5, 6**. Esto porque `HUM_SUELO_2` (columna 4, Área 2 de riego) ya que no se uilizara en el sistema y solo existe un área de riego 1.

```asm
next_column:
    cmp x26, #3        ; ¿se acaba de procesar columna 3 (HUM_SUELO_1)?
    b.eq skip_area2    ; sí → saltar a columna 5
    add x26, x26, #1   ; no → columna siguiente normal
    b column_loop
skip_area2:
    mov x26, #5        ; omite columna 4, va directo a LUZ
    b column_loop
```

#### 1.8 Algoritmo de detección de anomalías

```
Para cada columna sensora (TEMP, HUM_AIRE, HUM_SUELO_1, LUZ, GAS):
  1. Calcular media aritmética: μ = Σ(valor_i) / n
  2. Calcular MAD: MAD = Σ(|valor_i - μ|) / n
  3. Calcular umbral: U = MAD × 3
  4. Para cada valor_i:
     Si |valor_i - μ| > U → ANOMALÍA
```

La MAD (Mean Absolute Deviation) es diferente de la desviación estándar (módulo 2). Es más robusta contra outliers porque usa valor absoluto en vez de cuadrados.

#### 1.9 sum_array — Suma de arreglo (líneas 387-400)

```
Entrada:  x0 = base del arreglo, x1 = cantidad de elementos
Salida:   x0 = suma total
Algoritmo: Itera n elementos, carga cada entero de 64 bits con ldr [base + i*8], acumula en x11
```

#### 1.10 mad_sum — Suma de desviaciones absolutas (líneas 412-430)

```
Entrada:  x0 = base del arreglo, x1 = cantidad, x2 = media
Salida:   x0 = Σ(|valor_i - media|)
Algoritmo: Para cada elemento: subs x14, valor, media → si negativo: neg x14
           Acumula x14 en x11
```

#### 1.11 select_column_name — Mapeo columna→nombre (líneas 354-376)

```
Entrada implícita: x26 = índice de columna (1..3, 5..6)
Salida:            x1 = puntero al string del nombre
Lógica:            Cascada de cmp/b.eq. Si no coincide con 1,2,3,5 → por defecto GAS
```

#### 1.12 Manejadores de error (líneas 435-456)

| Etiqueta | Acción |
|----------|--------|
| `fail_open_csv` | Escribe error a stderr (fd=2), sale con código 1 |
| `fail_read_csv` | Cierra fd CSV, escribe error a stderr, sale con código 1 |
| `fail_open_result` | Escribe error a stderr, sale con código 1 |

---

### 2. temperatura_humedad.py — Sensor DHT11 de Temperatura y Humedad

**Archivo:** `iot_program/sensors/temperatura_humedad.py`  
**Lenguaje:** Python 3  
**Propósito:** Leer temperatura y humedad ambiente desde un sensor DHT11 conectado al GPIO4 (pin físico 7). Soporta dos librerías, cache de 2 segundos, y recuperación automática tras 8 errores consecutivos.

#### 2.1 Detección de librerías GPIO (líneas 1-26)

Se ejecuta al importar el módulo, antes de crear cualquier instancia:

| Orden | Librería | Pin | Variable |
|:-----:|----------|:---:|----------|
| 1º | `adafruit_dht` + `board` (moderna) | `board.D4` (GPIO4) | `_DHT_SENSOR_TYPE = "adafruit"` |
| 2º | `Adafruit_DHT` (legacy) | `4` (BCM GPIO4) | `_DHT_SENSOR_TYPE = "legacy"` |
| Fallback | Ninguna | — | `_GPIO_AVAILABLE = False` → simulación |

#### 2.2 Constructor __init__ (líneas 40-56)

| Atributo | Valor inicial | Propósito |
|----------|:---:|-----------|
| `_simulation` | `not _GPIO_AVAILABLE` | Si no hay librerías → modo simulación |
| `_pin` | Pin pasado o `board.D4` | GPIO donde está conectado el DHT11 |
| `_dht_device` | `None` | Objeto DHT11 de adafruit, creado solo si hay hardware |
| `_cached_temp` | 25.0 | Valor inicial de temperatura (usado si primera lectura falla) |
| `_cached_hum` | 60.0 | Valor inicial de humedad |
| `_last_read_at` | 0.0 | Timestamp de última lectura (0 = nunca) |
| `_error_count` | 0 | Contador de errores consecutivos |

- `use_pulseio=False`: Evita PulseIn que tiene problemas de timing en RPi con kernel Linux.
- Si la creación del dispositivo falla → cae a simulación.

#### 2.3 _read_sensor() — Lectura unificada (líneas 61-100)

Flujo paso a paso:

```
1. ¿Pasaron < 2 segundos desde última lectura?
   → Sí: retorna cache (evita saturar el DHT11)
   → No: continúa

2. ¿Modo simulación?
   → Sí: genera random.uniform(24.0, 36.5) °C y random.uniform(55.0, 82.0) %
   → No: continúa

3. Leer hardware:
   → Si librería legacy: Adafruit_DHT.read_retry(DHT11, pin)
   → Si librería adafruit: self._dht_device.temperature y .humidity

4. Si excepción:
   → error_count++, imprime mensaje
   → Si error_count >= 8: _recreate_device() (reinicia el sensor)

5. Si lectura exitosa (sin excepción):
   → error_count = 0 (reinicia racha de errores)

6. Actualizar cache:
   → Si temp no es None: _cached_temp = round(temp, 1)
   → Si hum no es None:  _cached_hum = round(hum, 1)
   → Si alguno es None: mantiene valor anterior del cache

7. _last_read_at = now
   → Retorna (cached_temp, cached_hum)
```

#### 2.4 _recreate_device() — Reinicio del sensor (líneas 102-117)

Solo aplica para la librería adafruit. Si los errores consecutivos llegan a 8:

1. Cierra el dispositivo actual con `self._dht_device.exit()`
2. Crea uno nuevo: `adafruit_dht.DHT11(pin, use_pulseio=False)`
3. Resetea `_error_count = 0`

Si la recreación falla, el sistema sigue funcionando con los últimos valores cacheados.

#### 2.5 Interfaz pública (líneas 122-128)

```python
leer_temperatura() → llama _read_sensor(), retorna solo temp
leer_humedad()     → llama _read_sensor(), retorna solo hum
```

Ambos métodos comparten el cache: si se llaman dentro del mismo intervalo de 2 segundos, solo la primera llamada consulta el hardware.

---

### 3. gas.py — Sensor de Gas MQ-135 vía ADS1115

**Archivo:** `iot_program/sensors/gas.py`  
**Lenguaje:** Python 3  
**Propósito:** Leer concentración de gas del sensor MQ-135 conectado al ADS1115 (ADC 16-bit) por I2C en el canal A1.

#### 3.1 Detección de I2C (líneas 1-16)

Intenta importar `board`, `busio`, `adafruit_ads1x15.ads1115` y `AnalogIn`. Si las 4 librerías existen → `_I2C_AVAILABLE = True`. Si falta alguna → modo simulación.

#### 3.2 Constructor (líneas 32-53)

| Parámetro | Default | Propósito |
|-----------|:-------:|-----------|
| `channel` | **1** | Canal A1 del ADS1115 |
| `address` | 0x48 | Dirección I2C estándar del ADS1115 |

Inicialización del hardware:
1. `busio.I2C(board.SCL, board.SDA)` — abre el bus I2C en pines SCL (pin 5) y SDA (pin 3)
2. `ADS.ADS1115(i2c, 0x48)` — instancia el ADC
3. `AnalogIn(ads, channel)` — configura el canal A1 como entrada single-ended
4. Si cualquier paso falla → `_simulation = True`

#### 3.3 read() — Lectura (líneas 58-65)

| Modo | Retorno |
|------|---------|
| Simulación | `random.randint(2800, 21800)` — rango típico del ADC de 16 bits |
| Hardware | `self._analog_in.value` — valor crudo del ADC (0-32767) |
| Error de lectura | Fallback silencioso a simulación |

El valor retornado es el valor crudo del ADC, no ppm. El `automation.py` lo compara contra `GAS_EMERGENCY_THRESHOLD = 600`.

**Nota sobre el MQ-135:** Requiere 24-48 horas de precalentamiento conectado a 5V para que el calentador interno alcance 200-300°C. Antes de eso, las lecturas son ~0 o muy bajas.

---

### 4. ventilador.py — Control de Ventilador vía Relé GPIO

**Archivo:** `iot_program/actuators/ventilador.py`  
**Lenguaje:** Python 3  
**Propósito:** Controlar un ventilador conectado a un módulo relé mediante GPIO17 (pin físico 11 de la Raspberry Pi, Canal 2 del relé CA58/CP96-2).

#### 4.1 Detección de GPIO (líneas 1-11)

Intenta importar `RPi.GPIO`. Si existe → `_GPIO_AVAILABLE = True`. Captura tanto `ImportError` (no instalado) como `RuntimeError` (no ejecutándose en RPi).

#### 4.2 Constructor (líneas 19-31)

| Parámetro | Default | Propósito |
|-----------|:-------:|-----------|
| `pin` | 17 | GPIO17 = pin físico 11 |
| `active_high` | False | Tipo de activación del relé |

- `_active_high = False` → el relé se activa con `GPIO.LOW` y se desactiva con `GPIO.HIGH` (comportamiento estándar de módulos relay comunes)
- Configura el GPIO como salida y lo inicializa en estado APAGADO
- Si falla → cae a modo simulación

#### 4.3 Propiedades _on_level y _off_level (líneas 33-39)

| active_high | `_on_level` (encender) | `_off_level` (apagar) |
|:-----------:|:----------------------:|:---------------------:|
| True | `GPIO.HIGH` | `GPIO.LOW` |
| **False** (default) | **`GPIO.LOW`** | **`GPIO.HIGH`** |

Estas propiedades abstraen la lógica del tipo de relé. El resto del código solo llama a `_on_level` / `_off_level` sin preocuparse por la polaridad.

#### 4.4 Métodos de activación (3 modos)

| Método | ¿Quién lo llama? | Retorna | Significado |
|--------|------------------|---------|-------------|
| `activar()` | `automation.py` (temperatura ≥ 34°C) | `"VENTILACION_ON"` | Activación automática por umbral de temperatura |
| `activar_manual()` | MQTT / dashboard / botón | `"VENTILACION_MANUAL"` | Usuario activó manualmente |
| `activar_emergencia()` | `automation.py` (gas ≥ 600) | `"VENTILACION_EMERGENCIA"` | Emergencia por gas, solo se apaga cuando el gas se normaliza |

Los 3 métodos hacen lo mismo a nivel hardware (`GPIO.output(pin, _on_level)`) pero retornan diferentes strings para que el sistema sepa el origen de la activación.

#### 4.5 desactivar() (líneas 62-66)

```python
self._active = False
GPIO.output(self._pin, self._off_level)
return {"ventilador": "VENTILACION_OFF"}
```

#### 4.6 limpiar() (líneas 68-71)

Se llama en `handle_shutdown()` de `main.py`:
1. Apaga el ventilador (`GPIO.output(pin, _off_level)`)
2. Libera el GPIO (`GPIO.cleanup(pin)`)

---

## Relación entre los archivos

```
Sensor DHT11 ──→ temperatura_humedad.py ──→ temperatura, humedad_ambiente
Sensor MQ-135 ─→ gas.py ──→ gas (valor ADC)
                                                   │
                                                   ▼
backend (MongoDB) ──→ lecturas.csv ──→ modulo_3_anomalias.s ──→ resultado_anomalias.txt
                                                   │
                                                   ▼
automation.py ──→ ACTIVAR_VENTILADOR ──→ ventilador.py ──→ GPIO17 → Relé IN2 → Ventilador
```

El `modulo_3_anomalias.s` procesa todas las columnas del CSV, incluyendo TEMP, HUM_AIRE y GAS que provienen de los sensores DHT11 y MQ-135. El `ventilador.py` es el actuador que responde a las decisiones del `automation.py` basadas en esos mismos datos.
