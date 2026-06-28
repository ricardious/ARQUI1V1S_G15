
.include "utils.s"
.section .rodata
msg_calc:
    .ascii "CALC=RMSE\n"
    len_msg_calc = . - msg_calc

msg_column:
    .ascii "COLUMN="
    len_msg_column = . - msg_column
    
msg_start:
    .ascii "WINDOW_START="
    len_start = . - msg_start

msg_end:
    .ascii "WINDOW_END="
    len_end = . - msg_end

msg_count:
    .ascii "COUNT="
    len_count = . - msg_count

msg_ideal:
    .ascii "IDEAL="
    len_ideal = . - msg_ideal
msg_rmse:
    .ascii "RMSE="
    len_rmse = . - msg_rmse

msg_ok:
    .ascii "STATUS=OK"
    len_ok = . - msg_ok

.section .text
