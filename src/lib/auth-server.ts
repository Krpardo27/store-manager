import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function requireAuth() {
  try {
    const session = await getServerSession();

    return {
      session,
      isAuth: !!session,
    };
  } catch (error) {
    console.error(error);

    return {
      session: null,
      isAuth: false,
    };
  }
}
