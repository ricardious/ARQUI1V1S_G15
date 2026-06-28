// Modulo 3: Prediccion futura por regresion


.data

msg_calc:
    .ascii "CALC=PREDICTION\n"
    len_msg_calc = . - msg_calc


msg_rango:
    .ascii "RANGE="
    len_msg_rango = . - msg_rango

msg_n_data:
    .ascii "N_DATA="
    len_msg_n_data = . - msg_n_data

msg_initial:
    .ascii "INITIAL_VALUE="
    len_msg_initial = . - msg_initial

msg_avg:
    .ascii "AVG_CHANGE="
    len_msg_avg = . - msg_avg


msg_status_ok:
    .ascii "STATUS=OK\n"
    len_msg_status_ok = . - msg_status_ok

str_guion:
    .ascii "-"

.text
.include "utils.s"
.global _start

_start:
    // 1. Obtener argumentos
    bl get_column_arg
    mov x17, x25       // FIX: Guardar el puntero del nombre a salvo en x17

    // Guardamos los limites de la ventana
    mov x16, x13       // WINDOW_START
    mov x19, x14       // WINDOW_END 
   
    // 2. Leer datos
    bl read_column_to_stack 

    mov x24, x0        // x0 trae el puntero a la cima de la pila ultimodato
    mov x25, x1        // x1 trae el puntero al fondo de la pila primerdato
    mov x21, x2        // cantidad de datos leidos (N) 
    mov x18, x3        // x3 trae la direccion original del stack

    
    cmp x21, #1
    ble error_rango_insuficiente

   
    sub x12, x25, #16  // Calculamos la direccion del primer dato
    ldr x22, [x12]     // Cargamos en x22 el valor inicial
    ldr x23, [x24]     // Cargamos en x23 el valor final 
    
    // TOTAL_DIFF = valor final - valor inicial
    sub x26, x23, x22


    // Abrimos el NUEVO archivo de salida
    bl open_prediccion_futura_write 
    mov x20, x0 

    // Escribimos el header nuevo
    mov x0, x20
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text

   
    mov x0, x20
    ldr x1, =msg_rango
    mov x2, len_msg_rango
    bl write_text

    mov x0, x16   
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

  
    mov x0, x20
    ldr x1, =msg_status_ok
    mov x2, len_msg_status_ok
    bl write_text

    // Cerrar archivo
    mov x0, x20
    bl close_output_file

    // Restaurar el stack
    mov sp, x18 
    b exit_ok

error_rango_insuficiente:
    mov x0, #1      
    mov x8, #93     
    svc #0          

exit_ok:
    mov x0, #0      
    mov x8, #93     
    svc #0