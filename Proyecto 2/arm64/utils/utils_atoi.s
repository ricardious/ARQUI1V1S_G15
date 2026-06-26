// Convertir ASCII a Entero
atoi_csv:
    mov x10, #0 // resultado = 0
    mov x7, #0 // bandera de numero activo
    mov x5, #10 //inmediato 10 por el cual se multiplica
atoi_loop:
    ldrb w23, [x21], #1

    // verificar si es un digito
    cmp w23, '0'
    blt atoi_done

    cmp w23, '9'
    bgt atoi_done

    // convertir caracter a numero
    sub w23, w23, '0' // w23 - '0', '0' = 48 por eso devuelve el numero 

    // resultado = resultado * base + digito
    mov x4, x10
    mul x10, x4, x5
    add x10, x10, x23

    // marcar que se encontro un numero
    mov x7, #1

    b atoi_loop

atoi_done:
    ret
