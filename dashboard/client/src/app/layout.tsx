import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Sora } from "next/font/google";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Invernadero Inteligente IoT — Grupo 15",
  description: "Dashboard de monitoreo y control IoT",
};

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bricolageGrotesque.variable} ${sora.variable} ${jetBrainsMono.variable}`}
    >
      <body className="grain font-sans text-white antialiased selection:bg-white selection:text-ink">
        {children}
      </body>
    </html>
  );
}
