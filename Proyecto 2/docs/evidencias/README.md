# Evidencias

Capturas, salidas y video que respaldan el funcionamiento del sistema, organizadas por categoría.

## Carpetas

| Carpeta | Contenido |
| ------- | --------- |
| `mqttx/` | Topics activos y payloads en MQTTX (sensores, comandos y respuestas). |
| `mongodb/` | Documentos de cada colección y respuestas de la API. |
| `dashboard/` | Secciones del dashboard con datos en vivo. |
| `sensores/` | Lecturas reales de cada sensor. |
| `actuadores/` | Bomba, ventilador, luces, buzzer y LEDs respondiendo. |
| `arm64/` | Archivos `resultado_*.txt` y la ejecución de los módulos. |
| `gdb/` | Sesiones de depuración por integrante. |
| `grafana/` | Paneles de Grafana leyendo el histórico de MongoDB. |

## Nombres sugeridos

```text
mqttx/topics_activos.png
mqttx/comando_encender_luces.png
mongodb/sensor_readings.png
mongodb/arm64_results.png
dashboard/panel_principal.png
dashboard/analisis_arm64.png
sensores/dht11.png
actuadores/bomba_riego.png
arm64/resultado_tendencia.png
gdb/ricardo_tendencia.png
grafana/panel_lecturas.png
grafana/panel_arm64_riesgo.png
```

## Capturas mínimas

- MQTTX: topics activos + un comando con su respuesta.
- MongoDB: un documento por colección (6).
- Dashboard: las 6 secciones.
- Sensores: los 4 sensores leyendo datos reales.
- Actuadores: bomba, ventilador, luces, buzzer y LEDs.
- ARM64: cada `resultado_*.txt` disponible.
- GDB: una sesión por integrante.
- Grafana: paneles del histórico (lecturas, riesgo y resultados ARM64).
