// =============================================================================
// Modulo 4: Prediccion lineal simple
// Archivo: modulo_4_prediccion.s
// Responsable: Alex Oswaldo Lopez Alquejay
//
// FORMULA:
//   DIF             = XFINAL - XINICIAL
//   PROMEDIO_CAMBIO = DIF / (N - 1)        con N = 30  ->  DIF / 29
//   PREDICCION      = XFINAL + PROMEDIO_CAMBIO
//
// SALIDA (../resultados_arm64/resultado_prediccion.txt):
//   MODULE=PREDICTION
//   INITIAL_VALUE=28
//   FINAL_VALUE=34
//   TOTAL_DIFF=6
//   AVG_CHANGE=0.20
//   NEXT_VALUE=34.20
//
// FLUJO:
//   Abrir CSV -> Leer buffer -> Saltar header -> Cargar columna ->
//   Tomar primer y ultimo valor -> Calcular DIF, promedio y prediccion ->
//   Escribir resultado -> Cerrar -> Salir
//
// NOTAS:
//   - ARM64 trabaja solo con enteros. Para AVG_CHANGE y NEXT_VALUE se usa
//     punto fijo escalado x100 (dos decimales) y se imprime con write_fixed2.
//   - Trabaja sobre exactamente 30 datos de una sola variable X.
// -----------------------------------------------------------------------------
// COLUMNA A PROCESAR
//   0=ID  1=TEMP  2=HUM_AIRE  3=HUM_SUELO_1  4=HUM_SUELO_2
//   5=LUZ  6=GAS  7=RIEGO_1  8=RIEGO_2
// -----------------------------------------------------------------------------
.equ COLUMN_INDEX, 1        // TEMP
.equ N_DATOS,      30       // cantidad de datos a procesar
.equ N_MENOS_1,    29       // N - 1, divisor del promedio de cambio
.equ BUFFER_SIZE,  4096     // tamano del buffer para leer el CSV

// Funciones de utils.s
.extern open_csv_read
.extern open_prediccion_write
.extern read_fd
.extern close_fd
.extern write_cstr
.extern write_uint
.extern write_int
.extern write_newline
.extern skip_header
.extern load_column_30
.extern exit_program

// -----------------------------------------------------------------------------
// .rodata: strings de salida (solo lectura)
// -----------------------------------------------------------------------------
.section .rodata
msg_module:   .asciz "MODULE=PREDICTION\n"
msg_initial:  .asciz "INITIAL_VALUE="
msg_final:    .asciz "FINAL_VALUE="
msg_diff:     .asciz "TOTAL_DIFF="
msg_avg:      .asciz "AVG_CHANGE="
msg_next:     .asciz "NEXT_VALUE="
msg_err_datos: .asciz "ERROR: no se encontraron 30 registros en el CSV\n"
str_minus:    .asciz "-"
str_dot:      .asciz "."
str_zero:     .asciz "0"

// -----------------------------------------------------------------------------
// .bss: memoria reservada (se llena de ceros al ejecutar)
// -----------------------------------------------------------------------------
.section .bss
.balign 8
csv_buffer:
    .skip BUFFER_SIZE       // contenido crudo del CSV
data_array:
    .skip 240               // 30 valores x 8 bytes = 240 bytes

// -----------------------------------------------------------------------------
// .text: codigo
// -----------------------------------------------------------------------------
.section .text
.global _start

// REGISTROS PERSISTENTES EN _start:
//   x19 = fd del CSV (luego se reutiliza para el fd de salida)
//   x20 = bytes leidos del CSV
//   x21 = puntero al final del buffer
//   x22 = base del arreglo data_array
//   x23 = INITIAL_VALUE (primer dato)
//   x24 = FINAL_VALUE (ultimo dato)
//   x25 = TOTAL_DIFF (XFINAL - XINICIAL, con signo)
//   x26 = AVG_CHANGE escalado x100 (con signo)
//   x27 = NEXT_VALUE escalado x100 (con signo)
_start:
// 1) ABRIR Y LEER EL CSV
    bl open_csv_read
    cmp x0, #0
    b.lt error_salida           // fd negativo -> no se pudo abrir
    mov x19, x0                 // x19 = fd del CSV

    mov x0, x19
    ldr x1, =csv_buffer
    mov x2, #BUFFER_SIZE
    bl read_fd
    mov x20, x0                 // x20 = bytes leidos

    // calcular fin del buffer = csv_buffer + bytes leidos
    ldr x0, =csv_buffer
    add x21, x0, x20            // x21 = puntero fin

// 2) SALTAR ENCABEZADO Y CARGAR LA COLUMNA
    ldr x0, =csv_buffer
    mov x1, x21
    bl skip_header             // x0 = ptr despues del encabezado

    mov x1, x21                // x1 = fin del buffer
    mov x2, #COLUMN_INDEX      // x2 = columna a extraer (TEMP)
    ldr x3, =data_array        // x3 = arreglo destino
    bl load_column_30
    cmp x0, #N_DATOS
    b.ne error_datos          // si no hay 30 valores, error

    // ya no necesitamos el CSV
    mov x0, x19
    bl close_fd

