"use client";

import { signOut } from "@/lib/auth-client";
import { FiLogOut } from "react-icons/fi";

interface LogoutButtonProps {
  callbackURL?: string;
  variant?: "sidebar" | "dock";
}

export default function LogoutButton({
  callbackURL = "/",
  variant = "sidebar",
}: LogoutButtonProps) {
  async function handleLogout() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = callbackURL;
        },
      },
    });
  }

  if (variant === "dock") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="group relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 text-[9px] font-medium text-red-400 transition-colors hover:text-red-300 min-[390px]:text-[10px]"
      >
        <FiLogOut className="h-4 w-4 shrink-0" />
        <span className="leading-none">Salir</span>
        <span className="absolute inset-x-1/2 bottom-1 h-0.5 rounded-full bg-red-400/80 opacity-0 transition-all duration-300 ease-out group-hover:inset-x-4 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="relative mt-3 rounded-lg bg-white/5 py-2 pl-4 pr-3 text-left text-sm text-zinc-400 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    >
      <span className="flex items-center gap-3">
        <FiLogOut className="h-4 w-4" />
        Cerrar sesión
      </span>
    </button>
  );
}