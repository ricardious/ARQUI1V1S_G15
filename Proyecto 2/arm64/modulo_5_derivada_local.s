.data
msg_calc:
    .ascii "CALC=LOCAL_DERIVATIVE\n" //Etiqueta para identificar el módulo
    len_msg_module = . - msg_calc

msg_column:
    .ascii "COLUMN="                 //Etiqueta para identificar la columna
    len_msg_column = . - msg_column

msg_window_start:
    .ascii "WINDOW_START="           //Etiqueta para identificar el inicio de la ventana
    len_msg_window_start = . - msg_window_start

msg_window_end:
    .ascii "WINDOW_END="             //Etiqueta para identificar el final de la ventana
    len_msg_window_end = . - msg_window_end

msg_count:
    .ascii "COUNT="                  //Etiqueta para identificar la cantidad de valores
    len_msg_count = . - msg_count

msg_window_size:
    .ascii "WINDOW_SIZE=5\n"            //Etiqueta para identificar el tamaño de la ventana
    len_msg_window_size = . - msg_window_size

msg_max_slope:
    .ascii "MAX_LOCAL_SLOPE_X100="               //Etiqueta para identificar la pendiente máxima
    len_msg_max_slope = . - msg_max_slope

msg_status_ok:
    .ascii "STATUS=OK\n"               //Etiqueta para identificar el estado de la operación
    len_msg_status_ok = . - msg_status_ok

msg_err_status:
    .ascii "STATUS=ERROR\n"               //Etiqueta para identificar el estado de la operación
    len_msg_err_status = . - msg_err_status

msg_err_insuf:
    .ascii "ERROR=ERROR_INSUFFICIENT_DATA\n"               //Etiqueta para identificar el estado de la operación
    len_msg_err_insuf = . - msg_err_insuf

msg_err_detail:
    .ascii "DETAIL=LOCAL_DERIVATIVE_REQUIRES_AT_LEAST_5_VALUES\n"               //Etiqueta para identificar el estado de la operación
    len_msg_err_detail = . - msg_err_detail

.text

.include "utils.s"  // arm64/utils.s

.global _start

_start:
    bl get_column_arg // obtener columna desde argumento

    mov x15, x13 // WINDOW_START
    mov x16, x14 // WINDOW_END
    mov x17, x25 // puntero al nombre de la columna

    bl read_column_to_stack // leer columna del CSV y guardarla en stack    

    mov x24, x0 // inicio de datos en stack
    mov x25, x1 // limite final de datos
    mov x26, x2 // salir cantidad de datos leidos
    mov x27, x3 // posicion para restaurar el stack

    cmp x26, #5 // verificar si hay al menos 5 valores
    blt error_insufficient // si no hay suficientes valores, ir a error

    mov sp, x27 // restaurar stack

exit_ok:
    mov x0, #0 // código de salida 0 (éxito)
    mov x8, #93 // syscall exit
    svc #0

error_insufficient:
    bl open_anomalias_write // abrir archivo de salida para escribir resultados
    mov x20, x0 // fd de salida(resultado)

    mov x0, x20 // fd de salida
    ldr x1, =msg_calc // mensaje de módulo
    mov x2, len_msg_err_status // longitud del mensaje de módulo
    bl write_text // escribir mensaje de módulo en archivo de salida   

    mov x0, x20 // fd de salida
    ldr x1, =msg_err_insuf // mensaje de error por insuficiencia
    mov x2, len_msg_err_insuf // longitud del mensaje de error por insuficiencia
    bl write_text // escribir mensaje de error por insuficiencia en archivo de salida   

    mov x0, x20 // fd de salida
    ldr x1, =msg_err_detail // mensaje de detalle del error
    mov x2, len_msg_err_detail // longitud del mensaje de detalle del error
    bl write_text // escribir mensaje de detalle del error en archivo de salida

    mov x0, x20 // fd de salida
    bl close_output_file // cerrar archivo de salida

    mov sp, x27 // restaurar stack 

    mov x0, #1 // código de salida 1 (error)
    mov x8, #93 // syscall exit
    svc #0
