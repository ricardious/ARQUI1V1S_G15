/** Organism: cabecera superior. */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-5 sm:px-8 py-4 border-b border-edge bg-ink/80 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
          Invernadero Inteligente
        </h1>
        <p className="text-[12px] text-dim2">
          Monitoreo y control en tiempo real
        </p>
      </div>
      <div className="ml-auto hidden md:flex items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-2 w-64">
        <svg
          className="size-3.25 shrink-0 text-dim2"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          className="bg-transparent text-[13px] placeholder:text-dim2 outline-none w-full"
          placeholder="Buscar evento, sensor…"
        />
      </div>
      <button className="flex items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-2 text-[12px] text-dim hover:text-white transition">
        Últimas 24 h ▾
      </button>
      <div className="flex items-center gap-2.5 pl-1">
        <div className="h-9 w-9 rounded-xl bg-white text-ink grid place-items-center font-display font-bold text-sm">
          G
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-[12px] font-semibold">Grupo 15</p>
          <p className="text-[10px] text-dim2">ARQUI1V1S</p>
        </div>
      </div>
    </header>
  );
}
