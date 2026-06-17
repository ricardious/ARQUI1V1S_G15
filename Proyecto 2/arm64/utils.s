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
//
// Convencion de llamada (AAPCS64) usada en todo el archivo:
//   - x0..x7  : argumentos de entrada y valores de retorno (caller-saved).
//   - x8      : numero de syscall (lo usa el kernel en 'svc #0').
//   - x9..x18 : temporales libres (caller-saved). Una rutina los puede pisar.
//   - x19..x28: callee-saved. Si una rutina los usa, primero los guarda en la
//               pila con stp y los restaura con ldp antes de 'ret'.
//   - x30 (lr): direccion de retorno. Se guarda en la pila cuando la rutina
//               llama a otra con 'bl' (porque 'bl' sobreescribe x30).
//   - sp      : pila, siempre alineada a 16 bytes (por eso los stp van de a pares).
//   Cada rutina documenta abajo sus Entradas/Salidas y que registros toca.
//
// Esquema del CSV (../data/lecturas.csv), 9 columnas por registro:
//   indice 0 = ID
//   indice 1 = TEMP          (temperatura)
//   indice 2 = HUM_AIRE      (humedad ambiente)
//   indice 3 = HUM_SUELO_1   (humedad de suelo area 1)
//   indice 4 = HUM_SUELO_2   (humedad de suelo area 2)
//   indice 5 = LUZ
//   indice 6 = GAS
//   indice 7 = RIEGO_1       (0/1)
//   indice 8 = RIEGO_2       (0/1)
//   Todos los valores se esperan como enteros NO negativos (sin signo '-').

// --- Numeros de syscall de Linux AArch64 -----------------------------------
.equ SYS_READ,   63          // read(fd, buf, count)
.equ SYS_WRITE,  64          // write(fd, buf, count)
.equ SYS_OPENAT, 56          // openat(dirfd, path, flags, mode)
.equ SYS_CLOSE,  57          // close(fd)
.equ SYS_EXIT,   93          // exit(code)

// --- Banderas para openat ---------------------------------------------------
.equ AT_FDCWD, -100          // rutas relativas al directorio de trabajo actual
.equ O_RDONLY, 0             // abrir solo lectura
.equ O_WRONLY_CREAT_TRUNC, 577   // O_WRONLY(1) | O_CREAT(64) | O_TRUNC(512) = 577
                                 // escritura: crea si no existe, vacia si existe
.equ MODE_0644, 420          // permisos 0644 en octal (rw-r--r--) = 420 decimal

// --- Rutas de archivos y literales (solo lectura) ---------------------------
.section .rodata
csv_path:
    .asciz "../data/lecturas.csv"          // entrada generada por el backend

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

// --- Simbolos exportados (los modulos los llaman con 'bl <nombre>') ---------
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

// ===========================================================================
// Apertura de archivos
// ===========================================================================

// open_csv_read()
//   Abre ../data/lecturas.csv en modo solo lectura.
//   Entradas:  ninguna
//   Salida:    x0 = fd (>=0) si abre bien, valor negativo (-errno) si falla
//   Toca:      x0, x1, x2, x3, x8
open_csv_read:
    mov x0, #AT_FDCWD
    ldr x1, =csv_path
    mov x2, #O_RDONLY
    mov x3, #0
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_media_write()
//   Abre/crea ../resultados_arm64/resultado_media.txt para escritura (trunca).
//   Salida: x0 = fd (>=0) si abre/crea bien, negativo si falla
//   Toca:   x0, x1, x2, x3, x8
open_media_write:
    mov x0, #AT_FDCWD
    ldr x1, =media_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_varianza_write()
//   Abre/crea resultado_varianza.txt para escritura (trunca).
//   Salida: x0 = fd (>=0) si abre/crea bien, negativo si falla
//   Toca:   x0, x1, x2, x3, x8
open_varianza_write:
    mov x0, #AT_FDCWD
    ldr x1, =varianza_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_anomalias_write()
//   Abre/crea resultado_anomalias.txt para escritura (trunca).
//   Salida: x0 = fd (>=0) si abre/crea bien, negativo si falla
//   Toca:   x0, x1, x2, x3, x8
open_anomalias_write:
    mov x0, #AT_FDCWD
    ldr x1, =anomalias_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_prediccion_write()
//   Abre/crea resultado_prediccion.txt para escritura (trunca).
//   Salida: x0 = fd (>=0) si abre/crea bien, negativo si falla
//   Toca:   x0, x1, x2, x3, x8
open_prediccion_write:
    mov x0, #AT_FDCWD
    ldr x1, =prediccion_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// open_tendencia_write()
