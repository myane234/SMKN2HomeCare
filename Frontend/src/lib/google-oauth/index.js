import { verifyGoogleIdToken } from "./verify-google-id-token";
import { createHcSessionValue } from "./create-session-cookie";
import { buildSessionCookie } from "./cookie-helpers";

/**
 * High-level helper untuk alur Google OAuth (ID token -> session cookie).
 *
 * Catatan: saat ini session masih placeholder (tanpa DB).
 */
export async function createHcSessionCookieFromGoogleCredential({
  credential,
  googleClientId,
  maxAgeSeconds = 86400,
}) {
  const { email, sub, iat } = await verifyGoogleIdToken({
    credential,
    googleClientId,
  });

  const sessionValue = createHcSessionValue({ email, sub, iat });
  const cookie = buildSessionCookie({
    sessionValue,
    maxAgeSeconds,
  });

  return {
    cookie,
    email,
    sub,
    iat,
  };
}

