// Biblioteca comun ARM64 del Proyecto
.data

csv_path:
    .asciz "../data/lecturas.csv"

anomalias_path:
    .asciz "../resultados_arm64/resultado_anomalias.txt"

prediccion_path:
    .asciz "../resultados_arm64/resultado_prediccion.txt"

newline_text:
    .asciz "\n"

err_open:
    .ascii "Error: no se pudo abrir el archivo\n"
    len_err_open = . - err_open

err_read:
    .ascii "Error: no se pudo leer el archivo\n"
    len_err_read = . - err_read

err_write:
    .ascii "Error: no se pudo escribir el archivo\n"
    len_err_write = . - err_write

.bss

buffer:
    .skip 4096

num_buffer:
    .skip 32 // espacio para convertir uint a string

.text

// Convertir ASCII a Entero
atoi_csv:
    mov x10, #0 // resultado = 0
    mov x7, #0 // bandera de numero activo
    mov x5, #10 //inmediato 10 por el cual se multiplica
atoi_loop:
    ldrb w23, [x21], #1

    // verificar si es un digito
    cmp w23, '0'
    blt atoi_done

    cmp w23, '9'
    bgt atoi_done

    // convertir caracter a numero
    sub w23, w23, '0' // w23 - '0', '0' = 48 por eso devuelve el numero 

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

// Crear/truncar archivo de salida
// x1: ruta del archivo a abrir
open_output_file:
    mov x0, #-100
    // x1 trae la ruta del archivo
    mov x2, #(1 | 64 | 512) // O_WRONLY | O_CREAT | O_TRUNC
    mov x3, #420 // permisos (0644)
    mov x8, #56 // syscall openat
    svc #0

    cmp x0, #0
    blt write_error

    ret

// Crear/Abrir resultado_tendencia.txt
open_tendencia_write:
    ldr x1, =tendencia_path
    bl open_output_file
    ret

// Crear/Abrir resultado_media.txt
open_media_write:
    ldr x1, =media_path
    bl open_output_file
    ret

// Crear/Abrir resultado_varianza.txt
open_varianza_write:
    ldr x1, =varianza_path
    bl open_output_file
    ret

// Crear/Abrir resultado_anomalias.txt
open_anomalias_write:
    ldr x1, =anomalias_path
    bl open_output_file
    ret

// Crear/Abrir resultado_prediccion.txt
open_prediccion_write:
    ldr x1, =prediccion_path
    bl open_output_file
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

// Cerrar archivo de salida
// x0: descriptor del archivo a cerrar
close_output_file:
    mov x8, #57 // syscall close
    svc #0
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
    
//Registros utilizados 
// x11 = columna selecciona
// x21 = direccion de buffer 

//Área para navegación de archivo, saltar encabezado
//skip_to_next_line 
//Que hace? , salta el caracteres hasta encontrar el final de una linea o caracter especial
//Registros utilizados:
// w23=  byte leido en esa direccion 
// x21 = direccion de memoria / buffer
skip_to_next_line:
    ldrb w23, [x21], #1     // lee un byte y lo guarda en w23
    cmp w23, '$'            //  compara 
    beq utils_skip_done     // si es igual llama a skip_done

    cmp w23, #10            //compara con 10 = ascii '\n', salto de linea
    beq utils_skip_done     // si es igual llama a skip_done

    b skip_to_next_line     // si no encontro ni salto o algun caracter extraño entonces vuelve a pasar linea por linea

// marca el final de una funcion 
utils_skip_done:
    ret

//Salto de columna
saltar_columna:
    ldrb w23, [x21], #1 

    cmp w23, '$'
    beq utils_skip_done

    cmp w23, #10
    beq utils_skip_done

    cmp w23, ','        // compara si es una comna entonces marca el fin
    beq utils_skip_done

    b saltar_columna

// Guardar numero en stack
save_number_to_stack:
    sub sp, sp, #16 // reservar espacio en stack
    str x10, [sp] // guardar numero en stack

    add x22, x22, #1 // incrementar contador de numeros
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
