

.text
.global evaluar_prioridades

evaluar_prioridades:
    // niveles de prioridad
    // 1) gas: promedio(x11) y amplitud elevado (x12) / ALARM_ON 
    
    // 2) soil1: promedio bajo y tendencia descendente / RIEGO_1_ON
    // 3) soil2: promedio bajo y tendencia descendente / RIEGO_2_ON
    // 4) luz: promedio bajo y tendencia descendente / LIGHT_ON
    // 5) temp: promedio alto y tendencia ascendente / FAN_ON
    // 6) sin condicion critica  / LED_GREEN
    // 6) sin accion fisica  / NO_ACTION
    
