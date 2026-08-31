import "./color-dock.css";

const colorMap: Record<string, string> = {
  preto: "#27272a",
  preta: "#27272a",
  branco: "#ffffff",
  branca: "#ffffff",
  marrom: "#78350f",
  marron: "#78350f",
  ceramica: "#b45309",
  cerâmica: "#b45309",
  azul: "#3b82f6",
  verde: "#22c55e",
  amarelo: "#eab308",
  vermelho: "#ef4444",
  rosa: "#ec4899",
  roxo: "#a855f7",
  cinza: "#9ca3af",
  bege: "#fef3c7",
  areia: "#f5f5f4",
  terracota: "#c2410c",
};

const getHex = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || "#cbd5e1"; // default color if not found
};

export function ColorDock({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="color-dock-wrapper">
      <div className="container-items">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className="item-color"
            style={{ "--color": getHex(c) } as React.CSSProperties}
            aria-label={c}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
