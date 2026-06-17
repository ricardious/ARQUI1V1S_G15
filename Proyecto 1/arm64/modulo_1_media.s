// =============================================================================
// Media Aritmetica Ponderada
// FORMULA:
//   WEIGHTED_MEAN = Σ(X_i * W_i) / ΣW_i
//   Donde W_i = i (peso del dato i, del 1 al 30)
//   WEIGHT_SUM = 1+2+3+...+30 = 465 (constante)
//
// FLUJO:
//   Abrir CSV -> Leer buffer -> Saltar header -> Cargar columna ->
//   Calcular sumas -> Dividir -> Escribir resultado -> Cerrar -> Salir
// -----------------------------------------------------------------------------
// COLUMNA A PROCESAR
// Cambiar este valor para procesar una variable distinta del CSV:
//   0=ID  1=TEMP  2=HUM_AIRE  3=HUM_SUELO_1  4=HUM_SUELO_2
//   5=LUZ  6=GAS  7=RIEGO_1  8=RIEGO_2
// -----------------------------------------------------------------------------
.equ COLUMN_INDEX,  1      //TEMP
.equ WEIGHT_SUM,  465       // 1+2+...+30, constante fija
.equ BUFFER_SIZE, 4096      // Tamaño del buffer para leer el CSV

// Funciones de utils.s
.extern open_csv_read       //abre el csv
.extern open_media_write    //
.extern read_fd             //lee
.extern close_fd            //cierra
.extern write_cstr          //escribe
.extern write_uint          //escribe
.extern write_newline       //escribe
.extern skip_header         //salta encabezado
.extern load_column_30      //carga 30
.extern exit_program        //sale del programa
// Sección .rodata, Strings de salida (solo para su lectura)
.section .rodata
msg_module:
    .asciz "MODULE=WEIGHTED_MEAN\n"
msg_total:
    .asciz "TOTAL_VALUES=30\n"
msg_sum_x:
    .asciz "SUM_X="
msg_weight_sum:
    .asciz "WEIGHT_SUM="
msg_weighted_mean:
    .asciz "WEIGHTED_MEAN="
// SECCION .bss, Variables no inicializadas
.section .bss
csv_buffer:
    .skip BUFFER_SIZE           // Buffer donde se carga el contenido del CSV
data_array:
    .skip 240                   // Arreglo de 30 valores x 8 bytes cada uno = 240 bytes

// SECCION .text, Codigo ejecutable
.section .text
.global _start

//REGISTROS:
//   x19 = fd del CSV
//   x20 = fd del archivo de salida resultado_media.txt
//   x21 = bytes leidos del CSV (retorno de read_fd)
//   x22 = indice del bucle (i = 0..29)
//   x23 = suma_x (suma simple de todos los datos)
//   x24 = suma_ponderada (suma de dato[i] * peso[i])
//   x25 = valor actual del dato leido del arreglo
_start:
// 1) ABRIR Y LEER EL CSV
    // Abrir lecturas.csv en modo lectura
    // open_csv_read no recibe parametros, retorna fd en x0
    bl open_csv_read                //Usamos función de utils.s con bl
    mov x19, x0                     // Guardar fd del CSV en el registro x19

    // Leer todo el contenido del CSV hacia csv_buffer
    // read_fd(fd, buffer, max_bytes)
    mov x0, x19                     // x0 ahora es el fd del CSV que antes estaba x19
    ldr x1, =csv_buffer             // x1 = direccion del buffer destino
    mov x2, #BUFFER_SIZE            // x2 = maximo de bytes a leer
    bl read_fd
    mov x21, x0                     // Guardar bytes leidos en x21

    // Salta la primera linea del CSV (encabezado con nombres de columnas)
    // skip_header(ptr, end) -> retorna nuevo ptr en x0
    ldr x0, =csv_buffer             // x0 = inicio del buffer
    ldr x1, =csv_buffer
    add x1, x1, x21                 // x1 = fin del buffer (inicio + bytes leidos)
    bl skip_header
    mov x22, x0                     // x22 = ptr despues del encabezado (temporal)

    // Cargar 30 valores de la columna elegida hacia data_array
    // load_column_30(ptr, end, column_index, output_array)
    mov x0, x22                     // x0 = ptr despues del encabezado
    ldr x1, =csv_buffer
    add x1, x1, x21                 // x1 = fin del buffer
    mov x2, #COLUMN_INDEX           // x2 = columna a extraer (1 = TEMP)
    ldr x3, =data_array             // x3 = arreglo donde guardar los 30 valores
    bl load_column_30
    // x0 ahora tiene la cantidad de valores cargados (esperamos 30)

