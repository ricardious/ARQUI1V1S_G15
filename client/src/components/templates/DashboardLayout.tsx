import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";

/** Template: armazón del dashboard (sidebar + cabecera + contenido). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Header />
        <div className="p-5 sm:p-8 space-y-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
