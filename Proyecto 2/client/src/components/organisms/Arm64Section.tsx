"use client";

import { useState } from "react";
import IconBox from "../atoms/IconBox";
import Arm64Card from "../molecules/Arm64Card";
import Dropdown from "../molecules/Dropdown";
import NumberField from "../molecules/NumberField";
import { useArm64Results } from "@/services/arm64/queries";
import { useGenerateCsv, useRunArm64 } from "@/services/arm64/mutations";
import { ARM64_COLUMNS, ARM64_MODULES, columnLabel } from "@/lib/arm64";
import type { Arm64Result } from "@/lib/types/types";

const COLUMN_OPTIONS = ARM64_COLUMNS.map((c) => ({
  value: c.key,
  label: c.label,
}));

/** Organism: sección ARM64 con resultados reales + botones de ejecución. */
export default function Arm64Section() {
  const [col, setCol] = useState<string>("temp");
  const [count, setCount] = useState<number>(150);
  const [lineStart, setLineStart] = useState<number>(1);
  const [lineEnd, setLineEnd] = useState<number>(150);
  const resultsQ = useArm64Results(30);
  const csvMut = useGenerateCsv();
  const runMut = useRunArm64();

  // Agarra el último resultado de cada módulo.
  const latestByModule = (resultsQ.data ?? []).reduce<
    Record<string, Arm64Result>
  >((acc, r) => {
    if (r.module && !(r.module in acc)) acc[r.module] = r;
    return acc;
  }, {});

  const runningModule = runMut.isPending ? runMut.variables?.module : undefined;
  const runningAll = runMut.isPending && !runMut.variables?.module;
  const busy = runMut.isPending || csvMut.isPending;
  const runOptions = { col, n: count, ini: lineStart, fin: lineEnd };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IconBox>A64</IconBox>
        <div>
          <h2 className="font-display text-xl font-bold">Análisis ARM64</h2>
          <p className="text-[12px] text-dim2">
            Calculado en ensamblador sobre{" "}
            <span className="font-mono">lecturas.csv</span> · últimos {count}{" "}
            datos
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        {/* Grupo 1 — Origen de datos: N define cuántas lecturas van al CSV. */}
        <div className="flex flex-col gap-2 rounded-2xl border border-edge bg-panel/40 p-3 sm:p-4">
          <span className="text-[10px] uppercase tracking-[.18em] text-dim2">
            Datos de origen
          </span>
          <div className="flex items-end gap-2">
            <label className="flex w-28 flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-dim2">
                N
              </span>
              <NumberField
                ariaLabel="Cantidad de lecturas (N)"
                value={count}
                min={1}
                max={5000}
                onChange={(value) => {
                  setCount(value);
                  setLineEnd(value);
                }}
                disabled={busy}
                className="w-full"
              />
            </label>
            <button
              onClick={() => csvMut.mutate(count)}
              disabled={busy}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-edge px-4 text-[12px] font-medium transition hover:border-white hover:text-white disabled:opacity-40 sm:flex-none"
            >
              {csvMut.isPending ? "Generando…" : "Generar CSV"}
            </button>
          </div>
        </div>

        {/* Grupo 2 — Ejecución: columna + rango de líneas a analizar. */}
        <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-edge bg-panel/40 p-3 sm:p-4">
          <span className="text-[10px] uppercase tracking-[.18em] text-dim2">
            Ejecutar análisis
          </span>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-36 flex-1 flex-col gap-1.5 sm:w-40 sm:flex-none">
              <span className="text-[10px] uppercase tracking-wide text-dim2">
                Columna
              </span>
              <Dropdown
                ariaLabel="Columna a analizar"
                options={COLUMN_OPTIONS}
                value={col}
                onChange={setCol}
                disabled={busy}
                className="w-full"
              />
            </label>
            <label className="flex min-w-24 flex-1 flex-col gap-1.5 sm:w-28 sm:flex-none">
              <span className="text-[10px] uppercase tracking-wide text-dim2">
                Inicio
              </span>
              <NumberField
                ariaLabel="Línea inicial"
                value={lineStart}
                min={1}
                onChange={setLineStart}
                disabled={busy}
                className="w-full"
              />
            </label>
            <label className="flex min-w-24 flex-1 flex-col gap-1.5 sm:w-28 sm:flex-none">
              <span className="text-[10px] uppercase tracking-wide text-dim2">
                Fin
              </span>
              <NumberField
                ariaLabel="Línea final"
                value={lineEnd}
                min={1}
                onChange={setLineEnd}
                disabled={busy}
                className="w-full"
              />
            </label>
            <button
              onClick={() => runMut.mutate(runOptions)}
              disabled={busy}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-white px-5 text-[12px] font-semibold text-ink transition hover:bg-white/90 disabled:opacity-40 sm:ml-auto sm:w-auto"
            >
              {runningAll ? "Ejecutando…" : "Ejecutar"}
            </button>
          </div>
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
          const doc = latestByModule[m.key];
          const fields = doc?.result?.fields ?? {};
          const headline = (doc ? m.headline(fields) : undefined) ?? "—";
          const danger = doc ? (m.danger?.(fields) ?? false) : false;
          const stats = doc ? m.stats(fields).filter((s) => s.v != null) : [];
          const time = doc
            ? new Date(doc.timestamp).toLocaleTimeString("es")
            : "";
          const foot = doc
            ? `${columnLabel(doc.column)}${time ? ` · ${time}` : ""}`
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
              raw={doc?.result?.raw}
              foot={foot}
              shape={m.shape}
              color={color}
              danger={danger}
              running={runningModule === m.key}
              disabled={busy}
              onRun={() => runMut.mutate({ ...runOptions, module: m.key })}
            />
          );
        })}
      </div>
    </section>
  );
}
