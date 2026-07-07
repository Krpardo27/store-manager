import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { Bree_Serif, Nunito } from "next/font/google";
import Link from "next/link";
import { FiArrowLeft, FiShield, FiDollarSign, FiUsers, FiShoppingBag } from "react-icons/fi";

const titleFont = Bree_Serif({
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Nunito({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

interface LoginPageProps {
  searchParams: Promise<{
    callbackURL?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const callbackURL = params.callbackURL || "/dashboard";

  return (
    <main
      className={`${bodyFont.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8ecd5] px-4 py-10 text-[#2e261b] sm:px-6`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fff5e6_0%,#f8ecd5_46%,#eecf9b_100%)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ce6c47]/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-[#2f6b4f]/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#2e261b]/10 bg-[#fffaf2]/95 shadow-[0_24px_80px_rgba(65,48,21,0.22)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-140 flex-col justify-between border-r border-[#2e261b]/10 bg-[#3f3426] p-8 text-[#fdf2df] lg:flex">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#fff0d5] transition-colors hover:bg-white/10 hover:text-white"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              Volver al sitio
            </Link>
          </div>

          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#f6b35f]">
              Negocio local
            </p>
            <div className="space-y-3">
              <h1
                className={`${titleFont.className} max-w-md text-5xl leading-tight tracking-tight text-[#fff7ea]`}
              >
                Donde la Toyita, control del local al día.
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-[#f6e2bc]">
                Gestiona pedidos, clientes y caja en un solo panel para operar con orden y cercanía.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-[#f6e2bc]">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-4">
              <FiDollarSign className="h-4 w-4 text-[#f6b35f]" />
              Ventas
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-4">
              <FiShoppingBag className="h-4 w-4 text-[#f6b35f]" />
              Productos
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-4">
              <FiUsers className="h-4 w-4 text-[#f6b35f]" />
              Clientes
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a4b2f]">
              Donde la Toyita
            </p>
            <Link href="/" className="text-xs font-semibold text-[#705640] hover:text-[#2e261b]">
              Inicio
            </Link>
          </div>

          <div className="mx-auto flex min-h-105 max-w-sm flex-col justify-center">
            <div className="mb-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#9a4b2f]/30 bg-[#9a4b2f]/10 text-[#9a4b2f]">
                <FiShield className="h-5 w-5" />
              </div>
              <div>
                <h2 className={`${titleFont.className} text-3xl tracking-tight text-[#2e261b]`}>
                  Iniciar sesion
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#705640]">
                  Entra con tu cuenta autorizada para administrar el local comercial.
                </p>
              </div>
            </div>

            <GoogleSignInButton
              callbackURL={callbackURL}
              className="h-12 w-full border-[#2e261b]/15 bg-[#fffdf9] text-[#2e261b] hover:bg-[#f4e5cb]"
            />

            <p className="mt-6 text-center text-xs leading-relaxed text-[#8f725a]">
              Solo las cuentas con rol administrador pueden acceder al panel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
