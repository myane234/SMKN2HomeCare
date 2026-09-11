import { NextResponse } from 'next/server';
import { createHubungiPesan } from '@/lib/cmsDataStore';

const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.nama || !body.email || !body.pesan) {
      return NextResponse.json(
        { success: false, message: 'Field nama, email, dan pesan wajib diisi' },
        { status: 422 }
      );
    }

    // 1. Kirim langsung ke backend produksi resmi https://citra.faaruq.com
    let remoteData = null;
    try {
      const remoteRes = await fetch(`${REMOTE_API_BASE}/api/resource/content/hubungi-kami/kirim-pesan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          nama: body.nama,
          email: body.email,
          no_hp: body.no_hp || '',
          subjek: body.subjek || '',
          pesan: body.pesan
        })
      });

      if (remoteRes.ok) {
        remoteData = await remoteRes.json();
      } else {
        console.warn('Backend server returned non-200:', remoteRes.status);
      }
    } catch (remoteErr) {
      console.error('Gagal mengirim pesan ke server backend remote:', remoteErr?.message);
    }

    // 2. Simpan juga ke local cmsDataStore sebagai backup
    try {
      createHubungiPesan(body);
    } catch {}

    if (remoteData) {
      return NextResponse.json(remoteData, { status: 201 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Pesan Anda berhasil terkirim. Tim kami akan segera menghubungi Anda.',
        data: body
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengirim pesan' },
      { status: 500 }
    );
  }
}
