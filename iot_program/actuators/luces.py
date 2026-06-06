class LucesActuator:
    """Control de luces.

    TODO: conectar luces reales por GPIO/rele.
    """

    def encender(self) -> dict[str, str]:
        return {"luces": "ON"}

    def apagar(self) -> dict[str, str]:
        return {"luces": "OFF"}
