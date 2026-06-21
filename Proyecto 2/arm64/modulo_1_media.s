.include "utils.s"
// Sección .rodata, Strings de salida (solo para su lectura)
.section .rodata
msg_module:
    .ascii "MODULE=WEIGHTED_MEAN\n"
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES=30\n"
    len_msg_total = . - msg_total
    
msg_sum_x:
    .ascii "SUM_X="
    len_msg_sum_x = . - msg_sum_x

msg_weight_sum:
    .ascii "WEIGHT_SUM="
    len_msg_weight_sum = . - msg_weight_sum

msg_weighted_mean:
    .ascii "WEIGHTED_MEAN="
    len_msg_weighted_mean = . - msg_weighted_mean

.section .text

.global _start

// Regristos utilizados:
// x19 = datos
// x20 = descripto de media
// x24 = indice del dato
//x21 = suma de los datos
// x22 = suma ponderada
// x23 = resultado / weighted_mean
_start:

    // se obtiene la columna, registro x11
    bl get_column_arg

    //se lee la columna y se guarda 
    bl read_column_to_stack

    //se abre el archivo resultado_media.txt
    bl open_media_write
    mov x20, x0         //x20 = x0 porque con x0 decolvio el descripto


// 2) realizar calculos

// 3) resultado_media.txt , imprimir 
    //MODULE=WEIGHTED_MEAN

    mov x0, x20
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    mov x0, x20
    ldr x1, =msg_total
    mov x2, len_msg_total
    bl write_text

    // falta resultado de suma
    mov x0, x20
    ldr x1, =msg_sum_x
    mov x2, len_msg_sum_x
    bl write_text

    //falta resultado de suma ponderada
    mov x0, x20
    ldr x1, =msg_weight_sum
    mov x2, len_msg_weight_sum
    bl write_text

    // falta resultado media 
    mov x0, x20
    ldr x1, =msg_weighted_mean
    mov x2, len_msg_weighted_mean
    bl write_text


    