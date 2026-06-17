import random
from typing import Callable

import paho.mqtt.client as mqtt

from config import Settings
from topics import ACTUATOR_TOPICS, COMMAND_TOPICS, SENSOR_TOPICS, STATUS_TOPICS, topics_with_prefix, with_prefix


CommandHandler = Callable[[str, str], None]


class MQTTClient:
    """Cliente MQTT con payloads en texto plano.

    No se usa JSON porque cada valor del invernadero tiene un topic propio.
    """

    def __init__(self, settings: Settings, on_command: CommandHandler) -> None:
        self.settings = settings
        self.on_command = on_command
        random_suffix = random.randint(10000, 99999)
        self.client_id = f"{settings.mqtt_client_id_prefix}-{random_suffix}"
        self.sensor_topics = topics_with_prefix(SENSOR_TOPICS, settings.mqtt_topic_prefix)
        self.status_topics = topics_with_prefix(STATUS_TOPICS, settings.mqtt_topic_prefix)
        self.actuator_topics = topics_with_prefix(ACTUATOR_TOPICS, settings.mqtt_topic_prefix)
        self.command_topics = [with_prefix(topic, settings.mqtt_topic_prefix) for topic in COMMAND_TOPICS]
        self.client = self._create_client()
        self.connected = False

    def _create_client(self) -> mqtt.Client:
        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=self.client_id)
        except (AttributeError, TypeError):
            client = mqtt.Client(client_id=self.client_id)

        if self.settings.mqtt_username and self.settings.mqtt_password:
            client.username_pw_set(self.settings.mqtt_username, self.settings.mqtt_password)

        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        return client

    def connect(self) -> None:
        print(f"[MQTT] Conectando a {self.settings.mqtt_host}:{self.settings.mqtt_port}")
        try:
            self.client.connect(self.settings.mqtt_host, self.settings.mqtt_port, keepalive=60)
            self.client.loop_start()
        except OSError as exc:
            raise RuntimeError(f"No se pudo conectar al broker MQTT: {exc}") from exc

    def disconnect(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()

    def publish_sensor_values(self, values: dict[str, object]) -> None:
        for key, topic in self.sensor_topics.items():
            if key in values:
                self.publish_text(topic, values[key])

        for key, topic in self.status_topics.items():
            if key in values:
                self.publish_text(topic, values[key])

    def publish_actuator_states(self, values: dict[str, object]) -> None:
        if "riego_1" in values or "riego_2" in values:
            riego_on = int(values.get("riego_1", 0)) == 1 or int(values.get("riego_2", 0)) == 1
            self.publish_text(self.actuator_topics["riego"], "ON" if riego_on else "OFF")

        for key, topic in self.actuator_topics.items():
            if key == "riego":
                continue
            if key in values:
                value = values[key]
                if key in {"riego_1", "riego_2"}:
                    value = "ON" if int(value) == 1 else "OFF"
                self.publish_text(topic, value)

    def publish_text(self, topic: str, value: object) -> None:
        result = self.client.publish(topic, str(value), qos=self.settings.mqtt_qos)
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] Error publicando en {topic}: rc={result.rc}")

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: object,
        flags: object,
        reason_code: object,
        properties: object = None,
    ) -> None:
        self.connected = True
        print(f"[MQTT] Conectado con client_id={self.client_id}")
        for topic in self.command_topics:
            client.subscribe(topic, qos=self.settings.mqtt_qos)
            print(f"[MQTT] Suscrito a {topic}")

    def _on_disconnect(
        self,
        client: mqtt.Client,
        userdata: object,
        disconnect_flags_or_reason_code: object,
        reason_code: object = None,
        properties: object = None,
    ) -> None:
        self.connected = False
        reason = reason_code if reason_code is not None else disconnect_flags_or_reason_code
        print(f"[MQTT] Desconectado: {reason}")

    def _on_message(self, client: mqtt.Client, userdata: object, message: mqtt.MQTTMessage) -> None:
        payload = message.payload.decode("utf-8", errors="replace").strip()
        self.on_command(message.topic, payload)
