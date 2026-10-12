export function TradeBadge({ sellerType }: { sellerType?: string | null }) {
  if (sellerType !== "trade") return null;
  return <span className="boats-trade-badge">Trade</span>;
}
