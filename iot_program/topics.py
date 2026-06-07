"""Topics MQTT del proyecto.

MQTT usa texto plano porque cada dato se publica en su propio topic.
"""

SENSOR_TOPICS = {
    "temperatura": "invernadero/sensores/temperatura",
    "humedad_ambiente": "invernadero/sensores/humedad_ambiente",
    "humedad_suelo_area1": "invernadero/sensores/humedad_suelo_area1",
    "humedad_suelo_area2": "invernadero/sensores/humedad_suelo_area2",
    "luz": "invernadero/sensores/luz",
    "gas": "invernadero/sensores/gas",
}

STATUS_TOPICS = {
    "estado_global": "invernadero/estado/global",
}

ACTUATOR_TOPICS = {
    "riego": "invernadero/actuadores/riego",
    "riego_1": "invernadero/actuadores/riego_area1",
    "riego_2": "invernadero/actuadores/riego_area2",
    "ventilador": "invernadero/actuadores/ventilador",
    "luces": "invernadero/actuadores/luces",
    "alarma": "invernadero/actuadores/alarma",
}

COMMAND_TOPICS = [
    "invernadero/control/remoto",
    "invernadero/control/manual",
]


def with_prefix(topic: str, prefix: str = "") -> str:
    clean_prefix = prefix.strip().strip("/")
    if not clean_prefix:
        return topic
    return f"{clean_prefix}/{topic}"


def topics_with_prefix(topics: dict[str, str], prefix: str = "") -> dict[str, str]:
    return {key: with_prefix(topic, prefix) for key, topic in topics.items()}
