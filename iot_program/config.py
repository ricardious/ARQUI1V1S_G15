import os
from dataclasses import dataclass

from dotenv import load_dotenv


def _bool_from_env(value: str | None, default: bool) -> bool:
    if value is None or value == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on", "si"}


def _int_from_env(value: str | None, default: int) -> int:
    try:
        return int(value or default)
    except ValueError:
        return default


def _float_from_env(value: str | None, default: float) -> float:
    try:
        return float(value or default)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Configuracion del programa IoT cargada desde .env."""

    mqtt_host: str
    mqtt_port: int
    mqtt_client_id_prefix: str
    mqtt_username: str
    mqtt_password: str
    mqtt_qos: int
    mqtt_topic_prefix: str
    mongodb_uri: str
    mongodb_db: str
    simulation_mode: bool
    sensor_interval_seconds: float
    mqtt_publish_interval_seconds: float


def load_settings() -> Settings:
    load_dotenv()
    return Settings(
        mqtt_host=os.getenv("MQTT_HOST", "broker.emqx.io"),
        mqtt_port=_int_from_env(os.getenv("MQTT_PORT"), 1883),
        mqtt_client_id_prefix=os.getenv("MQTT_CLIENT_ID_PREFIX", "greenpi-g15-iot"),
        mqtt_username=os.getenv("MQTT_USERNAME", ""),
        mqtt_password=os.getenv("MQTT_PASSWORD", ""),
        mqtt_qos=_int_from_env(os.getenv("MQTT_QOS"), 0),
        mqtt_topic_prefix=os.getenv("MQTT_TOPIC_PREFIX", "greenpi/g15").strip().strip("/"),
        mongodb_uri=os.getenv("MONGODB_URI", ""),
        mongodb_db=os.getenv("MONGODB_DB", "greenpi_iot"),
        simulation_mode=_bool_from_env(os.getenv("SIMULATION_MODE"), True),
        sensor_interval_seconds=_float_from_env(os.getenv("SENSOR_INTERVAL_SECONDS"), 0.2),
        mqtt_publish_interval_seconds=_float_from_env(os.getenv("MQTT_PUBLISH_INTERVAL_SECONDS"), 1.0),
    )
