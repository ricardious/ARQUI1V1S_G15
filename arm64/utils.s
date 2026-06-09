// GreenPi Grupo 15 - Biblioteca comun ARM64/AArch64
//
// Proposito:
//   Este archivo contiene rutinas reutilizables para los modulos ARM64.
//   Los demas integrantes pueden usar estas funciones, pero no deben modificar
//   utils.s sin coordinar, porque todos los modulos van a depender de este
//   contrato.
//
// Restricciones del proyecto:
//   - No usar Python para calcular resultados ARM64.
//   - Trabajar solo con enteros.
//   - Leer ../data/lecturas.csv generado por backend.
//   - Escribir resultados en ../resultados_arm64/.

.equ SYS_READ,   63
.equ SYS_WRITE,  64
.equ SYS_OPENAT, 56
.equ SYS_CLOSE,  57
.equ SYS_EXIT,   93

.equ AT_FDCWD, -100
.equ O_RDONLY, 0
.equ O_WRONLY_CREAT_TRUNC, 577   // O_WRONLY | O_CREAT | O_TRUNC
.equ MODE_0644, 420

.section .rodata
csv_path:
    .asciz "../data/lecturas.csv"

tendencia_path:
    .asciz "../resultados_arm64/resultado_tendencia.txt"

media_path:
    .asciz "../resultados_arm64/resultado_media.txt"

varianza_path:
    .asciz "../resultados_arm64/resultado_varianza.txt"

anomalias_path:
    .asciz "../resultados_arm64/resultado_anomalias.txt"

prediccion_path:
    .asciz "../resultados_arm64/resultado_prediccion.txt"

newline_text:
    .asciz "\n"

.section .text
.global open_csv_read
.global open_tendencia_write
.global open_media_write
.global open_varianza_write
.global open_anomalias_write
.global open_prediccion_write
.global read_fd
.global close_fd
.global write_all
.global write_cstr
.global write_newline
.global write_uint
.global write_int
.global skip_header
.global parse_next_uint
.global load_column_30
.global count_records
.global exit_program

// open_csv_read()
// Salida:
//   x0 = fd si abre bien, valor negativo si falla
open_csv_read:
    mov x0, #AT_FDCWD
    ldr x1, =csv_path
    mov x2, #O_RDONLY
    mov x3, #0
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_media_write()
// Salida:
//   x0 = fd si abre/crea bien, valor negativo si falla
open_media_write:
    mov x0, #AT_FDCWD
    ldr x1, =media_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_varianza_write()
// Salida:
//   x0 = fd si abre/crea bien, valor negativo si falla
open_varianza_write:
    mov x0, #AT_FDCWD
    ldr x1, =varianza_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_anomalias_write()
// Salida:
//   x0 = fd si abre/crea bien, valor negativo si falla
open_anomalias_write:
    mov x0, #AT_FDCWD
    ldr x1, =anomalias_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_prediccion_write()
// Salida:
//   x0 = fd si abre/crea bien, valor negativo si falla
open_prediccion_write:
    mov x0, #AT_FDCWD
    ldr x1, =prediccion_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_tendencia_write()
// Salida:
//   x0 = fd si abre/crea bien, valor negativo si falla
open_tendencia_write:
    mov x0, #AT_FDCWD
    ldr x1, =tendencia_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// read_fd(fd, buffer, max_bytes)
// Entradas:
//   x0 = fd
//   x1 = buffer destino
//   x2 = maximo bytes
// Salida:
//   x0 = bytes leidos, 0 EOF, negativo si error
read_fd:
    mov x8, #SYS_READ
    svc #0
    ret

// close_fd(fd)
close_fd:
    mov x8, #SYS_CLOSE
    svc #0
    ret

