.data

msg_module:
    .ascii "MODULE=ANOMALY_DETECTION\n" //Etiqueta para identificar el módulo
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES="          //Etiqueta para identificar el total de valores
    len_msg_total = . - msg_total

msg_mean:
    .ascii "MEAN="                 //Etiqueta para identificar la media
    len_msg_mean = . - msg_mean

msg_stddev:
    .ascii "STD_DEV="               //Etiqueta para identificar la desviación estándar
    len_msg_stddev = . - msg_stddev

msg_anomalies:
    .ascii "ANOMALIES="             //Etiqueta para identificar el número de anomalías
    len_msg_anomalies = . - msg_anomalies

msg_risk:
    .ascii "SYSTEM_RISK="            //Etiqueta para identificar el nivel de riesgo
    len_msg_risk = . - msg_risk

risk_normal:
    .ascii "NORMAL\n"               //Etiqueta para identificar el nivel de riesgo normal
    len_risk_normal = . - risk_normal

risk_medium:
    .ascii "MEDIUM\n"               //Etiqueta para identificar el nivel de riesgo medio
    len_risk_medium = . - risk_medium

risk_high:
    .ascii "HIGH\n"                 //Etiqueta para identificar el nivel de riesgo alto
    len_risk_high = . - risk_high

.text               // Incluir el archivo utils.s para utilizar sus funciones
.include "utils.s"  // arm64/utils.s
.global _start        

_start:
    // obtener columna desde argumento
    bl get_column_arg

    // leer columna del CSV y guardarla en stack
    bl read_column_to_stack

    // guardar salidas
    mov x24, x0 // total_values
    mov x25, x1 // mean
    mov x26, x2 // std_dev
    mov x27, x3 // anomalies

    bl open_anomalias_write // abrir archivo de salida para escribir resultados
    mov x20, x0 // fd de salida(resultado)

    mov x0, x20 // fd de salida
    ldr x1, =msg_module // mensaje de módulo
    mov x2, len_msg_module // longitud del mensaje de módulo
    bl write_text // escribir mensaje de módulo en archivo de salida

    mov x0, x20 // fd de salida
    ldr x1, =msg_total // mensaje de total de valores
    mov x2, len_msg_total // longitud del mensaje de total de valores
    bl write_text // escribir mensaje de total de valores en archivo de salida

    mov x0, x26 // cantidad de datos (total_values)
    mov x1, x20 // fd de salida
    bl write_uint // escribir total_values en archivo de salida

    mov x0, x20 // fd de salida
    bl write_newline // escribir nueva línea en archivo de salida
