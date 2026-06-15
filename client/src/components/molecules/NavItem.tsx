import StatusDot from "../atoms/StatusDot";

/** Molecule: ítem de navegación del sidebar (anchor same-page). */
export default function NavItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${active ? "active font-medium" : "text-dim hover:text-white hover:bg-panel"}`}
    >
      <StatusDot color="currentColor" className="opacity-40" />
      {label}
    </a>
  );
}
