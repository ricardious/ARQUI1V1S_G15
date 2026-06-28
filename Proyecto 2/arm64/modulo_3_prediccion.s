// Modulo 3: Prediccion futura por regresion

.data

msg_calc:
    .ascii "CALC=PREDICTION\n"  // etiqueta de modulo
    len_msg_calc = . - msg_calc

msg_column:
    .ascii "COLUMN="  // etiqueta de columna
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


    //  CALCULO DE SUMATORIAS PARA REGRESION
   
    mov x9, x24         // x9 = Puntero actual 
    sub x5, x21, #1     // x5 = Indice X_i 
    
    
Inicializamos sumX en 0 para limpiar la memoria residual
    mov x22, #0         // sumX
    mov x23, #0         // sumY
    mov x26, #0         // sumX2
    mov x27, #0         // sumXY

calc_sums_loop:
    cmp x9, x25         
    bge calc_sums_done

    ldr x10, [x9]       // Y_i = Valor actual del CSV

    add x23, x23, x10   // sumY += Y_i
    add x22, x22, x5    // sumX += X_i

    mul x11, x5, x5     
    add x26, x26, x11   // sumX2 += X_i * X_i

    mul x11, x5, x10
    add x27, x27, x11   // sumXY += X_i * Y_i

    sub x5, x5, #1      // X_i--
    add x9, x9, #16     // Avanzar al dato mas viejo 
    b calc_sums_loop

calc_sums_done:

    //  Calcular pendiente  e intercepto 
    // NUMERADOR = (N * sumXY) - (sumX * sumY)
    mul x10, x21, x27   // x10 = N * sumXY
    mul x11, x22, x23   // x11 = sumX * sumY
    sub x10, x10, x11   // x10 = NUMERADOR

    // DENOMINADOR = (N * sumX2) - (sumX * sumX)
    mul x12, x21, x26   // x12 = N * sumX2
    mul x13, x22, x22   // x13 = sumX * sumX
    sub x12, x12, x13   // x12 = DENOMINADOR

   // Valor absoluto del numerador (Evitar SDIV)
    mov x15, #0         // x15 = bandera de signo 
    cmp x10, #0
    bge num_pos_slope
    sub x10, xzr, x10   // Volver positivo: 0 - NUM
    mov x15, #1         // Marcar como negativo
num_pos_slope:
    
    // M_X100 = (NUM * 100) / DEN 
    mov x11, #100
    mul x10, x10, x11   
    udiv x28, x10, x12  // x28 = Magnitud M_X100
    
    // Restaurar el signo real para calculos futuros
    cmp x15, #1
    bne slope_sign_done
    sub x28, xzr, x28   // Volver a negativo: 0 - M_X100
slope_sign_done:

   
    //  MATEMATICA: B_X100 (Intercepto)
  
    // B_X100 = ((sumY * 100) - (M_X100 * sumX)) / N
    mov x11, #100
    mul x10, x23, x11   // sumY * 100
    mul x12, x28, x22   // M_X100 * sumX
    sub x10, x10, x12   // NUMERADOR INTERCEPTO

    // Valor absoluto del intercepto
    mov x15, #0
    cmp x10, #0
    bge num_pos_int
    sub x10, xzr, x10
    mov x15, #1
num_pos_int:
    udiv x29, x10, x21  // x29 = Magnitud B_X100

    cmp x15, #1
    bne int_sign_done
    sub x29, xzr, x29   // Restaurar negativo
int_sign_done:


    
    // Calcular proximo valor Prediccion
    // x_future = n + 5
    mov x19, #5         // k = 5
    add x10, x21, x19   // x10 = x_future

    // y_pred = ((m_x100 * x_future) + b_x100) / 100
    mul x11, x28, x10   // pendiente * x_futura
    add x11, x11, x29   //  intercepto

    // valor absoluto para division
    mov x15, #0         // bandera de signo a 0
    cmp x11, #0
    bge num_pos_pred
    sub x11, xzr, x11   // volver positivo
    mov x15, #1         // marcar bandera
num_pos_pred:
    mov x12, #100
    udiv x22, x11, x12  // magnitud y_pred

    // restaurar signo
    cmp x15, #1
    bne pred_sign_done
    sub x22, xzr, x22
