import Link from "next/link";

import { dashboardNavItems } from "@/features/admin/products/components/dashboard-nav-items";

const moduleItems = dashboardNavItems.filter((item) => item.href !== "/auth");

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Donde la Toyita
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
          Panel administrativo
        </h2>
        <p className="mt-3 text-sm text-zinc-600">
          Desde aqui puedes gestionar el local y revisar la operacion diaria.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {moduleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Modulo</p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-900">{item.label}</h3>
            <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
