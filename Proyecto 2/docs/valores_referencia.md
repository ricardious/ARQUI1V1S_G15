# Especificación de Valores de Referencia (Umbrales) - Motor ARM64

Para permitir que el motor de decisión clasifique los indicadores sin intervención de Python, el programa define y exporta como símbolos globales (`.global`) las siguientes constantes en la sección de datos estáticos:

| Símbolo Global | Valor en Código | Unidad | Condición de Activación | Acción Asociada |
| :--- | :---: | :---: | :--- | :--- |
| `TEMP_ALTA` | `35` | °C | Promedio de temperatura supera este valor con tendencia ascendente. | `FAN_ON` |
| `LUZ_BAJA` | `250` | Lux | Promedio de iluminación por debajo de este límite con tendencia descendente. | `LIGHT_ON` |
| `SOIL_BAJO` | `40` | % | Humedad de suelo de zona 1 o 2 inferior a este límite con tendencia descendente. | `RIEGO_1_ON` / `RIEGO_2_ON` |
| `GAS_ALTO` | `400` | ppm | Promedio de concentración de gas es superior a este límite. | `ALARM_ON` |
| `GAS_AMP_ALTA` | `80` | ppm | La variación rápida de gas (amplitud) en el buffer supera este valor. | `ALARM_ON` |
| `GAS_RIESGO` | `350` | ppm | Promedio de gas en zona de riesgo (entre 350 y 400 ppm). | `LED_RED` |
| `TEMP_RIESGO` | `32` | °C | Promedio de temperatura en zona de riesgo (entre 32°C y 35°C). | `LED_RED` |
| `GAS_ADVERTENCIA` | `300` | ppm | Promedio de gas en zona de advertencia (entre 300 y 350 ppm). | `LED_YELLOW` |
| `TEMP_ADVERTENCIA` | `29` | °C | Promedio de temperatura en zona de advertencia (entre 29°C y 32°C). | `LED_YELLOW` |

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

### E. Zona de Riesgo Alto o Critico — LED_RED (`GAS_RIESGO: .quad 350` y `TEMP_RIESGO: .quad 32`)
* **Gas (350 ppm):** Cuando el promedio de gas se encuentra entre 350 y 400 ppm, el sistema activa `LED_RED` para advertir al operador de una condición en deterioro antes de que alcance el nivel crítico de alarma.
* **Temperatura (32°C):** Si el promedio de temperatura se encuentra entre 32°C y 35°C, se activa `LED_RED` como señal de riesgo alto previo a la activación del ventilador.

### F. Zona de Advertencia — LED_YELLOW (`GAS_ADVERTENCIA: .quad 300` y `TEMP_ADVERTENCIA: .quad 29`)
* **Gas (300 ppm):** Concentraciones entre 300 y 350 ppm indican que el gas se está alejando del rango normal pero aún no representan riesgo inmediato.
* **Temperatura (29°C):** Temperaturas entre 29°C y 32°C activan una advertencia temprana para que el operador esté al tanto del comportamiento del invernadero antes de que se requiera acción física.