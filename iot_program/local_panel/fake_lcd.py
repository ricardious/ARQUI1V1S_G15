class FakeLCD:
    """LCD simulado para pruebas en consola."""

    def show(self, line_1: str, line_2: str = "") -> None:
        print(f"[LCD] {line_1} {line_2}".strip())
