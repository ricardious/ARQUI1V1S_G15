from actuators.riego_area1 import RiegoArea1Actuator

class RiegoArea2Actuator:
    """
    Control de riego del área 2.
    Comparte bomba física con área 1.
    Recibe la instancia ya creada para compartir estado.
    """
    def __init__(self, bomba_compartida: RiegoArea1Actuator):
        self._bomba_real = bomba_compartida

    def activar(self) -> dict:
        """Automático, solo reporta como RIEGO_AREA_2."""
        resultado = self._bomba_real._iniciar_riego("RIEGO_AREA_2", "riego_1")
        return {
            "riego_2":       resultado.get("riego_1", 0),
            "estado_global": resultado.get("estado_global", "NORMAL")
        }

    def activar_manual(self) -> dict:
        """Manual, botón o dashboard."""
        resultado = self._bomba_real.activar_manual()
        return {
            "riego_2":       resultado.get("riego_1", 0),
            "estado_global": resultado.get("estado_global", "NORMAL")
        }

    def verificar_y_regar(self, clasificacion: str) -> dict:
        """
        Modo automático conectado al sensor área 2.
        Misma lógica que área 1 pero reporta riego_2.
        """
        if clasificacion == "SATURADO":
            self.bloquear()
            print("[AUTO] Área 2 SATURADA — riego bloqueado")
            return {
                "riego_2":       0,
                "estado_global": "ADVERTENCIA"
            }

        elif clasificacion == "SECO":
            self.desbloquear()
            print("[AUTO] Área 2 SECA — activando riego automático")
            return self.activar()  
        
        else:  # NORMAL
            self.desbloquear()
            return {
                "riego_2":       0,
                "estado_global": "NORMAL"
            }

    def desactivar(self) -> dict:
        self._bomba_real.desactivar()
        return {"riego_2": 0, "estado_global": "NORMAL"}

    def bloquear(self):
        self._bomba_real.bloquear()

    def desbloquear(self):
        self._bomba_real.desbloquear()