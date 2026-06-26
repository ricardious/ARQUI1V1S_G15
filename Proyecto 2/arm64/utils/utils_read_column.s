// leer columna especifica de un archivo CSV y guardarla en el stack
// Entrada:
//  x11 = numero de columna a leer
// x13 = linea inicial
// x14 = linea final
//x15 = contador de fila
// Salida:
//  x0 = inicio de datos en stack
//  x1 = limite sfinal de datos
//  x2 = cantidad de datos leidos
//  x3 = posicion para restaurar el stack
read_column_to_stack:
    // guardar direccion de retorno
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    // x28 = limite superior de datos
    mov x28, sp

    // x27 = posicion para restaurar stack
    add x27, x28, #16

    mov x5, #10             // base 10
    mov x22, #0             // contador de numeros

    // abrir archivo
    bl open_csv_read

    // leer archivo
    bl read_file

    // cerrar archivo
    bl close_file

    // apuntar al inicio del buffer
    ldr x21, =buffer
    // obtiene el # de la columna desde el encabezado
    bl find_column_by_name

    // saltar encabezado
    bl skip_to_next_line

    cmp w23, '$'
    beq read_column_return

    mov x15, #1 

read_column_process_line:
    //verificamos que existan las filas
    cmp x15, x13    // linea actual < linia inial
    blt saltar_linea //salto porque todavia no estoy en la linea que quiero

    cmp x15, x14    // si linea actual > linea final
    bgt read_column_return //como es mayor finalizo

    mov x12, #1             // columna actual

read_column_find_column:
    cmp x12, x11
    beq read_column_read_value

    bl saltar_columna

    cmp w23, '$'
    beq read_column_return

    cmp w23, #10
    beq next_line_no_column //llego al final antes de encontrar la columna, por eso pasa a la siguiente fila
    // si fue coma, avanzar contador de columna
    add x12, x12, #1
    b read_column_find_column

next_line_no_column:    //continua a la siguiente fila si la column no existe en mi fila actual
    add x15, x15, #1
    b read_column_process_line

read_column_read_value:
    bl atoi_csv

    cbz x7, read_column_after_value

    // guardar numero convertido
    bl save_number_to_stack

// despues de leer la columna, saltar al final de la linea
read_column_after_value:
    cmp w23, '$'
    beq read_column_return

    cmp w23, #10
    bne continue_after_value

    add x15, x15, #1
    b read_column_process_line

continue_after_value: 
    //salta el resto de la fila actual
    bl skip_to_next_line

    add x15, x15, #1    //paso a la sig fila

    cmp w23, '$'
    beq read_column_return

    b read_column_process_line  // se procesa la siguiente fila

read_column_return:
    // si no se guardaron datos, el rango no existe o no produjo datos
    cmp x22, #0
    beq range_error

    // Si el archivo terminó antes de llegar a la línea final, el rango no existe completo
    cmp x15, x14
    blt range_error

    mov x0, sp              // inicio de datos
    mov x1, x28             // limite final
    mov x2, x22             // cantidad de datos
    mov x3, x27             // restaurar stack

    // recuperar direccion original de retorno
    ldr x30, [x29, #8]
    ret
