export const COMMANDS = {
  ACTIVAR_RIEGO:           "ACTIVAR_RIEGO",
  DESACTIVAR_RIEGO:        "DESACTIVAR_RIEGO",
  ACTIVAR_RIEGO_1:         "ACTIVAR_RIEGO_1",
  ACTIVAR_RIEGO_2:         "ACTIVAR_RIEGO_2",
  ENCENDER_LUCES:          "ENCENDER_LUCES",
  APAGAR_LUCES:            "APAGAR_LUCES",
  ACTIVAR_VENTILADOR:      "ACTIVAR_VENTILADOR",
  DESACTIVAR_VENTILADOR:   "DESACTIVAR_VENTILADOR",
  SILENCIAR_ALARMA:        "SILENCIAR_ALARMA",
  CAMBIAR_MODO_AUTOMATICO: "CAMBIAR_MODO_AUTOMATICO",
  CAMBIAR_MODO_MANUAL:     "CAMBIAR_MODO_MANUAL",
} as const;

export type Command = (typeof COMMANDS)[keyof typeof COMMANDS];

export const CONTROL_DEFS = [
  {
    key: "riego",
    label: "Riego general",
    cmdOn:  COMMANDS.ACTIVAR_RIEGO,
    cmdOff: COMMANDS.DESACTIVAR_RIEGO,
  },
  {
    key: "riego_area1",
    label: "Riego área 1",
    cmdOn:  COMMANDS.ACTIVAR_RIEGO_1,
    cmdOff: COMMANDS.DESACTIVAR_RIEGO,
  },
  {
    key: "riego_area2",
    label: "Riego área 2",
    cmdOn:  COMMANDS.ACTIVAR_RIEGO_2,
    cmdOff: COMMANDS.DESACTIVAR_RIEGO,
  },
  {
    key: "luces",
    label: "Iluminación",
    cmdOn:  COMMANDS.ENCENDER_LUCES,
    cmdOff: COMMANDS.APAGAR_LUCES,
  },
  {
    key: "ventilador",
    label: "Ventilación",
    cmdOn:  COMMANDS.ACTIVAR_VENTILADOR,
    cmdOff: COMMANDS.DESACTIVAR_VENTILADOR,
  },
  {
    key: "alarma",
    label: "Alarma / Buzzer",
    cmdOn:  COMMANDS.SILENCIAR_ALARMA,
    cmdOff: COMMANDS.SILENCIAR_ALARMA,
  },
] as const;
