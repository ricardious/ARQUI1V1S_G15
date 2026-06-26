import LoginScene3D from "../organisms/LoginScene3D";

/** Template: armazón de la pantalla de acceso. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-6 py-10">
      <LoginScene3D />
      {children}
    </div>
  );
}
