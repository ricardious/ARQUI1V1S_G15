.data
//buffers
temp_buffer:
    .quad 0, 0, 0, 0, 0

hum_buffer:
    .quad 0, 0, 0, 0, 0

soil1_buffer:
    .quad 0, 0, 0, 0, 0

soil2_buffer:
    .quad 0, 0, 0, 0, 0

luz_buffer:
    .quad 0, 0, 0, 0, 0

gas_buffer:
    .quad 0, 0, 0, 0, 0

//contadores
temp_count:  .quad 0
hum_count:   .quad 0
soil1_count: .quad 0
soil2_count: .quad 0
luz_count:   .quad 0
gas_count:   .quad 0


msg_no_action:
    .ascii "ACTION=NO_ACTION\n"
    len_led_on = . - msg_no_action


.bss

input_buffer:
    .skip 128

.text
.global _start

.include "utils.s"
.include "motor/array.s"
.include "motor/promedio.s"
.include "motor/tendencia.s"
.include "motor/amplitud.s"
_start:

main_loop:
    // read(stdin, input_buffer, 64)
    mov x0, #0
    ldr x1, =input_buffer
    mov x2, #128
    mov x8, #63
    svc #0

    // si no hay datos
    cmp x0, #0
    ble end_program

    // convertir a entero
    ldr x21, =input_buffer
    bl atoi_csv

    // si no hay numero al inicio
    cbz x7, main_loop

    // guardar en array
    mov x0, x10
    ldr x1, =temp_count
    ldr x3, =temp_buffer 
    bl guardar_dato

    ldr x0, =temp_buffer
    ldr x1, =temp_count
    bl promedio

    ldr x0, =temp_buffer
    ldr x1, =temp_count
    bl tendencia

    //Humedad
    bl atoi_csv

    mov x0,x10
    ldr x1,=hum_count
    ldr x3,=hum_buffer
    bl guardar_dato

    ldr x0, =hum_buffer
    ldr x1, =hum_count
    bl promedio

    ldr x0, =hum_buffer
    ldr x1, =hum_count
    bl amplitud

    // soil1
    bl atoi_csv

    mov x0,x10
    ldr x1,=soil1_count
    ldr x3,=soil1_buffer
    bl guardar_dato

    ldr x0, =soil1_buffer
    ldr x1, =soil1_count
    bl promedio

    ldr x0, =soil1_buffer
    ldr x1, =soil1_count
    bl tendencia

    //soli2
    bl atoi_csv

    mov x0,x10
    ldr x1,=soil2_count
    ldr x3,=soil2_buffer
    bl guardar_dato

    ldr x0, =soil2_buffer
    ldr x1, =soil2_count
    bl promedio

    ldr x0, =soil2_buffer
    ldr x1, =soil2_count
    bl tendencia

    //luz
    bl atoi_csv

    mov x0,x10
    ldr x1,=luz_count
    ldr x3,=luz_buffer
    bl guardar_dato

    ldr x0, =luz_buffer
    ldr x1, =luz_count
    bl promedio
    mov x25, x0

    ldr x0, =luz_buffer
    ldr x1, =luz_count
    bl tendencia
    mov x26, x0

    //gas
    bl atoi_csv

    mov x0,x10
    ldr x1,=gas_count
    ldr x3,=gas_buffer
    bl guardar_dato

    ldr x0, =gas_buffer
    ldr x1, =gas_count
    bl promedio
    mov x11, x0


    ldr x0, =gas_buffer
    ldr x1, =gas_count
    bl amplitud
    mov x12, x0

    b main_loop

promedio:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]

    bl calcular_promedio
    ret
tendencia:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]

    bl calcular_tendencia
    ret

amplitud:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]

    bl calcular_amplitud
    ret
end_program:
    mov x0, #0
    mov x8, #93
    svc #0