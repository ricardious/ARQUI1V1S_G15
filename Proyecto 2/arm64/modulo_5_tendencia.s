.data

msg_module:
    .ascii "MODULE=ADVANCED_TREND\n"
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES="
    len_msg_total = . - msg_total

msg_increments:
    .ascii "INCREMENTS="
    len_msg_increments = . - msg_increments

msg_decrements:
    .ascii "DECREMENTS="
    len_msg_decrements = . - msg_decrements

msg_max_up:
    .ascii "MAX_UP_STREAK="
    len_msg_max_up = . - msg_max_up

msg_max_down:
    .ascii "MAX_DOWN_STREAK="
    len_msg_max_down = . - msg_max_down

msg_accum_diff:
    .ascii "ACCUM_DIFF="
    len_msg_accum_diff = . - msg_accum_diff

msg_trend:
    .ascii "TREND="
    len_msg_trend = . - msg_trend

trend_stable:
    .ascii "STABLE\n"
    len_trend_stable = . - trend_stable

.text

.include "utils.s"

.global _start

_start:
    // obtener columna desde argumento
    bl get_column_arg

    // leer columna del CSV y guardarla en stack
    bl read_column_to_stack

    // guardar salidas de utils
    mov x24, x0 // inicio de datos en stack
    mov x25, x1 // limite final
    mov x26, x2 // cantidad de datos
    mov x27, x3 // posicion para restaurar stack

    // valores temporales para la base
    mov x15, #0 // incrementos
    mov x16, #0 // decrementos
    mov x17, #0 // max up streak
    mov x18, #0 // max down streak
    mov x19, #0 // accum diff

    // si hay menos de 2 valores, no hay comparaciones
    cmp x26, #2
    blt write_results

    // stack quedo en orden inverso
    // x25 - 16 apuntan al primer dato leido
    sub x12, x25, #16
    ldr x13, [x12] // ultimo valor

    // mover al segundo dato
    sub x12, x12, #16

count_changes:
    // si x12 queda antes del inicio, terminamos
    cmp x12, x24
    blt write_results

    ldr x14, [x12] // valor actual

    // actual > anterior => incremento
    cmp x14, x13
    bgt case_increment

    cmp x14, x13
    blt case_decrement

    b next_value

case_increment:
    add x15, x15, #1 // incremento++
    b next_value

case_decrement:
    add x16, x16, #1 // decremento++
    b next_value
    
next_value:
    // actual pasa a ser anterior
    mov x13, x14

    // avanza al siguiente valor
    sub x12, x12, #16

    b count_changes


write_results:
    // abrir archivo resultado_tendencia.txt
    bl open_tendencia_write
    mov x20, x0 // descriptor del archivo

    // MODULE=ADVANCED_TREND
    mov x0, x20
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    // TOTAL_VALUES=
    mov x0, x20
    ldr x1, =msg_total
    mov x2, len_msg_total
    bl write_text

    mov x0, x26
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // INCREMENTS=
    mov x0, x20
    ldr x1, =msg_increments
    mov x2, len_msg_increments
    bl write_text

    mov x0, x15
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // DECREMENTS=
    mov x0, x20
    ldr x1, =msg_decrements
    mov x2, len_msg_decrements
    bl write_text

    mov x0, x16
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // MAX_UP_STREAK=
    mov x0, x20
    ldr x1, =msg_max_up
    mov x2, len_msg_max_up
    bl write_text

    mov x0, x17
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // MAX_DOWN_STREAK=
    mov x0, x20
    ldr x1, =msg_max_down
    mov x2, len_msg_max_down
    bl write_text

    mov x0, x18
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // ACCUM_DIFF=
    mov x0, x20
    ldr x1, =msg_accum_diff
    mov x2, len_msg_accum_diff
    bl write_text

    mov x0, x19
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // TREND=
    mov x0, x20
    ldr x1, =msg_trend
    mov x2, len_msg_trend
    bl write_text

    mov x0, x20
    ldr x1, =trend_stable
    mov x2, len_trend_stable
    bl write_text

    // cerrar archivo
    mov x0, x20
    bl close_output_file

    // restaurar stack
    mov sp, x27

    b exit_ok

exit_ok:
    mov x0, #0
    mov x8, #93
    svc #0