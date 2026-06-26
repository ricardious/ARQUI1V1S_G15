.data
msg_riego2_on: 
    .ascii "ACTION=RIEGO_2_ON\nTARGET=SOIL2\nRISK=HIGH\nREASON=SOIL2_LOW_AND_DESCENDING\nSTATUS=OK\n\n"
len_riego2_on = . - msg_riego2_on

.text
.global evaluar_soil2

// promedio = x25
// tendencia = x26

evaluar_soil2:
    ldr x0, =SOIL_BAJO
    ldr x0, [x0]

    cmp x25, x0
    bge soil2_normal    // si el promedio es mayor o igual esta humedo

    cmp x26, #0
    bge soil2_normal    // si la tendencia es estable o ascendente normal

    mov x0, #1
    ldr x1, =msg_riego2_on
    mov x2, len_riego2_on
    str x30, [sp, #-16]!
    bl write_text
    ldr x30, [sp], #16
    mov x0, #1          // retorna 1 para indicar que se debe activar el riego 2
    ret

soil2_normal:
    mov x0, #0          // retorna 0 de estado normal
    ret