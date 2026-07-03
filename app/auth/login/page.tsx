import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiShield, FiCalendar, FiScissors } from "react-icons/fi";

interface LoginPageProps {
  searchParams: Promise<{
    callbackURL?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const callbackURL = params.callbackURL || "/admin";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-white sm:px-6">
      <Image
        src=""
        alt="Interior de barbería con silla clasica"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-zinc-950/75" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111111]/90 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-140 flex-col justify-between border-r border-white/10 p-8 lg:flex">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              Volver al sitio
            </Link>
          </div>

          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#C8A96E]">
              Barbería
            </p>
            <div className="space-y-3">
              <h1 className="max-w-md text-5xl font-bold leading-tight tracking-tight text-white">
                Control claro para tu barbería.
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-300">
                Administra reservas, clientes y servicios desde un panel pensado para operar rapido durante el dia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <FiCalendar className="h-4 w-4 text-[#C8A96E]" />
              Reservas
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <FiScissors className="h-4 w-4 text-[#C8A96E]" />
              Servicios
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <FiShield className="h-4 w-4 text-[#C8A96E]" />
              Acceso seguro
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A96E]">
              Barber OS
            </p>
            <Link href="/" className="text-xs font-semibold text-zinc-400 hover:text-white">
              Inicio
            </Link>
          </div>

          <div className="mx-auto flex min-h-105 max-w-sm flex-col justify-center">
            <div className="mb-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C8A96E]/25 bg-[#C8A96E]/10 text-[#C8A96E]">
                <FiShield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Iniciar sesion
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Entra con tu cuenta autorizada para gestionar la barbería.
                </p>
              </div>
            </div>

            <GoogleSignInButton callbackURL={callbackURL} className="h-12 w-full" />

            <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
              Solo las cuentas con rol administrador pueden acceder al panel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
