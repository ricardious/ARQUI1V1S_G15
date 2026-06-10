import threading
import time

try:
    import RPi.GPIO as GPIO  # type: ignore

    GPIO_DISPONIBLE = True
except (ImportError, RuntimeError):
    GPIO_DISPONIBLE = False
    print("[ADVERTENCIA] RPi.GPIO no disponible, modo simulacion")


PIN_RELE_BOMBA = 17
DURACION_RIEGO = 5
PAUSA_MINIMA = 30


class RiegoArea1Actuator:
    """Control de riego del area 1 usando la bomba compartida."""

    def __init__(self):
        self._bloqueado = False
        self._ultimo_riego = 0
        self._estado = "RIEGO_OFF"

        if GPIO_DISPONIBLE:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(PIN_RELE_BOMBA, GPIO.OUT)
            GPIO.output(PIN_RELE_BOMBA, GPIO.LOW)

    @property
    def estado(self) -> str:
        return self._estado

    def _puede_regar(self) -> bool:
        return (time.time() - self._ultimo_riego) >= PAUSA_MINIMA

    def _tarea_riego(self, estado_activo: str):
        """Hilo secundario: enciende bomba, espera duracion y apaga."""
        try:
            if GPIO_DISPONIBLE:
                GPIO.output(PIN_RELE_BOMBA, GPIO.HIGH)
            self._estado = estado_activo
            print(f"[RIEGO] Bomba encendida - estado: {estado_activo}")
            time.sleep(DURACION_RIEGO)
        finally:
            if GPIO_DISPONIBLE:
                GPIO.output(PIN_RELE_BOMBA, GPIO.LOW)
            self._estado = "RIEGO_OFF"
            self._ultimo_riego = time.time()
            print("[RIEGO] Bomba apagada.")

    def _iniciar_riego(self, estado_activo: str, clave_retorno: str) -> dict:
        if self._bloqueado:
            print("[RIEGO] Bloqueado por saturacion")
            return {
                clave_retorno: 0,
                "estado_global": "ADVERTENCIA",
            }

        if not self._puede_regar():
            espera = PAUSA_MINIMA - (time.time() - self._ultimo_riego)
            print(f"[RIEGO] Pausa minima activa, espera {espera:.0f}s")
            return {
                clave_retorno: 0,
                "estado_global": "NORMAL",
            }

        hilo = threading.Thread(
            target=self._tarea_riego,
            args=(estado_activo,),
            daemon=True,
        )
        hilo.start()
        return {
            clave_retorno: 1,
            "estado_global": "RIEGO_ACTIVO",
        }

    def activar(self) -> dict:
        return self._iniciar_riego("RIEGO_AREA_1", "riego_1")

    def activar_manual(self) -> dict:
        return self._iniciar_riego("RIEGO_MANUAL", "riego_1")

    def verificar_y_regar(self, clasificacion: str) -> dict:
        if clasificacion == "SATURADO":
            self.bloquear()
            print("[AUTO] Suelo SATURADO - riego bloqueado")
            return {
                "riego_1": 0,
                "estado_global": "ADVERTENCIA",
            }

        if clasificacion == "SECO":
            self.desbloquear()
            print("[AUTO] Suelo SECO - activando riego automatico")
            return self.activar()

        self.desbloquear()
        return {
            "riego_1": 0,
            "estado_global": "NORMAL",
        }

    def desactivar(self) -> dict:
        if GPIO_DISPONIBLE:
            GPIO.output(PIN_RELE_BOMBA, GPIO.LOW)
        self._estado = "RIEGO_OFF"
        return {"riego_1": 0, "estado_global": "NORMAL"}

    def bloquear(self):
        self._bloqueado = True
        self._estado = "BLOQUEADO_POR_SATURACION"

    def desbloquear(self):
        self._bloqueado = False
        self._estado = "RIEGO_OFF"

    def limpiar(self):
        if GPIO_DISPONIBLE:
            GPIO.output(PIN_RELE_BOMBA, GPIO.LOW)
            GPIO.cleanup(PIN_RELE_BOMBA)
