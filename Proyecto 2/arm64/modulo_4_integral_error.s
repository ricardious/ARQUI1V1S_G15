.data
msg_module:
    .ascii "CALC=ERROR_INTEGRAL\n"
    len_msg_module = . - msg_module

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column

msg_start:
    .ascii "\nWINDOW_START="
    len_msg_start = . - msg_start

msg_end:
    .ascii "\nWINDOW_END="
    len_msg_end = . - msg_end

msg_count:
    .ascii "\nCOUNT="
    len_msg_count = . - msg_count

msg_ideal:
    .ascii "\nIDEAL="
    len_msg_ideal = . - msg_ideal

msg_error_integral:
    .ascii "\nERROR_INTEGRAL="
    len_msg_error_integral = . - msg_error_integral

msg_status:
    .ascii "\nSTATUS=OK\n"
    len_msg_status = . - msg_status

msg_err_status:
    .ascii "STATUS=ERROR\nERROR=INSUFFICIENT_DATA\nDETAIL=INTEGRAL_REQUIRES_AT_LEAST_2_VALUES\n"
len_err_status = . - msg_err_status

.text
.global _start

.include "utils.s"

_start:
    // obtener argumentos de la consola
    // x13 = linea inicial
    // x14 = linea final
    // x24 = path archivo
    // x25 = puntero nombre columna
    bl get_column_arg

    // leer columna del archivo y cargarla al stack
    bl read_column_to_stack

    // guardar los retornos en registros estables
    mov x23, x0     // x23 = direccion de inicio de datos en el stack (lista Y)
    mov x20, x2     // x20 = cantidad de datos (N)
    mov x26, x3     // x26 = direccion para restaurar el stack

    mov x27, x13    // x27 = WINDOW_START
    mov x28, x14    // x28 = WINDOW_END

    // validar que al menos hayan 2 datos
    cmp x20, #2
    blt manejar_error_datos

    bl obtener_valor_ideal  // retorna el valor ideal en x0
    mov x22, x0

    // calculos
    mov x3, x23             // x3 = puntero iterador de la lista Y
    mov x4, x22             // x4 = valor ideal seleccionado
    sub x5, x20, #1         // x5 = contador de iteraciones (N - 1 parejas)
    mov x6, #0              // x6 = AREA_ERROR (acumulador total)

    // calcular el primer error (Y_0 - IDEAL)
    ldr x7, [x3], #8        // cargar Y_0 y avanzar el puntero 8 bytes
    sub x8, x7, x4          // x8 = Y_0 - IDEAL

    cmp x8, #0              // evaluar si el error es positivo o negativo
    b.ge error_0_positivo   // si es >= 0, saltar la conversion
    neg x8, x8              // si es menor a 0, cambiar signo: abs(ERROR_0)

error_0_positivo:
    // x8 es positivo

loop_integral:
    cbz x5, fin_calculo     // si ya se procesaron las N-1 parejas, salir

    // calcular el siguiente error (Y_(i+1) - IDEAL)
    ldr x9, [x3], #8        // cargar Y_(i+1) y avanzar el puntero 8 bytes
    sub x10, x9, x4         // x10 = Y_(i+1) - IDEAL

    cmp x10, #0             // evaluar signo del siguiente error
    b.ge error_next_positivo
    neg x10, x10            // cambiar signo si es negativo: abs(ERROR_NEXT)

error_next_positivo:
    // x10 es positivo

    // AREA_TRAPECIO = (ERROR_i + ERROR_NEXT) / 2
    add x11, x8, x10        // suma de los errores absolutos
    mov x12, #2
    udiv x11, x11, x12      // division truncads
    // AREA_ERROR = AREA_ERROR + AREA_TRAPECIO
    add x6, x6, x11

    // preparar para la siguiente iteracion
    mov x8, x10             // el ERROR_NEXT actual se vuelve el ERROR_i de la siguiente iteracion
    sub x5, x5, #1          // decrementar el contador de parejas restantes
    b loop_integral

    fin_calculo:
    mov x24, x6             // resultado final acumulado 

    bl open_integral_error_write 
    mov x15, x0             // guardar el fd en x15

    // CALC=ERROR_INTEGRAL
    mov x0, x15             // fd de salida
    ldr x1, =msg_module
    mov x2, len_msg_module
    bl write_text

    // COLUMN=
    mov x0, x15
    ldr x1, =msg_column
    mov x2, len_msg_column
    bl write_text

    // imprimir nombre de la columna
    mov x0, x15
    mov x1, x25
    bl write_cstring

    // WINDOW_START=
    mov x0, x15
    ldr x1, =msg_start
    mov x2, len_msg_start
    bl write_text

    // imprimir numero de inicio
    mov x0, x27
    mov x1, x15
    bl write_int

    // WINDOW_END=
    mov x0, x15
    ldr x1, =msg_end
    mov x2, len_msg_end
    bl write_text

    // imprimir numero de fin
    mov x0, x28
    mov x1, x15
    bl write_int

    // COUNT=
    mov x0, x15
    ldr x1, =msg_count
    mov x2, len_msg_count
    bl write_text

    // cantidad N de datos procesados
    mov x0, x20
    mov x1, x15
    bl write_int

    // IDEAL=
    mov x0, x15
    ldr x1, =msg_ideal
    mov x2, len_msg_ideal
    bl write_text

    // valor ideal que se utilizo
    mov x0, x22
    mov x1, x15
    bl write_int

    // ERROR_INTEGRAL=
    mov x0, x15
    ldr x1, =msg_error_integral
    mov x2, len_msg_error_integral
    bl write_text

    // resultado final del area (error integral)
    mov x0, x24
    mov x1, x15
    bl write_int

    // STATUS=OK
    mov x0, x15
    ldr x1, =msg_status
    mov x2, len_msg_status
    bl write_text

    bl close_output_file

    b salir_programa

manejar_error_datos:
    mov x0, #1
    ldr x1, =msg_err_status
    mov x2, len_err_status
    bl write_text
    b salir_programa

salir_programa:
    mov sp, x26     // restaurar el stack con el putnero original

    mov x0, #0
    mov x8, #93
    svc #0
