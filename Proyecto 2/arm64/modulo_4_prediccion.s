
// Modulo 4: Prediccion lineal simple


.data


msg_module:
    .ascii "MODULE=PREDICTION\n"
    len_msg_module = . - msg_module

msg_initial:
    .ascii "INITIAL_VALUE="
    len_msg_initial = . - msg_initial

msg_final:
    .ascii "FINAL_VALUE="
    len_msg_final = . - msg_final

msg_diff:
    .ascii "TOTAL_DIFF="
    len_msg_diff = . - msg_diff

msg_avg:
    .ascii "AVG_CHANGE="
    len_msg_avg = . - msg_avg

msg_next:
    .ascii "NEXT_VALUE="
    len_msg_next = . - msg_next

// Caracteres para decimales y negativos 
str_minus:
    .ascii "-"
str_dot:
    .ascii "."
str_zero:
    .ascii "0"

.text
.include "utils.s
.global _start

// inicio 
_start:
  
    bl get_column_arg  // llama a utils.s lee el argumento y lo prepara internamente.

   
    bl read_column_to_stack //  busca los numeros, los convierte y los apila.

    //  Guardar los resultados que nos devolvio utils.s 
    mov x24, x0 // x0 trae el puntero a la cima de la pila ultimodato
    mov x25, x1 // x1 trae el puntero al fondo de la pila primerdato
    mov x18, x3 // x3 trae la direccion original del stack para poder restaurar la memoria al terminar el programa 

    sub x12, x25, #16  // Calculamos la direccion del primer dato
    ldr x22, [x12]     // Cargamos en x22 el valor inicial
    ldp x23, x24, [x24] // x23 = ultimo valor, x24 = penultimo valor
    
    // El ULTIMO dato que se leyo
    ldr x23, [x24]     // Cargamos en x23 el valor final
    
 
    //  TOTAL_DIFF = valor final - valor inicial
    sub x26, x23, x22
    
    

    //calculo promedio de cambio
    mov x9, #100           // Cargamos la constante 100 
    mul x10, x26, x9       // x10 = TOTAL_DIFF * 100
    mov x11, #29           // x11 = N - 1
    sdiv x27, x10, x11     // x27 = cambio escalado x100
    
    // calculo proximo valor
    mul x10, x23, x9       // x10 = valor final * 100
    add x28, x10, x27      // x28 = proximo valor escalado x100



exit_ok:
    mov x0, #0      // Codigo de salida 0
    mov x8, #93     // Numero de syscall 
    svc #0          // Ejecuta la llamada al sistema operativo

