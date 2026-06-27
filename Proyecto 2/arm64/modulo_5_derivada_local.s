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
    .ascii "ERROR=INSUFFICIENT_DATA\n"               //Etiqueta para identificar el estado de la operación
    len_msg_err_insuf = . - msg_err_insuf

msg_err_detail:
    .ascii "DETAIL=LOCAL_DERIVATIVE_REQUIRES_AT_LEAST_5_VALUES\n"               //Etiqueta para identificar el estado de la operación
    len_msg_err_detail = . - msg_err_detail

.text

.include "utils.s"  // arm64/utils.s

.global _start

_start:
    bl get_column_arg // obtener columna desde argumento

    mov x16, x13 // WINDOW_START
    mov x17, x14 // WINDOW_END
    mov x18, x25 // puntero al nombre de la columna

    bl read_column_to_stack // leer columna del CSV y guardarla en stack    

    mov x24, x0 // inicio de datos en stack
    mov x25, x1 // limite final de datos
    mov x26, x2 // salir cantidad de datos leidos
    mov x27, x3 // posicion para restaurar el stack

    cmp x26, #5 // verificar si hay al menos 5 valores
    blt error_insufficient // si no hay suficientes valores, ir a error

    mov x19, #0 // inicializar pendiente máxima a 0
    sub x12, x26, #5 // calcular el índice del último valor
    mov x5, #0 // inicializar índice de la ventana a 0

window_loop:
    cmp x5, x12 // comparar índice de la ventana con el índice del último valor
    bgt window_done // si el índice de la ventana es mayor o igual al índice del último valor, salir del bucle

    lsl x6, x5, #4 // calcular el desplazamiento para el valor actual (x5 * 16 bytes)
    sub x7, x25, #16 // calcular la dirección del último valor
    sub x7, x7, x6 // calcular la dirección del valor actual

    mov x8, #0 // inicializar la pendiente local a 0
    mov x9, #0 // inicializar el índice de la ventana interna a 0
    mov x10, #0 // inicializar el índice del valor anterior a 0
    mov x11, #0 // inicializar el valor anterior a 0
    mov x14, #0 // inicializar el valor actual a 0

window_inner:
    cmp x14, #5 // comparar el índice de la ventana interna con 5
    bge compute_slope // si el índice de la ventana interna es mayor o igual a 5, calcular la pendiente

    lsl x13, x14, #4 // calcular el desplazamiento para el valor actual de la ventana interna (x14 * 16 bytes)
    sub x13, x7, x13 // calcular la dirección del valor actual de la ventana interna
    ldr x15, [x13] // cargar el valor actual de la ventana interna

    // sumX += valor actual de la ventana interna (i)
    add x8, x8, x14 // sumar el valor actual de la ventana interna a la pendiente local

    // sum X2 += i * i
    mul x13, x14, x14 // calcular i * i
    add x9, x9, x13 // sumar i * i a la suma de X2

    // sum Y += valor actual de la ventana interna (i)
    add x10, x10, x15 // sumar el valor actual de la ventana interna

    // sum XY += i * valor actual de la ventana interna (i)
    mul x13, x14, x15 // calcular i * valor actual de la ventana interna
    add x11, x11, x13 // sumar i * valor actual de la ventana interna a la suma de XY

    // incrementar el índice de la ventana interna
    add x14, x14, #1 // incrementar el índice de la ventana interna
    b window_inner // repetir el bucle de la ventana interna

compute_slope:
    //LOCAL_NUMERADOR = (5 * sumXY) - (sumX * sumY)
    mov x0, #5 // número de puntos en la ventana
    mul x0, x0, x11 // calcular n * sumXY
    mul x1, x8, x10 // calcular sumX * sumY
    sub x0, x0, x1 // calcular n * sumXY - sumX * sumY

    //LOCAL_DENOMINADOR = (5 * sumX2) - (sumX * sumX)
    mov x1, #5 // número de puntos en la ventana
    mul x1, x1, x9 // calcular n * sumX2
    mul x2, x8, x8 // calcular sumX * sumX
    sub x1, x1, x2 // calcular n * sumX2 - sumX * sumX

    // Valor absoluto de LOCAL_NUMERADOR
    cmp x0, #0 // comparar LOCAL_NUMERADOR con 0
    bge numerador_positive // si LOCAL_NUMERADOR es mayor o igual a 0, continuar
    sub x0, xzr, x0 // si LOCAL_NUMERADOR es negativo,

numerador_positive:
    // LOCAL_SLOPE_X100 = (LOCAL_NUMERADOR * 100) / LOCAL_DENOMINADOR
    mov x2, #100 // multiplicar por 100
    mul x0, x0, x2 // LOCAL_NUMERADOR * 100
    udiv x0, x0, x1 // dividir por LOCAL_DENOMINADOR

    cmp x0, x19 // comparar LOCAL_SLOPE_X100 con la pendiente máxima actual
    ble window_continue // si LOCAL_SLOPE_X100 es menor o igual a la pendiente máxima actual, continuar con la siguiente ventana
    mov x19, x0 // actualizar la pendiente máxima actual

