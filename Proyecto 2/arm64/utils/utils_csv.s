//Registros utilizados 
// x11 = columna selecciona
// x21 = direccion de buffer 

//Área para navegación de archivo, saltar encabezado
//skip_to_next_line 
//Que hace? , salta el caracteres hasta encontrar el final de una linea o caracter especial
//Registros utilizados:
// w23=  byte leido en esa direccion 
// x21 = direccion de memoria / buffer
skip_to_next_line:
    ldrb w23, [x21], #1     // lee un byte y lo guarda en w23
    cmp w23, '$'            //  compara 
    beq utils_skip_done     // si es igual llama a skip_done

    cmp w23, #10            //compara con 10 = ascii '\n', salto de linea
    beq utils_skip_done     // si es igual llama a skip_done

    b skip_to_next_line     // si no encontro ni salto o algun caracter extraño entonces vuelve a pasar linea por linea

// marca el final de una funcion 
utils_skip_done:
    ret

//x15 = contador de fila
saltar_linea:   //salta la fila actuañ
    bl skip_to_next_line

    add x15, x15, #1    // contador de linea/fila ++

    cmp w23, '$'    //w23 = ultimo byte leido 
    beq read_column_return

    b read_column_process_line

//Salto de columna
saltar_columna:
    ldrb w23, [x21], #1 

    cmp w23, '$'
    beq utils_skip_done

    cmp w23, #10
    beq utils_skip_done

    cmp w23, ','        // compara si es una comna entonces marca el fin
    beq utils_skip_done

    b saltar_columna
//entrada 
//x21 = direccion de buffer
// x25 = ptr al nombre de la columna 
// salida x11 = # de columna encontrada
// x7 = 1 si encontro || 0 si no encontro
find_column_by_name:    //busca la column por donbre
    sub sp, sp, #16          // reservar espacio
    str x30, [sp]            // guardar la direccion de retorno que es x30

    mov x11, #1 //columna actual = 1

find_column_loop:       //loop para buscar la columna
    //inicio del nombre actual
    mov x0, x21     //x0 = direccion del buffer
    mov x1, x25  //nombre buscado que es el puntero de la columna
    bl compare_column_name  // compara ambos nombres de las columna

    cbnz x7, find_column_done //1 = coincide y 0 sino

    bl saltar_columna   // si ni una collumn coincide entonces salta al final del nombre actual

    cmp w23, '$'    //llega al final entonces no existe la columna
    beq col_error

    cmp w23, #10
    beq col_error

    add x11, x11, #1  //columna ++

    b find_column_loop

find_column_done:
    ldr x30, [sp]             // recuperar la direccion de retorno
    add sp, sp, #16           // liberar el espacio reservado
    ret

compare_column_name:    //compara nombre actual con el nombre solicitado
    mov x7, #0      // por ahora no hay coincidenci

    mov x2, x0          // nombre del CSV
    mov x3, x1          // nombre buscado

compare_loop:   //lee c/caracter de cada cadena
    ldrb w4, [x2], #1   // se carga un byte del CSV que viene de compare
    ldrb w5, [x3], #1   

    // si llegamos al final del nombre del CSV se termina
    cmp w4, ','
    beq compare_end

    cmp w4, #10 //si es \n entonces llama a compare_end
    beq compare_end

    cmp w4, '$'     //fin de archivo
    beq compare_end

    // si los caracteres !=
    cmp w4, w5
    bne compare_not_equal

    b compare_loop

compare_end:
    // verificar que también termino el nombre buscado
    cmp w5, #0          // '\0'
    bne compare_not_equal

    mov x7, #1
    ret

compare_not_equal:
    mov x7, #0
    ret
