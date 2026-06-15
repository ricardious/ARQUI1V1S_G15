# Instalación y ejecución

Pasos para preparar y ejecutar cada componente del sistema.

---

## 1. Requisitos

| Componente             | Requisito                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| Programa IoT y backend | Python 3.10+                                                             |
| Dashboard              | Node.js 18+ y pnpm                                                       |
| ARM64                  | `aarch64-linux-gnu-as`, `aarch64-linux-gnu-ld`, `make` y `gdb-multiarch` |
| Base de datos          | URI de MongoDB Atlas                                                     |
| Comunicación           | Broker MQTT `broker.emqx.io` (público)                                   |

---

## 2. Programa IoT (`iot_program/`)

```bash
cd iot_program
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py        # modo simulación por defecto
```

Dependencias: `paho-mqtt`, `pymongo`, `python-dotenv`, `adafruit-circuitpython-ads1x15`, `adafruit-circuitpython-dht`, `RPLCD`, `smbus2`.

Para hardware real se configura `SIMULATION_MODE=false`.

---

## 3. Backend (`server/`)

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
fastapi dev           # http://127.0.0.1:8000   (alternativa: uvicorn app.main:app --reload)
```

Documentación interactiva: `http://127.0.0.1:8000/docs`.

---

## 4. Dashboard (`client/`)

```bash
cd client
pnpm install
cp .env.example .env.local
pnpm dev              # http://localhost:3000
```

Build de producción:

```bash
pnpm build
pnpm start
```

---

## 5. ARM64 (`arm64/`)

```bash
cd arm64
make run-tendencia    # compila y ejecuta; genera ../resultados_arm64/resultado_tendencia.txt
```

Targets del Makefile: `make` / `make tendencia` / `make run-tendencia` / `make run-all` / `make clean`. Toolchain: `aarch64-linux-gnu-as` y `aarch64-linux-gnu-ld`.

Depuración con GDB:

```bash
make
gdb-multiarch build/modulo_5_tendencia
```

---

## 6. Variables de entorno

### `iot_program/.env`

| Variable                        | Descripción                              |
| ------------------------------- | ---------------------------------------- |
| `MQTT_HOST` / `MQTT_PORT`       | Broker MQTT (`broker.emqx.io` / `1883`). |
| `MQTT_TOPIC_PREFIX`             | Prefijo de topics (`greenpi/g15`).       |
| `MQTT_QOS`                      | Calidad de servicio (`0`).               |
| `MONGODB_URI` / `MONGODB_DB`    | Conexión MongoDB (`greenpi_iot`).        |
| `SIMULATION_MODE`               | `true` simulación / `false` hardware.    |
| `SENSOR_INTERVAL_SECONDS`       | Período del bucle.                       |
| `MQTT_PUBLISH_INTERVAL_SECONDS` | Frecuencia de publicación/persistencia.  |

### `server/.env`

| Variable                     | Descripción                           |
| ---------------------------- | ------------------------------------- |
| `MONGODB_URI` / `MONGODB_DB` | Conexión MongoDB.                     |
| `FRONTEND_URL`               | Origen permitido (CORS).              |
| `ARM64_DIR`                  | Ruta a la carpeta ARM64 (`../arm64`). |

### `client/.env.local`

| Variable                        | Descripción                                   |
| ------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | URL del backend.                              |
| `NEXT_PUBLIC_MQTT_WSS_URL`      | Broker MQTT por WebSocket seguro.             |
| `NEXT_PUBLIC_MQTT_TOPIC_PREFIX` | Prefijo de topics (igual al del iot_program). |

> Las credenciales reales (cadena de MongoDB) se mantienen fuera del repositorio. El prefijo de topics del iot_program y del dashboard deben coincidir.

---

## 7. Verificación rápida

| Componente     | Comando                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Backend activo | `curl http://127.0.0.1:8000/health`                                                                       |
| MongoDB        | `curl -X POST http://127.0.0.1:8000/api/readings/test` y `curl http://127.0.0.1:8000/api/readings/latest` |
| MQTT           | MQTTX suscrito a `invernadero/#`                                                                          |
| ARM64          | `make run-tendencia` y revisar `resultados_arm64/resultado_tendencia.txt`                                 |
