.data
msg_soil1_inicio:   
    .ascii "ACTION=RIEGO_1_ON\nTARGET=SOIL1\nRISK=HIGH\nREASON=SOIL1_LOW_AND_DESCENDING\nVALUE="
len_soil1_inicio = . - msg_soil1_inicio

msg_soil1_medio:    
    .ascii "\nINDICATOR="
len_soil1_medio = . - msg_soil1_medio

msg_soil1_fin:      
    .ascii "\nSTATUS=OK\n\n"
len_soil1_fin = . - msg_soil1_fin

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

    str x30, [sp, #-16]!

    // imprimir la parte inicial
    mov x0, #1          // fd
    ldr x1, =msg_soil1_inicio
    mov x2, len_soil1_inicio
    bl write_text

    // pasar el valor de VALUE
    mov x0, x23         // numero a escribir (promedio)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte media
    mov x0, #1
    ldr x1, =msg_soil1_medio
    mov x2, len_soil1_medio
    bl write_text

    // pasar el valor de INDICATOR
    mov x0, x24         // numero a escribir (tendencia)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte final
    mov x0, #1              
    ldr x1, =msg_soil1_fin
    mov x2, len_soil1_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1          // retorna 1 para indicar que se debe activar el riego 1
    ret

soil1_normal:
    mov x0, #0          // retorna 0 de estado normal
    ret