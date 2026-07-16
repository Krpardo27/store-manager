import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-server";

export default async function proxy(request: NextRequest) {
  const { isAuth } = await requireAuth();

  const isLoginPage = request.nextUrl.pathname.startsWith("/auth/login");

  if (!isAuth && !isLoginPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackURL", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/login"],
};