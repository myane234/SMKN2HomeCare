export function buildSessionCookie({ sessionValue, maxAgeSeconds = 86400 }) {
  return [
    `hc_session=${sessionValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

