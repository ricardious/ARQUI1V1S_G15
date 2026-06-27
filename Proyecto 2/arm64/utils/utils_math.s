// Calcula raiz cuadrada entera truncada.
// Entrada:
//   x0 = numero al que se le quiere sacar raiz
// Salida:
//   x0 = raiz entera truncada
sqrt_entera:
    mov x1, #1              // iterador

sqrt_loop:
    mul x2, x1, x1          // x2 = x1 * x1

    cmp x2, x0              // si x1*x1 > numero, terminar
    bgt sqrt_end_loop

    add x1, x1, #1
    b sqrt_loop

sqrt_end_loop:
    sub x1, x1, #1          // nos pasamos una posicion, entonces restamos 1
    mov x0, x1              // resultado en x0
    ret
    