pred_sign_done:

    //  escritura de archivo (inicio)
    bl open_prediccion_futura_write
    mov x20, x0         // guardar fd en x20

    // calc=prediction
    mov x0, x20
    ldr x1, =msg_calc
    mov x2, len_msg_calc
    bl write_text

    // column=
    mov x0, x20
    ldr x1, =msg_column
    mov x2, len_msg_column
    bl write_text

    // contar letras de la columna
    mov x23, x17
    mov x24, #0
strlen_loop:
    ldrb w25, [x23], #1 // leer byte
    cbz w25, strlen_done // si es nulo, terminar
    add x24, x24, #1    // incrementar contador
    b strlen_loop
strlen_done:
  
    // imprimir nombre de columna
    mov x0, x20
    mov x1, x17
    mov x2, x24
    mov x8, #64
    svc #0

    // agregar el salto 
    mov x0, x20
    bl write_newline

    // window_start=
    mov x0, x20
    ldr x1, =msg_window_start
    mov x2, len_msg_window_start
    bl write_text
    
    mov x0, x16         // inicio de ventana
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

    // window_end=
    mov x0, x20
    ldr x1, =msg_window_end
    mov x2, len_msg_window_end
    bl write_text
    
    mov x0, x19         // fin de ventana
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

    // count=
    mov x0, x20
    ldr x1, =msg_count
    mov x2, len_msg_count
    bl write_text
    
    mov x0, x21         // n cantidad de datos
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

    // k=5
    mov x0, x20
    ldr x1, =msg_k
    mov x2, len_msg_k
    bl write_text

    // imprimir pendiente (con manejo de signo)
    mov x0, x20
    ldr x1, =msg_slope
    mov x2, len_msg_slope
    bl write_text
    
    mov x0, x28         // x28 tiene la pendiente
    cmp x0, #0
    bge print_slope_pos
    // si es negativo, imprimir guion
    mov x26, x0         
    mov x0, x20
    ldr x1, =str_minus  
    mov x2, #1
    bl write_text
    sub x0, xzr, x26    // volver positivo para write_uint
print_slope_pos:
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

    // imprimir intercepto (con manejo de signo)
    mov x0, x20
    ldr x1, =msg_intercept
    mov x2, len_msg_intercept
    bl write_text
    
    mov x0, x29         // x29 tiene el intercepto
    cmp x0, #0
    bge print_int_pos
    mov x26, x0
    mov x0, x20
    ldr x1, =str_minus
    mov x2, #1
    bl write_text
    sub x0, xzr, x26    
print_int_pos:
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

    // imprimir prediccion (con manejo de signo)
    mov x0, x20
    ldr x1, =msg_predicted
    mov x2, len_msg_predicted
    bl write_text
    
    mov x0, x22         // x22 tiene la prediccion
    cmp x0, #0
    bge print_pred_pos
    // si es negativo, imprimir guion
    mov x26, x0
    mov x0, x20
    ldr x1, =str_minus
    mov x2, #1
    bl write_text
    sub x0, xzr, x26    
print_pred_pos:
    mov x1, x20
    bl write_uint
    mov x0, x20
    bl write_newline

   

    // cerrar archivo para no perder buffer
    mov x0, x20
    bl close_output_file
    b exit_ok

error_rango_insuficiente:
    // abrir archivo para escribir el error
    bl open_prediccion_futura_write 
    mov x20, x0 

    // imprimir estado de error
    mov x0, x20
    ldr x1, =msg_err_status
    mov x2, len_msg_err_status
    bl write_text

    // imprimir insuficiencia de datos
    mov x0, x20
    ldr x1, =msg_err_insuf
    mov x2, len_msg_err_insuf
    bl write_text

    // imprimir detalle exacto del error
    mov x0, x20
    ldr x1, =msg_err_detail
    mov x2, len_msg_err_detail
    bl write_text

    // cerrar archivo
    mov x0, x20
    bl close_output_file

    // salir con codigo de error
    mov sp, x18     // restaurar stack original
    mov x0, #1      // codigo de salida 1 (error)
    mov x8, #93     // syscall exit
    svc #0

exit_ok:
    mov sp, x18     // restaurar stack original
    mov x0, #0      // codigo de salida 0 (exito)
    mov x8, #93     // syscall exit
    svc #0