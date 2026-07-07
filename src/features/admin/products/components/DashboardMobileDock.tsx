"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBox, FiDollarSign, FiGrid, FiHome, FiUsers } from "react-icons/fi";

const iconMap = {
    home: FiHome,
    sales: FiDollarSign,
    inventory: FiBox,
    clients: FiUsers,
    cash: FiGrid,
  } as const;

import { dashboardNavItems } from "./dashboard-nav-items";

export default function DashboardMobileDock() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getDockScale = (index: number, isActive: boolean) => {
    if (hoveredIndex === null) {
      return isActive ? 1.08 : 1;
    }

    const distance = Math.abs(hoveredIndex - index);
    if (distance === 0) return 1.18;
    if (distance === 1) return 1.1;
    if (distance === 2) return 1.04;
    return isActive ? 1.06 : 1;
  };

  return (
    <nav
      aria-label="Dock de navegacion"
      className="fixed inset-x-0 bottom-3 z-40 overflow-x-clip px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] lg:hidden"
    >
      <div
        className="mx-auto grid max-w-md grid-cols-5 gap-1.5 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {dashboardNavItems.map((item, index) => {
          const isActive = pathname === item.href;
          const scale = getDockScale(index, isActive);
          const Icon = iconMap[item.iconKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => setHoveredIndex(index)}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center rounded-xl px-1.5 py-2 text-center transition-all duration-200 ease-out ${
                isActive
                  ? "bg-zinc-900 text-white shadow-md"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              style={{
                transform: `translateY(${isActive ? "-5px" : "0px"}) scale(${scale})`,
                transformOrigin: "center bottom",
              }}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold tracking-wide ${
                  isActive ? "bg-white/15 text-white" : "bg-zinc-200 text-zinc-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-1.5 truncate text-[11px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
