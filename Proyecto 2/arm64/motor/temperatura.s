.data
//FAN_ON = activar ventilacion 

msg_fan_inicio: 
    .ascii "ACTION=FAN_ON\nTARGET=TEMP\nRISK=HIGH\nREASON=TEMP_HIGH_AND_ASCENDING\nVALUE="
len_fan_inicio = . - msg_fan_inicio

msg_fan_medio:    
    .ascii "\nINDICATOR="
len_fan_medio = . - msg_fan_medio

msg_fan_fin:      
    .ascii "\nSTATUS=OK\n\n"
len_fan_fin = . - msg_fan_fin

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
    
    // imprimir la parte inicial
    mov x0, #1          // fd
    ldr x1, =msg_fan_inicio
    mov x2, len_fan_inicio
    bl write_text 

    // pasar el valor de VALUE
    mov x0, x19         // numero a escribir (promedio)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte media
    mov x0, #1
    ldr x1, =msg_fan_medio
    mov x2, len_fan_medio
    bl write_text

    // pasar el valor de INDICATOR
    mov x0, x20         // numero a escribir (tendencia)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte final
    mov x0, #1              
    ldr x1, =msg_fan_fin
    mov x2, len_fan_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret
    
mantener_apagado:
    mov x0, #0
    ret