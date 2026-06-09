# GreenPi Grupo 15 - ARM64

Esta carpeta contiene codigo ensamblador ARM64/AArch64 para procesar datos reales del invernadero. Los modulos leen `../data/lecturas.csv`, calculan en ARM64 y generan archivos `.txt` dentro de `../resultados_arm64/`.

## Estado actual

Por ahora solo el modulo de Alex Ricardo tiene implementacion completa:

- Alex Ricardo Castaneda Rodriguez: `modulo_5_tendencia.s`
- Modulo: tendencia acumulada avanzada
- Salida: `../resultados_arm64/resultado_tendencia.txt`

Los demas modulos no existen todavia. Cada integrante debe crear despues su archivo:

- Claudia: `modulo_1_media.s`
- Emiliana: `modulo_2_varianza.s`
- Kevin: `modulo_3_anomalias.s`
- Alex Oswaldo: `modulo_4_prediccion.s`

El Makefile deja referencias pendientes para esos modulos, pero no intenta compilarlos hasta que existan sus archivos reales.

## Biblioteca comun

Todos los modulos deben usar `utils.s` como apoyo comun.

`utils.s` queda mantenido inicialmente por Alex Ricardo. No debe modificarse sin coordinacion, porque todos los modulos dependeran de sus rutinas y contratos de registros.

Rutinas actuales en `utils.s`:

- `open_csv_read`: abre `../data/lecturas.csv`.
- `open_tendencia_write`: crea/trunca `../resultados_arm64/resultado_tendencia.txt`.
- `open_media_write`: crea/trunca `../resultados_arm64/resultado_media.txt` cuando exista modulo de Claudia.
- `open_varianza_write`: crea/trunca `../resultados_arm64/resultado_varianza.txt` cuando exista modulo de Emiliana.
- `open_anomalias_write`: crea/trunca `../resultados_arm64/resultado_anomalias.txt` cuando exista modulo de Kevin.
- `open_prediccion_write`: crea/trunca `../resultados_arm64/resultado_prediccion.txt` cuando exista modulo de Alex Oswaldo.
- `read_fd`: lee bytes desde un descriptor.
- `close_fd`: cierra descriptor.
- `write_all`: escribe un buffer completo.
- `write_cstr`: escribe string terminado en `0`.
- `write_newline`: escribe un salto de linea.
- `write_uint`: escribe entero sin signo en decimal.
- `write_int`: escribe entero con signo en decimal.
- `skip_header`: salta el encabezado CSV.
- `parse_next_uint`: convierte el siguiente entero ASCII no negativo del CSV.
- `load_column_30`: carga hasta 30 valores de una columna en un arreglo.
- `count_records`: cuenta registros completos de 9 columnas.
- `exit_program`: termina el proceso.

## Formato obligatorio del CSV

El backend genera `../data/lecturas.csv` con este encabezado exacto:

```csv
ID,TEMP,HUM_AIRE,HUM_SUELO_1,HUM_SUELO_2,LUZ,GAS,RIEGO_1,RIEGO_2
```

Indices:

- 0: ID
- 1: TEMP
- 2: HUM_AIRE
- 3: HUM_SUELO_1
- 4: HUM_SUELO_2
- 5: LUZ
- 6: GAS
- 7: RIEGO_1
- 8: RIEGO_2

Reglas:

- El CSV debe tener 30 registros.
- El backend genera el CSV.
- Los decimales ya deben venir truncados desde el backend.
- ARM64 trabaja solo con enteros.
- Los valores del CSV deben venir como enteros no negativos.
- Python no puede calcular los resultados ARM64.
- Cada modulo debe generar su propio `.txt` dentro de `../resultados_arm64/`.
- Cada integrante debe poder defender su algoritmo, registros usados, memoria, ciclos, saltos y evidencia GDB.

## Modulo 5 - Tendencia acumulada avanzada

`modulo_5_tendencia.s` procesa columnas sensoras:

- TEMP
- HUM_AIRE
- HUM_SUELO_1
- HUM_SUELO_2
- LUZ
- GAS

Para cada registro despues del primero, compara valor actual contra valor anterior:

- Si sube, acumula diferencia en `Suma subidas`.
- Si baja, acumula diferencia absoluta en `Suma bajadas`.
- Si no cambia, cuenta cambio estable.

Despues calcula:

```text
Tendencia neta = Suma subidas - Suma bajadas
```

Clasificacion:

- `SUBE` si tendencia neta > 0.
- `BAJA` si tendencia neta < 0.
- `ESTABLE` si tendencia neta = 0.

## Comandos

Desde `arm64/`:

```bash
make
make media
make varianza
make anomalias
make prediccion
make tendencia
make run-media
make run-varianza
make run-anomalias
make run-prediccion
make run-tendencia
make run-all
make clean
```

`make run-tendencia` genera:

```text
../resultados_arm64/resultado_tendencia.txt
```

## GDB basico

Compilar:

```bash
make
```

Depurar:

```bash
gdb-multiarch build/modulo_5_tendencia
```

Comandos utiles dentro de GDB:

```gdb
break _start
run
stepi
nexti
info registers
x/16x $sp
x/s $x1
continue
quit
```

Evidencia esperada:

- captura de breakpoints,
- registros usados,
- memoria revisada,
- saltos principales,
- ciclos del parser,
- archivo de salida generado por ARM64.
