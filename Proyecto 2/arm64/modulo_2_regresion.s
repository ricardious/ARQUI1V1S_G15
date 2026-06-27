.data

msg_calc:
    .ascii "CALC=LINEAR_REGRESSION\n"
    len_msg_calc = . - msg_calc

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column

msg_window_start:
    .ascii "WINDOW_START="
    len_msg_window_start = . - msg_window_start

msg_window_end:
    .ascii "WINDOW_END="
    len_msg_window_end = . - msg_window_end

msg_count:
    .ascii "COUNT="
    len_msg_count = . - msg_count

msg_slope:
    .ascii "SLOPE_X100="
    len_msg_slope = . - msg_slope

msg_trend:
    .ascii "TREND="
    len_msg_trend = . - msg_trend

trend_stable:
    .ascii "STABLE\n"
    len_trend_stable = . - trend_stable

msg_status:
    .ascii "STATUS=OK\n"
    len_msg_status = . - msg_status

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
    mov x24, x0 // inicio de datos en stack
    mov x25, x1 // limite final
    mov x26, x2 // cantidad de datos
    mov x27, x3 // posicion para restaurar stack

    // regresion necesita al menos 2 valores
    cmp x26, #2
    blt range_error

    // valores temporales de base
    mov x15, #0 // slope_x100 temporal

    // abrir archivo resultado_regresion.txt
    bl open_regresion_write
    mov x20, x0 // descriptor del archivo

    // CALC=LINEAR_REGRESSION
    mov x0, x20
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text

    // COLUMN=
    mov x0, x20
    ldr x1, =msg_column
    mov x2, len_msg_column
    bl write_text

    mov x0, x20
    mov x1, x25         // x25 = nombre de columna recibido por argumento
    bl write_cstring

    mov x0, x20
    bl write_newline

    // WINDOW_START=
    mov x0, x20
    ldr x1, =msg_window_start
    mov x2, len_msg_window_start
    bl write_text

    mov x0, x13
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // WINDOW_END=
    mov x0, x20
    ldr x1, =msg_window_end
    mov x2, len_msg_window_end
    bl write_text

    mov x0, x14
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // COUNT=
    mov x0, x20
    ldr x1, =msg_count
    mov x2, len_msg_count
    bl write_text

    mov x0, x26
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // SLOPE_X100=
    mov x0, x20
    ldr x1, =msg_slope
    mov x2, len_msg_slope
    bl write_text

    mov x0, x15
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

    // STATUS=OK
    mov x0, x20
    ldr x1, =msg_status
    mov x2, len_msg_status
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
