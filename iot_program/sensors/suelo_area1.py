try:
    import board
    import busio
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    ADS1115_DISPONIBLE = True
except ImportError:
    ADS1115_DISPONIBLE = False

class SueloArea1Sensor:
    """
    Sensor de humedad de suelo del área 1.
    Lee desde ADS1115 canal An vía I2C.
    Valor raw del ADS1115: 0-32767 (lectura positiva)
    Se mapea a porcentaje 0-100:
        - Suelo seco  → valor alto  (~28000+) → 0-30%
        - Suelo normal→ valor medio (~15000)  → 30-70%
        - Suelo saturado → valor bajo (~5000) → 70-100%
    """
    # Pines y configuración
    UMBRAL_SECO      = 700   # equivalente lógico para clasificación
    UMBRAL_SATURADO  = 300

    def __init__(self):
        if ADS1115_DISPONIBLE:
            i2c = busio.I2C(board.SCL, board.SDA)
            ads = ADS.ADS1115(i2c)
            self._canal = AnalogIn(ads, ADS.P0)  # Canal A0
        else:
            self._canal = None
            print("[ADVERTENCIA] ADS1115 no disponible, usando simulación")

    def leer_valor_raw(self) -> int:
        """Devuelve valor crudo 0-32767 del ADS1115."""
        if self._canal:
            return self._canal.value
        # Fallback simulado si no hay hardware
        import random
        return random.randint(3000, 30000)

    def clasificar(self, porcentaje: float) -> str:
        """Clasifica el suelo según porcentaje de humedad."""
        if porcentaje < 30:
            return "SECO"
        elif porcentaje > 70:
            return "SATURADO"
        else:
            return "NORMAL"

    def read(self) -> float:
        """
        Retorna humedad como porcentaje (0.0 - 100.0).
        ADS1115 da valores altos cuando el suelo está seco
        y bajos cuando está húmedo.
        """
        raw = self.leer_valor_raw()
        # Mapear inversamente: raw alto = seco = % bajo
        # raw rango útil: 5000 (saturado) a 28000 (seco)
        raw = max(5000, min(28000, raw))
        porcentaje = (28000 - raw) / (28000 - 5000) * 100
        return round(porcentaje, 1)

    def obtener_estado(self) -> dict:
        """Retorna valor y clasificación juntos."""
        porcentaje = self.read()
        return {
            "valor": porcentaje,
            "clasificacion": self.clasificar(porcentaje)
        }