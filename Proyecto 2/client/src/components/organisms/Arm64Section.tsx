"use client";

import { useState } from "react";
import IconBox from "../atoms/IconBox";
import Arm64Card from "../molecules/Arm64Card";
import Dropdown from "../molecules/Dropdown";
import { useArm64Results } from "@/services/arm64/queries";
import { useGenerateCsv, useRunArm64 } from "@/services/arm64/mutations";
import { ARM64_COLUMNS, ARM64_MODULES, columnLabel } from "@/lib/arm64";

const COLUMN_OPTIONS = ARM64_COLUMNS.map((c) => ({
  value: c.key,
  label: c.label,
}));

/** Organism: sección ARM64 con selector de columna y ejecución por módulo. */
export default function Arm64Section() {
  const [col, setCol] = useState<string>("temp");
  const resultsQ = useArm64Results(1);
  const csvMut   = useGenerateCsv();
  const runMut   = useRunArm64();

  const latest = resultsQ.data?.[0];
  const valor  = latest?.valor ?? {};

  const runningModule = runMut.isPending ? runMut.variables?.module : undefined;
  const runningAll    = runMut.isPending && !runMut.variables?.module;
  const busy          = runMut.isPending || csvMut.isPending;

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
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <span className="hidden text-[12px] text-dim2 sm:inline">Columna</span>
          <Dropdown
            ariaLabel="Columna a analizar"
            options={COLUMN_OPTIONS}
            value={col}
            onChange={setCol}
            disabled={busy}
            className="flex-1 sm:flex-none sm:w-40"
          />
          <button
            onClick={() => csvMut.mutate()}
            disabled={busy}
            className="flex-1 rounded-xl border border-edge px-4 py-2 text-[12px] font-medium transition hover:border-white hover:text-white disabled:opacity-40 sm:flex-none"
          >
            {csvMut.isPending ? "Generando…" : "Generar CSV"}
          </button>
          <button
            onClick={() => runMut.mutate({ col })}
            disabled={busy}
            className="flex-1 rounded-xl bg-white px-4 py-2 text-[12px] font-semibold text-ink transition hover:bg-white/90 disabled:opacity-40 sm:flex-none"
          >
            {runningAll ? "Ejecutando…" : "Ejecutar todos"}
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
      {(csvMut.isSuccess || runMut.isSuccess) && !busy && (
        <p className="mb-3 rounded-xl border border-ok/30 bg-ok/5 px-4 py-2 text-[12px] text-ok">
          {runMut.isSuccess
            ? "ARM64 ejecutado — resultados actualizados."
            : "CSV generado correctamente."}
        </p>
      )}

      {resultsQ.isError && (
        <p className="mb-3 text-[12px] text-dim2">
          Backend no disponible — mostrando valores anteriores.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-4">
        {ARM64_MODULES.map((m) => {
          const mod      = valor[m.key];
          const fields   = mod?.fields ?? {};
          const headline = (mod ? m.headline(fields) : undefined) ?? "—";
          const danger   = mod ? (m.danger?.(fields) ?? false) : false;
          const stats    = mod ? m.stats(fields).filter((s) => s.v != null) : [];
          const time     = latest
            ? new Date(latest.timestamp).toLocaleTimeString("es")
            : "";
          const foot = mod
            ? `${columnLabel(mod.column)}${time ? ` · ${time}` : ""}`
            : "sin datos";
          const color = danger
            ? "#FF2D2D"
            : headline === "—"
              ? "#5a5a62"
              : "#ffffff";

          return (
            <Arm64Card
              key={m.key}
              file={m.file}
              label={m.label}
              headline={headline}
              stats={stats}
              foot={foot}
              shape={m.shape}
              color={color}
              danger={danger}
              running={runningModule === m.key}
              disabled={busy}
              onRun={() => runMut.mutate({ col, module: m.key })}
            />
          );
        })}
      </div>
    </section>
  );
}
