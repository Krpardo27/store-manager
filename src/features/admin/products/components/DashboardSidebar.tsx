"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBox, FiDollarSign, FiGrid, FiHome, FiUsers } from "react-icons/fi";

import { dashboardNavItems } from "./dashboard-nav-items";

const iconMap = {
    home: FiHome,
    sales: FiDollarSign,
    inventory: FiBox,
    clients: FiUsers,
    cash: FiGrid,
  } as const;

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:block lg:self-start">
      <div className="border-b border-zinc-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Donde la Toyita
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">Panel principal</h2>
      </div>

      <nav className="mt-4 space-y-2" aria-label="Navegacion del panel">
        {dashboardNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = iconMap[item.iconKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group block rounded-xl border px-3 py-2.5 transition-all ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    isActive ? "bg-white/15" : "bg-zinc-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-700"}`} />
                </span>
                <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-zinc-900"}`}>
                  {item.label}
                </span>
              </span>
              <span className={`mt-0.5 block text-xs ${isActive ? "text-zinc-200" : "text-zinc-500"}`}>
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}