class AlarmaActuator:
    """Control de alarma/buzzer.

    TODO: conectar buzzer real por GPIO.
    """

    def silenciar(self) -> dict[str, str]:
        return {"alarma": "OFF"}
