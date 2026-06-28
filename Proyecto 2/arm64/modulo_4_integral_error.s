.data
msg_module:
    .ascii "CALC=ERROR_INTEGRAL\n"
    len_msg_module = . - msg_module

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column

msg_start:
    .ascii "\nWINDOW_START="
    len_msg_start = . - msg_start

msg_end:
    .ascii "\nWINDOW_END="
    len_msg_end = . - msg_end

msg_count:
    .ascii "\nCOUNT="
    len_msg_count = . - msg_count

msg_ideal:
    .ascii "\nIDEAL="
    len_msg_ideal = . - msg_ideal

msg_error_integral:
    .ascii "\nERROR_INTEGRAL="
    len_msg_error_integral = . - msg_error_integral

msg_status:
    .ascii "\nSTATUS=OK\n"
    len_msg_status = . - msg_status

msg_err_status:
    .ascii "STATUS=ERROR\nERROR=INSUFFICIENT_DATA\nDETAIL=INTEGRAL_REQUIRES_AT_LEAST_2_VALUES\n"
len_err_status = . - msg_err_status

.text
.global _start

.include "utils.s"

_start:
    // obtener argumentos de la consola
    // x13 = linea inicial
    // x14 = linea final
    // x24 = path archivo
    // x25 = puntero nombre columna
    bl get_column_arg

    // leer columna del archivo y cargarla al stack
    bl read_column_to_stack

    // guardar los retornos en registros estables
    mov x19, x0     // x19 = direccion de inicio de datos en el stack (lista Y)
    mov x20, x2     // x20 = cantidad de datos (N)
    mov x26, x3     // x26 = direccion para restaurar el stack

    mov x27, x13    // x27 = WINDOW_START
    mov x28, x14    // x28 = WINDOW_END

    // validar que al menos hayan 2 datos
    cmp x20, #2
    blt manejar_error_datos

    b salir_programa

manejar_error_datos:
    mov x0, #1
    ldr x1, =msg_err_status
    mov x2, len_err_status
    bl write_text

salir_programa:
    mov x0, #0
    mov x8, #93
    svc #0