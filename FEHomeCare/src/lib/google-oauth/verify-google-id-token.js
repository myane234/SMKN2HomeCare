import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

/**
 * Verifikasi Google ID Token.
 * @param {object} params
 * @param {string} params.credential - ID token dari Google
 * @param {string} params.googleClientId - Audience (NEXT_PUBLIC/GOOGLE_CLIENT_ID)
 */
export async function verifyGoogleIdToken({ credential, googleClientId }) {
  if (!credential) throw new Error("Missing credential");
  if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID");

  const { payload } = await jwtVerify(credential, JWKS, {
    issuer: [
      "https://accounts.google.com",
      "https://www.googleapis.com/oauth2/v3/auth",
    ],
    audience: googleClientId,
  });

  const email = payload?.email;
  const sub = payload?.sub;

  if (!email || !sub) throw new Error("Invalid token payload");

  return { email, sub, iat: payload?.iat };
}

