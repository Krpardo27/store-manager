export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4e6cc] text-[#2d261c]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#fff6e5_0%,#f4e6cc_48%,#e7c88f_100%)]" />
      <div className="absolute -left-28 top-14 h-72 w-72 rounded-full bg-[#9a4b2f]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#2f6b4f]/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8f4d2f]">
            Donde la Toyita
          </p>
          <a
            href="/auth/login"
            className="rounded-full border border-[#2d261c]/20 bg-[#fff8ec] px-4 py-2 text-sm font-semibold text-[#2d261c] transition-colors hover:bg-[#f7e7c8]"
          >
            Iniciar sesion
          </a>
        </header>

        <section className="mt-16 grid items-center gap-10 lg:mt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9a4b2f]">
              Gestion comercial
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight text-[#2d261c] sm:text-5xl lg:text-6xl">
              Controla ventas, clientes e inventario en un solo tablero.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#5f4d39] sm:text-lg">
              Una plataforma simple para operar el dia a dia de tu negocio local con datos claros y flujo rapido.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[#2f6b4f] px-6 py-3 text-sm font-semibold text-[#f7f3e9] transition-colors hover:bg-[#275941]"
              >
                Entrar al panel
              </a>
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl border border-[#2d261c]/20 bg-[#fff8ec] px-6 py-3 text-sm font-semibold text-[#2d261c] transition-colors hover:bg-[#f8ebd2]"
              >
                Ir al dashboard
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-[#2d261c]/10 bg-[#fffaf2]/85 p-4 shadow-[0_20px_60px_rgba(64,45,18,0.15)] backdrop-blur sm:grid-cols-2">
            <article className="rounded-2xl border border-[#2d261c]/10 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4d2f]">Ventas</p>
              <p className="mt-2 text-sm text-[#5f4d39]">Registro rapido de pedidos, metodos de pago y cierre diario.</p>
            </article>
            <article className="rounded-2xl border border-[#2d261c]/10 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4d2f]">Inventario</p>
              <p className="mt-2 text-sm text-[#5f4d39]">Stock, alertas de reposicion y control de productos clave.</p>
            </article>
            <article className="rounded-2xl border border-[#2d261c]/10 bg-white/80 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f4d2f]">Clientes y caja</p>
              <p className="mt-2 text-sm text-[#5f4d39]">Historial de clientes e ingresos/egresos para decisiones mas rapidas.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
