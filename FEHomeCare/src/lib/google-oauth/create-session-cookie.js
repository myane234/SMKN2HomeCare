/**
 * Buat session cookie placeholder.
 * Replace dengan DB-backed session jika sudah ada backend session.
 */
export function createHcSessionValue({ email, sub, iat }) {
  const sessionValue = Buffer.from(
    JSON.stringify({ email, sub, iat })
  )
    .toString("base64")
    .replace(/=+$/g, "");

  return sessionValue;
}

