import { cn } from "@/lib/utils";

// Marca própria em SVG (círculo + "JS" + casinha), nas cores da logo
// enviada pelo cliente. Trocar pelo arquivo original assim que
// disponível — ver PROJETO_SPEC.md.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <circle cx="32" cy="28" r="22" fill="none" stroke="var(--brand)" strokeWidth="3.5" />
      <text
        x="32"
        y="35"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="24"
        fill="var(--brand)"
      >
        J
        <tspan fill="#fff">S</tspan>
      </text>
      <path
        d="M14 46 L32 34 L50 46"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="flex items-baseline gap-1">
          <span className="font-extrabold tracking-tight text-brand">JANDIRA</span>
          <span className="font-light tracking-widest text-foreground">SERVICE</span>
        </div>
        {subtitle && (
          <div className="text-[10px] uppercase tracking-wider text-muted">
            Soluções que facilitam sua vida
          </div>
        )}
      </div>
    </div>
  );
}
