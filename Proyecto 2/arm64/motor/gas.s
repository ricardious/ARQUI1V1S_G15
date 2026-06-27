.data

msg_alarm_inicio:   
    .ascii "ACTION=ALARM_ON\nTARGET=GAS\nRISK=CRITICAL\nREASON=HIGH_GAS_OR_HIGH_AMP\nVALUE="
len_alarm_inicio = . - msg_alarm_inicio

msg_alarm_medio:    
    .ascii "\nINDICATOR="
len_alarm_medio = . - msg_alarm_medio

msg_alarm_fin:      
    .ascii "\nSTATUS=OK\n\n"
len_alarm_fin = . - msg_alarm_fin

.text
.global evaluar_gas

// promedio = x11
// amplitud = x12

evaluar_gas:
    ldr x0, =GAS_ALTO
    ldr x0, [x0]
    cmp x11, x0
    bgt activar_alarma      // si promedio > umbral, activar alarma

    ldr x0, =GAS_AMP_ALTA
    ldr x0, [x0]
    cmp x12, x0
    bgt activar_alarma      // si amplitud > umbral, activar alarma

    mov x0, #0
    ret

activar_alarma:
    str x30, [sp, #-16]!

    // imprimir la parte inicial
    mov x0, #1
    ldr x1, =msg_alarm_inicio
    mov x2, len_alarm_inicio
    bl write_text

    // pasar el valor de VALUE
    mov x0, x11     // numero a escribir (promedio)
    mov x1, #1      // fd
    bl write_int

    // imprimir la parte media
    mov x0, #1
    ldr x1, =msg_alarm_medio
    mov x2, len_alarm_medio
    bl write_text

    // pasar el valor de INDICATOR
    mov x0, x12     // numero a escribir (amplitud)
    mov x1, #1      //fd
    bl write_int

    // imprimir la parte final
    mov x0, #1              
    ldr x1, =msg_alarm_fin
    mov x2, len_alarm_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret