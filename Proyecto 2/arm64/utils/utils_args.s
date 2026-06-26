// Leer columna desde argumento de consola
// Espera ejecutar el modulo asi:
// ./modulo archivo.csv linea_inicial linea_final columna
// Salida:
// x13 = linea inicial
// x14 = linea final
// x24 = direccion del archivo
// x25 = puntero al nombre de la columna
get_column_arg:
    // guardar direccion de retorno
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    // argc esta en [sp + 16] 
    ldr x0, [x29, #16]

    // validar que exista argv[1]
    cmp x0, #5      //ahora tambien validara arg[2] y 3 que son las lineas para el rango
    blt arg_error

    //direccion del archivo archivo
    ldr x24, [x29, #32]

    // argv[2] esta en [sp + 16] original
    // como ahora se guardo x29, se debe acceder a [x29 + 32]
    ldr x21, [x29, #40]

    // convertir parametro a numero
    bl atoi_csv

    // si no encontro numero, error
    cbz x7, arg_error

    // linea inicial
    mov x13, x10

    ldr x21, [x29, #48]     // línea final
    bl atoi_csv
    cbz x7, arg_error
    mov x14, x10            // x14 = linea final

    // validar que linea inicial sea mayor o igual a 1
    cmp x13, #1
    blt arg_error

    // validar que linea final sea mayor o igual que linea inicial
    cmp x14, x13
    blt arg_error

    ldr x25, [x29, #56]     // puntero de la columna

    // recuperar direccion original de retorno
    ldp x29, x30, [sp], #16
    ret
