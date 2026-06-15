// ====================================================================
// Modulo 2: Varianza y desviacion estandar
// Archivo: modulo_2_varianza.s
//
// Entrada:
//   ../data/lecturas.csv
//   Argumento 1: 
//      0=ID  1=TEMP  2=HUM_AIRE  3=HUM_SUELO_1  4=HUM_SUELO_2
//      5=LUZ  6=GAS  7=RIEGO_1  8=RIEGO_2
//
// Como ejecutar:
//   ./modulo_2_varianza
// ====================================================================

.section .rodata
// strings que se van a escribir en el archivo de salida
// asciz agrega un cero al final del string automaticamente
msg_module:       .asciz "MODULE=VARIANCE\n"
msg_total:        .asciz "TOTAL_VALUES=30\n"
msg_mean:         .asciz "MEAN="
msg_variance:     .asciz "VARIANCE="
msg_std_dev:      .asciz "STD_DEV="
msg_err_args:     .asciz "ERROR: uso correcto: ./modulo_2_varianza <columna 0-8>\n"
msg_err_datos:    .asciz "ERROR: no se encontraron 30 registros en el CSV\n"

.section .bss
// bss es memoria que el sistema reserva y llena de ceros
// no ocupa espacio en el archivo compilado, solo se reserva al ejecutar
.balign 8
// balign 8 alinea a 8 bytes, necesario porque se van a guardar
// enteros de 64 bits y arm64 necesita esa alineacion para ldr y str

mi_buffer:        .skip 4096 // aqui se guarda el contenido de lecturas.csv

variable_x:       .skip 240
// este es el arreglo donde load_column_30 va a guardar los 30 valores
// 30 datos * 8 bytes cada uno = 240 bytes
// cada dato ocupa 8 bytes porque se trabaja con registros de 64 bits

// resultados que se van calculando, cada uno es un entero de 64 bits
.balign 8
media_res:        .skip 8
variance_res:     .skip 8
std_dev_res:      .skip 8

columna_res:      .skip 8
// aqui se guarda el numero de columna pedido, se guarda en memoria
// porque se haran varios bl a utils.s antes de usarlo, y para que ninguna funcion pise ese registro


.section .text
.global _start


// funciones que existen en utils.s, no se definen, solo se usan con bl
.extern open_csv_read
.extern open_varianza_write
.extern read_fd
.extern close_fd
.extern write_cstr
.extern write_int
.extern write_newline
.extern skip_header
.extern parse_next_uint
.extern load_column_30
.extern exit_program


// ====================================================================
// _start es el punto de entrada del programa, como un main
//
// registros a usar a lo largo del el programa:
//   x19 = fd del csv, despues se reutiliza para fd del archivo salida
//   x20 = bytes leidos del csv
//   x21 = puntero al final del buffer
//   x22 = puntero base del arreglo variable_x
//   x23 = indice i, se reutiliza en los dos ciclos (media y varianza)
//   x10 = suma acumulada en el ciclo de la media
//   x11 = media ya calculada
//   x12 = suma de cuadrados en el ciclo de varianza
//   x13 = varianza ya calculada
//   x14 = desviacion estandar ya calculada
// ====================================================================
_start:

    // ----------------------------------------------------------------
    // PASO 0: configurar la columna a procesar de forma fija
    // ----------------------------------------------------------------

    mov x1, #1

    // guardamos la columna en memoria, no en un registro
    ldr x0, =columna_res
    str x1, [x0]
    // columna_res ahora tiene el numero de columna estatico


    // ----------------------------------------------------------------
    // PASO 1: abrir y leer el archivo lecturas.csv
    // ----------------------------------------------------------------

    bl open_csv_read
    // open_csv_read no recibe parametros, ya tiene la ruta hardcodeada
    // en utils.s como ../data/lecturas.csv
    // retorna en x0 el descriptor de archivo (fd), o negativo si fallo

    cmp x0, #0
    b.lt error_salida
    // si x0 es negativo el archivo no se pudo abrir

    mov x19, x0
    // guardamos el fd del csv en x19 para usarlo despues


    // ahora leemos todo el contenido del archivo al buffer
    // read_fd recibe:
    //   x0 = fd
    //   x1 = direccion donde guardar lo leido
    //   x2 = cuantos bytes maximo leer
    // retorna en x0 cuantos bytes realmente leyo

    mov x0, x19
    ldr x1, =mi_buffer
    mov x2, #4096
    bl read_fd

    mov x20, x0
    // x20 = cantidad de bytes que realmente se leyeron del archivo


    // calculamos donde termina el contenido util del buffer
    ldr x0, =mi_buffer
    add x21, x0, x20
    // x21 = direccion donde inicia mi_buffer + bytes leidos
    // o sea x21 apunta justo despues del ultimo byte leido
    // esto nos sirve como limite para no leer memoria basura


    // ----------------------------------------------------------------
    // PASO 2: saltar el encabezado del csv
    // ----------------------------------------------------------------
    // el csv empieza con la linea
    // ID,TEMP,HUM_AIRE,HUM_SUELO_1,HUM_SUELO_2,LUZ,GAS,RIEGO_1,RIEGO_2

    ldr x0, =mi_buffer
    mov x1, x21
    bl skip_header
    // skip_header recibe el puntero de inicio y el de fin
    // avanza byte por byte hasta encontrar el primer salto de linea
    // retorna en x0 el puntero justo despues de ese salto de linea
    // o sea x0 ahora apunta al inicio de la fila 1 de datos


    // ----------------------------------------------------------------
    // PASO 3: cargar los 30 valores de la columna 
    // ----------------------------------------------------------------
    // load_column_30 recibe:
    //   x0 = puntero despues del encabezado (lo que nos devolvio skip_header)
    //   x1 = puntero fin del buffer
    //   x2 = numero de columna a extraer
    //   x3 = arreglo destino donde va a guardar los valores
    // retorna en x0 cuantos valores realmente guardo

    // x0 ya viene listo desde skip_header
    mov x1, x21

    ldr x2, =columna_res
    ldr x2, [x2]
    // primero cargamos la direccion de columna_res en x2
    // luego hacemos otro ldr para traer el VALOR que esta guardado ahi
    // ahora x2 = numero de columna (1)

    ldr x3, =variable_x
    // x3 apunta a donde vamos a guardar los 30 valores

    bl load_column_30

    cmp x0, #30
    b.ne error_datos
    // si load_column_30 no encontro exactamente 30 valores
    // algo esta mal con el csv, entonces error


    // ya no necesitamos el archivo csv abierto, lo cerramos
    mov x0, x19
    bl close_fd


    // ----------------------------------------------------------------
    // PASO 4: calcular la media
    // formula: MEDIA = suma de todos los X / 30
    // ----------------------------------------------------------------

    ldr x22, =variable_x
    // x22 = direccion base del arreglo, no se mueve, lo usamos como referencia

    mov x10, #0
    // x10 = suma acumulada, empieza en 0

    mov x23, #0
    // x23 = indice i, empieza en 0

