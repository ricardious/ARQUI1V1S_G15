import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";

/** Template: armazón del dashboard (sidebar + cabecera + contenido). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Header />
        <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
