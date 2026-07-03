import Link from "next/link";

import { dashboardNavItems } from "./dashboard-nav-items";

export default function DashboardSidebar() {
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-zinc-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Donde la Toyita
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">Panel principal</h2>
      </div>

      <nav className="mt-4 space-y-2" aria-label="Navegacion del panel">
        {dashboardNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
          >
            <span className="block text-sm font-semibold text-zinc-900">{item.label}</span>
            <span className="mt-0.5 block text-xs text-zinc-500">{item.description}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}