// AMPLITUD = MAAXIMO - MINIMO
//entrada
// x3= direccion de buffer
// x2 = cantidad de datos 

//salida 
// x0 = amplitud
calcular_amplitud:

    cmp x2, #0
    beq amplitud_cero       // Si x2 = 0, salir

    // Cargar el primer elemento
    ldr x4, [x3]      // x4 = minimo
    mov x5, x4      // x5 = max

    mov x6, #1     // indice = 1, registro x6 

loop_amplitud:
    cmp     x6, x2
    bge     calcular_resultado       // Si índice >= tamaño, calcular amplitud

    // x7 = offset = indice * 8
    mov x7, #8
    mul x8, x6, x7  // desplazamiento = x8

    ldr x9, [x3, x8]    //dato actual = x9

    cmp x9, x4      // actua es > al minimo?
    bge revisar_maximo
    mov x4, x9      //actualizo el minimo
    b next

revisar_maximo:
    cmp x9, x5  //comparo con el maximo
    ble next    //  <=
    mov x5, x9      //actualizo el maximo 

next:
    add x6, x6, #1      //indice ++
    b loop_amplitud

calcular_resultado:
    sub x0, x5, x4      // max - min
    ret

amplitud_cero:
    mov     x0, #0
    ret