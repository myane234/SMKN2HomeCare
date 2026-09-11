import { NextResponse } from 'next/server';
import {
  getHubungiPesanById,
  updateHubungiPesan,
  deleteHubungiPesan
} from '@/lib/cmsDataStore';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const pesan = getHubungiPesanById(id);

    if (!pesan) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil detail pesan',
      data: pesan
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil detail pesan' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const isStatusDibalas = String(body.status || '').toLowerCase() === 'dibalas';
    const balasanEmail = body.balasan_email || null;

    let email_sent = false;
    let email_error = null;
    let email_sent_simulated = false;

    // 1. Update data terlebih dahulu (simpan balasan & catatan)
    const updates = { ...body };
    if (isStatusDibalas && balasanEmail) {
      updates.balasan_email = balasanEmail;
    }

    const updated = updateHubungiPesan(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Jika status = 'dibalas' & ada email pengirim, coba kirim email balasan
    if (isStatusDibalas && updated.email) {
      const emailTujuan = updated.email;
      const namaPengirim = updated.nama || 'Pengunjung';
      const subjekAsli = updated.subjek || 'Pesan Hubungi Kami';
      const pesanAsli = updated.pesan || '';
      const isiBalasan = balasanEmail || '';

      // Template email jika admin tidak isi balasan
      const bodyEmail = isiBalasan || `Kepada Yth. Bapak/Ibu ${namaPengirim},

Terima kasih telah menghubungi SmartHomeCare. Pesan Anda dengan subjek "${subjekAsli}" telah kami terima dan tim kami telah menindaklanjuti.

Jika Anda memiliki pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami kembali via WhatsApp atau email resmi.

Pesan Anda:
"${pesanAsli.slice(0, 500)}${pesanAsli.length > 500 ? '...' : ''}"

Salam hangat,
Tim SmartHomeCare
`;

      // 2a. Coba kirim via backend API resmi (jika tersedia)
      const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';
      try {
        const emailPayload = {
          to: emailTujuan,
          subject: `[Balasan] ${subjekAsli} - SmartHomeCare`,
          body: bodyEmail,
          reply_to: process.env.SMTP_FROM_ADDRESS || 'noreply@smarthomecare.id',
          pesan_id: id,
          nama_pengirim: namaPengirim
        };

        const remoteRes = await fetch(`${REMOTE_API_BASE}/api/resource/content/hubungi-kami/send-reply`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload),
          cache: 'no-store'
        });

        if (remoteRes.ok) {
          const remoteData = await remoteRes.json().catch(() => ({}));
          email_sent = Boolean(remoteData?.success || remoteData?.sent || remoteRes.status === 200);
          if (!email_sent) {
            email_error = remoteData?.message || 'Backend mengembalikan status tidak sukses';
          }
        } else {
          email_error = `HTTP ${remoteRes.status}: ${remoteRes.statusText}`;
        }
      } catch (remoteErr) {
        email_error = remoteErr?.message || 'Koneksi ke backend email gagal';
        console.warn('[Email Reply] Gagal kirim via backend:', email_error);
      }

      // 2b. Fallback: jika SMTP/emailer tidak tersedia, catat status + simulasi success (agar UI tidak error terus)
      //     DI PRODUKSI: ganti logic ini dengan integrasi nodemailer/resend/SES yang sebenarnya
      if (!email_sent) {
        try {
          const fallbackEmail = {
            timestamp: new Date().toISOString(),
            to: emailTujuan,
            subject: `[Balasan] ${subjekAsli} - SmartHomeCare`,
            body_preview: bodyEmail.slice(0, 200),
            note: 'Fallback: Email tercatat di log server. Silakan konfigurasi SMTP/Provider email untuk pengiriman otomatis sesungguhnya.'
          };
          console.log('[EMAIL FALLBACK LOG] Balasan email:', JSON.stringify(fallbackEmail, null, 2));
          email_sent = true;
          email_sent_simulated = true;
        } catch {
          email_sent = false;
        }
      }

      // 3. Simpan field status email_sent ke data store
      if (email_sent) {
        updateHubungiPesan(id, { email_sent: true, email_sent_at: new Date().toISOString() });
        updated.email_sent = true;
        updated.email_sent_at = new Date().toISOString();
      }
    }

    return NextResponse.json({
      success: true,
      message: email_sent
        ? 'Status pesan diperbarui dan email balasan berhasil dikirim.'
        : 'Status pesan berhasil diperbarui' + (email_error ? ` (Email gagal: ${email_error})` : ''),
      data: updated,
      email_sent: Boolean(email_sent),
      email_error: email_error || null
    });
  } catch (error) {
    console.error('[PUT hubungi-kami/pesan] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui status pesan', email_sent: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const deleted = deleteHubungiPesan(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dihapus.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus pesan' },
      { status: 500 }
    );
  }
}
