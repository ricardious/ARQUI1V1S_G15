// Biblioteca comun ARM64 del Proyecto
.data

csv_path:
    .asciz "../data/lecturas.csv"

err_open:
    .ascii "Error: no se pudo abrir el archivo\n"
    len_err_open = . - err_open

err_read:
    .ascii "Error: no se pudo leer el archivo\n"
    len_err_read = . - err_read

.bss

buffer:
    .skip 4096

.text

// Convertir ASCII a Entero
atoi_csv:
    mov x10, #0 // resultado = 0
    mov x7, #0 // bandera de numero activo
atoi_loop:
    ldrb w23, [x21], #1

    // verificar si es un digito
    cmp w23, '0'
    blt atoi_done

    cmp w23, '9'
    bgt atoi_done

    // convertir caracter a numero
    sub w23, w23, '0'

    // resultado = resultado * base + digito
    mov x4, x10
    mul x10, x4, x5
    add x10, x10, x23

    // marcar que se encontro un numero
    mov x7, #1

    b atoi_loop

atoi_done:
    ret

// Abrir archivo lecturas.csv
open_csv_read:
    mov x0, #-100
    ldr x1, =csv_path
    mov x2, #0
    mov x3, #0
    mov x8, #56 // syscall openat
    svc #0

    cmp x0, #0
    blt open_error

    mov x19, x0 // descriptor del archivo
    ret

// Leer archivo hacia buffer
read_file:
    mov x0, x19
    ldr x1, =buffer
    mov x2, #4096
    mov x8, #63 // syscall read
    svc #0

    cmp x0, #0
    blt read_error

    mov x20, x0 // guardar bytes leidos
    ret

// Cerrar archivo
close_file:
    mov x0, x19
    mov x8, #57 // syscall close
    svc #0
    ret

// Manejo de errores
open_error:
    mov x0, #1
    ldr x1, =err_open
    mov x2, len_err_open
    mov x8, #64 // syscall write
    svc #0
    b exit_error

read_error:
    mov x0, #1
    ldr x1, =err_read
    mov x2, len_err_read
    mov x8, #64 // syscall write
    svc #0
    b exit_error

exit_error:
    mov x0, #1
    ldr x8, #93 // syscall exit
    svc #0
