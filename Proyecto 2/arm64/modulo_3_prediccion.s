// Modulo 3: Prediccion futura por regresion

.data

msg_calc:
    .ascii "CALC=PREDICTION\n"
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

msg_k:
    .ascii "K=5\n"
    len_msg_k = . - msg_k

msg_slope:
    .ascii "SLOPE_X100="
    len_msg_slope = . - msg_slope

msg_intercept:
    .ascii "INTERCEPT_X100="
    len_msg_intercept = . - msg_intercept

msg_predicted:
    .ascii "PREDICTED_5="
    len_msg_predicted = . - msg_predicted

msg_status_ok:
    .ascii "STATUS=OK\n"
    len_msg_status_ok = . - msg_status_ok


msg_err_status:
    .ascii "STATUS=ERROR\n"
    len_msg_err_status = . - msg_err_status

msg_err_insuf:
    .ascii "ERROR=INSUFFICIENT_DATA\n"
    len_msg_err_insuf = . - msg_err_insuf

msg_err_detail:
    .ascii "DETAIL=REGRESSION_REQUIRES_AT_LEAST_2_VALUES\n"
    len_msg_err_detail = . - msg_err_detail

str_minus:
    .ascii "-"

.text
.include "utils.s"
.global _start

_start:
    // 1. Obtener argumentos
    bl get_column_arg
    mov x17, x25       // Guardar el puntero del nombre a salvo

    // Guardamos los limites de la ventana
    mov x16, x13       // WINDOW_START
    mov x17_end, x14   
    mov x19, x14       // WINDOW_END 
   
    // 2. Leer datos al stack
    bl read_column_to_stack 

    mov x24, x0        // Top del stack (ultimo dato)
    mov x25, x1        // Fondo del stack (primer dato)
    mov x21, x2        // N (cantidad de datos)
    mov x18, x3        // Direccion original del stack

    // 3. Validacion: Regresion necesita MINIMO 2 puntos
    cmp x21, #2
    blt error_rango_insuficiente

    // Abrimos el archivo de salida
    bl open_prediccion_futura_write 
    mov x20, x0 

    // Escribimos CALC=PREDICTION
    mov x0, x20
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text

    mov x0, x20
    ldr x1, =msg_status_ok
    mov x2, len_msg_status_ok
    bl write_text

    // Cerrar archivo y salir
    mov x0, x20
    bl close_output_file
    mov sp, x18 
    b exit_ok

error_rango_insuficiente:
    // (En commits posteriores pondremos la impresion del error detallado aqui)
    mov x0, #1      
    mov x8, #93     
    svc #0          

exit_ok:
    mov x0, #0      
    mov x8, #93     
    svc #0