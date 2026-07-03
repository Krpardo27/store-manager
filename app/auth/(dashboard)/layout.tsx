import { requireAdmin } from "@/lib/auth-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/features/auth/components/LogoutButton";
import DashboardSidebar from "@/features/admin/products/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { session, isAuth, isAdmin } = await requireAdmin();

  if (!isAuth || !session) {
    redirect("/auth/login?callbackURL=/auth");
  }

  if (!isAdmin) {
    redirect("/auth/login?callbackURL=/auth&error=forbidden");
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Donde la Toyita
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">Panel principal</h1>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="text-xs text-zinc-500">Sesión: {session.user.email}</p>
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Ver sitio
            </Link>
            <LogoutButton callbackURL="/auth/login" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <DashboardSidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}
