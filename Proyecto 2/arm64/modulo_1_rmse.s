.section .rodata
msg_calc:
    .ascii "CALC=RMSE\n"
    len_msg_calc = . - msg_calc

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column
    
msg_start:
    .ascii "WINDOW_START="
    len_start = . - msg_start

msg_end:
    .ascii "WINDOW_END="
    len_end = . - msg_end

msg_count:
    .ascii "COUNT="
    len_count = . - msg_count

msg_ideal:
    .ascii "IDEAL="
    len_ideal = . - msg_ideal
msg_rmse:
    .ascii "RMSE="
    len_rmse = . - msg_rmse

msg_ok:
    .ascii "STATUS=OK"
    len_ok = . - msg_ok

.section .text

.global _start

.include "utils.s"
_start:

    // se obtiene la columna
    bl get_column_arg

	mov x16, x13 // inicio 
    mov x17, x14 // linea final 

    //se lee la columna y se guarda 
    bl read_column_to_stack
	mov x24, x0	// inicio de datos
	mov x25, x1	// limite superior
	mov x26, x2	// cantidad de datos
	mov x27, x3	//direccion para restaurar stack

    //se abre el archivo resultado_media.txt
    bl open_rmse_write
    mov x20, x0         //x20 = x0 porque con x0 decolvio el descriptor
    
    bl obtener_valor_ideal
    mov x19, x0      // ideal


    // CALC=ERROR_INTEGRAL
    mov x0, x20            // fd de salida
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text


//CALC=RMSE 
//COLUMN=SOIL1 
//WINDOW_START=1000 
//WINDOW_END=1050 
//COUNT=51 
//IDEAL=55 
//RMSE=18 
//STATUS=OK 

//ERROR_i = Y_i - IDEAL
//ERROR2_i = ERROR_i * ERROR_i 
// MSE = suma(ERROR2_i) / N 
//RMSE = sqrt_entera(MSE) 
    mov x0, #0
    mov x8, #93
    svc #0