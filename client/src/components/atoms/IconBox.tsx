/** Atom: contenedor cuadrado para íconos o texto corto. */
export default function IconBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`grid size-9 place-items-center rounded-lg bg-white text-ink font-mono text-xs ${className}`}
    >
      {children}
    </span>
  );
}
