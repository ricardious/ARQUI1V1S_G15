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

write_error:
    mov x0, #1
    ldr x1, =err_write
    mov x2, len_err_write
    mov x8, #64 // syscall write
    svc #0
    b exit_error

exit_error:
    mov x0, #1
    mov x8, #93 // syscall exit
    svc #0

arg_error:
    mov x0, #1
    ldr x1, =err_arg
    mov x2, len_err_arg
    mov x8, #64
    svc #0

    b exit_error

col_error:
    mov x0, #1
    ldr x1, =err_col
    mov x2, len_err_col
    mov x8, #64
    svc #0
    b exit_error

range_error:
    mov x0, #1
    ldr x1, =err_range
    mov x2, len_err_range
    mov x8, #64
    svc #0
    b exit_error

num_error:
    mov x0, #1
    ldr x1, =err_num
    mov x2, len_err_num
    mov x8, #64
    svc #0
    b exit_error
