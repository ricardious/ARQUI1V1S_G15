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
// x20 = descripto de media
//x21 = suma de los datos
// x22 = suma ponderada
// x23 = indice del dato
// x24 = apuntador
// x27 = dato actual
//x28 = peso actual
_start:

    // se obtiene la columna, registro x11
    bl get_column_arg

    //se lee la columna y se guarda 
    bl read_column_to_stack
	mov x24, x0	//direccion del primer dato
	add x24, x24, #(29*16)  //multiplico para llegar al ultimo dato, osae dato 1 porque es una pila
	mov x25, x2	// cantidad de datos (los 30)
	mov x26, x3	//direccion para restaurar stack

    //se abre el archivo resultado_media.txt
    bl open_media_write
    mov x20, x0         //x20 = x0 porque con x0 decolvio el descriptor

	//inicializo variables 
	mov x21, #0		//sum_x = suma de los datos
	mov x22, #0		//suma pondera
	mov x23, #0		//indice

calculo_loop:
	cmp x23, x25
	b.hs calcular_media	//si datp > n procede a calcular la media

	ldr x27, [x24], #-16	// carga el dato apuntado por x24 en x27
	//  -16, mueve al siguiente dato a procesar, dato 2, el movimiento ocurre despues de cargar el dato
	add x21, x21, x27
	//peso actual 
	add x28, x23, #1
	//x19 = dato * peso
	mul x19, x28, x27
	//suma ponderada
	add x22, x22, x19

	add x23, x23, #1    // indice ++ 
	b calculo_loop
calcular_media:
	b imprimir_resultado


// 3) resultado_media.txt , imprimir 
    //MODULE=WEIGHTED_MEAN
imprimir_resultado:
    mov x0, x20
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    mov x0, x20
    ldr x1, =msg_total
    mov x2, len_msg_total
    bl write_text

    //  suma_X
    mov x0, x20
    ldr x1, =msg_sum_x
    mov x2, len_msg_sum_x
    bl write_text

	mov x0, x21
	mov x1, x20
	bl write_uint 

	mov x0, x20
	bl write_newline

    //falta resultado de suma ponderada
    mov x0, x20
    ldr x1, =msg_weight_sum
    mov x2, len_msg_weight_sum
    bl write_text

	mov x0, x22
	mov x1, x20
	bl write_uint 

	mov x0, x20
	bl write_newline

    // falta resultado media 
    mov x0, x20
    ldr x1, =msg_weighted_mean
    mov x2, len_msg_weighted_mean
    bl write_text


    mov x0, x20
    bl close_output_file

    mov x0, #0      
    mov x8, #93     // syscall exit
    svc #0