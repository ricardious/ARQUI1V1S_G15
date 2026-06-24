.data

temp_array:
    .quad 0, 0, 0, 0, 0

temp_count:
    .quad 0

temp_ideal:
    .quad 30

msg_led_on:
    .ascii "ACTION=LED_ON\n"
    len_led_on = . - msg_led_on

msg_led_off:
    .ascii "ACTION=LED_OFF\n"
    len_led_off = . - msg_led_off

.bss

input_buffer:
    .skip 64

.text
.global _start

.include "utils/atoi.s"
.include "utils/array.s"

_start:

main_loop:
    // read(stdin, input_buffer, 64)
    mov x0, #0
    ldr x1, =input_buffer
    mov x2, #64
    mov x8, #63
    svc #0

    // si no hay datos
    cmp x0, #0
    ble end_program

    // convertir a entero
    ldr x21, =input_buffer
    mov x5, #10
    bl atoi_csv

    // si no hay numero al inicio
    cbz x7, main_loop

    // guardar en array
    mov x0, x10
    ldr x1, =temp_count
    ldr x3, =temp_array
    bl guardar_dato

    // IR GUARDAN SECUENCIALMENTE TODOS
    // LOS DATOS EN LOS ARRAY /TEMP /HUM /...


    // calcular el promedio de cada array
    // calcular promedio
    // del array
    // x3 = direccion del array
    // x2 = cantidad de elementos en el array
    bl calcular_promedio

    // comparar con temp_ideal
    ldr x0, =temp_ideal
    ldr x0, [x0]

    // VER QUE ACCION SE HACE CON CADA VALIDACION ( ustes tienen 2)
    // promedio la tendencia y amplitud
    // ver accion a tomar
    cmp x13, x0
    bgt imprimir_led_on

    b imprimir_led_off

calcular_promedio:
    ldr x1, =temp_array
    ldr x2, =temp_count
    ldr x2, [x2]

    mov x3, #0
    mov x4, #0

sumar_loop:
    cmp x4, x2
    beq dividir_promedio

    mov x5, #8
    mul x6, x4, x5

    ldr x7, [x1, x6]
    add x3, x3, x7

    add x4, x4, #1
    b sumar_loop

dividir_promedio:
    cmp x2, #0
    beq promedio_cero

    udiv x13, x3, x2
    ret

promedio_cero:
    mov x13, #0
    ret

imprimir_led_on:
    mov x0, #1
    ldr x1, =msg_led_on
    mov x2, len_led_on
    mov x8, #64
    svc #0
    b main_loop

imprimir_led_off:
    mov x0, #1
    ldr x1, =msg_led_off
    mov x2, len_led_off
    mov x8, #64
    svc #0
    b main_loop

end_program:
    mov x0, #0
    mov x8, #93
    svc #0
