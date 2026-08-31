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

trend_ascending:
    .ascii "ASCENDING\n"
    len_trend_ascending = . - trend_ascending

trend_descending:
    .ascii "DESCENDING\n"
    len_trend_descending = . - trend_descending

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

    mov x21, x25 // nombre de columna
    mov x22, x13 // linea inicial
    mov x23, x14 // linea final

    // guardar salidas de utils
    mov x24, x0 // inicio de datos en stack
    mov x25, x1 // limite final
    mov x26, x2 // cantidad de datos
    mov x27, x3 // posicion para restaurar stack

    // regresion necesita al menos 2 valores
    cmp x26, #2
    blt range_error

    // X = indice temporal: 0, 1, 2, ..., N-1
    // Y = valor leido desde el stack
    // x15 = SUM_X
    // x16 = SUM_Y
    // x17 = SUM_XY
    // x18 = SUM_X2
    // x19 = indice X
    mov x15, #0 // SUM_X
    mov x16, #0 // SUM_Y
    mov x17, #0 // SUM_XY
    mov x18, #0 // SUM_X2
    mov x19, #0 // X = 0

    // recorrer en orden temporal
    // primer dato temporal = x25 - 16
    mov x28, x25
    sub x28, x28, #16

regresion_sum_loop:
    cmp x19, x26
    beq regresion_sum_done

    ldr x10, [x28] // Y actual

    // SUM_X += X
    add x15, x15, x19

    // SUM_Y += Y
    add x16, x16, x10

    // SUM_XY += X * Y
    mul x11, x19, x10
    add x17, x17, x11

    // SUM_X2 += X * X
    mul x11, x19, x19
    add x18, x18, x11

    // siguiente valor temporal
    sub x28, x28, #16

    // X++
    add x19, x19, #1

    b regresion_sum_loop

regresion_sum_done:
    // ---------------------------------------------------------
    // Modificacion de la imagen, pero sin tocar el loop:
    //
    // X' = X + 32
    // Y' = Y - 16
    //
    // Como el loop ya calculo:
    // SUM_X  = SUM(X)
    // SUM_Y  = SUM(Y)
    // SUM_XY = SUM(X * Y)
    // SUM_X2 = SUM(X * X)
    //
    // Entonces se ajusta despues:
    //
    // SUM_XY' = SUM_XY - 16SUM_X + 32SUM_Y - 512N
    // SUM_X2' = SUM_X2 + 64SUM_X + 1024N
    //
    // NUM = N * SUM_XY' - SUM_X * SUM_Y - 512
    // DEN = N * SUM_X2' - SUM_X * SUM_X
    //
    // SLOPE_X100 = ((NUM * 200) / (DEN + 256)) / 2
    // ---------------------------------------------------------

    // x17 = SUM_XY'
    mov x13, #16
    mul x9, x15, x13        // x9 = 16 * SUM_X
    sub x17, x17, x9        // SUM_XY = SUM_XY - 16SUM_X

    mov x13, #32
    mul x9, x16, x13        // x9 = 32 * SUM_Y
    add x17, x17, x9        // SUM_XY = SUM_XY + 32SUM_Y

    mov x13, #512
    mul x9, x26, x13        // x9 = 512 * N
    sub x17, x17, x9        // SUM_XY = SUM_XY - 512N

    // x18 = SUM_X2'
    mov x13, #64
    mul x9, x15, x13        // x9 = 64 * SUM_X
    add x18, x18, x9        // SUM_X2 = SUM_X2 + 64SUM_X

    mov x13, #1024
    mul x9, x26, x13        // x9 = 1024 * N
    add x18, x18, x9        // SUM_X2 = SUM_X2 + 1024N

    // NUM = N * SUM_XY' - SUM_X * SUM_Y - 512
    mul x9, x26, x17        // x9 = N * SUM_XY'
    mul x10, x15, x16       // x10 = SUM_X * SUM_Y
    sub x11, x9, x10        // x11 = N*SUM_XY' - SUM_X*SUM_Y
    sub x11, x11, #512      // x11 = NUM

    // DEN = N * SUM_X2' - SUM_X * SUM_X
    mul x9, x26, x18        // x9 = N * SUM_X2'
    mul x10, x15, x15       // x10 = SUM_X * SUM_X
    sub x12, x9, x10        // x12 = DEN

    // DEN = DEN + 256
    add x12, x12, #256

    // Validar division entre cero
    cmp x12, #0
    beq range_error

    // NUM * 200
    mov x13, #200
    mul x11, x11, x13       // x11 = NUM * 200

    // (NUM * 200) / (DEN + 256)
    sdiv x19, x11, x12

    // resultado / 2
    mov x13, #2
    sdiv x19, x19, x13      // x19 = SLOPE_X100

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
    mov x1, x21 // nombre de columna
    bl write_cstring

    mov x0, x20
    bl write_newline

    // WINDOW_START=
    mov x0, x20
    ldr x1, =msg_window_start
    mov x2, len_msg_window_start
    bl write_text

    mov x0, x22
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

    // WINDOW_END=
    mov x0, x20
    ldr x1, =msg_window_end
    mov x2, len_msg_window_end
    bl write_text

    mov x0, x23
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

    // x19 = SLOPE_X100
    // x19 > 0  => ASCENDING
    // x19 < 0  => DESCENDING
    // x19 == 0 => STABLE
    cmp x19, #0
    bgt regresion_write_ascending
    blt regresion_write_descending
    b regresion_write_stable

regresion_write_ascending:
    mov x0, x20
    ldr x1, =trend_ascending
    mov x2, len_trend_ascending
    bl write_text
    b regresion_write_status

regresion_write_descending:
    mov x0, x20
    ldr x1, =trend_descending
    mov x2, len_trend_descending
    bl write_text
    b regresion_write_status

regresion_write_stable:
    mov x0, x20
    ldr x1, =trend_stable
    mov x2, len_trend_stable
    bl write_text

regresion_write_status:
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
