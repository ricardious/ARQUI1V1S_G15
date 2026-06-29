# Documentación técnica — Invernadero Inteligente IoT (Grupo 15)

Informe técnico del proyecto **Invernadero Inteligente IoT**, curso **Arquitectura de Computadores y Ensambladores 1 (ACYE1)**, Universidad de San Carlos de Guatemala.

Esta documentación describe la arquitectura del sistema, los subsistemas obligatorios, la comunicación MQTT, el modelo de datos en MongoDB, el dashboard web y el procesamiento estadístico en ARM64, junto con las decisiones de diseño y la evidencia de funcionamiento.

---

## Índice

| Documento                                                | Contenido                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| [arquitectura_general.md](arquitectura_general.md)       | Arquitectura del sistema, subsistemas, responsabilidades y flujos de datos. |
| [instalacion_y_ejecucion.md](instalacion_y_ejecucion.md) | Requisitos y ejecución de cada componente.                                  |
| [iot_program.md](iot_program.md)                         | Lógica en Python: sensores, actuadores, estados, modo automático/manual.    |
| [mqtt.md](mqtt.md)                                       | Comunicación IoT: broker, topics, comandos y payloads.                      |
| [mongodb.md](mongodb.md)                                 | Modelo de datos: colecciones y estructura de documentos.                    |
| [backend_fastapi.md](backend_fastapi.md)                 | API REST, generación de `lecturas.csv` y orquestación de ARM64.             |
| [dashboard.md](dashboard.md)                             | Dashboard web: panel principal, gráficas, controles e historial.            |
| [arm64.md](arm64.md)                                     | Procesamiento en ensamblador: `utils.s`, módulos y formatos de salida.      |
| [conexiones_fisicas.md](conexiones_fisicas.md)           | Conexión física: pines GPIO, I2C, ADS1115, relés y botones.                 |
| [pruebas_y_evidencias.md](pruebas_y_evidencias.md)       | Plan de pruebas y registro de evidencias.                                   |
| [integrantes/](integrantes/)                             | Documentación individual de cada módulo ARM64.                              |

### Documentación individual ARM64

| Documento                                                              | Módulo                         | Responsable                      |
| ---------------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| [integrantes/claudia_media.md](integrantes/claudia_media.md)           | Media aritmética ponderada     | Claudia Maribel Tigüilá Tecum    |
| [integrantes/elizabeth_varianza.md](integrantes/elizabeth_varianza.md) | Varianza y desviación estándar | Emiliana Elizabeth Pú Lara       |
| [integrantes/kevin_anomalias.md](integrantes/kevin_anomalias.md)       | Detección de anomalías         | Kevin Rodrigo Sandoval Hernández |
| [integrantes/oswaldo_prediccion.md](integrantes/oswaldo_prediccion.md) | Predicción lineal simple       | Alex Oswaldo López Alquejay      |
| [integrantes/ricardo_tendencia.md](integrantes/ricardo_tendencia.md)   | Tendencia acumulada avanzada   | Alex Ricardo Castañeda Rodríguez |
| [integrantes/ricardo_regresion.md](integrantes/ricardo_regresion.md)   | Regresión lineal simple        | Alex Ricardo Castañeda Rodríguez |

### Evidencias

[`evidencias/`](evidencias/) reúne las capturas y salidas que respaldan el funcionamiento (MQTT, MongoDB, dashboard, sensores, actuadores, ARM64 y GDB). Ver [evidencias/README.md](evidencias/README.md).

---

## Orden de lectura recomendado

1. [arquitectura_general.md](arquitectura_general.md)
2. [instalacion_y_ejecucion.md](instalacion_y_ejecucion.md)
3. [iot_program.md](iot_program.md) · [mqtt.md](mqtt.md) · [mongodb.md](mongodb.md)
4. [backend_fastapi.md](backend_fastapi.md) · [arm64.md](arm64.md)
5. [dashboard.md](dashboard.md) · [conexiones_fisicas.md](conexiones_fisicas.md)
6. [integrantes/](integrantes/) · [pruebas_y_evidencias.md](pruebas_y_evidencias.md)
