AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build

LEC ?= ../data/lecturas.csv
INI ?= 1
FIN ?= 30
COL ?= TEMP

UTILS_OBJ := $(BUILD_DIR)/utils.o
MEDIA_OBJ := $(BUILD_DIR)/modulo_1_media.o
MEDIA_BIN := $(BUILD_DIR)/modulo_1_media
VARIANZA_OBJ := $(BUILD_DIR)/modulo_2_varianza.o
VARIANZA_BIN := $(BUILD_DIR)/modulo_2_varianza
ANOMALIAS_OBJ := $(BUILD_DIR)/modulo_3_anomalias.o
ANOMALIAS_BIN := $(BUILD_DIR)/modulo_3_anomalias
PREDICCION_OBJ := $(BUILD_DIR)/modulo_4_prediccion.o
PREDICCION_BIN := $(BUILD_DIR)/modulo_4_prediccion

TENDENCIA_OBJ := $(BUILD_DIR)/modulo_5_tendencia.o
TENDENCIA_BIN := $(BUILD_DIR)/modulo_5_tendencia

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

$(MEDIA_BIN): $(MEDIA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(VARIANZA_BIN): $(VARIANZA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(ANOMALIAS_BIN): $(ANOMALIAS_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(PREDICCION_BIN): $(PREDICCION_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(TENDENCIA_BIN): $(TENDENCIA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-media: $(MEDIA_BIN)
	$(MEDIA_BIN) $(LEC) $(INI) $(FIN) $(COL)

run-varianza: $(VARIANZA_BIN)
	$(VARIANZA_BIN) $(LEC) $(INI) $(FIN) $(COL)

run-anomalias: $(ANOMALIAS_BIN)
	$(ANOMALIAS_BIN) $(LEC) $(INI) $(FIN) $(COL)

run-prediccion: $(PREDICCION_BIN)
	$(PREDICCION_BIN) $(LEC) $(INI) $(FIN) $(COL)

run-tendencia: $(TENDENCIA_BIN)
	$(TENDENCIA_BIN) $(LEC) $(INI) $(FIN) $(COL)

run-all: run-media run-varianza run-anomalias run-prediccion run-tendencia

clean:
	rm -rf $(BUILD_DIR)