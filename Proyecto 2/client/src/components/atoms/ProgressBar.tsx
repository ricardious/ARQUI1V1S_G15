"use client";

import { useEffect, useState } from "react";

/** Atom: barra de progreso (humedad de suelo). */
export default function ProgressBar({
  value,
  color = "#ffffff",
}: {
  value: number;
  color?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const safeValue = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDisplayValue(safeValue);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [safeValue]);

  return (
    <div
      className="h-2 rounded-full bg-panel2 overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div
        className="h-full rounded-full shadow-[0_0_16px_rgba(255,255,255,0.16)] transition-[width,background-color,box-shadow] duration-1000 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        style={{
          width: `${displayValue}%`,
          background: color,
          boxShadow: `0 0 18px ${color}33`,
        }}
      />
    </div>
  );
}
