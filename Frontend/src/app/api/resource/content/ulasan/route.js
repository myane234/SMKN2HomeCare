import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPublicUlasanList, createUlasan } from '@/lib/cmsDataStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const per_page = searchParams.get('per_page') || 10;
    const page = searchParams.get('page') || 1;

    const result = getPublicUlasanList({ rating, search, per_page, page });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar ulasan',
      ulasan_heading: result.ulasan_heading,
      ulasan_subheading: result.ulasan_subheading,
      data: result.data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat ulasan' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // 1. Validasi Autentikasi (Wajib Login)
    const authHeader = request.headers.get('authorization') || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookieStore = await cookies();
      token =
        cookieStore.get('auth_token')?.value ||
        cookieStore.get('smarthomecare-session')?.value;
    }

    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json(
        { message: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    // 2. Parse payload (FormData atau JSON)
    let payload = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          payload[key] = value;
        }
      }
    } else {
      payload = await request.json();
    }

    // 3. Validasi Field Wajib (rating & komentar)
    const errors = {};
    if (!payload.rating) {
      errors.rating = ['The rating field is required.'];
    }
    if (!payload.komentar || !payload.komentar.trim()) {
      errors.komentar = ['The komentar field is required.'];
    }

    if (Object.keys(errors).length > 0) {
      const errCount = Object.keys(errors).length;
      return NextResponse.json(
        {
          message:
            errCount > 1
              ? `The ${Object.keys(errors)[0]} field is required. (and ${errCount - 1} more error)`
              : `The ${Object.keys(errors)[0]} field is required.`,
          errors
        },
        { status: 422 }
      );
    }

    // 4. Dapatkan info user jika nama_pengulas atau email belum terisi
    if (!payload.nama_pengulas || !payload.email) {
      try {
        const cookieStore = await cookies();
        const emailCookie = cookieStore.get('profile_email')?.value;
        const namaCookie = cookieStore.get('profile_nama')?.value || cookieStore.get('user_nama')?.value;
        if (!payload.email && emailCookie) {
          payload.email = decodeURIComponent(emailCookie);
        }
        if (!payload.nama_pengulas && namaCookie) {
          payload.nama_pengulas = decodeURIComponent(namaCookie);
        }
      } catch {}
    }

    payload.is_published = false; // Memerlukan moderasi admin
    payload.urutan = 0;
    
    // Simpan ke local CMS store
    const newUlasan = createUlasan(payload);

    // Coba kirim juga ke backend remote (citra.faaruq.com) jika token valid
    try {
      const remoteForm = new FormData();
      remoteForm.append('rating', String(payload.rating));
      remoteForm.append('komentar', String(payload.komentar));
      if (payload.nama_pengulas) remoteForm.append('nama_pengulas', String(payload.nama_pengulas));
      if (payload.profesi_peran) remoteForm.append('profesi_peran', String(payload.profesi_peran));
      if (payload.layanan_id) remoteForm.append('layanan_id', String(payload.layanan_id));

      fetch('https://citra.faaruq.com/api/resource/content/ulasan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: remoteForm,
      }).catch(() => {});
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: 'Terima kasih! Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami.',
        data: newUlasan
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengirim ulasan' },
      { status: 500 }
    );
  }
}
