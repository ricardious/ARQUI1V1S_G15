//primedio recientes 
// promedio = suma de xi / n
// n cantidad de datos

// entrada
// x3 = direccion del array
// x2 = cantidad de datos
// salida x0 con el calculo del promedio 

calcular_promedio:
    mov x4, #0      // indice
    mov x5, #0      // suma

sumar_loop:
    cmp x4, x2
    beq dividir_promedio

    mov x6, #8
    mul x7, x4, x6  //  offset del dato en el array

    ldr x8, [x3, x7]        // lee el elemento del arreglo
    add x5, x5, x8      // x5 = x5 + x8

    add x4, x4, #1      // indice ++
    b sumar_loop

dividir_promedio:
    cmp x2, #0
    beq promedio_cero

    udiv x0, x5, x2     // suma (x5)/ N (x2)
    ret

promedio_cero:
    mov x0, #0
    ret