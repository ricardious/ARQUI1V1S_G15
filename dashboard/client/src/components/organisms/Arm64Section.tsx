import IconBox from "../atoms/IconBox";
import Arm64Card from "../molecules/Arm64Card";
import { ARM64_CARDS } from "@/lib/constants/dashboard-data";

/** Organism: sección de análisis ARM64. */
export default function Arm64Section() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <IconBox>A64</IconBox>
        <div>
          <h2 className="font-display text-xl font-bold">Análisis ARM64</h2>
          <p className="text-[12px] text-dim2">
            Calculado en ensamblador sobre{" "}
            <span className="font-mono">lecturas.csv</span> · 30 datos
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {ARM64_CARDS.map((c) => (
          <Arm64Card key={c.file} {...c} />
        ))}
      </div>
    </section>
  );
}
