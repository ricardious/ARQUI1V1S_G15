.data  

msg_luz_on: 
    .ascii "ACTION=LIGHT_ON\nTARGET=LUZ\nRISK=HIGH\nREASON=LUZ_LOW_AND_DESCENDING\nSTATUS=OK\n\n"
len_luz_on = . - msg_luz_on

.text 
// determinar si el nivel de luz es bajo
//x27 = promedio
// x28 = tendencia 
evaluar_luz:
    ldr x0, =LUZ_BAJA //n x0 = direecion del umbral
    ldr x0, [x0]        //cargo en x0 el umbral
    
    cmp x27, x0         // comprao el umbral con el valor de la luz
    bge apagar_luces   // promedio >= umbral se apagaran luces
    
    cmp x28, #0         // comprao el umbral con el valor de la luz
    bge apagar_luces   // tend, estable o asc >= umbral se apagaran luces
    
    str x30, [sp, #-16]!
    mov x0, #1
    ldr x1, =msg_luz_on
    mov x2, len_luz_on
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret

apagar_luces:
    mov x0, #0
    ret