import { requireAuth } from "@/lib/auth-server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { session, isAuth } = await requireAuth();

  if (!isAuth || !session) {
    redirect("/auth/login?callbackURL=/auth");
  }

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
          Sesion activa como {session.user.email}. Desde aqui puedes gestionar el local y revisar la operacion diaria.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/auth/ventas"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Modulo</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">Ventas</h3>
          <p className="mt-2 text-sm text-zinc-600">Registra ventas, métodos de pago y comprobantes.</p>
        </Link>

        <Link
          href="/auth/inventario"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Modulo</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">Inventario</h3>
          <p className="mt-2 text-sm text-zinc-600">Controla stock, reposición y productos más vendidos.</p>
        </Link>

        <Link
          href="/auth/clientes"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Modulo</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">Clientes</h3>
          <p className="mt-2 text-sm text-zinc-600">Consulta historial y datos para atención más cercana.</p>
        </Link>

        <Link
          href="/auth/caja"
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Modulo</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">Caja</h3>
          <p className="mt-2 text-sm text-zinc-600">Revisa ingresos diarios, egresos y cierre de jornada.</p>
        </Link>
      </div>
    </section>
  );
}
