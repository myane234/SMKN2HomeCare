import nodemailer from 'nodemailer';

/**
 * Membuat transporter Nodemailer berdasarkan environment variables
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== 'false' && (port === 465 || process.env.SMTP_SECURE === 'true');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Mengirimkan email kode OTP reset password ke alamat pengguna
 * @param {object} params
 * @param {string} params.to - Alamat email penerima
 * @param {string} params.otp - 6-digit kode OTP
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function sendOtpEmail({ to, otp }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      '[SMTP INFO] SMTP_USER atau SMTP_PASS belum disetel di .env.local. Email fisik tidak dapat dikirim.'
    );
    return {
      success: false,
      reason: 'SMTP_NOT_CONFIGURED',
      message: 'Kredensial SMTP belum diatur di .env.local.',
    };
  }

  const fromAddress =
    process.env.SMTP_FROM ||
    `"SmartHomeCare Support" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode OTP Reset Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
              
              <!-- Header Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #0284c7 0%, #004fa4 50%, #2dd4bf 100%); padding: 32px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">SmartHomeCare</h1>
                  <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">Layanan Perawatan Kesehatan Terpercaya</p>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Pemulihan Kata Sandi</h2>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                    Halo, kami menerima permintaan untuk mereset kata sandi akun Anda. Gunakan kode OTP berikut untuk melanjutkan proses pemulihan akun:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">KODE VERIFIKASI ANDA</span>
                    <span style="font-size: 34px; font-weight: 800; color: #004fa4; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; display: inline-block;">${otp}</span>
                    <span style="display: block; margin-top: 8px; font-size: 12px; color: #0284c7; font-weight: 600;">Berlaku selama 10 menit</span>
                  </div>

                  <!-- Warning & Security Note -->
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400e;">
                      <strong>Perhatian Keamanan:</strong> Jangan pernah membagikan kode verifikasi ini kepada siapapun, termasuk pihak yang mengatasnamakan SmartHomeCare.
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                    Jika Anda tidak merasa meminta kode reset ini, Anda dapat mengabaikan email ini dengan aman. Kata sandi akun Anda tidak akan berubah tanpa kode di atas.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SMKN 2 HomeCare System. Seluruh hak cipta dilindungi.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `[SmartHomeCare] ${otp} adalah Kode Verifikasi Reset Password Anda`,
      text: `Kode verifikasi OTP reset password Anda adalah: ${otp}. Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[SMTP ERROR] Gagal mengirim email via Nodemailer:', error);
    return {
      success: false,
      reason: 'SMTP_SEND_FAILED',
      error: error.message,
    };
  }
}
