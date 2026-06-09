"use client";

import IconBox from "../atoms/IconBox";
import Arm64Card from "../molecules/Arm64Card";
import { useArm64Results } from "@/services/arm64/queries";
import { useGenerateCsv, useRunArm64 } from "@/services/arm64/mutations";
import type { Shape } from "@/lib/types/types";

const SHAPE_MAP: Record<string, Shape> = {
  media:     "ico",
  varianza:  "octa",
  anomalias: "tetra",
  prediccion: "torus",
  tendencia: "box",
};

const LABEL_MAP: Record<string, string> = {
  media:     "Media ponderada",
  varianza:  "Desv. estándar",
  anomalias: "Anomalías",
  prediccion: "Predicción",
  tendencia: "Tendencia",
};

/** Organism: sección ARM64 con resultados reales + botones de ejecución. */
export default function Arm64Section() {
  const resultsQ   = useArm64Results(1);
  const csvMut     = useGenerateCsv();
  const runMut     = useRunArm64();

  const latest = resultsQ.data?.[0];
  const valor  = latest?.valor ?? {};

  const cards = Object.entries(LABEL_MAP).map(([key, label]) => ({
    file:   `modulo_${key}.s`,
    label,
    value:  valor[key as keyof typeof valor] ?? "—",
    foot:   latest ? new Date(latest.timestamp).toLocaleTimeString("es") : "sin datos",
    shape:  SHAPE_MAP[key],
    color:  key === "anomalias" && valor.anomalias && Number(valor.anomalias) > 2
      ? "#FF2D2D"
      : "#ffffff",
    danger: key === "anomalias" && valor.anomalias ? Number(valor.anomalias) > 2 : false,
  }));

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <IconBox>A64</IconBox>
        <div>
          <h2 className="font-display text-xl font-bold">Análisis ARM64</h2>
          <p className="text-[12px] text-dim2">
            Calculado en ensamblador sobre{" "}
            <span className="font-mono">lecturas.csv</span> · 30 datos
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => csvMut.mutate()}
            disabled={csvMut.isPending}
            className="rounded-xl border border-edge px-4 py-2 text-[12px] font-medium hover:border-white hover:text-white transition disabled:opacity-40"
          >
            {csvMut.isPending ? "Generando…" : "Generar CSV"}
          </button>
          <button
            onClick={() => runMut.mutate()}
            disabled={runMut.isPending || csvMut.isPending}
            className="rounded-xl bg-white text-ink px-4 py-2 text-[12px] font-semibold hover:bg-white/90 transition disabled:opacity-40"
          >
            {runMut.isPending ? "Ejecutando…" : "Ejecutar ARM64"}
          </button>
        </div>
      </div>

      {(csvMut.isError || runMut.isError) && (
        <p className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-[12px] text-danger">
          {csvMut.isError
            ? String((csvMut.error as Error).message)
            : String((runMut.error as Error).message)}
        </p>
      )}
      {(csvMut.isSuccess || runMut.isSuccess) && (
        <p className="mb-3 rounded-xl border border-ok/30 bg-ok/5 px-4 py-2 text-[12px] text-ok">
          {runMut.isSuccess ? "ARM64 ejecutado — resultados actualizados." : "CSV generado correctamente."}
        </p>
      )}

      {resultsQ.isError && (
        <p className="mb-3 text-[12px] text-dim2">
          Backend no disponible — mostrando valores anteriores.
        </p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Arm64Card key={c.file} {...c} />
        ))}
      </div>
    </section>
  );
}
