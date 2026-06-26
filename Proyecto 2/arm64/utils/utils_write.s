// Escribir texto con longitud conocida
// x0: descriptor del archivo
// x1: direccion del texto
// x2: cantidad de bytes
write_text:
    mov x8, #64 // syscall write
    svc #0

    cmp x0, #0
    blt write_error

    ret

// Escribir salto de linea
write_newline:
    ldr x1, =newline_text
    mov x2, #1
    mov x8, #64 // syscall write
    svc #0

    cmp x0, #0
    blt write_error

    ret

// Escribir uint como string
// x0: numero a escribir
// x1: descriptor del archivo
write_uint:
    mov x9, x1 // guardar descriptor
    ldr x1, =num_buffer
    add x1, x1, #31 // apuntar al final del buffer

    mov w2, #0
    strb w2, [x1] // escribir terminador de string

    mov x3, #10 // base 10
    mov x4, #0 // bandera de numero activo

    cmp x0, #0
    bne convert_loop

    sub x1, x1, #1
    mov w2, '0'
    strb w2, [x1] // escribir '0' si el numero es 0

    mov x4, #1 // marcar que se escribio un numero
    b write_number

// Escribir entero con signo
// x0: numero a escribir
// x1: descriptor del archivo
write_int:
    // si el numero es positivo o cero, usar write_uint
    cmp x0, #0
    bge write_uint

    // guardar descriptor del archivo
    mov x9, x1

    // convertir numero negativo a positivo
    mov x10, #0
    sub x10, x10, x0

    // escribir signo menos
    mov x0, x9
    ldr x1, =minus_text
    mov x2, #1
    mov x8, #64 // syscall write
    svc #0

    cmp x0, #0
    blt write_error

    // escribir numero positivo
    mov x0, x10
    mov x1, x9
    b write_uint

convert_loop:
    udiv x5, x0, x3
    msub x6, x5, x3, x0

    add x6, x6, '0'

    sub x1, x1, #1
    strb w6, [x1]

    add x4, x4, #1

    mov x0, x5
    cbnz x0, convert_loop

write_number:
    mov x0, x9 // descriptor
    mov x2, x4 // cantidad de digitos
    mov x8, #64 // syscall write
    svc #0

    cmp x0, #0
    blt write_error

    ret
