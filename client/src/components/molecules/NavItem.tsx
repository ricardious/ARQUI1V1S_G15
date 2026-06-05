import StatusDot from "../atoms/StatusDot";

/** Molecule: ítem de navegación del sidebar. */
export default function NavItem({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${active ? "active font-medium" : "text-dim hover:text-white hover:bg-panel"}`}
    >
      <StatusDot color="currentColor" className="opacity-40" />
      {label}
    </a>
  );
}
