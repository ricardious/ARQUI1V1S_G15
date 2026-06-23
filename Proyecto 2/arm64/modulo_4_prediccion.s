
// Modulo 4: Prediccion lineal simple


.data


msg_module:
    .ascii "MODULE=PREDICTION\n"
    len_msg_module = . - msg_module

msg_initial:
    .ascii "INITIAL_VALUE="
    len_msg_initial = . - msg_initial

msg_final:
    .ascii "FINAL_VALUE="
    len_msg_final = . - msg_final

msg_diff:
    .ascii "TOTAL_DIFF="
    len_msg_diff = . - msg_diff

msg_avg:
    .ascii "AVG_CHANGE="
    len_msg_avg = . - msg_avg

msg_next:
    .ascii "NEXT_VALUE="
    len_msg_next = . - msg_next

// Caracteres para decimales y negativos 
str_minus:
    .ascii "-"
str_dot:
    .ascii "."
str_zero:
    .ascii "0"

.text
.global _start

// inicio 
_start:
  


exit_ok:
    mov x0, #0      // Codigo de salida 0
    mov x8, #93     // Numero de syscall 
    svc #0          // Ejecuta la llamada al sistema operativo

