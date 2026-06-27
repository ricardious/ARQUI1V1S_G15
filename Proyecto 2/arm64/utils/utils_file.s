// Abrir archivo lecturas.csv
open_csv_read:
    mov x0, #-100
    mov x1, x24     //ahora tiene la direccion el arvhico
    mov x2, #0
    mov x3, #0
    mov x8, #56 // syscall openat
    svc #0

    cmp x0, #0
    blt open_error

    mov x19, x0 // descriptor del archivo
    ret

// Crear/truncar archivo de salida
// x1: ruta del archivo a abrir
open_output_file:
    mov x0, #-100
    // x1 trae la ruta del archivo
    mov x2, #(1 | 64 | 512) // O_WRONLY | O_CREAT | O_TRUNC
    mov x3, #420 // permisos (0644)
    mov x8, #56 // syscall openat
    svc #0

    cmp x0, #0
    blt write_error

    ret

// Crear/Abrir resultado_tendencia.txt
open_tendencia_write:
    ldr x1, =tendencia_path
    b open_output_file

// Crear/Abrir resultado_media.txt
open_media_write:
    ldr x1, =media_path
    b open_output_file

// Crear/Abrir resultado_varianza.txt
open_varianza_write:
    ldr x1, =varianza_path
    b open_output_file

// Crear/Abrir resultado_anomalias.txt
open_anomalias_write:
    ldr x1, =anomalias_path
    b open_output_file

// Crear/Abrir resultado_prediccion.txt
open_prediccion_write:
    ldr x1, =prediccion_path
    b open_output_file

// Crear/Abrir resultado_rmse.txt
open_rmse_write:
    ldr x1, =rmse_path
    b open_output_file

// Crear/Abrir resultado_regresion.txt
open_regresion_write:
    ldr x1, =regresion_path
    b open_output_file

// Crear/Abrir resultado_prediccion_futura.txt
open_prediccion_futura_write:
    ldr x1, =prediccion_futura_path
    b open_output_file

// Crear/Abrir resultado_integral_error.txt
open_integral_error_write:
    ldr x1, =integral_error_path
    b open_output_file

// Crear/Abrir resultado_derivada_local.txt
open_derivada_local_write:
    ldr x1, =derivada_local_path
    b open_output_file

// Cerrar archivo de salida
// x0: descriptor del archivo a cerrar
close_output_file:
    mov x8, #57 // syscall close
    svc #0
    ret

// Leer archivo hacia buffer
read_file:
    mov x0, x19
    ldr x1, =buffer
    mov x2, #131071
    mov x8, #63 // syscall read
    svc #0

    cmp x0, #0
    blt read_error

    // Agregar '$' al final del buffer
    ldr x1, =buffer
    add x1, x1, x0
    mov w2, '$'
    strb w2, [x1]

    mov x20, x0 // guardar bytes leidos
    ret

// Cerrar archivo
close_file:
    mov x0, x19
    mov x8, #57 // syscall close
    svc #0
    ret
    
