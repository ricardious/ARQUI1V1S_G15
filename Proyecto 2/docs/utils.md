# Documentación Técnica: Biblioteca Común ARM64 (`utils`)

La biblioteca común centraliza todas las operaciones de entrada/salida de archivos, análisis sintáctico de texto CSV, conversión numérica, manipulación de la pila (Stack) y control de errores en ensamblador ARM64 (AArch64). Está diseñada para soportar procesamiento con tamaños de ventanas dinámicas y columnas seleccionables por consola.

---

## 1. Arquitectura de Archivos de la Biblioteca
La biblioteca se encuentra modularizada bajo el directorio `utils/` y se integra de forma unificada mediante el archivo cabecera `utils.s`:

```text
utils.s (Archivo central de includes)
├── utils_data.s          - Declaración de constantes de rutas, ideales, buffers y strings de error.
├── utils_atoi.s          - Conversión de ASCII a entero.
├── utils_args.s          - Parseo de argumentos de línea de comandos (argc/argv).
├── utils_file.s          - Llamadas al sistema para abrir, leer, escribir y cerrar archivos.
├── utils_write.s         - Funciones de formateo y escritura de texto, enteros sin signo y firmados.
├── utils_csv.s           - Navegación interna de caracteres, salto de líneas y comparación de strings.
├── utils_stack.s         - Funciones auxiliares para empujar datos dinámicos a la pila.
├── utils_math.s          - Rutina para raíz cuadrada entera truncada.
├── utils_read_column.s   - Motor principal de extracción y parseo de columnas dinámicas al Stack.
├── utils_errors.s        - Manejo estructurado de fallas y terminación segura del proceso.
└── utils_ideal.s         - Retorno del valor ideal para un índice de columna.
```

---

## 2. API de Funciones y Subrutinas

### A. Procesamiento de Argumentos (`utils_args.s`)
#### `get_column_arg`
Lee y valida los parámetros ingresados por la consola al ejecutar los módulos de análisis.
* **Formato esperado de ejecución:**
  `./modulo archivo.csv linea_inicial linea_final columna`
* **Entrada:** Pila del sistema a través del puntero de marco `x29`.
* **Salida:**
  * `x13` = Línea inicial del rango (`WINDOW_START`).
  * `x14` = Línea final del rango (`WINDOW_END`).
  * `x24` = Puntero a la cadena del archivo CSV (`argv[1]`).
  * `x25` = Puntero a la cadena con el nombre de la columna (`argv[4]`).
* **Validaciones realizadas:**
  1. Que `argc` sea exactamente 5 (salta a `arg_error` si es menor).
  2. Convierte `argv[2]` (línea inicial) y `argv[3]` (línea final) a enteros mediante `atoi_csv`.
  3. Comprueba que `linea_inicial >= 1` e interrumpe si falla.
  4. Comprueba que `linea_final >= linea_inicial`.

---

### B. Parseo y Conversión Numérica (`utils_atoi.s` / `utils_csv.s`)
#### `atoi_csv`
Convierte una cadena de caracteres ASCII delimitada en un entero de 64 bits.
* **Entrada:** `x21` (puntero al inicio de la cadena en el buffer).
* **Salida:**
  * `x10` = Entero de 64 bits resultante.
  * `x7` = Bandera de estado (`1` si se decodificó un número válido, `0` si no se encontró un dígito decimal).
  * `x21` = Puntero actualizado apuntando al siguiente byte después del delimitador leído.

#### `find_column_by_name`
Busca secuencialmente la columna objetivo leyendo la primera línea del CSV (cabecera).
* **Entrada:**
  * `x21` = Dirección del buffer del archivo en memoria.
  * `x25` = Puntero al nombre de la columna buscada.
* **Salida:**
  * `x11` = Índice de columna encontrado (1-based index).
  * `x7` = Estado de búsqueda (`1` si fue encontrada, `0` en caso de error/no existencia).

---

### C. Carga Dinámica de Datos en Memoria (`utils_read_column.s` / `utils_stack.s`)

Este subcomponente lee el archivo físico, busca la columna solicitada, filtra la ventana de líneas solicitada y carga la serie temporal directamente en la pila del sistema para que los módulos históricos operen sobre ella.


#### `read_column_to_stack`
* **Entradas (deben estar configuradas en registros):**
  * `x11` = Número de columna a leer (obtenido con `find_column_by_name`).
  * `x13` = Línea inicial del rango.
  * `x14` = Línea final del rango.
