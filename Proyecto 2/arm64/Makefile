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
REGRESION_OBJ := $(BUILD_DIR)/modulo_2_regresion.o
REGRESION_BIN := $(BUILD_DIR)/modulo_2_regresion

DERIVADA_OBJ := $(BUILD_DIR)/modulo_5_derivada_local.o
DERIVADA_BIN := $(BUILD_DIR)/modulo_5_derivada_local

MOTOR_OBJ := $(BUILD_DIR)/motor.o
MOTOR_BIN := $(BUILD_DIR)/motor

.PHONY: all media varianza anomalias prediccion tendencia motor regresion run-media run-varianza run-anomalias run-prediccion run-tendencia run-motor run-regresion run-derivada run-all clean

all: media varianza anomalias prediccion tendencia motor regresion derivada

media: $(MEDIA_BIN)

varianza: $(VARIANZA_BIN)

anomalias: $(ANOMALIAS_BIN)

prediccion: $(PREDICCION_BIN)

tendencia: $(TENDENCIA_BIN)

derivada: $(DERIVADA_BIN)

motor: $(MOTOR_BIN)

regresion: $(REGRESION_BIN)

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

$(DERIVADA_BIN): $(DERIVADA_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(MOTOR_BIN): $(MOTOR_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

$(REGRESION_BIN): $(REGRESION_OBJ) $(UTILS_OBJ)
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

run-regresion: regresion
	$(REGRESION_BIN) $(LEC) $(INI) $(FIN) $(COL)
  
run-derivada: $(DERIVADA_BIN)
	$(DERIVADA_BIN) $(LEC) $(INI) $(FIN) $(COL)
 
run-motor: $(MOTOR_BIN)
	$(MOTOR_BIN)

run-all: run-media run-varianza run-anomalias run-prediccion run-tendencia run-regresion run-derivada

clean:
	rm -rf $(BUILD_DIR)