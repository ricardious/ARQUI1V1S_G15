.include "utils.s"
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

.section .bss
csv_buffer:
    .skip 4096         //buffer del csv

.section .text

.global _start

// Regristos utilizados:

_start:
//Algoritmoa planificado
// 1) abrir csv
// 2) realizar calculos
// 3) resultado_media.txt , imprimir 
    