* **Salidas:**
  * `x0` = Puntero al inicio de los datos leídos en la pila (dirección de memoria más baja).
  * `x1` = Puntero al límite final de los datos en la pila (`x28`).
  * `x2` = Cantidad de datos numéricos válidos leídos (`x22`).
  * `x3` = Dirección de memoria para restaurar la pila al salir (`x27`).
* **Lógica del Algoritmo:**
  1. Inicializa el Stack Frame y define la dirección de restauración `x27` y el límite superior de datos `x28`.
  2. Abre, lee y cierra el archivo CSV cargándolo temporalmente en la variable `buffer` de la sección `.bss`.
  3. Ejecuta `find_column_by_name` y se desplaza saltando el encabezado del archivo.
  4. Realiza un ciclo de comparación de la línea actual (`x15`):
     * Si `x15 < x13`, invoca a `saltar_linea` para omitir registros fuera del rango inferior.
     * Si `x15 > x14`, finaliza el procesamiento y salta a `read_column_return`.
  5. Dentro de la línea válida, navega por las columnas hasta igualar el índice objetivo (`x12 == x11`). Si la línea termina antes de hallar la columna, avanza a la siguiente fila.
  6. Al ubicar la columna, convierte el valor mediante `atoi_csv` y, si es numérico (`x7 == 1`), llama a `save_number_to_stack`.
  7. Repite hasta alcanzar la línea final o el fin del archivo (`$`).
  8. **Validación de Rango:** Valida que la cantidad de datos leídos sea mayor a cero (`x22 > 0`) y que la línea final solicitada se haya alcanzado dentro del archivo (`x15 >= x14`). De lo contrario, lanza un `range_error`.

#### `save_number_to_stack`
Reserva memoria dinámicamente en el stack decrementando `sp` en 16 bytes (para alineación de pila AArch64) y guarda el entero cargado en `x10`. Incrementa el contador global de datos `x22`.

---

### D. Funciones de Escritura (`utils_write.s`)
Permiten formatear reportes de salida y guardarlos en disco.

#### `write_text`
Escribe una cadena de texto de longitud conocida (`x2`) en el descriptor de archivo en `x0` usando la syscall `write` (número 64).

#### `write_cstring`
Escribe una cadena de caracteres terminada en nulo (`\0`) calculando su tamaño dinámicamente en tiempo de ejecución.
* **Entrada:** `x0` = Descriptor de archivo, `x1` = Dirección de la cadena de caracteres.

#### `write_int` (Entero con signo)
Permite representar números enteros negativos en formato ASCII en el archivo de reporte.
* **Lógica:** Evalúa si el número es positivo o cero:
  * Si es positivo, salta directamente a `write_uint`.
  * Si es negativo, lo niega (`sub x10, x10, x0`), escribe el carácter de signo menos (`-`) y procede a formatear el valor absoluto con `write_uint`.

#### `write_uint` (Entero sin signo)
Convierte el valor numérico binario de `x0` a ASCII dividiéndolo sucesivamente por 10 (`udiv`/`msub`) y escribiendo los dígitos resultantes en orden inverso en `num_buffer`.

---

### E. Aritmética Avanzada (`utils_math.s`)
#### `sqrt_entera`
Calcula la raíz cuadrada entera truncada ($\lfloor\sqrt{X}\rfloor$) mediante un bucle de aproximación sucesiva.
* **Entrada:** `x0` = Número a evaluar.
* **Salida:** `x0` = Raíz entera truncada.
* **Lógica:** Compara incrementalmente el cuadrado de un iterador (`x1 * x1`) contra el radicando. Al superarlo, decrementa el iterador en 1 para obtener la parte entera inferior.

---

### F. Control de Errores y Excepciones (`utils_errors.s`)
Ante cualquier falla de validación o desbordamiento en llamadas al sistema, el programa interrumpe el flujo, escribe el mensaje correspondiente en la consola (salida estándar `1`) y finaliza el proceso con código de salida `1` (`sys_exit`, syscall 93):

* **`open_error`**: No se puede acceder al archivo CSV.
* **`read_error`**: Falla al leer el archivo en disco.
* **`write_error`**: Falla de escritura o creación de los reportes.
* **`arg_error`**: Entrada incorrecta por consola de comandos.
* **`col_error`**: El sensor solicitado no existe en la cabecera del archivo.
* **`range_error`**: El rango seleccionado es inválido, no contiene datos o excede el total de líneas del archivo.
* **`num_error`**: Se detectó un valor no numérico en la columna seleccionada.