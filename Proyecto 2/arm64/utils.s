// Biblioteca Utils
//Modulos importantes a llenar son:
// Manejo de archivo (abrir, leer y cerrar)
// Navegación en un archivo como: saltar encabezado, saltar a la siguiente columna
// Conversión de texto a numero : atoi_csv  (utils_save_number)
// read_column_to_stack
//Manejo de errores 


//Registros utilizados 
// x11 = columna selecciona
// x21 = direccion de buffer (skip_to_next_line)
// w23 = ultimo byte leido / byte que detuvo el ultimo salto o conversion (skip_to_next_line)
// x12 = columna actual durante el reccorido de una fila

//Área para navegación de archivo, saltar encabezado
//skip_to_next_line 
//Que hace? , salta el caracteres hasta encontrar el final de una linea o caracter especial
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

inicio_columna:
    mov x12, #1

// busca la columna
find_column_loop:
    cmp x12, x11  //comparamos la columna con la columna a buscar
    //beq read_column //si la correcta entonces procedemos a leer la columna

    bl santar_columna  //como no estamos en la columna que queremos entonces saltamos a la siguiente

    cmp w23, '$'    // si es el fin del archivo 
    //beq utils_done  //llammos utils donne, que termina reccorrido, prepara y regresa al programa principal

    cmp w23, #10    //si es un salto de linea
    //beq process_line  // termino de analizzar y no encontro, por eso proces_line reinicia

    add x12, x12, #1 // columna ++
    b find_column_loop // y volvwmos a comparar