ciclo_media:
    cmp x23, #30
    b.hs calcular_media_final
    // b.hs = branch if higher or same (mayor o igual sin signo)
    // si i ya llego a 30, salimos del ciclo

    lsl x24, x23, #3
    // lsl = logical shift left, desplazamiento a la izquierda
    // x24 = i * 8
    // multiplicamos por 8 porque cada elemento del arreglo ocupa 8 bytes
    // entonces para llegar al elemento i necesitamos saltar i*8 bytes

    ldr x4, [x22, x24]
    // cargamos el valor en la posicion (x22 + x24)
    // o sea variable_x[i]

    add x10, x10, x4
    // suma += variable_x[i]

    add x23, x23, #1
    // i++

    b ciclo_media
    // volvemos a revisar la condicion

calcular_media_final:
    mov x5, #30
    udiv x11, x10, x5
    // udiv = division entera sin signo
    // x11 = suma / 30 = media

    ldr x0, =media_res
    str x11, [x0]
    // guardamos la media en memoria por si la necesitamos despues


    // ----------------------------------------------------------------
    // PASO 5: calcular la varianza
    // formula: VAR = suma de (X - MEDIA) al cuadrado / 30
    // ----------------------------------------------------------------

    mov x12, #0
    // x12 = suma de los cuadrados de las diferencias, empieza en 0

    mov x23, #0
    // reiniciamos el indice i para el segundo ciclo

ciclo_varianza:
    cmp x23, #30
    b.hs calcular_varianza_final

    lsl x24, x23, #3
    ldr x4, [x22, x24]
    // x4 = variable_x[i], igual que antes

    sub x6, x4, x11
    // x6 = X_i - MEDIA
    // esto puede dar un numero negativo,
    // en arm64 los registros manejan numeros negativos en complemento a dos

    mul x7, x6, x6
    // x7 = (X_i - MEDIA) al cuadrado
    // aunque x6 sea negativo, al multiplicarlo por si mismo
    // el resultado siempre es positivo, el complemento a dos se encarga 

    add x12, x12, x7
    // suma_cuadrados += (X_i - MEDIA)^2

    add x23, x23, #1
    b ciclo_varianza