//   Abre/crea resultado_tendencia.txt para escritura (trunca).
//   Salida: x0 = fd (>=0) si abre/crea bien, negativo si falla
//   Toca:   x0, x1, x2, x3, x8
open_tendencia_write:
    mov x0, #AT_FDCWD
    ldr x1, =tendencia_path
    mov x2, #O_WRONLY_CREAT_TRUNC
    mov x3, #MODE_0644
    mov x8, #SYS_OPENAT
    svc #0
    ret

// ===========================================================================
// Entrada/salida de bajo nivel
// ===========================================================================

// read_fd(fd, buffer, max_bytes)
//   Una sola syscall read(). Puede devolver menos bytes que max_bytes.
//   Entradas:
//     x0 = fd
//     x1 = buffer destino
//     x2 = maximo de bytes a leer
//   Salida:
//     x0 = bytes leidos, 0 = EOF, negativo = error
//   Toca: x0, x8
read_fd:
    mov x8, #SYS_READ
    svc #0
    ret

// close_fd(fd)
//   Cierra el descriptor de archivo.
//   Entradas: x0 = fd
//   Salida:   x0 = 0 si ok, negativo si error
//   Toca:     x0, x8
close_fd:
    mov x8, #SYS_CLOSE
    svc #0
    ret

// write_all(fd, buffer, length)
//   Escribe TODO el buffer, repitiendo write() hasta terminar. Esto cubre el
//   caso en que una sola syscall escribe solo una parte (escritura parcial).
//   Entradas:
//     x0 = fd
//     x1 = buffer
//     x2 = length (bytes a escribir)
//   Salida:
//     x0 = 0 si escribio todo, negativo si hubo error o write devolvio 0
//   Preserva: x19, x20, x21 (los guarda en la pila)
//   Registros internos: x19=fd, x20=puntero actual, x21=bytes restantes
write_all:
    stp x19, x20, [sp, #-16]!
    stp x21, x30, [sp, #-16]!
    mov x19, x0
    mov x20, x1
    mov x21, x2
write_all_loop:
    cbz x21, write_all_ok          // no quedan bytes -> exito
    mov x0, x19
    mov x1, x20
    mov x2, x21
    mov x8, #SYS_WRITE
    svc #0
    cmp x0, #0
    b.lt write_all_done            // x0 < 0 -> error, sale con el codigo en x0
    cbz x0, write_all_done         // x0 == 0 -> nada escrito, evita lazo infinito
    add x20, x20, x0               // avanza el puntero por los bytes escritos
    sub x21, x21, x0               // descuenta lo escrito de los restantes
    b write_all_loop
write_all_ok:
    mov x0, #0
write_all_done:
    ldp x21, x30, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// write_cstr(fd, c_string)
//   Calcula la longitud de una cadena terminada en 0 y la manda con write_all.
//   Entradas:
//     x0 = fd
//     x1 = puntero a cadena terminada en '\0'
//   Salida:
//     x0 = resultado de write_all (0 ok, negativo error)
//   Preserva: x19, x20, x21
//   Registros internos: x19=fd, x20=cadena, x21=longitud calculada
write_cstr:
    stp x19, x20, [sp, #-16]!
    stp x21, x30, [sp, #-16]!
    mov x19, x0
    mov x20, x1
    mov x21, #0
write_cstr_len_loop:
    ldrb w2, [x20, x21]            // lee el byte en cadena[longitud]
    cbz w2, write_cstr_write       // byte 0 -> fin de la cadena
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
//   Escribe un salto de linea. Helper para separar lineas en los .txt.
//   Entradas: x0 = fd
//   Salida:   x0 = resultado de write_cstr
//   Nota: hace tail-call ('b', no 'bl') a write_cstr, asi que no toca la pila.
write_newline:
    ldr x1, =newline_text
    b write_cstr

// write_uint(fd, value)
//   Convierte un entero SIN signo a ASCII decimal y lo escribe.
//   Algoritmo: divide entre 10 repetidamente, guardando cada digito de atras
//   hacia adelante en un buffer temporal de 32 bytes en la pila.
//   Entradas:
//     x0 = fd
//     x1 = valor sin signo
//   Salida:
//     x0 = resultado de write_all
//   Preserva: x19, x20, x21, x22, x23
//   Registros internos: x19=fd, x20=valor, x21=puntero de escritura en buffer,
//                        w22=10 (divisor), x23=cociente
write_uint:
    stp x19, x20, [sp, #-16]!
    stp x21, x22, [sp, #-16]!
    stp x23, x30, [sp, #-16]!
    sub sp, sp, #32                // reserva buffer temporal de 32 bytes
    mov x19, x0
    mov x20, x1
    add x21, sp, #31               // apunta al final del buffer (ultimo byte)
    mov w22, #10
    cbnz x20, write_uint_loop      // si el valor no es 0, va al lazo normal
    mov w0, #'0'                   // caso especial: el valor es 0
    strb w0, [x21]
    mov x0, x19
    mov x1, x21
    mov x2, #1
    bl write_all
    b write_uint_done
write_uint_loop:
    udiv x23, x20, x22             // x23 = valor / 10
    msub x0, x23, x22, x20         // x0  = valor - (x23*10) = digito actual
    add w0, w0, #'0'               // convierte digito a ASCII
    strb w0, [x21]                 // lo guarda en el buffer (de derecha a izq.)
    sub x21, x21, #1
    mov x20, x23                   // sigue con el cociente
    cbnz x20, write_uint_loop
    add x21, x21, #1               // ajusta al primer digito escrito
    add x2, sp, #32               // x2 = fin del buffer
    sub x2, x2, x21               // x2 = longitud = fin - inicio
    mov x0, x19
    mov x1, x21
    bl write_all
write_uint_done:
    add sp, sp, #32               // libera el buffer temporal
    ldp x23, x30, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// write_int(fd, value)
//   Escribe un entero CON signo en decimal. Si es negativo escribe '-' y luego
//   delega en write_uint con el valor en positivo.
//   Entradas:
//     x0 = fd
//     x1 = valor con signo
//   Salida:
//     x0 = resultado de write_uint
//   Preserva: x19, x20
//   Registros internos: x19=fd, x20=valor (negado si era negativo)
write_int:
    stp x19, x20, [sp, #-16]!
    stp x30, xzr, [sp, #-16]!      // guarda x30; xzr solo rellena para alinear
    mov x19, x0
    mov x20, x1
    cmp x20, #0
    b.ge write_int_positive        // valor >= 0 -> no imprime signo
    neg x20, x20                   // valor negativo -> lo vuelve positivo
    sub sp, sp, #16
    mov w1, #'-'
    strb w1, [sp]
    mov x0, x19
    mov x1, sp
    mov x2, #1
    bl write_all                   // escribe el signo '-'
    add sp, sp, #16
write_int_positive:
    mov x0, x19
    mov x1, x20
    bl write_uint                  // escribe los digitos
    ldp x30, xzr, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// ===========================================================================
// Parseo del CSV
// ===========================================================================

// skip_header(ptr, end)
//   Avanza desde el inicio del buffer hasta justo despues del primer '\n'.
//   Sirve para saltar la fila de encabezado del CSV antes de leer datos.
//   Entradas:
//     x0 = ptr actual (inicio del buffer)
//     x1 = ptr fin (un byte despues del ultimo valido)
//   Salida:
//     x0 = ptr despues del encabezado, o 'end' si no encontro salto de linea
//   Toca: x0, x2
skip_header:
    cmp x0, x1
    b.hs skip_header_done          // buffer vacio (ptr >= end) -> nada que saltar
skip_header_loop:
    ldrb w2, [x0], #1              // lee byte y avanza ptr (post-incremento)
    cmp w2, #10                    // 10 = '\n'
    b.eq skip_header_done
    cmp x0, x1
    b.lo skip_header_loop
skip_header_done:
    ret

// parse_next_uint(ptr, end)
//   Busca el siguiente numero decimal no negativo en el CSV y lo convierte a
//   entero. Pensado para llamarse en lazo despues de skip_header.
//   Separadores aceptados: coma, LF, CR y cualquier otro caracter no-digito.
//   Importante: NO procesa el signo '-'. El backend debe entregar enteros >= 0.
//   Entradas:
//     x0 = ptr actual
//     x1 = ptr fin
//   Salidas:
//     x0 = ptr justo despues del numero leido
//     x1 = valor entero parseado
//     x2 = 1 si encontro numero, 0 si llego al fin sin encontrar
//   Toca: x0, x1, x2, x3, x4, x5, x6
//   Registros internos: x3=cursor, w4=byte leido, x5=acumulador, x6=10
parse_next_uint:
    mov x3, x0
parse_seek_digit:                  // fase 1: avanza hasta el primer digito
    cmp x3, x1
    b.hs parse_no_value
    ldrb w4, [x3]
    cmp w4, #'0'
    b.lt parse_advance             // byte < '0' -> no es digito
    cmp w4, #'9'
    b.le parse_digits_start        // '0'..'9' -> empieza a acumular
parse_advance:
    add x3, x3, #1
    b parse_seek_digit
parse_digits_start:
    mov x5, #0                     // acumulador = 0
parse_digit_loop:                  // fase 2: acumula digitos consecutivos
    cmp x3, x1
    b.hs parse_value_done
    ldrb w4, [x3]
    cmp w4, #'0'
    b.lt parse_value_done          // byte fuera de '0'..'9' -> termino el numero
    cmp w4, #'9'
    b.gt parse_value_done
    sub w4, w4, #'0'               // ASCII -> valor del digito
    mov x6, #10
    madd x5, x5, x6, x4            // acumulador = acumulador*10 + digito
    add x3, x3, #1
    b parse_digit_loop
parse_value_done:                  // encontro y termino de leer un numero
    mov x0, x3
    mov x1, x5
    mov x2, #1
    ret
parse_no_value:                    // se acabo el buffer sin hallar numero
    mov x0, x3
    mov x1, #0
    mov x2, #0
    ret

// load_column_30(ptr, end, column_index, output_array)
//   Carga hasta 30 valores de UNA columna del CSV (ya sin encabezado).
//   Recorre los numeros en orden; lleva la cuenta de la columna actual con
//   modulo 9 (porque hay 9 columnas por registro) y guarda solo los que caen
//   en la columna pedida.
//   Entradas:
//     x0 = ptr despues del encabezado (usar skip_header antes)
//     x1 = ptr fin del buffer
//     x2 = indice de columna a extraer (ver esquema del CSV arriba: 0..8)
//     x3 = arreglo destino con espacio para 30 enteros de 64 bits (240 bytes)
//   Salida:
//     x0 = cantidad de valores guardados (0..30)
//   Preserva: x19..x25
//   Registros internos: x19=ptr, x20=end, x21=columna deseada, x22=arreglo,
//                        x23=guardados, x24=columna actual, x25=offset en bytes
//   Nota:
//     No valida por si sola que existan exactamente 30 registros.
//     Usar count_records(ptr, end) si el modulo necesita validar eso.
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
    cmp x23, #30                   // ya guardamos 30 -> listo
    b.hs load_column_done

    mov x0, x19
    mov x1, x20
    bl parse_next_uint
    cbz x2, load_column_done       // x2==0 -> no hay mas numeros
    mov x19, x0                    // avanza el ptr al siguiente numero

    cmp x24, x21                   // columna actual == columna deseada?
    b.ne load_column_next

    lsl x25, x23, #3               // offset = guardados * 8 (enteros de 64 bits)
    str x1, [x22, x25]             // arreglo[guardados] = valor
    add x23, x23, #1

load_column_next:
    add x24, x24, #1               // pasa a la siguiente columna
    cmp x24, #9                    // hay 9 columnas; al llegar a 9 reinicia
    b.lt load_column_loop
    mov x24, #0                    // fin de registro -> columna actual vuelve a 0
    b load_column_loop

load_column_done:
    mov x0, x23                    // retorna la cantidad guardada
    ldp x25, x30, [sp], #16
    ldp x23, x24, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// count_records(ptr, end)
//   Cuenta registros COMPLETOS del CSV (ya sin encabezado).
//   Entradas:
//     x0 = ptr despues del encabezado
//     x1 = ptr fin del buffer
//   Salida:
//     x0 = cantidad de registros completos encontrados
//   Preserva: x19, x20, x21, x22
//   Registros internos: x19=ptr, x20=end, x21=total de numeros, x22=9 (divisor)
//   Metodo:
//     Cuenta todos los enteros parseables y divide entre 9 columnas.
//     Si hay columnas incompletas al final, no cuentan como registro completo.
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
    cbz x2, count_records_done     // no hay mas numeros -> termina
    mov x19, x0
    add x21, x21, #1               // suma uno por cada entero hallado
    b count_records_loop

count_records_done:
    mov x22, #9
    udiv x0, x21, x22              // registros completos = total_numeros / 9
    ldp x30, xzr, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret

// ===========================================================================
// Salida del programa
// ===========================================================================

// exit_program(code)
//   Termina el proceso con el codigo de salida indicado. No retorna.
//   Entradas: x0 = codigo de salida
exit_program:
    mov x8, #SYS_EXIT
    svc #0
