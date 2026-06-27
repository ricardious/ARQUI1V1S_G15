// mide si los valores recientes aumentan, disminuyen o estan estable

// DIF_i = X_i -X(i-1)
// DIF_ACUM = suma(DIF_i)

// si DIF_ACUM >0 = tendencia ascendente
// si DIF_ACUM < 0 = tendencia descendente
// si DIF_ACUM = 0 = tendencia estable


// entrada 
// x3 = direccion del buffer
// x2 = cantidad de datos
//salida 
// x0 = diferencia acumulada

calcular_tendencia:
    //necesitamos por lo menos dos datos
    cmp x2, #2
    blt tendencia_cero      // '<'

    mov x4, #1      // indice
    mov x5, #0      // dif_acum

tendencia_loop:
    cmp x4, x2
    beq fin_tendencia

    //offset del dato actual
    mov x6, #8
    mul x7, x4, x6

    //cargo el dato actula
    ldr x8, [x3, x7]

    //dato anterior
    sub x9, x4, #1
    mul x10, x9, x6

    //ahora cargo dato anterior
    ldr x11, [x3, x10]

    sub x12, x8, x11    // actual - anterior

    add x5, x5, x12     // dif_acum

    add x4, x4, #1      // siguiente indice
    b tendencia_loop

fin_tendencia:
    mov x0, x5
    ret

tendencia_cero:
    mov x0, #0
    ret
