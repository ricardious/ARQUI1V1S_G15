AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build
UTILS_OBJ := $(BUILD_DIR)/utils.o
TENDENCIA_OBJ := $(BUILD_DIR)/modulo_5_tendencia.o

TENDENCIA_BIN := $(BUILD_DIR)/modulo_5_tendencia

.PHONY: all media varianza anomalias prediccion tendencia run-media run-varianza run-anomalias run-prediccion run-tendencia run-all clean

all: tendencia

media:
	@echo "PENDIENTE: falta arm64/modulo_1_media.s (Claudia)"

varianza:
	@echo "PENDIENTE: falta arm64/modulo_2_varianza.s (Elizabeth)"

anomalias:
	@echo "PENDIENTE: falta arm64/modulo_3_anomalias.s (Kevin)"

prediccion:
	@echo "PENDIENTE: falta arm64/modulo_4_prediccion.s (Oswaldo)"

tendencia: $(TENDENCIA_BIN)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(UTILS_OBJ): utils.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(BUILD_DIR)/%.o: %.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(TENDENCIA_BIN): $(TENDENCIA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-media:
	@echo "PENDIENTE: falta arm64/modulo_1_media.s (Claudia)"
	@exit 2

run-varianza:
	@echo "PENDIENTE: falta arm64/modulo_2_varianza.s (Elizabeth)"
	@exit 2

run-anomalias:
	@echo "PENDIENTE: falta arm64/modulo_3_anomalias.s (Kevin)"
	@exit 2

run-prediccion:
	@echo "PENDIENTE: falta arm64/modulo_4_prediccion.s (Oswaldo)"
	@exit 2

run-tendencia: $(TENDENCIA_BIN)
	$(TENDENCIA_BIN)

run-all: run-tendencia
	@echo "PENDIENTE: run-media, run-varianza, run-anomalias y run-prediccion se habilitan cuando existan sus .s"

clean:
	rm -rf $(BUILD_DIR)
