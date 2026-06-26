

.text
.global evaluar_prioridades

evaluar_prioridades:
    // niveles de prioridad
    // 1) gas: promedio(x11) y amplitud elevado (x12) / ALARM_ON 
    
    // 2) soil1: promedio bajo (x23) y tendencia descendente (x24) / RIEGO_1_ON
    // 3) soil2: promedio bajo (x25) y tendencia descendente (x26) / RIEGO_2_ON
    // 4) luz: promedio bajo (x27) y tendencia descendente (x28) / LIGHT_ON
    // 5) temp: promedio alto (x19) y tendencia ascendente (x20)/ FAN_ON
    // 6) sin condicion critica  / LED_GREEN
    // 6) sin accion fisica  / NO_ACTION
    
