import { createHcSessionCookieFromGoogleCredential } from "@/lib/google-oauth";

export async function POST(req) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return Response.json(
        { ok: false, error: "Missing credential" },
        { status: 400 }
      );
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return Response.json(
        { ok: false, error: "Missing GOOGLE_CLIENT_ID" },
        { status: 500 }
      );
    }

    const { cookie, email } =
      await createHcSessionCookieFromGoogleCredential({
        credential,
        googleClientId,
      });

    const res = Response.json({ ok: true, email });
    res.headers.set("Set-Cookie", cookie);

    return res;
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err?.message || "Google token verification failed",
      },
      { status: 401 }
    );
  }
}


