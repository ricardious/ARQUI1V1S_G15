// GreenPi Grupo 15 - Modulo 5: Tendencia acumulada avanzada
// Responsable: Alex Ricardo Castaneda Rodriguez
//
// Entrada:
//   ../data/lecturas.csv
//
// Salida:
//   ../resultados_arm64/resultado_tendencia.txt
//
// Algoritmo:
//   1. Leer CSV completo generado por backend.
//   2. Saltar encabezado.
//   3. Procesar hasta 30 registros, 9 columnas por registro.
//   4. Comparar columnas sensoras 1..6 contra registro anterior:
//        TEMP, HUM_AIRE, HUM_SUELO_1, HUM_SUELO_2, LUZ, GAS.
//   5. Acumular:
//        - suma de subidas
//        - suma de bajadas
//        - cantidad de cambios positivos
//        - cantidad de cambios negativos
//        - cantidad de cambios estables
//   6. Calcular tendencia neta = suma_subidas - suma_bajadas.
//   7. Clasificar:
//        neta > 0  -> SUBE
//        neta < 0  -> BAJA
//        neta = 0  -> ESTABLE
//
// Notas:
//   - ARM64 trabaja solo con enteros.
//   - No hay datos simulados.
//   - Si el CSV tiene menos datos, el resultado reporta registros leidos.

.equ CSV_MAX_BYTES, 8192
.equ MAX_RECORDS, 30
.equ COLS_PER_RECORD, 9

.section .rodata
msg_title:
    .asciz "Modulo 5 - Tendencia acumulada avanzada\n"
msg_responsable:
    .asciz "Responsable: Alex Ricardo Castaneda Rodriguez\n"
msg_records:
    .asciz "Registros procesados: "
msg_pos_sum:
    .asciz "Suma subidas: "
msg_neg_sum:
    .asciz "Suma bajadas: "
msg_net:
    .asciz "Tendencia neta: "
msg_pos_count:
    .asciz "Cambios positivos: "
msg_neg_count:
    .asciz "Cambios negativos: "
msg_stable_count:
    .asciz "Cambios estables: "
msg_label:
    .asciz "Clasificacion: "
msg_up:
    .asciz "SUBE\n"
msg_down:
    .asciz "BAJA\n"
msg_stable:
    .asciz "ESTABLE\n"
msg_open_csv_error:
    .asciz "ERROR: no se pudo abrir ../data/lecturas.csv\n"
msg_read_error:
    .asciz "ERROR: no se pudo leer ../data/lecturas.csv\n"
msg_open_result_error:
    .asciz "ERROR: no se pudo crear ../resultados_arm64/resultado_tendencia.txt\n"

.section .bss
.align 3
csv_buffer:
    .skip CSV_MAX_BYTES
prev_values:
    .skip 8 * COLS_PER_RECORD
curr_values:
    .skip 8 * COLS_PER_RECORD

.section .text
.global _start
.extern open_csv_read
.extern open_tendencia_write
.extern read_fd
.extern close_fd
.extern write_cstr
.extern write_newline
.extern write_uint
.extern write_int
.extern skip_header
.extern parse_next_uint
.extern exit_program

_start:
    // Registros persistentes del modulo:
    // x19 = fd CSV
    // x20 = ptr actual CSV
    // x21 = ptr fin CSV
    // x22 = registros procesados
    // x23 = suma subidas
    // x24 = suma bajadas
    // x25 = contador positivos
    // x26 = contador negativos
    // x27 = contador estables
    // x28 = fd resultado

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
    mov x20, x0

    mov x22, #0
    mov x23, #0
    mov x24, #0
    mov x25, #0
    mov x26, #0
    mov x27, #0

record_loop:
    cmp x22, #MAX_RECORDS
    b.hs finish_calculation

    mov x9, #0
    ldr x10, =curr_values

column_loop:
    cmp x9, #COLS_PER_RECORD
    b.hs record_loaded

    mov x0, x20
    mov x1, x21
    bl parse_next_uint
    cbz x2, finish_calculation
    mov x20, x0

    str x1, [x10, x9, lsl #3]
    add x9, x9, #1
    b column_loop

record_loaded:
    cbz x22, save_first_record
    bl compare_sensor_columns

save_first_record:
    bl copy_current_to_previous
    add x22, x22, #1
    b record_loop

finish_calculation:
    mov x0, x19
    bl close_fd

    bl open_tendencia_write
    cmp x0, #0
    b.lt fail_open_result
    mov x28, x0

    bl write_report

    mov x0, x28
    bl close_fd

    mov x0, #0
    bl exit_program

// Compara columnas 1..6 entre curr_values y prev_values.
compare_sensor_columns:
    mov x9, #1
    ldr x10, =curr_values
    ldr x11, =prev_values
compare_loop:
    cmp x9, #7
    b.hs compare_done
    ldr x12, [x10, x9, lsl #3]
    ldr x13, [x11, x9, lsl #3]
    subs x14, x12, x13
    b.gt delta_positive
    b.lt delta_negative
    add x27, x27, #1
    b compare_next
delta_positive:
    add x23, x23, x14
    add x25, x25, #1
    b compare_next
delta_negative:
    neg x14, x14
    add x24, x24, x14
    add x26, x26, #1
compare_next:
    add x9, x9, #1
    b compare_loop
compare_done:
    ret

// Copia 9 enteros de curr_values a prev_values.
copy_current_to_previous:
    mov x9, #0
    ldr x10, =curr_values
    ldr x11, =prev_values
copy_loop:
    cmp x9, #COLS_PER_RECORD
    b.hs copy_done
    ldr x12, [x10, x9, lsl #3]
    str x12, [x11, x9, lsl #3]
    add x9, x9, #1
    b copy_loop
copy_done:
    ret

write_report:
    stp x29, x30, [sp, #-16]!

    mov x0, x28
    ldr x1, =msg_title
    bl write_cstr
    mov x0, x28
    ldr x1, =msg_responsable
    bl write_cstr

    mov x0, x28
    ldr x1, =msg_records
    bl write_cstr
    mov x0, x28
    mov x1, x22
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_pos_sum
    bl write_cstr
    mov x0, x28
    mov x1, x23
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_neg_sum
    bl write_cstr
    mov x0, x28
    mov x1, x24
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_net
    bl write_cstr
    sub x1, x23, x24
    mov x0, x28
    bl write_int
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_pos_count
    bl write_cstr
    mov x0, x28
    mov x1, x25
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_neg_count
    bl write_cstr
    mov x0, x28
    mov x1, x26
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_stable_count
    bl write_cstr
    mov x0, x28
    mov x1, x27
    bl write_uint
    mov x0, x28
    bl write_newline

    mov x0, x28
    ldr x1, =msg_label
    bl write_cstr
    sub x9, x23, x24
    cmp x9, #0
    b.gt write_label_up
    b.lt write_label_down
    mov x0, x28
    ldr x1, =msg_stable
    bl write_cstr
    b write_report_done
write_label_up:
    mov x0, x28
    ldr x1, =msg_up
    bl write_cstr
    b write_report_done
write_label_down:
    mov x0, x28
    ldr x1, =msg_down
    bl write_cstr

write_report_done:
    ldp x29, x30, [sp], #16
    ret

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
