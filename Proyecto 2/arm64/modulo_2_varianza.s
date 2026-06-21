.data
msg_module:
    .ascii "MODULE=VARIANCE\n"
    len_msg_module = . - msg_module

msg_total:
    .ascii "TOTAL_VALUES="
    len_msg_total = . - msg_total

msg_mean:
    .ascii "MEAN="
    len_msg_mean = . - msg_mean

msg_variance:
    .ascii "VARIANCE="
    len_msg_variance = . - msg_variance

msg_std_dev:
    .ascii "STD_DEV="
    len_msg_std_dev = . - msg_std_dev

.text
.global _start
.include "utils.s"

_start:

    bl get_column_arg           // obtener la columna desde los argumentos de la consola
    bl read_column_to_stack     // leer columna del csv y cargarla al stack

    // guardar los retornos de utils en registros estables
    mov x19, x0     // direccion de inicio de datos en el stack
    mov x20, x2     // cantidad de datos leidos
    mov x21, x3     // posicion original para restaurar el stack

    mov x0, #0
    mov x8, #93
    svc #0