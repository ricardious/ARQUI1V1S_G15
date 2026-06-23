AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build

UTILS_OBJ := $(BUILD_DIR)/utils.o
MEDIA_OBJ := $(BUILD_DIR)/modulo_1_media.o
MEDIA_BIN := $(BUILD_DIR)/modulo_1_media

.PHONY: all media run-media clean

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

clean:
	rm -rf $(BUILD_DIR)