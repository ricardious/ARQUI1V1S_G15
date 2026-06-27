.data  
msg_luz_inicio: 
    .ascii "ACTION=LIGHT_ON\nTARGET=LUZ\nRISK=HIGH\nREASON=LUZ_LOW_AND_DESCENDING\nVALUE="
len_luz_inicio = . - msg_luz_inicio

msg_luz_medio:    
    .ascii "\nINDICATOR="
len_luz_medio = . - msg_luz_medio

msg_luz_fin:      
    .ascii "\nSTATUS=OK\n\n"
len_luz_fin = . - msg_luz_fin

.text 
.global evaluar_luz
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

    // imprimir la parte inicial
    mov x0, #1          // fd
    ldr x1, =msg_luz_inicio
    mov x2, len_luz_inicio
    bl write_text

    // pasar el valor de VALUE
    mov x0, x27         // numero a escribir (promedio)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte media
    mov x0, #1
    ldr x1, =msg_luz_medio
    mov x2, len_luz_medio
    bl write_text

    // pasar el valor de INDICATOR
    mov x0, x28         // numero a escribir (tendencia)
    mov x1, #1          // fd
    bl write_int

    // imprimir la parte final
    mov x0, #1              
    ldr x1, =msg_luz_fin
    mov x2, len_luz_fin
    bl write_text

    ldr x30, [sp], #16
    mov x0, #1
    ret

apagar_luces:
    mov x0, #0
    ret