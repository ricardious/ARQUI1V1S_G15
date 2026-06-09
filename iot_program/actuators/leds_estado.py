class LedsEstadoActuator:
    """Control de leds de estado y modo automatico/manual.

    TODO: conectar LEDs reales de estado cuando exista panel fisico.
    """

    def modo_automatico(self) -> dict[str, str]:
        return {"modo": "AUTOMATICO", "estado_global": "NORMAL"}

    def modo_manual(self) -> dict[str, str]:
        return {"modo": "MANUAL", "estado_global": "MODO_MANUAL"}
