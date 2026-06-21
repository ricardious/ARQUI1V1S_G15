AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build
UTILS_OBJ := $(BUILD_DIR)/utils.o
TENDENCIA_OBJ := $(BUILD_DIR)/modulo_5_tendencia.o
MEDIA_OBJ := $(BUILD_DIR)/modulo_1_media.o
VARIANZA_OBJ := $(BUILD_DIR)/modulo_2_varianza.o
ANOMALIAS_OBJ := $(BUILD_DIR)/modulo_3_anomalias.o
PREDICCION_OBJ := $(BUILD_DIR)/modulo_4_prediccion.o

TENDENCIA_BIN := $(BUILD_DIR)/modulo_5_tendencia
MEDIA_BIN := $(BUILD_DIR)/modulo_1_media
VARIANZA_BIN := $(BUILD_DIR)/modulo_2_varianza
ANOMALIAS_BIN := $(BUILD_DIR)/modulo_3_anomalias
PREDICCION_BIN := $(BUILD_DIR)/modulo_4_prediccion

COL ?= 1

.PHONY: all media varianza anomalias prediccion tendencia run-media run-varianza run-anomalias run-prediccion run-tendencia run-all clean

all: media varianza anomalias prediccion tendencia

media: $(MEDIA_BIN)

varianza: $(VARIANZA_BIN)

anomalias: $(ANOMALIAS_BIN)

prediccion: $(PREDICCION_BIN)

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

$(ANOMALIAS_BIN): $(ANOMALIAS_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(PREDICCION_BIN): $(PREDICCION_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-media: $(MEDIA_BIN)
	$(MEDIA_BIN) $(COL)

run-varianza: $(VARIANZA_BIN)
	$(VARIANZA_BIN) $(COL)

run-anomalias: $(ANOMALIAS_BIN)
	$(ANOMALIAS_BIN) $(COL)

run-prediccion: $(PREDICCION_BIN)
	$(PREDICCION_BIN) $(COL)

run-tendencia: $(TENDENCIA_BIN)
	$(TENDENCIA_BIN) $(COL)

run-all: run-media run-varianza run-anomalias run-prediccion run-tendencia
	@echo "Todos los modulos ARM64 ejecutados."

clean:
	rm -rf $(BUILD_DIR)