calcular_varianza_final:
    mov x5, #30
    udiv x13, x12, x5
    // x13 = suma_cuadrados / 30 = varianza

    ldr x0, =variance_res
    str x13, [x0]
    // guardamos la varianza


    // ----------------------------------------------------------------
    // PASO 6: calcular la desviacion estandar
    // formula: DESV = raiz cuadrada de la varianza
    // ----------------------------------------------------------------

    mov x0, x13
    // pasamos la varianza como parametro de entrada a la subrutina

    bl raiz_cuadrada_entera
    // retorna la raiz cuadrada entera x0

    mov x14, x0
    // x14 = desviacion estandar

    ldr x0, =std_dev_res
    str x14, [x0]
    // guardamos la desviacion estandar


    // ----------------------------------------------------------------
    // PASO 7: escribir el reporte en resultado_varianza.txt
    // ----------------------------------------------------------------

    bl open_varianza_write
    // abre o crea el archivo resultado_varianza.txt
    // retorna el fd en x0, o negativo si fallo

    cmp x0, #0
    b.lt error_salida

    mov x19, x0
    // reutilizamos x19, ahora guarda el fd del archivo de salida
    // ya no necesitamos el fd del csv, por eso es seguro reutilizarlo


    // escribimos linea por linea
    // write_cstr escribe un string que termina en cero
    // write_int escribe un numero como texto
    // write_newline escribe un salto de linea


    // linea 1: MODULE=VARIANCE
    mov x0, x19
    ldr x1, =msg_module
    bl write_cstr

    // linea 2: TOTAL_VALUES=30
    mov x0, x19
    ldr x1, =msg_total
    bl write_cstr

    // linea 3: MEAN=numero
    mov x0, x19
    ldr x1, =msg_mean
    bl write_cstr
    // primero escribimos el texto "MEAN="

    mov x0, x19
    ldr x2, =media_res
    ldr x1, [x2]
    // x2 = direccion de media_res
    // x1 = el VALOR guardado en esa direccion
    bl write_int
    // ahora escribimos el numero de la media

    mov x0, x19
    bl write_newline
    // y el salto de linea

    // linea 4: VARIANCE=numero
    mov x0, x19
    ldr x1, =msg_variance
    bl write_cstr

    mov x0, x19
    ldr x2, =variance_res
    ldr x1, [x2]
    bl write_int

    mov x0, x19
    bl write_newline

    // linea 5: STD_DEV=numero
    mov x0, x19
    ldr x1, =msg_std_dev
    bl write_cstr

    mov x0, x19
    ldr x2, =std_dev_res
    ldr x1, [x2]
    bl write_int

    mov x0, x19
    bl write_newline


    // cerramos el archivo de salida
    mov x0, x19
    bl close_fd

    // terminamos el programa con codigo 0, exito
    mov x0, #0
    bl exit_program


// ====================================================================
// bloques de error
// cada uno escribe un mensaje y termina el programa con codigo 1
// el fd 2 es stderr, la salida de errores
// ====================================================================

error_args:
    mov x0, #2
    ldr x1, =msg_err_args
    bl write_cstr
    mov x0, #1
    bl exit_program

error_datos:
    mov x0, x19
    bl close_fd
    // cerramos el csv antes de salir porque lo dejamos abierto

    mov x0, #2
    ldr x1, =msg_err_datos
    bl write_cstr
    mov x0, #1
    bl exit_program

error_salida:
    mov x0, #1
    bl exit_program


// ====================================================================
// subrutina propia: raiz_cuadrada_entera
//
// que hace:
//   calcula la raiz cuadrada entera de un numero
//   usando el metodo babilonico, newton-raphson
//
// como funciona el metodo:
//   se empieza con una estimacion inicial (el numero dividido entre 2)
//   y se va mejorando esa estimacion con la formula:
//   nueva_estimacion = (estimacion_anterior + numero/estimacion_anterior) / 2
//   se repite hasta que la estimacion deja de mejorar
//
// entrada:
//   x0 = el numero al que se le quiere sacar raiz, en este caso la varianza
//
// salida:
//   x0 = la raiz cuadrada entera, redondeada hacia abajo
//
// registros usados:
//   x1 = copia del numero original (N)
//   x2 = estimacion actual de la raiz
//   x3 = nueva estimacion calculada en cada vuelta del ciclo
// ====================================================================
raiz_cuadrada_entera:

    cbz x0, sqrt_zero
    // cbz = compare and branch if zero
    // si x0 es 0, la raiz de 0 es 0, caso especial

    mov x1, x0
    // x1 = N, guardamos el numero original porque x0 lo vamos a usar de retorno

    lsr x2, x1, #1
    // lsr = logical shift right, desplazamiento a la derecha
    // x2 = N / 2, esta es nuestra primera estimacion de la raiz

    cbz x2, sqrt_one
    // si N/2 da 0 quiere decir que N era 1
    // la raiz de 1 es 1, otro caso especial

sqrt_loop:
    udiv x3, x1, x2
    // x3 = N / estimacion_actual

    add x3, x3, x2
    // x3 = (N / estimacion_actual) + estimacion_actual

    lsr x3, x3, #1
    // x3 = lo anterior dividido entre 2
    // esta es la nueva estimacion mejorada

    cmp x3, x2
    b.ge sqrt_done
    // si la nueva estimacion es mayor o igual a la anterior
    // quiere decir que ya convergio, no va a mejorar mas
    // entonces terminamos

    mov x2, x3
    // si todavia mejora, actualizamos la estimacion

    b sqrt_loop
    // y repetimos


sqrt_one:
    mov x0, #1
    ret
    // caso especial, la raiz de 1 es 1

sqrt_zero:
    mov x0, #0
    ret
    // caso especial, la raiz de 0 es 0

sqrt_done:
    mov x0, x2
    // devolvemos la ultima estimacion que si convergio
    // x2 es la buena, x3 ya era la que no mejoraba
    ret