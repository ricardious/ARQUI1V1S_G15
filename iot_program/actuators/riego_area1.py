class RiegoArea1Actuator:
    """Control de riego del area 1.

    TODO: conectar el rele/bomba real del area 1.
    """

    def activar(self) -> dict[str, int | str]:
        return {"riego_1": 1, "estado_global": "RIEGO_ACTIVO"}

    def desactivar(self) -> dict[str, int]:
        return {"riego_1": 0}
