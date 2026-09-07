import { NextResponse } from 'next/server';
import { createHubungiPesan } from '@/lib/cmsDataStore';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.nama || !body.email || !body.pesan) {
      return NextResponse.json(
        { success: false, message: 'Field nama, email, dan pesan wajib diisi' },
        { status: 422 }
      );
    }

    const newPesan = createHubungiPesan(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Pesan Anda berhasil terkirim. Tim kami akan segera menghubungi Anda.',
        data: newPesan
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
