// Guardar numero en stack
save_number_to_stack:
    sub sp, sp, #16 // reservar espacio en stack
    str x10, [sp] // guardar numero en stack

    add x22, x22, #1 // incrementar contador de numeros
    ret
