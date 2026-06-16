/** Фоновое свечение как на странице «Технические условия» */
export function SiteAmbientGlow() {
  return (
    <div
      className="site-ambient-glow fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <div className="absolute top-[-20%] left-[-10%] w-[62.5%] h-[62.5%] bg-primary/[0.125] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[62.5%] h-[62.5%] bg-secondary/[0.125] blur-[120px] rounded-full" />
    </div>
  );
}
