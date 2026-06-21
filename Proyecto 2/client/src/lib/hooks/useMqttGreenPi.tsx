"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MqttClient } from "mqtt";
import { ENV } from "@/lib/constants/env";
import { ALL_SENSOR_TOPICS, TOPICS } from "@/lib/constants/mqtt-topics";
import {
  parsePlainBool,
  parsePlainFloat,
  buildClientId,
} from "@/lib/helpers/mqtt";
import { estadoToEstadoKey } from "@/lib/helpers/formatters";
import type {
  ActuatorStates,
  EstadoKey,
  MqttConnectionState,
  SensorReadings,
} from "@/lib/types/types";

// ── Context ────────────────────────────────────────────────────────────────

export interface MqttContextValue {
  sensors: SensorReadings;
  actuators: ActuatorStates;
  globalState: EstadoKey;
  connectionState: MqttConnectionState;
  lastMessageAt: number | null;
  raspberryOnline: boolean;
  sendCommand: (cmd: string) => void;
}

const DEFAULT_SENSORS: SensorReadings = {
  temperatura: null,
  humedad_ambiente: null,
  humedad_suelo_area1: null,
  humedad_suelo_area2: null,
  luz: null,
  gas: null,
};

const DEFAULT_ACTUATORS: ActuatorStates = {
  riego: false,
  riego_area1: false,
  riego_area2: false,
  ventilador: false,
  luces: false,
  alarma: false,
};

export const MqttContext = createContext<MqttContextValue>({
  sensors: DEFAULT_SENSORS,
  actuators: DEFAULT_ACTUATORS,
  globalState: "SIN_DATOS",
  connectionState: "disconnected",
  lastMessageAt: null,
  raspberryOnline: false,
  sendCommand: () => undefined,
});

// ── Provider ───────────────────────────────────────────────────────────────

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [sensors, setSensors] = useState<SensorReadings>(DEFAULT_SENSORS);
  const [actuators, setActuators] = useState<ActuatorStates>(DEFAULT_ACTUATORS);
  const [globalState, setGlobalState] = useState<EstadoKey>("SIN_DATOS");
  const [connState, setConnState] = useState<MqttConnectionState>("connecting");
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [raspberryOnline, setRaspberryOnline] = useState(false);
  const clientRef = useRef<MqttClient | null>(null);
  const raspberryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let client: MqttClient;

    // Dynamic import keeps mqtt out of SSR bundle
    import("mqtt").then(({ default: mqtt }) => {
      client = mqtt.connect(ENV.MQTT_WSS_URL, {
        clientId: buildClientId(),
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10_000,
      });
      clientRef.current = client;

      client.on("connect", () => {
        setConnState("connected");
        client.subscribe(ALL_SENSOR_TOPICS as unknown as string[], { qos: 0 });
      });

      client.on("reconnect", () => setConnState("connecting"));
      client.on("offline", () => setConnState("disconnected"));
      client.on("error", () => setConnState("error"));

      client.on("message", (topic: string, payload: Buffer) => {
        const msg = payload.toString().trim();
        setLastMessageAt(Date.now());
        setRaspberryOnline(true);
        if (raspberryTimeoutRef.current != null) {
          window.clearTimeout(raspberryTimeoutRef.current);
        }
        raspberryTimeoutRef.current = window.setTimeout(() => {
          setRaspberryOnline(false);
        }, 30_000);

        switch (topic) {
          case TOPICS.TEMP:
            setSensors((s) => ({ ...s, temperatura: parsePlainFloat(msg) }));
            break;
          case TOPICS.HUM_AMBIENTE:
            setSensors((s) => ({
              ...s,
              humedad_ambiente: parsePlainFloat(msg),
            }));
            break;
          case TOPICS.HUM_SUELO_1:
            setSensors((s) => ({
              ...s,
              humedad_suelo_area1: parsePlainFloat(msg),
            }));
            break;
          case TOPICS.HUM_SUELO_2:
            setSensors((s) => ({
              ...s,
              humedad_suelo_area2: parsePlainFloat(msg),
            }));
            break;
          case TOPICS.LUZ:
            setSensors((s) => ({ ...s, luz: parsePlainFloat(msg) }));
            break;
          case TOPICS.GAS:
            setSensors((s) => ({ ...s, gas: parsePlainFloat(msg) }));
            break;
          case TOPICS.ESTADO_GLOBAL:
            setGlobalState(estadoToEstadoKey(msg));
            break;
          case TOPICS.RIEGO:
            setActuators((a) => ({ ...a, riego: parsePlainBool(msg) }));
            break;
          case TOPICS.RIEGO_AREA1:
            setActuators((a) => ({ ...a, riego_area1: parsePlainBool(msg) }));
            break;
          case TOPICS.RIEGO_AREA2:
            setActuators((a) => ({ ...a, riego_area2: parsePlainBool(msg) }));
            break;
          case TOPICS.VENTILADOR:
            setActuators((a) => ({ ...a, ventilador: parsePlainBool(msg) }));
            break;
          case TOPICS.LUCES:
            setActuators((a) => ({ ...a, luces: parsePlainBool(msg) }));
            break;
          case TOPICS.ALARMA:
            setActuators((a) => ({ ...a, alarma: parsePlainBool(msg) }));
            break;
        }
      });
    });

    return () => {
      clientRef.current?.end(true);
      clientRef.current = null;
      if (raspberryTimeoutRef.current != null) {
        window.clearTimeout(raspberryTimeoutRef.current);
        raspberryTimeoutRef.current = null;
      }
    };
  }, []);

  const sendCommand = useCallback((cmd: string) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    client.publish(TOPICS.CONTROL, cmd, { qos: 0 });
  }, []);

  return (
    <MqttContext.Provider
      value={{
        sensors,
        actuators,
        globalState,
        connectionState: connState,
        lastMessageAt,
        raspberryOnline,
        sendCommand,
      }}
    >
      {children}
    </MqttContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useMqttGreenPi(): MqttContextValue {
  return useContext(MqttContext);
}
