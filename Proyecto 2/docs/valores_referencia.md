# Especificación de Valores de Referencia (Umbrales) - Motor ARM64

Para permitir que el motor de decisión clasifique los indicadores sin intervención de Python, el programa define y exporta como símbolos globales (`.global`) las siguientes constantes en la sección de datos estáticos:

| Símbolo Global | Valor en Código | Unidad | Condición de Activación | Acción Asociada |
| :--- | :---: | :---: | :--- | :--- |
| `TEMP_ALTA` | `35` | °C | Promedio de temperatura supera este valor con tendencia ascendente. | `FAN_ON` |
| `LUZ_BAJA` | `250` | Lux | Promedio de iluminación por debajo de este límite con tendencia descendente. | `LIGHT_ON` |
| `SOIL_BAJO` | `40` | % | Humedad de suelo de zona 1 o 2 inferior a este límite con tendencia descendente. | `RIEGO_1_ON` / `RIEGO_2_ON` |
| `GAS_ALTO` | `400` | ppm | Promedio de concentración de gas es superior a este límite. | `ALARM_ON` |
| `GAS_AMP_ALTA` | `80` | ppm | La variación rápida de gas (amplitud) en el buffer supera este valor. | `ALARM_ON` |

## Justificación Técnica de los Umbrales Definidos

### A. Temperatura Alta (`TEMP_ALTA: .quad 35`)
* Se establece en **35°C** debido a que es un límite crítico donde la mayoría de los cultivos del invernadero experimentan marchitamiento. Si el promedio supera este valor y la tendencia indica aumento (`x20 > 0`), se activa el ventilador.

### B. Iluminación Baja (`LUZ_BAJA: .quad 250`)
* Se configura en **250 Lux** para asegurar la compensación de luz solar en días muy nublados o durante el atardecer. Si el promedio desciende de este límite con tendencia descendente (`x28 < 0`), se enciende la luz artificial.

### C. Humedad de Suelo Mínima (`SOIL_BAJO: .quad 40`)
* Configurado al **40%**. Un nivel inferior compromete el transporte hídrico del cultivo. Se evalúa el promedio de humedad en conjunto con la tendencia para determinar si la tierra se está secando activamente.

### D. Seguridad de Gas (`GAS_ALTO: .quad 400` y `GAS_AMP_ALTA: .quad 80`)
* **Límite Absoluto (400 ppm):** Concentraciones superiores indican presencia inusual de CO u otros gases.
* **Variabilidad Dinámica (80 ppm):** Si el cambio máximo detectado en las últimas 5 muestras supera los 80 ppm (amplitud), se asume una anomalía por fuego o fuga súbita, disparando la alarma inmediatamente.