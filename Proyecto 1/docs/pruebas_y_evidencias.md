# Pruebas y evidencias

Plan de pruebas del sistema y guía de las evidencias que respaldan su funcionamiento. Las capturas se organizan en [evidencias/](evidencias/).

---

## 1. Plan de pruebas

| #   | Prueba            | Cómo se verifica                                          | Evidencia                |
| --- | ----------------- | --------------------------------------------------------- | ------------------------ |
| 1   | Programa IoT      | `python main.py`; consola de arranque y publicación.      | `evidencias/sensores/`   |
| 2   | MQTT (sensores)   | MQTTX suscrito a `invernadero/#`.                         | `evidencias/mqttx/`      |
| 3   | MQTT (comandos)   | Publicar en `invernadero/control/manual` y ver respuesta. | `evidencias/mqttx/`      |
| 4   | MongoDB           | Documentos en las colecciones tras ejecutar el sistema.   | `evidencias/mongodb/`    |
| 5   | Backend           | `GET /health` y `/docs`.                                  | `evidencias/dashboard/`  |
| 6   | Dashboard         | Recorrer las 6 secciones con datos en vivo.               | `evidencias/dashboard/`  |
| 7   | Sensores reales   | Lectura de cada sensor con hardware.                      | `evidencias/sensores/`   |
| 8   | Actuadores reales | Comando o condición → actuador físico responde.           | `evidencias/actuadores/` |
| 9   | ARM64             | `make run-tendencia` y archivo de salida.                 | `evidencias/arm64/`      |
| 10  | GDB               | Sesión de depuración por integrante.                      | `evidencias/gdb/`        |

---

## 2. Prueba MQTT

1. Ejecutar el programa IoT.
2. En MQTTX, conectar a `broker.emqx.io:1883` y suscribirse a `invernadero/#` (o con prefijo `greenpi/g15/invernadero/#`).
3. Verificar lecturas en `invernadero/sensores/*` y estado en `invernadero/estado/global`.
4. Publicar un comando (p. ej. `ENCENDER_LUCES`) en `invernadero/control/manual` y confirmar `ON` en `invernadero/actuadores/luces`.

---

## 3. Prueba MongoDB

Con el backend en ejecución:

```bash
curl -X POST http://127.0.0.1:8000/api/readings/test
curl http://127.0.0.1:8000/api/readings/latest
```

Revisar en Atlas/Compass las colecciones `sensor_readings`, `events`, `commands`, `actuator_logs`, `system_status` y `arm64_results`.

---

## 4. Prueba del flujo IoT completo

Validar la cadena de extremo a extremo:

```text
Sensores → Python → MQTT → MongoDB → Dashboard → Comando → Raspberry Pi → Actuador
→ lecturas.csv → ARM64 → Resultados → MongoDB → Dashboard
```

---

## 5. Prueba de sensores reales

| Sensor     | Verificación                      |
| ---------- | --------------------------------- |
| DHT11      | Temperatura y humedad coherentes. |
| Suelo (A0) | Sube al humedecer, baja al secar. |
| Gas (A1)   | Sube ante humo/gas.               |
| Luz (A3)   | Sube con luz, baja en sombra.     |

---

## 6. Prueba de actuadores reales

| Actuador          | Condición                               | Verificación                        |
| ----------------- | --------------------------------------- | ----------------------------------- |
| Bomba             | `ACTIVAR_RIEGO` o suelo seco            | La bomba riega de forma controlada. |
| Ventilador        | `ACTIVAR_VENTILADOR` o temperatura alta | El ventilador gira.                 |
| Luces             | `ENCENDER_LUCES` o luz baja             | Las luces encienden.                |
| Buzzer + LED rojo | Gas sobre umbral                        | Alarma sonora y visual.             |
| LEDs de estado    | Cambios de estado global                | LED correcto encendido.             |

---

## 7. Prueba ARM64 y GDB

```bash
cd arm64
make run-tendencia
cat ../resultados_arm64/resultado_tendencia.txt

gdb-multiarch build/modulo_5_tendencia
```

Cada integrante presenta la sesión GDB de su módulo: breakpoints, registros, memoria, saltos y ciclos.

---

## 8. Evidencias a registrar

| Carpeta                  | Contenido                                |
| ------------------------ | ---------------------------------------- |
| `evidencias/mqttx/`      | Topics activos y comando/respuesta.      |
| `evidencias/mongodb/`    | Un documento por colección.              |
| `evidencias/dashboard/`  | Las 6 secciones del dashboard.           |
| `evidencias/sensores/`   | Lectura real de cada sensor.             |
| `evidencias/actuadores/` | Actuadores físicos respondiendo.         |
| `evidencias/arm64/`      | Archivos `resultado_*.txt`.              |
| `evidencias/gdb/`        | Una sesión de depuración por integrante. |

---

## 9. Video demostrativo

El video debe mostrar sensores, actuadores, riego real, dashboard, comunicación MQTT y persistencia en MongoDB, incluyendo el flujo completo hasta los resultados ARM64 en el dashboard.
