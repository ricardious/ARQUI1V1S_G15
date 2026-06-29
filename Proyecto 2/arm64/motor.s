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

.global SOIL_BAJO
.global GAS_ALTO
.global GAS_AMP_ALTA
.global LUZ_BAJA
.global TEMP_ALTA
TEMP_ALTA:      .quad 35

LUZ_BAJA:       .quad 250

SOIL_BAJO:      .quad 40

GAS_ALTO:       .quad 400
GAS_AMP_ALTA:   .quad 80

msg_error_fields:
    .ascii "STATUS=ERROR\nERROR=INVALID_INPUT\nDETAIL=EXPECTED_7_FIELDS\n\n"
len_error_fields = . - msg_error_fields


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
.include "motor/temperatura.s"
.include "motor/luz.s"
.include "motor/gas.s"
.include "motor/soil1.s"
.include "motor/soil2.s"
.include "motor/prioridades.s"
.include "motor/led_red.s"
.include "motor/led_yellow.s"


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
    strb wzr, [x1, x0]
    mov x21, x1

    bl atoi_csv

    cbz x7, manejar_error_input

    // si no hay numero al inicio
    //cbz x7, main_loop

    // guardar en array
    mov x0, x10
    ldr x1, =temp_count
    ldr x3, =temp_buffer 
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =temp_buffer
    ldr x1, =temp_count
    bl promedio
    // x0 promedio 
    mov x19, x0

    ldr x0, =temp_buffer
    ldr x1, =temp_count
    bl tendencia
    mov x20, x0
    ldr x21, [sp], #16

    //Humedad
    bl atoi_csv
    cbz x7, manejar_error_input

    mov x0, x10
    ldr x1, =hum_count
    ldr x3, =hum_buffer
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =hum_buffer
    ldr x1, =hum_count
    bl promedio

    ldr x0, =hum_buffer
    ldr x1, =hum_count
    bl amplitud

    ldr x21, [sp], #16

    // soil1
    bl atoi_csv
    cbz x7, manejar_error_input

    mov x0,x10
    ldr x1,=soil1_count
    ldr x3,=soil1_buffer
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =soil1_buffer
    ldr x1, =soil1_count
    bl promedio
    mov x23, x0         // promedio de soil1

    ldr x0, =soil1_buffer
    ldr x1, =soil1_count
    bl tendencia
    mov x24, x0         // tendencia de soil1

    ldr x21, [sp], #16
    //soli2
    bl atoi_csv
    cbz x7, manejar_error_input

    mov x0,x10
    ldr x1,=soil2_count
    ldr x3,=soil2_buffer
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =soil2_buffer
    ldr x1, =soil2_count
    bl promedio
    mov x25, x0         // promedio de soil2

    ldr x0, =soil2_buffer
    ldr x1, =soil2_count
    bl tendencia
    mov x26, x0         // tendencia de soil2
    ldr x21, [sp], #16
    //luz
    bl atoi_csv
    cbz x7, manejar_error_input

    mov x0,x10
    ldr x1,=luz_count
    ldr x3,=luz_buffer
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =luz_buffer
    ldr x1, =luz_count
    bl promedio
    mov x27, x0

    ldr x0, =luz_buffer
    ldr x1, =luz_count
    bl tendencia
    mov x28, x0

    ldr x21, [sp], #16
    //gas
    bl atoi_csv
    cbz x7, manejar_error_input

    mov x0,x10
    ldr x1,=gas_count
    ldr x3,=gas_buffer
    str x21, [sp, #-16]!
    bl guardar_dato

    ldr x0, =gas_buffer
    ldr x1, =gas_count
    bl promedio
    mov x11, x0


    ldr x0, =gas_buffer
    ldr x1, =gas_count
    bl amplitud
    mov x12, x0
    ldr x21, [sp], #16

    //Modo
    bl atoi_csv
    mov x13, x10        //modo(0= automatico, 1= manual)
    cbz x7, manejar_error_input

    bl evaluar_prioridades
    b main_loop

manejar_error_input:
    mov x0, #1
    ldr x1, =msg_error_fields
    mov x2, len_error_fields
    bl write_text
    
    b main_loop

promedio:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]
    str x30, [sp, #-16]!
    bl calcular_promedio
    ldr x30, [sp], #16
    ret

tendencia:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]
    str x30, [sp, #-16]!
    bl calcular_tendencia
    ldr x30, [sp], #16
    ret

amplitud:
    // x0 = buffer
    // x1 = contador

    mov x3, x0
    ldr x2, [x1]
    str x30, [sp, #-16]!

    bl calcular_amplitud
    ldr x30, [sp], #16
    ret

end_program:
    mov x0, #0
    mov x8, #93
    svc #0
