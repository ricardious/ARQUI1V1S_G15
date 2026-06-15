# Módulo 1 — Media Aritmética Ponderada

| Campo | Detalle |
|---------|---------|
| **Responsable** | Claudia Maribel Tigüilá Tecum |
| **Subsistema del invernadero** | Monitoreo de sensores |
| **Archivo ARM64** | `arm64/modulo_1_media.s` |
| **Biblioteca común** | `arm64/utils.s` |
| **Salida** | `resultado_media.txt` |
| **Colección de resultados** | `arm64_results` |

---

# Explicación del algoritmo, registros, memoria y flujo

## 1. modulo_1_media.s — Media Aritmética Ponderada

**Archivo:** `arm64/modulo_1_media.s`  
**Lenguaje:** Ensamblador ARM64 (AArch64)

**Propósito:** Leer una columna específica de `lecturas.csv`, calcular su media aritmética ponderada utilizando pesos crecientes del 1 al 30 y almacenar el resultado en un archivo de salida.



## 1.1 Constantes (.equ)

| Constante | Valor | Propósito |
|-----------|:------:|-----------|
| `COLUMN_INDEX` | 1 | Columna a procesar (TEMP) |
| `WEIGHT_SUM` | 465 | Suma fija de pesos 1..30 |
| `BUFFER_SIZE` | 4096 | Tamaño máximo del buffer CSV |

### Índices de columnas

| Índice | Columna |
|---------|----------|
| 0 | ID |
| 1 | TEMP |
| 2 | HUM_AIRE |
| 3 | HUM_SUELO_1 |
| 4 | HUM_SUELO_2 |
| 5 | LUZ |
| 6 | GAS |
| 7 | RIEGO_1 |
| 8 | RIEGO_2 |

---

## 1.2 Sección .rodata

Contiene los textos utilizados para generar el archivo de salida.

| Etiqueta | Contenido |
|-----------|-----------|
| `msg_module` | MODULE=WEIGHTED_MEAN |
| `msg_total` | TOTAL_VALUES=30 |
| `msg_sum_x` | SUM_X= |
| `msg_weight_sum` | WEIGHT_SUM= |
| `msg_weighted_mean` | WEIGHTED_MEAN= |

---

## 1.3 Sección .bss

Variables reservadas dinámicamente durante la ejecución.

| Etiqueta | Tamaño | Propósito |
|-----------|---------|-----------|
| `csv_buffer` | 4096 bytes | Almacena el contenido completo del CSV |
| `data_array` | 240 bytes | Arreglo de 30 enteros de 64 bits |

### Distribución de memoria

```text
csv_buffer
┌──────────────────────┐
│ Contenido CSV        │
└──────────────────────┘

data_array
┌────┬────┬────┬────┐
│X1  │X2  │... │X30 │
└────┴────┴────┴────┘
30 elementos × 8 bytes
```

---

## 1.4 Funciones externas

Las siguientes funciones son proporcionadas por `utils.s`.

| Función | Propósito |
|----------|-----------|
| `open_csv_read` | Abrir CSV en lectura |
| `open_media_write` | Crear archivo resultado |
| `read_fd` | Leer archivo |
| `close_fd` | Cerrar archivo |
| `write_cstr` | Escribir cadena |
| `write_uint` | Escribir entero |
| `write_newline` | Escribir salto de línea |
| `skip_header` | Saltar encabezado CSV |
| `load_column_30` | Cargar 30 valores de una columna |
| `exit_program` | Finalizar programa |

---

## 1.5 Registros utilizados

| Registro | Propósito |
|-----------|-----------|
| x19 | File descriptor del CSV |
| x20 | File descriptor del archivo resultado |
| x21 | Cantidad de bytes leídos |
| x22 | Índice del ciclo (i) |
| x23 | Suma simple de datos |
| x24 | Suma ponderada |
| x25 | Valor actual / resultado final |
| x0-x3 | Parámetros temporales para funciones |

---

## 1.6 Flujo general del programa

```text
_start
 │
 ├─ Abrir CSV
 │
 ├─ Leer contenido completo
 │
 ├─ Saltar encabezado
 │
 ├─ Cargar columna seleccionada
 │
 ├─ Abrir archivo resultado
 │
 ├─ Recorrer arreglo
 │    ├─ Sumar valores
 │    ├─ Calcular peso
 │    └─ Acumular suma ponderada
 │
 ├─ Calcular media ponderada
 │
 ├─ Escribir resultados
 │
 ├─ Cerrar archivos
 │
 └─ Finalizar programa
```

---

## 1.7 Carga de datos

Después de leer el CSV:

```asm
bl skip_header
```

se posiciona el puntero después del encabezado.

Posteriormente:

```asm
bl load_column_30
```

extrae los primeros 30 valores de la columna definida por `COLUMN_INDEX` y los almacena en:

```text
data_array
```

---

## 1.8 Algoritmo de cálculo

Inicialización:

```asm
mov x22, #0
mov x23, #0
mov x24, #0
```

donde:

- x22 = índice
- x23 = suma simple
- x24 = suma ponderada

### Recorrido

Para cada elemento:

```text
dato = data_array[i]

suma_x += dato

peso = i + 1

suma_ponderada += dato × peso
```

---

## 1.9 Ciclo principal

El ciclo procesa exactamente 30 elementos.

```asm
cmp x22, #30
b.hs calc_done
```

La instrucción:

```asm
b.hs
```

significa:

```text
Branch if Higher or Same
```

equivalente a:

```c
if(i >= 30)
```

---

## 1.10 Acceso al arreglo

Cada elemento ocupa 8 bytes.

El desplazamiento se calcula mediante:

```asm
lsl x0, x22, #3
```

equivalente a:

```c
offset = i * 8;
```

Luego:

```asm
ldr x25, [x1, x0]
```

carga:

```text
data_array[i]
```

---

## 1.11 Cálculo de la media ponderada

Al finalizar el recorrido:

```asm
udiv x25, x24, #465
```

conceptualmente:

```c
weighted_mean = suma_ponderada / 465;
```

El resultado queda almacenado en:

```asm
x25
```

---

## 1.12 Generación del archivo de salida

El programa genera un archivo con el formato:

```text
MODULE=WEIGHTED_MEAN
TOTAL_VALUES=30
SUM_X=1330
WEIGHT_SUM=465
WEIGHTED_MEAN=43
```

Los valores se escriben utilizando:

```asm
write_cstr()
write_uint()
write_newline()
```

---

## 1.13 Cierre del programa

Finalmente:

```asm
close_fd(csv_fd)
close_fd(output_fd)
exit_program(0)
```

Se liberan los recursos utilizados y el programa termina correctamente.

---

## 1.14 Resumen del algoritmo

```text
1. Leer archivo CSV.
2. Saltar encabezado.
3. Extraer 30 valores de una columna.
4. Calcular suma simple.
5. Calcular suma ponderada.
6. Dividir entre 465.
7. Guardar resultado.
8. Cerrar archivos.
```

---


### Espacio

Se utilizan:

```text
csv_buffer = 4096 bytes
data_array = 240 bytes
```

