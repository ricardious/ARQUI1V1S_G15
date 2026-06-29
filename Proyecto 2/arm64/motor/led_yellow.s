.data

msg_led_yellow_inicio:
    .ascii "ACTION=LED_YELLOW\nTARGET=SYSTEM\nRISK=MEDIUM\nREASON=VARIABLE_NEAR_THRESHOLD\nVALUE="
len_led_yellow_inicio = . - msg_led_yellow_inicio

msg_led_yellow_medio:
    .ascii "\nINDICATOR="
len_led_yellow_medio = . - msg_led_yellow_medio

msg_led_yellow_fin:
    .ascii "\nSTATUS=OK\n\n"
len_led_yellow_fin = . - msg_led_yellow_fin

.text
.global evaluar_advertencia

// detecta si gas o temp estan en zona de advertencia (cerca del umbral de riesgo)
// promedio gas = x11
//promedio temp = x19

evaluar_advertencia:
    ldr x0, =GAS_ADVERTENCIA
    ldr x0, [x0]
    cmp x11, x0
    bgt activar_led_yellow  // promedio gas > 300

    ldr x0, =TEMP_ADVERTENCIA
    ldr x0, [x0]
    cmp x19, x0
    bgt activar_led_yellow  // promedio temp > 29

    mov x0, #0
    ret

activar_led_yellow:
    str x30, [sp, #-16]!

    mov x0, #1
    ldr x1, =msg_led_yellow_inicio
    mov x2, len_led_yellow_inicio
    bl write_text

    mov x0, x11             // VALUE = promedio gas
    mov x1, #1
    bl write_int

    mov x0, #1
    ldr x1, =msg_led_yellow_medio
    mov x2, len_led_yellow_medio
    bl write_text

    mov x0, x19             // INDICATOR = promedio temp
    mov x1, #1
    bl write_int

    mov x0, #1
    ldr x1, =msg_led_yellow_fin
    mov x2, len_led_yellow_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret
    