// 3) TOMAR PRIMER Y ULTIMO VALOR
    ldr x22, =data_array
    ldr x23, [x22]             // INITIAL = data_array[0]
    ldr x24, [x22, #232]       // FINAL = data_array[29]  (29*8 = 232)

// 4) CALCULOS
    // TOTAL_DIFF = FINAL - INITIAL (con signo)
    sub x25, x24, x23

    // AVG_CHANGE escalado x100 = (TOTAL_DIFF * 100) / 29   (division con signo)
    mov x9, #100
    mul x9, x25, x9            // x9 = TOTAL_DIFF * 100
    mov x10, #N_MENOS_1
    sdiv x26, x9, x10          // x26 = AVG_CHANGE * 100

    // NEXT_VALUE escalado x100 = FINAL*100 + AVG_CHANGE*100
    mov x9, #100
    mul x9, x24, x9            // x9 = FINAL * 100
    add x27, x9, x26           // x27 = NEXT_VALUE * 100

// 5) ABRIR ARCHIVO DE SALIDA
    bl open_prediccion_write
    cmp x0, #0
    b.lt error_salida
    mov x19, x0                // x19 = fd de salida

// 6) ESCRIBIR EL REPORTE
    // MODULE=PREDICTION
    mov x0, x19
    ldr x1, =msg_module
    bl write_cstr

    // INITIAL_VALUE=<entero>
    mov x0, x19
    ldr x1, =msg_initial
    bl write_cstr
    mov x0, x19
    mov x1, x23
    bl write_uint
    mov x0, x19
    bl write_newline

    // FINAL_VALUE=<entero>
    mov x0, x19
    ldr x1, =msg_final
    bl write_cstr
    mov x0, x19
    mov x1, x24
    bl write_uint
    mov x0, x19
    bl write_newline

    // TOTAL_DIFF=<entero con signo>
    mov x0, x19
    ldr x1, =msg_diff
    bl write_cstr
    mov x0, x19
    mov x1, x25
    bl write_int
    mov x0, x19
    bl write_newline

    // AVG_CHANGE=<punto fijo 2 decimales>
    mov x0, x19
    ldr x1, =msg_avg
    bl write_cstr
    mov x0, x19
    mov x1, x26
    bl write_fixed2
    mov x0, x19
    bl write_newline

    // NEXT_VALUE=<punto fijo 2 decimales>
    mov x0, x19
    ldr x1, =msg_next
    bl write_cstr
    mov x0, x19
    mov x1, x27
    bl write_fixed2
    mov x0, x19
    bl write_newline

// 7) CERRAR Y SALIR
    mov x0, x19
    bl close_fd
    mov x0, #0
    bl exit_program

// -----------------------------------------------------------------------------
// Bloques de error: escriben a stderr (fd 2) y salen con codigo 1
// -----------------------------------------------------------------------------
error_datos:
    mov x0, x19
    bl close_fd
    mov x0, #2
    ldr x1, =msg_err_datos
    bl write_cstr
    mov x0, #1
    bl exit_program

error_salida:
    mov x0, #1
    bl exit_program

// =============================================================================
// SUBRUTINA PROPIA: write_fixed2(fd, valor_escalado)
//   Imprime un valor escalado x100 como decimal con 2 cifras: "[-]entero.frac"
//   Ejemplos: 20 -> "0.20"   3420 -> "34.20"   -20 -> "-0.20"
//
//   Entradas:
//     x0 = fd
//     x1 = valor escalado x100 (con signo)
//   Preserva: x19, x20, x21, x22 (los guarda en la pila)
//   Internos: x19=fd, x20=valor, x21=parte entera, x22=fraccion
// =============================================================================
write_fixed2:
    stp x19, x20, [sp, #-16]!
    stp x21, x22, [sp, #-16]!
    stp x30, xzr, [sp, #-16]!
    mov x19, x0
    mov x20, x1

    // signo: si es negativo, imprime '-' y vuelve positivo el valor
    cmp x20, #0
    b.ge wf2_abs
    mov x0, x19
    ldr x1, =str_minus
    bl write_cstr
    neg x20, x20
wf2_abs:
    // separar parte entera y fraccion (mod 100)
    mov x2, #100
    udiv x21, x20, x2          // x21 = parte entera
    msub x22, x21, x2, x20     // x22 = valor - entera*100 = fraccion (0..99)

    // parte entera
    mov x0, x19
    mov x1, x21
    bl write_uint

    // punto decimal
    mov x0, x19
    ldr x1, =str_dot
    bl write_cstr

    // cero a la izquierda si la fraccion es menor que 10 (p.ej. 0.05)
    cmp x22, #10
    b.ge wf2_frac
    mov x0, x19
    ldr x1, =str_zero
    bl write_cstr
wf2_frac:
    // fraccion
    mov x0, x19
    mov x1, x22
    bl write_uint

    ldp x30, xzr, [sp], #16
    ldp x21, x22, [sp], #16
    ldp x19, x20, [sp], #16
    ret
