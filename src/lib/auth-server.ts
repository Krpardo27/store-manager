import { headers } from "next/headers";
import { auth } from "./auth";

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getSessionUserValue<T>(session: unknown, key: string): T | undefined {
  if (!session || typeof session !== "object") return undefined;
  const user = (session as Record<string, unknown>).user;
  if (!user || typeof user !== "object") return undefined;
  return (user as Record<string, unknown>)[key] as T | undefined;
}

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

export function isAdminSession(session: unknown) {
  const role = getSessionUserValue<string>(session, "role");
  if (role?.toLowerCase() === "admin") {
    return true;
  }

  const email = getSessionUserValue<string>(session, "email")?.toLowerCase();
  if (!email) {
    return false;
  }

  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
}

export async function requireAdmin() {
  const { session, isAuth } = await requireAuth();
  return {
    session,
    isAuth,
    isAdmin: isAdminSession(session),
  };
}
