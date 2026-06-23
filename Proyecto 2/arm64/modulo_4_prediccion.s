
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
.include "utils.s"
.global _start

// inicio 
_start:
  
    bl get_column_arg  // llama a utils.s lee el argumento y lo prepara internamente.

   
    bl read_column_to_stack //  busca los numeros, los convierte y los apila.

    //  Guardar los resultados que nos devolvio utils.s 
    mov x24, x0 // x0 trae el puntero a la cima de la pila ultimodato
    mov x25, x1 // x1 trae el puntero al fondo de la pila primerdato
    mov x18, x3 // x3 trae la direccion original del stack, restaurar la memoria al terminar el programa 

    sub x12, x25, #16  // Calculamos la direccion del primer dato
    ldr x22, [x12]     // Cargamos en x22 el valor inicial
    
    
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

    bl open_prediccion_write // abrimos el archivo para escribir
    mov x20, x0 // Guardamos en x20

    //escribimos el modulo
    mov x0, x20
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    //escribimos el valor incial
    mov x0, x20
    ldr x1, =msg_initial
    mov x2, len_msg_initial
    bl write_text
    
    mov x0, x22      // Pasamos el valor inicial
    mov x1, x20      // Pasamos la etiqueta del archivo
    bl write_int     // Imprime el numero
    
    mov x0, x20
    bl write_newline // salto de linea

    //escribimos el valor final
    mov x0, x20
    ldr x1, =msg_final
    mov x2, len_msg_final
    bl write_text
    
    mov x0, x23      // Pasamos el valor final
    mov x1, x20
    bl write_int
    
    mov x0, x20
    bl write_newline

    // Escribimos la diferencia total 
    mov x0, x20
    ldr x1, =msg_diff
    mov x2, len_msg_diff
    bl write_text
    
    mov x0, x26      // Pasamos la diferencia total 
    mov x1, x20
    bl write_int
    
    mov x0, x20
    bl write_newline

    //escribimos el promedio de cambio
    mov x0, x20
    ldr x1, =msg_avg
    mov x2, len_msg_avg
    bl write_text

   mov x15, x27               // Cargar promedio de cambio en x15
    cmp x15, #0                //Comprobar si es negativo
    bge avg_positive           // Si es mayor o igual a 0 lo saltamos

    // Si es negativo hacerlo positivo
    mov x0, x20
    ldr x1, =str_minus
    mov x2, #1
    bl write_text
    neg x15, x15               // Convertir a positivo

avg_positive:
    mov x2, #100
    udiv x16, x15, x2          // x16 = parte entera
    msub x17, x16, x2, x15     // x17 = parte decimal


    // Imprimir parte entera
    mov x0, x16
    mov x1, x20
    bl write_uint

    // Imprimir punto
    mov x0, x20
    ldr x1, =str_dot
    mov x2, #1
    bl write_text

    cmp x17, #10
    bge avg_print_frac
    
    // Imprimir 0 a la izquierda
    mov x0, x20
    ldr x1, =str_zero
    mov x2, #1
    bl write_text

avg_print_frac:
    // Imprimir la fraccion
    mov x0, x17
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline

   
    // IMPRIMIR prediccion siguiente 
    mov x0, x20
    ldr x1, =msg_next
    mov x2, len_msg_next
    bl write_text

    mov x15, x28               // Cargar prediccion siguiente
    cmp x15, #0                // Comprobar si es negativo
    bge next_positive

    // hacerlo positivo
    mov x0, x20
    ldr x1, =str_minus
    mov x2, #1
    bl write_text
    neg x15, x15

next_positive:
    mov x2, #100
    udiv x16, x15, x2          // x16 parte entera
    msub x17, x16, x2, x15     // x17 parte decimal

    // Imprimir parte entera
    mov x0, x16
    mov x1, x20
    bl write_uint

    // Imprimir punto
    mov x0, x20
    ldr x1, =str_dot
    mov x2, #1
    bl write_text

    // Revisar si el decimal es menor a 10 
    cmp x17, #10
    bge next_print_frac
    
    // Imprimir 0 a la izquierda
    mov x0, x20
    ldr x1, =str_zero
    mov x2, #1
    bl write_text

next_print_frac:
    // Imprimir la fraccion
    mov x0, x17
    mov x1, x20
    bl write_uint

    mov x0, x20
    bl write_newline


    mov x0, x20
    bl close_output_file

    //restaurar el stack
    mov sp, x18 


exit_ok:
    mov x0, #0      // Codigo de salida 0
    mov x8, #93     // Numero de syscall 
    svc #0          // Ejecuta la llamada al sistema operativo

