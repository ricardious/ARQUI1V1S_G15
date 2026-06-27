.data
msg_p7_no_action:
    .ascii "\nACTION=NO_ACTION\nTARGET=SYSTEM\nRISK=LOW\nREASON=ALL_VARIABLES_UNDER_CONTROL\nSTATUS=OK\n\n"
len_p7_no_action = . - msg_p7_no_action

msg_p6_led_green:
    .ascii "\nACTION=LED_GREEN\nTARGET=SYSTEM\nRISK=LOW\nREASON=ALL_VARIABLES_UNDER_CONTROL\nSTATUS=OK\n\n"
len_p6_led_green = . - msg_p6_led_green
.text
.global evaluar_prioridades

evaluar_prioridades:
    str x30, [sp, #-16]!
    // niveles de prioridad
    // 1) gas: promedio(x11) y amplitud elevado (x12) / ALARM_ON 
    bl evaluar_gas
    cbnz x0, salir_prioridad

    // 2) soil1: promedio bajo (x23) y tendencia descendente (x24) / RIEGO_1_ON
    bl evaluar_soil1
    cbnz x0, salir_prioridad

    // 3) soil2: promedio bajo (x25) y tendencia descendente (x26) / RIEGO_2_ON
    bl evaluar_soil2
    cbnz x0, salir_prioridad

    // 4) luz: promedio bajo (x27) y tendencia descendente (x28) / LIGHT_ON
    bl evaluar_luz
    cbnz x0, salir_prioridad
    
    // 5) temp: promedio alto (x19) y tendencia ascendente (x20)/ FAN_ON
    bl evaluar_temperatura
    cbnz x0, salir_prioridad
    
    cmp x13, #0             //  modo es automático?
    bne prioridad_7         // != cero (Manual), salta a NO_ACTION

prioridad_6:
    // 6 , led green 
    mov x0, #1
    ldr x1, =msg_p6_led_green
    mov x2, len_p6_led_green
    bl write_text
    b salir_prioridad       // Termina y sale 

prioridad_7:
    // 7, no action (sin acción física)
    mov x0, #1
    ldr x1, =msg_p7_no_action
    mov x2, len_p7_no_action
    bl write_text
    
salir_prioridad:
    ldr x30, [sp], #16
    ret