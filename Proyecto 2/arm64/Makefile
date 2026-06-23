AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build

UTILS_OBJ := $(BUILD_DIR)/utils.o
MEDIA_OBJ := $(BUILD_DIR)/modulo_1_media.o
MEDIA_BIN := $(BUILD_DIR)/modulo_1_media

COL ?= 1

.PHONY: all media varianza anomalias prediccion tendencia run-media run-varianza run-anomalias run-prediccion run-tendencia run-all clean

all: media

media: $(MEDIA_BIN)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(UTILS_OBJ): utils.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(BUILD_DIR)/%.o: %.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(MEDIA_BIN): $(MEDIA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-media: $(MEDIA_BIN)
	$(MEDIA_BIN) $(INI) $(FIN) $(COL)

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