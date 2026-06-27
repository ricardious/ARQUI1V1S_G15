.data
//FAN_ON = activar ventilacion 
msg_fan_on: 
    .ascii "ACTION=FAN_ON\nTARGET=TEMP\nRISK=HIGH\nREASON=TEMP_HIGH_AND_ASCENDING\nSTATUS=OK\n\n"
len_fan_on = . - msg_fan_on

.text

.global evaluar_temperatura
//entrada / temp apoya decisiones de ventilación
// x19 = promedio temperatura
// x20 = tendencia acumulada
evaluar_temperatura:
    ldr x0, =TEMP_ALTA  //cargo el valor de referencua
    ldr x0, [x0]

    // valido el promedio
    cmp x19, x0
    blt mantener_apagado    // promedio < temp_alta

    cmp x20, #0
    ble mantener_apagado    // tendencia <= (es estable o descendente)
    
    str x30, [sp, #-16]!
    // se cumplen ambas condiciones, activar ventilacion
    mov x0, #1
    ldr x1, =msg_fan_on 
    mov x2, len_fan_on
    bl write_text //se retorna al motor principal
    ldr x30, [sp], #16

    mov x0, #1
    ret
mantener_apagado:
    mov x0, #0
    ret