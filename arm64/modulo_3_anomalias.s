// GreenPi Grupo 15 - Modulo 3: Deteccion de Anomalias
// Responsable: Kevin Rodrigo Sandoval Hernandez
//
// Entrada:
//   ../data/lecturas.csv
//
// Salida:
//   ../resultados_arm64/resultado_anomalias.txt
//
// Algoritmo:
//   1. Leer CSV completo generado por backend.
//   2. Saltar encabezado.
//   3. Procesar hasta 30 registros, 9 columnas por registro.
//   4. Para cada columna sensora (TEMP, HUM_AIRE, HUM_SUELO_1,
//      HUM_SUELO_2, LUZ, GAS):
//      a. Calcular media aritmetica de los valores.
//      b. Calcular Desviacion Absoluta Media (MAD):
//         MAD = sum(|valor - media|) / n
//      c. Umbral de anomalia = MAD * 3.
//      d. Marcar como anomalia todo valor donde
//         |valor - media| > umbral.
//   5. Reportar anomalias por columna y total general.
//
// Notas:
//   - ARM64 trabaja solo con enteros.
//   - No hay datos simulados.
//   - Si el CSV tiene menos de 30 registros, se procesan los disponibles.
//   - La MAD (Mean Absolute Deviation) es diferente de la desviacion
//     estandar (modulo 2) y de la media ponderada (modulo 1).

.equ CSV_MAX_BYTES, 8192
.equ MAX_RECORDS, 30
.equ COLS_PER_RECORD, 9
.equ MAD_MULTIPLIER, 3

.section .rodata
msg_title:
    .asciz "Modulo 3 - Deteccion de Anomalias\n"
msg_responsable:
    .asciz "Responsable: Kevin Rodrigo Sandoval Hernandez\n"
msg_records:
    .asciz "Registros procesados: "
msg_total_title:
    .asciz "\nTotal de anomalias detectadas: "
msg_col_temp:
    .asciz "\n--- TEMP ---\n"
msg_col_hum_aire:
    .asciz "\n--- HUM_AIRE ---\n"
msg_col_hum_s1:
    .asciz "\n--- HUM_SUELO_1 ---\n"
msg_col_hum_s2:
    .asciz "\n--- HUM_SUELO_2 ---\n"
msg_col_luz:
    .asciz "\n--- LUZ ---\n"
msg_col_gas:
    .asciz "\n--- GAS ---\n"
msg_mean:
    .asciz "Media: "
msg_mad:
    .asciz "MAD: "
msg_anomalies:
    .asciz "Anomalias: "
msg_regs:
    .asciz "Registros: "
msg_comma:
    .asciz ", "
msg_none:
    .asciz "ninguno"
msg_open_csv_error:
    .asciz "ERROR: no se pudo abrir ../data/lecturas.csv\n"
msg_read_error:
    .asciz "ERROR: no se pudo leer ../data/lecturas.csv\n"
msg_open_result_error:
    .asciz "ERROR: no se pudo crear ../resultados_arm64/resultado_anomalias.txt\n"

.section .bss
.align 3
csv_buffer:
    .skip CSV_MAX_BYTES
col_array:
    .skip 8 * MAX_RECORDS
anomaly_indices:
    .skip 8 * MAX_RECORDS

.section .text
.global _start
.extern open_csv_read
.extern open_anomalias_write
.extern read_fd
.extern close_fd
.extern write_cstr
.extern write_newline
.extern write_uint
.extern skip_header
.extern load_column_30
.extern count_records
.extern exit_program

// ---------------------------------------------------------------------------
// Registros persistentes del modulo:
//   x19 = fd CSV (se salva en stack al entrar al bucle de columnas)
//   x20 = media de la columna actual (reutiliza buffer_start)
//   x21 = buffer end
//   x22 = post-header pointer
//   x23 = MAD de la columna actual (reutiliza record_count)
//   x24 = fd resultado
//   x25 = total anomalias (acumulado entre columnas)
//   x26 = indice de columna actual (1..6)
//   x27 = cantidad de valores en la columna actual
// ---------------------------------------------------------------------------

