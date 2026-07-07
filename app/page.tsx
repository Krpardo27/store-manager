import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { isAuth } = await requireAuth();

  if (isAuth) {
    redirect("/dashboard");
  }

  redirect("/auth/login?callbackURL=/dashboard");
}
