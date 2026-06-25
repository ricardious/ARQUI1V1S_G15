.data
//buffers
temp_array:
    .quad 0, 0, 0, 0, 0

hum_array:
    .quad 0, 0, 0, 0, 0

soil1_array:
    .quad 0, 0, 0, 0, 0

soil2_array:
    .quad 0, 0, 0, 0, 0

luz_array:
    .quad 0, 0, 0, 0, 0

gas_array:
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
//.include "motor/tendencia.s"
//.include "motor/amplitud.s"
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
    ldr x3, =temp_array 
    bl guardar_dato

    // IR GUARDAN SECUENCIALMENTE TODOS
    // LOS DATOS EN LOS ARRAY /TEMP /HUM /...
    //Humedad
    bl atoi_csv

    mov x0,x10
    ldr x1,=hum_count
    ldr x3,=hum_array
    bl guardar_dato

    // soil1
    bl atoi_csv

    mov x0,x10
    ldr x1,=soil1_count
    ldr x3,=soil1_array
    bl guardar_dato

    //soli2
    bl atoi_csv

    mov x0,x10
    ldr x1,=soil2_count
    ldr x3,=soil2_array
    bl guardar_dato

    //luz
    bl atoi_csv

    mov x0,x10
    ldr x1,=luz_count
    ldr x3,=luz_array
    bl guardar_dato

    //gas
    bl atoi_csv

    mov x0,x10
    ldr x1,=gas_count
    ldr x3,=gas_array
    bl guardar_dato

    b main_loop

    // calcular el promedio de cada array
    // calcular promedio
    // del array
    // x3 = direccion del array
    // x2 = cantidad de elementos en el array
    //bl calcular_promedio //metodo que vendra de motor


end_program:
    mov x0, #0
    mov x8, #93
    svc #0
