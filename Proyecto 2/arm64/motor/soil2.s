.data
msg_soil2_inicio:   
    .ascii "ACTION=RIEGO_2_ON\nTARGET=SOIL2\nRISK=HIGH\nREASON=SOIL2_LOW_AND_DESCENDING\nVALUE="
len_soil2_inicio = . - msg_soil2_inicio

msg_soil2_medio:    
    .ascii "\nINDICATOR="
len_soil2_medio = . - msg_soil2_medio

msg_soil2_fin:      
    .ascii "\nSTATUS=OK\n\n"
len_soil2_fin = . - msg_soil2_fin

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

    str x30, [sp, #-16]!

    // imprimir la parte inicial
    mov x0, #1          // fd
    ldr x1, =msg_soil2_inicio
    mov x2, len_soil2_inicio
    bl write_text

    // pasar el valor de VALUE
    mov x0, x25         // numero a escribir (promedio)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte media
    mov x0, #1
    ldr x1, =msg_soil2_medio
    mov x2, len_soil2_medio
    bl write_text

    // pasar el valor de INDICATOR
    mov x0, x26         // numero a escribir (tendencia)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte final
    mov x0, #1              
    ldr x1, =msg_soil2_fin
    mov x2, len_soil2_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1          // retorna 1 para indicar que se debe activar el riego 2
    ret

soil2_normal:
    mov x0, #0          // retorna 0 de estado normal
    ret