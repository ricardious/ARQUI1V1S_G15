.data

msg_led_red_inicio:
    .ascii "ACTION=LED_RED\nTARGET=SYSTEM\nRISK=HIGH\nREASON=VARIABLE_NEAR_CRITICAL\nVALUE="
len_led_red_inicio = . - msg_led_red_inicio

msg_led_red_medio:
    .ascii "\nINDICATOR="
len_led_red_medio = . - msg_led_red_medio

msg_led_red_fin:
    .ascii "\nSTATUS=OK\n\n"
len_led_red_fin = . - msg_led_red_fin

.text
.global evaluar_riesgo_alto

// detecta si gas o temp estan en zona de riesgo alto (cerca del umbral critico)
// promedio gas = x11
// amplitud gas = x12
// promedio temp = x19

evaluar_riesgo_alto:
    // verificar gas en zona riesgo (entre GAS_ADVERTENCIA y GAS_ALTO)
    ldr x0, =GAS_RIESGO
    ldr x0, [x0]
    cmp x11, x0
    bgt activar_led_red     // promedio gas > 350

    // verificar temp en zona riesgo (entre TEMP_ADVERTENCIA y TEMP_ALTA)
    ldr x0, =TEMP_RIESGO
    ldr x0, [x0]
    cmp x19, x0
    bgt activar_led_red     // promedio temp > 32

    mov x0, #0
    ret

activar_led_red:
    str x30, [sp, #-16]!

    mov x0, #1
    ldr x1, =msg_led_red_inicio
    mov x2, len_led_red_inicio
    bl write_text

    mov x0, x11             // VALUE = promedio gas
    mov x1, #1
    bl write_int

    mov x0, #1
    ldr x1, =msg_led_red_medio
    mov x2, len_led_red_medio
    bl write_text

    mov x0, x19             // INDICATOR = promedio temp
    mov x1, #1
    bl write_int

    mov x0, #1
    ldr x1, =msg_led_red_fin
    mov x2, len_led_red_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret
    