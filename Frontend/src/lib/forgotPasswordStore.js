import crypto from 'crypto';
import { sendOtpEmail } from './emailService';

// In-memory store untuk OTP & reset tokens (globalThis agar persist di Next.js dev server reloads)
const globalOtpStore = globalThis.__homecare_otp_store || new Map();
globalThis.__homecare_otp_store = globalOtpStore;

const globalTokenStore = globalThis.__homecare_token_store || new Map();
globalThis.__homecare_token_store = globalTokenStore;

const REMOTE_BACKEND = 'https://citra.faaruq.com';

/**
 * Step 1 — Request OTP Handler
 */
export async function handleRequestOtp(request, path = '/api/forgot-password') {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return Response.json(
        { success: false, message: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Coba forward ke remote backend
    try {
      const remoteRes = await fetch(`${REMOTE_BACKEND}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (remoteRes.status !== 404) {
        const remoteData = await remoteRes.json().catch(() => null);
        if (remoteData) {
          return Response.json(remoteData, { status: remoteRes.status });
        }
      }
    } catch {
      // Remote unavailable, lanjutkan ke fallback handler
    }

    // 2. Fallback OTP Generation & Email Dispatch
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

    globalOtpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
    });

    // Kirim email fisik via Nodemailer (jika SMTP terkonfigurasi di .env.local)
    const emailResult = await sendOtpEmail({ to: email, otp });

    if (emailResult.success) {
      console.log(`\n========================================`);
      console.log(`✉️ [EMAIL SUKSES TERKIRIM KE INBOX]`);
      console.log(`📧 Penerima  : ${email}`);
      console.log(`🔢 MessageID : ${emailResult.messageId}`);
      console.log(`⏰ Berlaku   : 10 menit`);
      console.log(`========================================\n`);
    } else {
      console.log(`\n========================================`);
      console.log(`🔑 [KODE OTP FORGOT PASSWORD] (Terminal Dev Fallback)`);
      console.log(`📧 Email     : ${email}`);
      console.log(`🔢 OTP       : ${otp}`);
      console.log(`⏰ Berlaku   : 10 menit`);
      if (emailResult.reason === 'SMTP_NOT_CONFIGURED') {
        console.log(`ℹ️ Info      : Kredensial SMTP belum disetel di .env.local.`);
        console.log(`               Setel SMTP_USER & SMTP_PASS agar email terkirim ke inbox.`);
      } else {
        console.log(`⚠️ Info      : Pengiriman email gagal (${emailResult.error}).`);
      }
      console.log(`========================================\n`);
    }

    return Response.json({
      success: true,
      message: emailResult.success
        ? 'Kode OTP telah dikirimkan ke alamat email Anda. Silakan periksa kotak masuk atau spam.'
        : 'Jika email terdaftar, kode OTP telah dikirim.',
      email_delivered: emailResult.success,
      // Sertakan hint dev jika di development environment
      ...(process.env.NODE_ENV !== 'production' ? { _dev_otp: otp } : {}),
    });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}

/**
 * Step 2 — Verifikasi OTP Handler
 */
export async function handleVerifyOtp(request, path = '/api/forgot-password/verify') {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const otp = (body.otp || '').toString().trim();

    if (!email || !otp) {
      return Response.json(
        { success: false, message: 'Email dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Coba forward ke remote backend
    try {
      const remoteRes = await fetch(`${REMOTE_BACKEND}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (remoteRes.status !== 404) {
        const remoteData = await remoteRes.json().catch(() => null);
        if (remoteData) {
          return Response.json(remoteData, { status: remoteRes.status });
        }
      }
    } catch {
      // Remote unavailable, lanjutkan ke fallback handler
    }

    // 2. Fallback Mock OTP Verification
    const stored = globalOtpStore.get(email);
    if (!stored) {
      return Response.json(
        { success: false, message: 'Kode OTP tidak valid atau belum diminta.' },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expiresAt) {
      globalOtpStore.delete(email);
      return Response.json(
        { success: false, message: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    if (stored.otp !== otp) {
      stored.attempts = (stored.attempts || 0) + 1;
      return Response.json(
        { success: false, message: 'Kode OTP tidak valid.' },
        { status: 400 }
      );
    }

    // Hapus OTP setelah berhasil diverifikasi
    globalOtpStore.delete(email);

    // Buat reset_token (berlaku 15 menit sesuai spec)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = Date.now() + 15 * 60 * 1000;

    globalTokenStore.set(resetToken, {
      email,
      expiresAt: tokenExpiresAt,
    });

    return Response.json({
      success: true,
      message: 'OTP valid. Silakan masukkan password baru Anda.',
      reset_token: resetToken,
    });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}

/**
 * Step 3 — Reset Password Handler
 */
export async function handleResetPassword(request, path = '/api/forgot-password/reset') {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const resetToken = (body.reset_token || '').trim();
    const password = body.password || '';
    const passwordConfirmation = body.password_confirmation || '';

    if (!email || !resetToken || !password) {
      return Response.json(
        { success: false, message: 'Data tidak lengkap.' },
        { status: 400 }
      );
    }

    if (password !== passwordConfirmation) {
      return Response.json(
        { success: false, message: 'Konfirmasi password tidak cocok.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, message: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    // 1. Coba forward ke remote backend
    try {
      const remoteRes = await fetch(`${REMOTE_BACKEND}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          reset_token: resetToken,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      if (remoteRes.status !== 404) {
        const remoteData = await remoteRes.json().catch(() => null);
        if (remoteData) {
          return Response.json(remoteData, { status: remoteRes.status });
        }
      }
    } catch {
      // Remote unavailable, lanjutkan ke fallback handler
    }

    // 2. Fallback Mock Reset Password Verification
    const storedToken = globalTokenStore.get(resetToken);
    if (!storedToken || storedToken.email !== email) {
      return Response.json(
        { success: false, message: 'Token reset tidak valid atau sudah kadaluarsa.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedToken.expiresAt) {
      globalTokenStore.delete(resetToken);
      return Response.json(
        { success: false, message: 'Token reset tidak valid atau sudah kadaluarsa.' },
        { status: 400 }
      );
    }

    // Sukses reset
    globalTokenStore.delete(resetToken);

    return Response.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru Anda.',
    });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
