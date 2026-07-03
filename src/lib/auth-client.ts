import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000",

  plugins: [magicLinkClient()],
});

function getSafeCallbackPath(callbackURL?: string) {
  if (!callbackURL) {
    return "/premios-musa";
  }

  const normalized = callbackURL.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/premios-musa";
  }

  return normalized;
}

// Google Sign In
export const signInWithGoogle = async (callbackURL?: string) => {
  try {
    const safeCallbackPath = getSafeCallbackPath(callbackURL);
    const processingPath = `/auth/procesando-acceso?redirectTo=${encodeURIComponent(safeCallbackPath)}`;

    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: processingPath,
    });
    return data;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

export const { signIn } = authClient;
