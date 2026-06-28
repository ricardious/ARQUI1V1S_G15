// funcion para obtener ideal

.text
//entrada:
// x11 = # de column
// salida:
// x0 = valor ideal 

.global obtener_valor_ideal

obtener_valor_ideal:

    cmp x11, #1
    beq temp

    cmp x11, #2
    beq hum

    cmp x11, #3
    beq soil

    cmp x11, #4
    beq soil

    cmp x11, #5
    beq luz

    cmp x11, #6
    beq gas

    mov x0, #0
    ret


temp:
    ldr x0, =TEM_IDEAL
    ldr x0, [x0]
    ret

hum:
    ldr x0, =HUM_IDEAL
    ldr x0, [x0]
    ret

soil:
    ldr x0, =SOIL_IDEAL
    ldr x0, [x0]
    ret

luz:
    ldr x0, =LUZ_IDEAL
    ldr x0, [x0]
    ret

gas:
    ldr x0, =GAS_IDEAL
    ldr x0, [x0]
    ret