//2) ABRIR ARCHIVO DE SALIDA
    // Crear/truncar resultado_media.txt para escritura
    bl open_media_write
    mov x20, x0                     // Guardar fd de salida en x20

// 3) CALCULAR SUMAS
// Recorre data_array acumulando suma_x y suma_ponderada simultaneamente.
// El peso de cada dato es su posicion (i+1): dato[0]*1, dato[1]*2, ...
//inicializamos variables 
    mov x22, #0                     // x22 = i (indice del bucle, empieza en 0)
    mov x23, #0                     // x23 = suma_x = 0
    mov x24, #0                     // x24 = suma_ponderada = 0


//b.hs	(Mayor o igual (sin signo))
calc_loop:
    cmp x22, #30
    b.hs calc_done                  // Si i >= 30, terminar el bucle
    // Leer dato[i] desde data_array
    // Cada elemento ocupa 8 bytes, offset = i * 8
    //lsl #3 = *8
    lsl x0, x22, #3                 // x0 = i * 8 (desplazamiento en bytes)
    ldr x1, =data_array
    ldr x25, [x1, x0]              // x25 = data_array[i]

    // Acumular suma_x += dato[i]
    add x23, x23, x25

    // Calcular peso del dato actual: peso = i + 1
    add x0, x22, #1                 // x0 = i + 1 = peso actual

    // Acumular suma_ponderada += dato[i] * peso
    mul x1, x25, x0                 // x1 = dato[i] * peso
    add x24, x24, x1               // suma_ponderada += dato[i] * peso

    // Avanzar al siguiente dato
    add x22, x22, #1               // i++
    b calc_loop

calc_done:

    // media ponderada = suma_ponderada / WEIGHT_SUM (465) o suma de pesos
    mov x0, #WEIGHT_SUM
    udiv x25, x24, x0              // x25 = suma_ponderada / 465 = WEIGHTED_MEAN

// 4) resultado_media.txt

    // MODULE=WEIGHTED_MEAN
    mov x0, x20
    ldr x1, =msg_module
    bl write_cstr

    // TOTAL_VALUES=30
    mov x0, x20
    ldr x1, =msg_total
    bl write_cstr

    // SUM_X=<valor>
    mov x0, x20
    ldr x1, =msg_sum_x
    bl write_cstr                   // Escribir "SUM_X="
    mov x0, x20
    mov x1, x23                     // x23 = suma_x calculada
    bl write_uint                   // Escribir el valor numerico
    mov x0, x20
    bl write_newline                // Salto de linea

    // WEIGHT_SUM=465
    mov x0, x20
    ldr x1, =msg_weight_sum
    bl write_cstr                   // Escribir "WEIGHT_SUM="
    mov x0, x20
    mov x1, #WEIGHT_SUM             // 465, constante fija
    bl write_uint
    mov x0, x20
    bl write_newline

    // WEIGHTED_MEAN=<valor>
    mov x0, x20
    ldr x1, =msg_weighted_mean
    bl write_cstr                   // Escribir "WEIGHTED_MEAN="
    mov x0, x20
    mov x1, x25                     // x25 = resultado de la division
    bl write_uint
    mov x0, x20
    bl write_newline

//5) CERRAR ARCHIVOS Y SALIR
    // Cerrar fd del CSV
    mov x0, x19
    bl close_fd
    // Cerrar fd del archivo de salida
    mov x0, x20
    bl close_fd
    // Terminar el proceso con codigo 0 (exito)
    mov x0, #0
    bl exit_program