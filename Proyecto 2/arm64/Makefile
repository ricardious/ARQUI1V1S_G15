AS := aarch64-linux-gnu-as
LD := aarch64-linux-gnu-ld

BUILD_DIR := build

UTILS_OBJ := $(BUILD_DIR)/utils.o

MOTOR_OBJ := $(BUILD_DIR)/motor.o
MOTOR_BIN := $(BUILD_DIR)/motor

.PHONY: all run-motor motor clean

all: motor 

motor: $(MOTOR_BIN)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(UTILS_OBJ): utils.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(BUILD_DIR)/%.o: %.s | $(BUILD_DIR)
	$(AS) -g -o $@ $<

$(MOTOR_BIN): $(MOTOR_OBJ) $(UTILS_OBJ)
	$(LD) -o $@ $^

run-motor: 	$(MOTOR_BIN) 

clean:	
	rm -rf $(BUILD_DIR)