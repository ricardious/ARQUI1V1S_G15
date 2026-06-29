.section .rodata
msg_calc:
    .ascii "CALC=RMSE\n"
    len_msg_calc = . - msg_calc

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column

msg_start:
    .ascii "\nWINDOW_START="
    len_start = . - msg_start

msg_end:
    .ascii "\nWINDOW_END="
    len_end = . - msg_end

msg_count:
    .ascii "\nCOUNT="
    len_count = . - msg_count

msg_ideal:
    .ascii "\nIDEAL="
    len_ideal = . - msg_ideal
msg_rmse:
    .ascii "\nRMSE="
    len_rmse = . - msg_rmse

msg_ok:
    .ascii "\nSTATUS=OK\n"
    len_ok = . - msg_ok

msg_err_status:
    .ascii "STATUS=ERROR\nERROR=INSUFFICIENT_DATA\nDETAIL=RMSE_REQUIRES_AT_LEAST_2_VALUES\n"
    len_err_status = . - msg_err_status

.section .text

.global _start

.include "utils.s"
_start:

    // se obtiene la columna
    bl get_column_arg
    
    //se lee la columna y se guarda 
    bl read_column_to_stack
    mov x24, x0	// inicio de datos
    mov x26, x2	// cantidad de datos
    mov x27, x3	//direccion para restaurar stack

    mov x16, x13        // inicio
    mov x17, x14        // linea final

    // validar que hayan al menos 2 datos
    cmp x26, #2
    blt manejar_error_datos

    bl obtener_valor_ideal
    mov x19, x0     // ideal

//ERROR_i = Y_i - IDEAL
//ERROR2_i = ERROR_i * ERROR_i 
// MSE = suma(ERROR2_i) / N 
//RMSE = sqrt_entera(MSE) 
    mov x3, x24 // iterador de la lista Y
    mov x5, x26 // contador de iteraciones
    mov x6, #0  // SUMA_ERROR2 = 0

calc_loop:
    cbz x5, calc_done

    ldr x7, [x3], #16    // Y_i, avanza puntero
    sub x8, x7, x19         // ERROR_i = Y_i - IDEAL
    mul x9, x8, x8           // ERROR2_i
    add x6, x6, x9             // acumula

    sub x5, x5, #1
    b calc_loop

calc_done:
    udiv x10, x6, x26        // MSE = SUMA_ERROR2 / N
    mov x0, x10
    bl sqrt_entera             // RMSE
    mov x28, x0                 // x28 = RMSE final

    bl open_rmse_write
    mov x20, x0                  // fd de salida

    // CALC=RMSE
    mov x0, x20            // fd de salida
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text

    // COLUMN=
    mov x0, x20
    ldr x1, =msg_column
    mov x2, len_msg_column
    bl write_text

    mov x0, x20
    mov x1, x25
    bl write_cstring

    // WINDOW_START=
    mov x0, x20
    ldr x1, =msg_start
    mov x2, len_start
    bl write_text

    mov x0, x16
    mov x1, x20
    bl write_int

    // WINDOW_END=
    mov x0, x20
    ldr x1, =msg_end
    mov x2, len_end
    bl write_text

    mov x0, x17
    mov x1, x20
    bl write_int

    // COUNT=
    mov x0, x20
    ldr x1, =msg_count
    mov x2, len_count
    bl write_text

    mov x0, x26
    mov x1, x20
    bl write_int

    // IDEAL=
    mov x0, x20
    ldr x1, =msg_ideal
    mov x2, len_ideal
    bl write_text

    mov x0, x19
    mov x1, x20
    bl write_int

    // RMSE=
    mov x0, x20
    ldr x1, =msg_rmse
    mov x2, len_rmse
    bl write_text

    mov x0, x28
    mov x1, x20
    bl write_int

    // STATUS=OK
    mov x0, x20
    ldr x1, =msg_ok
    mov x2, len_ok
    bl write_text

    bl close_output_file
    b exit

manejar_error_datos:
    mov x0, #1
    ldr x1, =msg_err_status
    mov x2, len_err_status
    bl write_text
    b exit

exit:
    mov sp, x27          // restaurar el stack
    mov x0, #0
    mov x8, #93
    svc #0