_start:
    bl open_csv_read
    cmp x0, #0
    b.lt fail_open_csv
    mov x19, x0

    ldr x1, =csv_buffer
    mov x2, #CSV_MAX_BYTES
    bl read_fd
    cmp x0, #0
    b.lt fail_read_csv

    ldr x20, =csv_buffer
    add x21, x20, x0

    mov x0, x20
    mov x1, x21
    bl skip_header
    mov x22, x0

    mov x0, x22
    mov x1, x21
    bl count_records
    mov x23, x0

    bl open_anomalias_write
    cmp x0, #0
    b.lt fail_open_result
    mov x24, x0

    // ---- Escribir encabezado del reporte ----
    mov x0, x24
    ldr x1, =msg_title
    bl write_cstr
    mov x0, x24
    ldr x1, =msg_responsable
    bl write_cstr
    mov x0, x24
    ldr x1, =msg_records
    bl write_cstr
    mov x0, x24
    mov x1, x23
    bl write_uint
    mov x0, x24
    bl write_newline

    // ---- Salvar fd CSV en stack para reutilizar x19 en el bucle ----
    stp x19, xzr, [sp, #-16]!

    // ---- Inicializar contadores ----
    mov x25, #0          // total anomalias
    mov x26, #1          // columna inicial = 1 (TEMP)

// ===================================================================
// Bucle principal: procesa columnas 1 a 6
// ===================================================================
column_loop:
    cmp x26, #7
    b.hs write_summary

    // Cargar columna actual con load_column_30 de utils.s
    mov x0, x22
    mov x1, x21
    mov x2, x26
    ldr x3, =col_array
    bl load_column_30
    mov x27, x0          // x27 = cantidad de valores cargados

    cbz x27, next_column

    // ---- Escribir nombre de la columna ----
    mov x0, x24
    bl select_column_name
    bl write_cstr

    // ---- Calcular media ----
    ldr x0, =col_array
    mov x1, x27
    bl sum_array
    mov x1, x27
    udiv x9, x0, x1
    mov x20, x9           // x20 = media (callee-saved, sobrevive llamadas)

    // Escribir "Media: "
    mov x0, x24
    ldr x1, =msg_mean
    bl write_cstr
    mov x0, x24
    mov x1, x20
    bl write_uint
    mov x0, x24
    bl write_newline

    // ---- Calcular MAD (Desviacion Absoluta Media) ----
    ldr x0, =col_array
    mov x1, x27
    mov x2, x20           // media (callee-saved)
    bl mad_sum
    mov x1, x27
    udiv x10, x0, x1
    mov x23, x10          // x23 = MAD (callee-saved, x23 era record_count ya usado)

    // Escribir "MAD: "
    mov x0, x24
    ldr x1, =msg_mad
    bl write_cstr
    mov x0, x24
    mov x1, x23
    bl write_uint
    mov x0, x24
    bl write_newline

    // ---- Calcular umbral = MAD * 3 ----
    mov x11, #MAD_MULTIPLIER
    mul x11, x23, x11
    mov x19, x11          // x19 = umbral (callee-saved, fd CSV esta en stack)

    // ---- Detectar anomalias y guardar indices ----
    // Fase 1: escanear y almacenar indices en anomaly_indices
    mov x12, #0           // indice dentro del arreglo
    mov x28, #0           // contador de anomalias de esta columna
    ldr x13, =anomaly_indices

detect_loop:
    cmp x12, x27
    b.hs detect_done

    ldr x0, =col_array
    ldr x14, [x0, x12, lsl #3]   // valor = col_array[indice]

    // diff = |valor - media|
    subs x15, x14, x20
    b.ge diff_non_neg
    neg x15, x15
diff_non_neg:

    // Si diff > umbral  =>  ANOMALIA
    cmp x15, x19
    b.le not_anomaly

    // Guardar indice (1-based) en anomaly_indices
    add x16, x12, #1
    str x16, [x13, x28, lsl #3]
    add x28, x28, #1

not_anomaly:
    add x12, x12, #1
    b detect_loop

detect_done:
    // x28 = cantidad de anomalias en esta columna

    // ---- Escribir "Anomalias: " + contador ----
    mov x0, x24
    ldr x1, =msg_anomalies
    bl write_cstr
    mov x0, x24
    mov x1, x28
    bl write_uint
    mov x0, x24
    bl write_newline

    // ---- Escribir "Registros: " + lista de indices (o "ninguno") ----
    mov x0, x24
    ldr x1, =msg_regs
    bl write_cstr

    cbz x28, write_none

    // Escribir indices separados por coma
    mov x12, #0
    ldr x13, =anomaly_indices

write_indices_loop:
    cmp x12, x28
    b.hs indices_done

    // Coma antes del segundo en adelante
    cbz x12, write_one_index
    mov x0, x24
    ldr x1, =msg_comma
    bl write_cstr

write_one_index:
    ldr x1, [x13, x12, lsl #3]
    mov x0, x24
    bl write_uint
    add x12, x12, #1
    b write_indices_loop

indices_done:
    mov x0, x24
    bl write_newline
    b after_regs

write_none:
    mov x0, x24
    ldr x1, =msg_none
    bl write_cstr
    mov x0, x24
    bl write_newline

after_regs:
    add x25, x25, x28    // acumular al total

next_column:
    add x26, x26, #1
    b column_loop

// ===================================================================
// Escribir total general y terminar
// ===================================================================
write_summary:
    mov x0, x24
    ldr x1, =msg_total_title
    bl write_cstr
    mov x0, x24
    mov x1, x25
    bl write_uint
    mov x0, x24
    bl write_newline

    // Restaurar fd CSV desde stack
    ldp x19, xzr, [sp], #16

    mov x0, x19
    bl close_fd

    mov x0, x24
    bl close_fd

    mov x0, #0
    bl exit_program

// ===================================================================
// select_column_name -- devuelve en x1 el puntero al nombre de
//   la columna segun x26 (1..6).
// ===================================================================
select_column_name:
    cmp x26, #1
    b.eq scn_temp
    cmp x26, #2
    b.eq scn_hum_aire
    cmp x26, #3
    b.eq scn_hum_s1
    cmp x26, #4
    b.eq scn_hum_s2
    cmp x26, #5
    b.eq scn_luz
    ldr x1, =msg_col_gas
    ret
scn_temp:
    ldr x1, =msg_col_temp
    ret
scn_hum_aire:
    ldr x1, =msg_col_hum_aire
    ret
scn_hum_s1:
    ldr x1, =msg_col_hum_s1
    ret
scn_hum_s2:
    ldr x1, =msg_col_hum_s2
    ret
scn_luz:
    ldr x1, =msg_col_luz
    ret

// ===================================================================
// sum_array(array, count) -> sum
//   Entradas:
//     x0 = direccion base del arreglo
//     x1 = cantidad de elementos
//   Salida:
//     x0 = suma total
//   Registros usados: x9, x10, x11 (no necesita salvar)
// ===================================================================
sum_array:
    mov x9, #0           // indice
    mov x10, x0          // base
    mov x11, #0          // acumulador
sum_loop:
    cmp x9, x1
    b.hs sum_done
    ldr x12, [x10, x9, lsl #3]
    add x11, x11, x12
    add x9, x9, #1
    b sum_loop
sum_done:
    mov x0, x11
    ret

// ===================================================================
// mad_sum(array, count, mean) -> sum of absolute deviations
//   Entradas:
//     x0 = direccion base del arreglo
//     x1 = cantidad de elementos
//     x2 = media
//   Salida:
//     x0 = sum(|valor - media|)
//   Registros usados: x9, x10, x11, x12, x13 (no necesita salvar)
// ===================================================================
mad_sum:
    mov x9, #0           // indice
    mov x10, x0          // base
    mov x11, #0          // acumulador
    mov x12, x2          // media
mad_loop:
    cmp x9, x1
    b.hs mad_done
    ldr x13, [x10, x9, lsl #3]
    subs x14, x13, x12   // valor - media
    b.ge mad_non_neg
    neg x14, x14
mad_non_neg:
    add x11, x11, x14
    add x9, x9, #1
    b mad_loop
mad_done:
    mov x0, x11
    ret

// ===================================================================
// Manejadores de error
// ===================================================================
fail_open_csv:
    mov x0, #2
    ldr x1, =msg_open_csv_error
    bl write_cstr
    mov x0, #1
    bl exit_program

fail_read_csv:
    mov x0, x19
    bl close_fd
    mov x0, #2
    ldr x1, =msg_read_error
    bl write_cstr
    mov x0, #1
    bl exit_program

fail_open_result:
    mov x0, #2
    ldr x1, =msg_open_result_error
    bl write_cstr
    mov x0, #1
    bl exit_program
