// Biblioteca Utils
//Modulos importantes a llenar son:
// Manejo de archivo (abrir, leer y cerrar)
// Navegación en un archivo como: saltar encabezado, saltar a la siguiente columna
// Conversión de texto a numero : atoi_csv  (utils_save_number)
// read_column_to_stack
//Manejo de errores 



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