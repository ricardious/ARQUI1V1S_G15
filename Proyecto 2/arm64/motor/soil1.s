.data
msg_riego1_on: 
    .ascii "ACTION=RIEGO_1_ON\nTARGET=SOIL1\nRISK=HIGH\nREASON=SOIL1_LOW_AND_DESCENDING\nSTATUS=OK\n\n"
len_riego1_on = . - msg_riego1_on

.text
.global evaluar_soil1

// promedio = x23
// tendencia = x24

evaluar_soil1:
    ldr x0, =SOIL_BAJO
    ldr x0, [x0]

    cmp x23, x0
    bge soil1_normal    // si el promedio es mayor o igual esta humedo

    cmp x24, #0
    bge soil1_normal    // si la tendencia es estable o ascendente normal

    mov x0, #1
    ldr x1, =msg_riego1_on
    mov x2, len_riego1_on
    str x30, [sp, #-16]!
    bl write_text
    ldr x30, [sp], #16
    mov x0, #1          // retorna 1 para indicar que se debe activar el riego 1
    ret

soil1_normal:
    mov x0, #0          // retorna 0 de estado normal
    ret