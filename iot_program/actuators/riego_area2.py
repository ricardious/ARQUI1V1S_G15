class RiegoArea2Actuator:
    """Control de riego del area 2.

    TODO: conectar el rele/bomba real del area 2.
    """

    def activar(self) -> dict[str, int | str]:
        return {"riego_2": 1, "estado_global": "RIEGO_ACTIVO"}

    def desactivar(self) -> dict[str, int]:
        return {"riego_2": 0}
