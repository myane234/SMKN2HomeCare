/**
 * Forgot Password Service (OTP System)
 * Mendukung Portal Pasien/Nakes & Portal Admin
 */

const API_BASE = ""; // Mengarah ke local Next.js proxy / API handler yang otomatis mem-forward ke backend remote dengan fallback cerdas

/**
 * Step 1 — Request OTP
 * @param {string} email
 * @param {boolean} isAdmin
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function requestOtp(email, isAdmin = false) {
  const endpoint = isAdmin ? "/api/admin/forgot-password" : "/api/forgot-password";
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok && data?.success === false) {
    throw new Error(data.message || "Gagal meminta kode OTP.");
  }
  return data;
}

/**
 * Step 2 — Verifikasi OTP
 * @param {string} email
 * @param {string} otp
 * @param {boolean} isAdmin
 * @returns {Promise<{success: boolean, message: string, reset_token: string}>}
 */
export async function verifyOtp(email, otp, isAdmin = false) {
  const endpoint = isAdmin
    ? "/api/admin/forgot-password/verify"
    : "/api/forgot-password/verify";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Kode OTP tidak valid atau kedaluwarsa.");
  }
  return data;
}

/**
 * Step 3 — Reset Password
 * @param {object} param0
 * @param {string} param0.email
 * @param {string} param0.reset_token
 * @param {string} param0.password
 * @param {string} param0.password_confirmation
 * @param {boolean} isAdmin
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetPassword(
  { email, reset_token, password, password_confirmation },
  isAdmin = false
) {
  const endpoint = isAdmin
    ? "/api/admin/forgot-password/reset"
    : "/api/forgot-password/reset";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      reset_token,
      password,
      password_confirmation,
    }),
  });

  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Gagal mereset kata sandi.");
  }
  return data;
}
