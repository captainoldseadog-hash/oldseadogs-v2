import Link from "next/link";

export function GuideBreadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav className="marina-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
