.data
msg_alarm_on: 
    .ascii "ACTION=ALARM_ON\nTARGET=GAS\nRISK=CRITICAL\nREASON=HIGH_GAS_OR_HIGH_AMP\nSTATUS=OK\n\n"
len_alarm_on = . - msg_alarm_on

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
    mov x0, #1
    ldr x1, =msg_alarm_on
    mov x2, len_alarm_on
    str x30, [sp, #-16]!
    bl write_text
    ldr x30, [sp], #16
    mov x0, #1
    ret