// write_all(fd, buffer, length)
// Escribe todo el buffer, no solo una syscall parcial.
// Entradas:
//   x0 = fd
//   x1 = buffer
//   x2 = length
// Salida:
//   x0 = 0 si completo, negativo si error
write_all:
    stp x19, x20, [sp, #-16]!
    stp x21, x30, [sp, #-16]!
    mov x19, x0
    mov x20, x1
    mov x21, x2
write_all_loop:
    cbz x21, write_all_ok
    mov x0, x19
    mov x1, x20
    mov x2, x21
    mov x8, #SYS_WRITE
    svc #0
    cmp x0, #0
    b.lt write_all_done
    cbz x0, write_all_done
    add x20, x20, x0
    sub x21, x21, x0
    b write_all_loop
write_all_ok:
    mov x0, #0
write_all_done:
    ldp x21, x30, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// write_cstr(fd, c_string)
// Calcula longitud de string terminada en 0 y llama write_all.
write_cstr:
    stp x19, x20, [sp, #-16]!
    stp x21, x30, [sp, #-16]!
    mov x19, x0
    mov x20, x1
    mov x21, #0
write_cstr_len_loop:
    ldrb w2, [x20, x21]
    cbz w2, write_cstr_write
    add x21, x21, #1
    b write_cstr_len_loop
write_cstr_write:
    mov x0, x19
    mov x1, x20
    mov x2, x21
    bl write_all
    ldp x21, x30, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// write_newline(fd)
// Escribe salto de linea. Helper simple para reportes .txt.
write_newline:
    ldr x1, =newline_text
    b write_cstr

// write_uint(fd, value)
// Convierte entero sin signo a ASCII decimal y escribe.
// Entradas:
//   x0 = fd
//   x1 = valor
write_uint:
    stp x19, x20, [sp, #-16]!
    stp x21, x22, [sp, #-16]!
    stp x23, x30, [sp, #-16]!
    sub sp, sp, #32
    mov x19, x0
    mov x20, x1
    add x21, sp, #31
    mov w22, #10
    cbnz x20, write_uint_loop
    mov w0, #'0'
    strb w0, [x21]
    mov x0, x19
    mov x1, x21
    mov x2, #1
    bl write_all
    b write_uint_done
write_uint_loop:
    udiv x23, x20, x22
    msub x0, x23, x22, x20
    add w0, w0, #'0'
    strb w0, [x21]
    sub x21, x21, #1
    mov x20, x23
    cbnz x20, write_uint_loop
    add x21, x21, #1
    add x2, sp, #32
    sub x2, x2, x21
    mov x0, x19
    mov x1, x21
    bl write_all
write_uint_done:
    add sp, sp, #32
    ldp x23, x30, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// write_int(fd, value)
// Escribe entero con signo en decimal.
write_int:
    stp x19, x20, [sp, #-16]!
    stp x30, xzr, [sp, #-16]!
    mov x19, x0
    mov x20, x1
    cmp x20, #0
    b.ge write_int_positive
    neg x20, x20
    sub sp, sp, #16
    mov w1, #'-'
    strb w1, [sp]
    mov x0, x19
    mov x1, sp
    mov x2, #1
    bl write_all
    add sp, sp, #16
write_int_positive:
    mov x0, x19
    mov x1, x20
    bl write_uint
    ldp x30, xzr, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// skip_header(ptr, end)
// Avanza desde inicio de buffer hasta despues del primer '\n'.
// Entradas:
//   x0 = ptr actual
//   x1 = ptr fin
// Salida:
//   x0 = ptr despues del encabezado, o end si no hay salto
skip_header:
    cmp x0, x1
    b.hs skip_header_done
skip_header_loop:
    ldrb w2, [x0], #1
    cmp w2, #10
    b.eq skip_header_done
    cmp x0, x1
    b.lo skip_header_loop
skip_header_done:
    ret

// parse_next_uint(ptr, end)
// Busca siguiente numero decimal no negativo en CSV y lo convierte a entero.
// Sirve despues de skip_header. Separadores aceptados: coma, LF, CR, otros no digitos.
// Importante: no procesa signo '-'. El backend debe entregar enteros no negativos.
// Entradas:
//   x0 = ptr actual
//   x1 = ptr fin
// Salidas:
//   x0 = ptr despues del numero
//   x1 = valor entero
//   x2 = 1 si encontro numero, 0 si llego al fin
parse_next_uint:
    mov x3, x0
parse_seek_digit:
    cmp x3, x1
    b.hs parse_no_value
    ldrb w4, [x3]
    cmp w4, #'0'
    b.lt parse_advance
    cmp w4, #'9'
    b.le parse_digits_start
parse_advance:
    add x3, x3, #1
    b parse_seek_digit
parse_digits_start:
    mov x5, #0
parse_digit_loop:
    cmp x3, x1
    b.hs parse_value_done
    ldrb w4, [x3]
    cmp w4, #'0'
    b.lt parse_value_done
    cmp w4, #'9'
    b.gt parse_value_done
    sub w4, w4, #'0'
    mov x6, #10
    madd x5, x5, x6, x4
    add x3, x3, #1
    b parse_digit_loop
parse_value_done:
    mov x0, x3
    mov x1, x5
    mov x2, #1
    ret
parse_no_value:
    mov x0, x3
    mov x1, #0
    mov x2, #0
    ret

// load_column_30(ptr, end, column_index, output_array)
// Carga hasta 30 valores de una columna del CSV ya sin encabezado.
// Entradas:
//   x0 = ptr despues del encabezado
//   x1 = ptr fin del buffer
//   x2 = columna a extraer:
//        0 ID, 1 TEMP, 2 HUM_AIRE, 3 HUM_SUELO_1, 4 HUM_SUELO_2,
//        5 LUZ, 6 GAS, 7 RIEGO_1, 8 RIEGO_2
//   x3 = arreglo destino con espacio para 30 enteros de 64 bits
// Salida:
//   x0 = cantidad de valores guardados
//
// Nota:
//   No valida por si sola que existan exactamente 30 registros.
//   Usar count_records(ptr, end) si el modulo necesita validar eso.
load_column_30:
    stp x19, x20, [sp, #-16]!
    stp x21, x22, [sp, #-16]!
    stp x23, x24, [sp, #-16]!
    stp x25, x30, [sp, #-16]!

    mov x19, x0        // ptr actual
    mov x20, x1        // ptr fin
    mov x21, x2        // columna deseada
    mov x22, x3        // arreglo destino
    mov x23, #0        // cantidad guardada
    mov x24, #0        // columna actual

load_column_loop:
    cmp x23, #30
    b.hs load_column_done

    mov x0, x19
    mov x1, x20
    bl parse_next_uint
    cbz x2, load_column_done
    mov x19, x0

    cmp x24, x21
    b.ne load_column_next

    lsl x25, x23, #3
    str x1, [x22, x25]
    add x23, x23, #1

load_column_next:
    add x24, x24, #1
    cmp x24, #9
    b.lt load_column_loop
    mov x24, #0
    b load_column_loop

load_column_done:
    mov x0, x23
    ldp x25, x30, [sp], #16
    ldp x23, x24, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// count_records(ptr, end)
// Cuenta registros completos del CSV ya sin encabezado.
// Entradas:
//   x0 = ptr despues del encabezado
//   x1 = ptr fin del buffer
// Salida:
//   x0 = cantidad de registros completos encontrados
//
// Metodo:
//   Cuenta todos los enteros parseables y divide entre 9 columnas.
//   Si hay columnas incompletas al final, no cuentan como registro completo.
count_records:
    stp x19, x20, [sp, #-16]!
    stp x21, x22, [sp, #-16]!
    stp x30, xzr, [sp, #-16]!

    mov x19, x0        // ptr actual
    mov x20, x1        // ptr fin
    mov x21, #0        // cantidad de numeros

count_records_loop:
    mov x0, x19
    mov x1, x20
    bl parse_next_uint
    cbz x2, count_records_done
    mov x19, x0
    add x21, x21, #1
    b count_records_loop

count_records_done:
    mov x22, #9
    udiv x0, x21, x22
    ldp x30, xzr, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// exit_program(code)
exit_program:
    mov x8, #SYS_EXIT
    svc #0
