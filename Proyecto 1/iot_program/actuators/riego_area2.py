from actuators.riego_area1 import RiegoArea1Actuator


class RiegoArea2Actuator:
    """Control de riego del area 2 usando la bomba del area 1."""

    def __init__(self, bomba_compartida: RiegoArea1Actuator):
        self._bomba_real = bomba_compartida

    def activar(self) -> dict:
        resultado = self._bomba_real._iniciar_riego("RIEGO_AREA_2", "riego_1")
        return {
            "riego_2": resultado.get("riego_1", 0),
            "estado_global": resultado.get("estado_global", "NORMAL"),
        }

    def activar_manual(self) -> dict:
        resultado = self._bomba_real.activar_manual()
        return {
            "riego_2": resultado.get("riego_1", 0),
            "estado_global": resultado.get("estado_global", "NORMAL"),
        }

    def verificar_y_regar(self, clasificacion: str) -> dict:
        if clasificacion == "SATURADO":
            self.bloquear()
            print("[AUTO] Area 2 SATURADA - riego bloqueado")
            return {
                "riego_2": 0,
                "estado_global": "ADVERTENCIA",
            }

        if clasificacion == "SECO":
            self.desbloquear()
            print("[AUTO] Area 2 SECA - activando riego automatico")
            return self.activar()

        self.desbloquear()
        return {
            "riego_2": 0,
            "estado_global": "NORMAL",
        }

    def desactivar(self) -> dict:
        self._bomba_real.desactivar()
        return {"riego_2": 0, "estado_global": "NORMAL"}

    def bloquear(self):
        self._bomba_real.bloquear()

    def desbloquear(self):
        self._bomba_real.desbloquear()
