//primedio recientes 
// promedio = suma de xi / n
// n cantidad de datos


// algoritmo planificado
// recibo los datos de motor
// pueden venir de regitro x17

calcular_datos:
    cmp x17, #5     // si hay 5 datos entonces mando a calcular promedio
    b calcular_promedio



calcular_promedio_loop:
    // cargo  el primer dato de los 5 con un  desplazamiento para que despues vaya al segundo numero

    //con add en un registro que inicializo en 0 procedo a sumar lo que me vino del anterior

    // si lo datos cumplieron con ser 5 entonces divido_en_5 y retorno que ese sera el valor que llegara a luz.s
    
