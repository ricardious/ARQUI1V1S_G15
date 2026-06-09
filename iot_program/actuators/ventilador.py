class VentiladorActuator:
    """Control de ventilador.

    TODO: conectar el ventilador real por GPIO/rele.
    """

    def activar(self) -> dict[str, str]:
        return {"ventilador": "ON"}

    def desactivar(self) -> dict[str, str]:
        return {"ventilador": "OFF"}
