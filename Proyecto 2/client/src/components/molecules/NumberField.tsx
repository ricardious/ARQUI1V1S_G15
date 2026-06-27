"use client";

/**
 * Molecule: input numérico con stepper propio.
 */
export default function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  ariaLabel,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const clamp = (n: number) => {
    if (Number.isNaN(n)) return min ?? 0;
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    return v;
  };

  const atMax = max != null && value >= max;
  const atMin = min != null && value <= min;

  return (
    <div
      className={`flex h-10 items-stretch overflow-hidden rounded-xl border border-edge bg-ink/5 transition focus-within:border-white ${
        disabled ? "pointer-events-none opacity-40" : ""
      } ${className}`}
    >
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-full min-w-0 bg-transparent px-3 text-[12px] text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="flex w-7 shrink-0 flex-col border-l border-edge">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar"
          disabled={disabled || atMax}
          onClick={() => onChange(clamp(value + step))}
          className="flex flex-1 items-center justify-center text-dim2 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <svg
            viewBox="0 0 12 12"
            className="size-2.5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 2v8M2 6h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Disminuir"
          disabled={disabled || atMin}
          onClick={() => onChange(clamp(value - step))}
          className="flex flex-1 items-center justify-center border-t border-edge text-dim2 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <svg
            viewBox="0 0 12 12"
            className="size-2.5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
