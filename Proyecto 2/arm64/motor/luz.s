.include "arm64/utils.s"

.data
luz_umbral:     .quad 250   

msg_luces_on:   .ascii "ACTION=ENCENDER_LUCES\n"
len_luces_on = . - msg_luces_on

msg_luces_off:  .ascii "ACTION=APAGAR_LUCES\n"
len_luces_off = . - msg_luces_off

.text
evaluar_luz_simple:
    // x25 tiene el valor de luz (0-1000) enviado por Python
    ldr x0, =luz_umbral //n x0 = direecion del umbral
    ldr x0, [x0]        //cargo en x0 el umbral
    
    cmp x25, x0         // comprao el umbral con el valor de la luz
    blt prender_luces   // luz < umbral se prenderan luces
    
    // Si hay suficiente luz (>= 250), apagar luces
    mov x0, #1
    ldr x1, =msg_luces_off
    mov x2, len_luces_off
    bl write_text

prender_luces:
    mov x0, #1
    ldr x1, =msg_luces_on
    mov x2, len_luces_on
    bl write_text