window_continue:
    add x5, x5, #1 // incrementar el índice de la ventana
    b window_loop // repetir el bucle de la ventana

window_done:
    mov x21, x18 // guardar el puntero al nombre de la columna en x21
    mov x22, #0 // inicializar el contador de anomalías a 0


strlen_col:
    ldrb w23, [x21], #1 // cargar un byte del nombre de la columna y avanzar el puntero
    cbz w23, strlen_col_done
    add x22, x22, #1 // incrementar el contador de caracteres
    b strlen_col // repetir hasta encontrar el byte nulo
    
strlen_col_done:

    bl open_derivada_local_write // abrir archivo de salida para escribir resultados
    mov x20, x0 // fd de salida(resultado)

    //CALC = LOCAL_DERIVATIVE
    mov x0, x20 // fd de salida
    ldr x1, =msg_calc // mensaje de módulo
    mov x2, len_msg_module // longitud del mensaje de módulo
    bl write_text // escribir mensaje de módulo en archivo de salida

    //COLUMN =
    mov x0, x20 // fd de salida
    ldr x1, =msg_column // mensaje de columna
    mov x2, len_msg_column // longitud del mensaje de columna
    bl write_text // escribir mensaje de columna en archivo de salida

    //nombre de la columna
    mov x0, x20 // fd de salida
    mov x1, x18 // puntero al nombre de la columna
    mov x2, x22 // longitud del nombre de la columna
    mov x8, #64 // syscall write
    svc #0 // llamar al sistema para escribir el nombre de la columna en archivo de salida 

    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida   

    //WINDOW_START =
    mov x0, x20 // fd de salida
    ldr x1, =msg_window_start // mensaje de inicio de ventana
    mov x2, len_msg_window_start // longitud del mensaje de inicio de ventana
    bl write_text // escribir mensaje de inicio de ventana en archivo de salida
    mov x0, x16 // WINDOW_START
    mov x1, x20 // fd de salida
    bl write_uint // escribir WINDOW_START en archivo de salida
    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida

    //WINDOW_END =
    mov x0, x20 // fd de salida
    ldr x1, =msg_window_end // mensaje de final de ventana
    mov x2, len_msg_window_end // longitud del mensaje de final de ventana
    bl write_text // escribir mensaje de final de ventana en archivo de salida
    mov x0, x17 // WINDOW_END
    mov x1, x20 // fd de salida
    bl write_uint // escribir WINDOW_END en archivo de salida
    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida

    //COUNT =
    mov x0, x20 // fd de salida
    ldr x1, =msg_count // mensaje de cantidad de valores
    mov x2, len_msg_count // longitud del mensaje de cantidad de valores
    bl write_text // escribir mensaje de cantidad de valores en archivo de salida
    mov x0, x26 // cantidad de datos (total_values)
    mov x1, x20 // fd de salida
    bl write_uint // escribir total_values en archivo de salida
    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida

    //WINDOW_SIZE = 5
    mov x0, x20 // fd de salida
    ldr x1, =msg_window_size // mensaje de tamaño de ventana
    mov x2, len_msg_window_size // longitud del mensaje de tamaño de ventana
    bl write_text // escribir mensaje de tamaño de ventana en archivo de salida

    //MAX_LOCAL_SLOPE_X100 =
    mov x0, x20 // fd de salida
    ldr x1, =msg_max_slope // mensaje de pendiente máxima
    mov x2, len_msg_max_slope // longitud del mensaje de pendiente máxima
    bl write_text // escribir mensaje de pendiente máxima en archivo de salida
    mov x0, x19 // pendiente máxima
    mov x1, x20 // fd de salida
    bl write_uint // escribir pendiente máxima en archivo de salida
    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida

    //STATUS = OK
    mov x0, x20 // fd de salida
    ldr x1, =msg_status_ok // mensaje de estado OK
    mov x2, len_msg_status_ok // longitud del mensaje de estado OK
    bl write_text // escribir mensaje de estado OK en archivo de salida

    mov x0, x20 // fd de salida
    bl close_output_file // cerrar archivo de salida
    mov sp, x27 // restaurar stack

exit_ok:
    mov x0, #0 // código de salida 0 (éxito)
    mov x8, #93 // syscall exit
    svc #0

error_insufficient:
    bl open_derivada_local_write // abrir archivo de salida para escribir resultados
    mov x20, x0 // fd de salida(resultado)

    mov x0, x20 // fd de salida
    ldr x1, =msg_err_status // mensaje de módulo
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
