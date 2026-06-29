// Biblioteca comun ARM64 del Proyecto
.data
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

rmse_path:
    .asciz "../resultados_arm64/resultado_rmse.txt"

regresion_path:
    .asciz "../resultados_arm64/resultado_regresion.txt"

prediccion_futura_path:
    .asciz "../resultados_arm64/resultado_prediccion_futura.txt"

integral_error_path:
    .asciz "../resultados_arm64/resultado_integral_error.txt"

derivada_local_path:
    .asciz "../resultados_arm64/resultado_derivada_local.txt"

.data

TEMP_IDEAL: .quad 24
HUM_IDEAL:  .quad 70
SOIL_IDEAL: .quad 65
LUZ_IDEAL:  .quad 200
GAS_IDEAL:  .quad 150

// umbrales para LED_RED (riesgo alto o critico)
GAS_RIESGO:       .quad 350     // gas entre 350-400 LED_RED
TEMP_RIESGO:      .quad 32      // temp entre 32-35 LED_RED

// umbrales para LED_YELLOW (advertencia)
GAS_ADVERTENCIA:  .quad 300     // gas entre 300-350 LED_YELLOW
TEMP_ADVERTENCIA: .quad 29      // temp entre 29-32 LED_YELLOW

newline_text:
    .asciz "\n"

minus_text:
    .ascii "-"

err_open:
    .ascii "Error: no se pudo abrir el archivo\n"
    len_err_open = . - err_open

err_read:
    .ascii "Error: no se pudo leer el archivo\n"
    len_err_read = . - err_read

err_write:
    .ascii "Error: no se pudo escribir el archivo\n"
    len_err_write = . - err_write

err_arg:
    .ascii "Error: use ./modulo archivo.csv linea_inicial linea_final columna\n"
    len_err_arg = . - err_arg

err_col:
    .ascii "Error: columna no encontrada\n"
    len_err_col = . - err_col

err_range:
    .ascii "Error: rango invalido o sin datos\n"
    len_err_range = . - err_range

err_num:
    .ascii "Error: valor no numerico en la columna\n"
    len_err_num = . - err_num

.bss

buffer:
    .skip 131072

num_buffer:
    .skip 32 // espacio para convertir uint a string
