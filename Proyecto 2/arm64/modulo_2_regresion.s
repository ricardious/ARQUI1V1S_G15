.data

msg_module:
    .ascii "MODULE=LINEAR_REGRESSION\n"
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES="
    len_msg_total = . - msg_total

msg_sum_x:
    .ascii "SUM_X="
    len_msg_sum_x = . - msg_sum_x

msg_sum_y:
    .ascii "SUM_Y="
    len_msg_sum_y = . - msg_sum_y

msg_sum_xy:
    .ascii "SUM_XY="
    len_msg_sum_xy = . - msg_sum_xy

msg_sum_x2:
    .ascii "SUM_X2="
    len_msg_sum_x2 = . - msg_sum_x2

msg_numerator:
    .ascii "NUMERATOR="
    len_msg_numerator = . - msg_numerator

msg_denominator:
    .ascii "DENOMINATOR="
    len_msg_denominator = . - msg_denominator

msg_slope:
    .ascii "SLOPE_X100="
    len_msg_slope = . - msg_slope

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
    // obtener argumentos:
    // ./modulo_2_regresion archivo.csv linea_inicial linea_final columna
    bl get_column_arg

    // leer columna del CSV y guardarla en stack
    bl read_column_to_stack

    // guardar salidas de utils
    mov x24, x0     // inicio de datos en stack
    mov x25, x1     // limite final
    mov x26, x2     // cantidad de datos
    mov x27, x3     // posicion para restaurar stack

    // regresion necesita al menos 2 valores
    cmp x26, #2
    blt range_error

    // valores temporales para la base
    mov x15, #0     // sum_x
    mov x16, #0     // sum_y
    mov x17, #0     // sum_xy
    mov x18, #0     // sum_x2
    mov x19, #0     // slope_x100

    // abrir archivo resultado_regresion.txt
    bl open_regresion_write
    mov x20, x0 // descriptor del archivo

    // MODULE=LINEAR_REGRESSION
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

    // SUM_X=
    mov x0, x20
    ldr x1, =msg_sum_x
    mov x2, len_msg_sum_x
    bl write_text

    mov x0, x15
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // SUM_Y=
    mov x0, x20
    ldr x1, =msg_sum_y
    mov x2, len_msg_sum_y
    bl write_text

    mov x0, x16
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // SUM_XY=
    mov x0, x20
    ldr x1, =msg_sum_xy
    mov x2, len_msg_sum_xy
    bl write_text

    mov x0, x17
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // SUM_X2=
    mov x0, x20
    ldr x1, =msg_sum_x2
    mov x2, len_msg_sum_x2
    bl write_text

    mov x0, x18
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // NUMERATOR=
    mov x0, x20
    ldr x1, =msg_numerator
    mov x2, len_msg_numerator
    bl write_text

    mov x0, #0
    mov x1, x20
    bl write_int

    mov x0, x20
    bl write_newline

    // DENOMINATOR=
    mov x0, x20
    ldr x1, =msg_denominator
    mov x2, len_msg_denominator
    bl write_text

    mov x0, #0
    mov x1, x20
    bl write_int

    mov x0, x20
    bl write_newline

    // SLOPE_X100=
    mov x0, x20
    ldr x1, =msg_slope
    mov x2, len_msg_slope
    bl write_text

    mov x0, x19
    mov x1, x20
    bl write_int

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