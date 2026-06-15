AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build
UTILS_OBJ := $(BUILD_DIR)/utils.o
TENDENCIA_OBJ := $(BUILD_DIR)/modulo_5_tendencia.o
MEDIA_OBJ := $(BUILD_DIR)/modulo_1_media.o
VARIANZA_OBJ := $(BUILD_DIR)/modulo_2_varianza.o

TENDENCIA_BIN := $(BUILD_DIR)/modulo_5_tendencia
MEDIA_BIN := $(BUILD_DIR)/modulo_1_media
VARIANZA_BIN := $(BUILD_DIR)/modulo_2_varianza

.PHONY: all media varianza anomalias prediccion tendencia run-media run-varianza run-anomalias run-prediccion run-tendencia run-all clean

all: media varianza tendencia

media: $(MEDIA_BIN)

varianza: $(VARIANZA_BIN)

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

$(MEDIA_BIN): $(MEDIA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(VARIANZA_BIN): $(VARIANZA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-media: $(MEDIA_BIN)
	$(MEDIA_BIN)

run-varianza: $(VARIANZA_BIN)
	$(VARIANZA_BIN)

run-anomalias:
	@echo "PENDIENTE: falta arm64/modulo_3_anomalias.s (Kevin)"
	@exit 2

run-prediccion:
	@echo "PENDIENTE: falta arm64/modulo_4_prediccion.s (Oswaldo)"
	@exit 2

run-tendencia: $(TENDENCIA_BIN)
	$(TENDENCIA_BIN)

run-all: run-media run-varianza run-tendencia
	@echo "PENDIENTE: run-anomalias y run-prediccion se habilitan cuando existan sus .s"

clean:
	rm -rf $(BUILD_DIR)
