.data
msg_module:
    .ascii "MODULE=VARIANCE\n"
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES="
    len_msg_total = . - msg_total

msg_mean:
    .ascii "MEAN="
    len_msg_mean = . - msg_mean

msg_variance:
    .ascii "VARIANCE="
    len_msg_variance = . - msg_variance

msg_std_dev:
    .ascii "STD_DEV="
    len_msg_std_dev = . - msg_std_dev

.text
.global _start
.include "utils.s"

_start:

    // obtener rangos y la columna desde los argumentos de la consola (Archivo, Rango e Hilo de Columna)
    // dejando x24 = path archivo, x13 = linea inicial, x14 = linea final, x25 = ptr nombre columna
    bl get_column_arg
    bl read_column_to_stack     // leer columna del csv y cargarla al stack

    // guardar los retornos de utils en registros estables
    mov x19, x0     // direccion de inicio de datos en el stack
    mov x20, x2     // cantidad de datos leidos en el rango
    mov x21, x3     // posicion original para restaurar el stack

    // calcular media
    mov x10, #0  // suma acumulada
    mov x23, #0  // indice i

ciclo_media:
    cmp x23, x20        // comparar x23 >= x20
    b.hs calcular_media_final

    lsl x24, x23, #4    // i*16 (x24 = numero de bytes de desplazamiento)
    ldr x4, [x19, x24]  // cargar el dato actual del stack
    add x10, x10, x4    // sumar al acumulador

    add x23, x23, #1
    b ciclo_media

calcular_media_final:
    udiv x16, x10, x20

    // calcular varianza
    mov x12, #0  // acumulador de suma de diferencias al cuadrado
    mov x23, #0  // reiniciar indice i

ciclo_varianza:
    cmp x23, x20  // comparar x23(indice) >= x20(datos leidos)
    b.hs calcular_varianza_final

    lsl x24, x23, #4    // i*16 (x24 = numero de bytes de desplazamiento) 
    ldr x4, [x19, x24]  // cargar el dato actual del stack

    sub x6, x4, x16     // x6 = x - media
    mul x7, x6, x6      // x7 = (x - media) al cuadrado
    add x12, x12, x7    // sumar al acumulador de la suma de cuadrados (numerador)

    add x23, x23, #1
    b ciclo_varianza

calcular_varianza_final:
    udiv x17, x12, x20   // x17 (varianza) = suma de cuadrados / N

    // calcular desviacion estandar (raiz cuadrada de la varianza)
    mov x0, x17     // varianza
    mov x1, #1      // iterador

loop_sqrt:
    mul x2, x1, x1  // x2 = x1 * x1
    
    // realizar comparacion para saber si ya nos pasamos
    cmp x2, x0      // x2 > x0
    bgt end_loop_sqrt

    add x1, x1, #1

    b loop_sqrt

end_loop_sqrt:
    // el add anterior deja una posicion arriba del resultado, entonces restar
    sub x1, x1, #1  // restamos uno
    mov x26, x1     // resultado

    // limpiar los datos temporales del stack 
    mov sp, x21

    bl open_varianza_write
    mov x15, x0          // almacenar el fd del archivo de salida en x15

    // MODULE=VARIANCE
    mov x0, x15
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    // TOTAL_VALUES=N
    mov x0, x15
    ldr x1, =msg_total
    mov x2, len_msg_total
    bl write_text

    mov x0, x20          // pasar el valor total de N
    mov x1, x15          // fd
    bl write_uint
    mov x0, x15
    bl write_newline

    // MEAN=
    mov x0, x15
    ldr x1, =msg_mean
    mov x2, len_msg_mean
    bl write_text

    mov x0, x16          // pasar la media
    mov x1, x15          // fd
    bl write_uint
    mov x0, x15
    bl write_newline

    // VARIANCE=
    mov x0, x15
    ldr x1, =msg_variance
    mov x2, len_msg_variance
    bl write_text

    mov x0, x17          // pasar la varianza
    mov x1, x15          // fd
    bl write_uint
    mov x0, x15
    bl write_newline

    // STD_DEV=
    mov x0, x15
    ldr x1, =msg_std_dev
    mov x2, len_msg_std_dev
    bl write_text

    mov x0, x26          // pasar la desviacion estandar
    mov x1, x15          // fd
    bl write_uint
    mov x0, x15
    bl write_newline

    // cerrar archivo
    mov x0, x15
    bl close_output_file

    mov x0, #0
    mov x8, #93
    svc #0