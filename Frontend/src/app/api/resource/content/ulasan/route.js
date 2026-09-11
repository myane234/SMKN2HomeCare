import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPublicUlasanList, createUlasan } from '@/lib/cmsDataStore';

const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const remoteUrl = new URL(`${REMOTE_API_BASE}/api/resource/content/ulasan`);
    searchParams.forEach((val, key) => {
      remoteUrl.searchParams.set(key, val);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const remoteRes = await fetch(remoteUrl.toString(), {
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      const rawList = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      if (rawList.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || /timeout|abort/i.test(err?.message || '');
    if (isTimeout) {
      console.warn('Remote ulasan API timeout (6s), fallback ke local store');
    } else {
      console.warn('Gagal memuat ulasan dari remote database, fallback ke local:', err?.message);
    }
  }

  // 2. Fallback jika remote database tidak memiliki data atau tidak bisa diakses
  try {
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const per_page = searchParams.get('per_page') || 6;
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
    // 1. Dapatkan token autentikasi jika ada
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

    // 3. Validasi Field Wajib (rating & komentar & nama_pengulas)
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

    // 4. Simpan ke database/store lokal CMS agar admin langsung bisa melihat & menayangkan ulasan
    payload.is_published = false;
    payload.urutan = 0;
    const newUlasan = createUlasan(payload);

    // 5. Teruskan ke database backend API resmi (jika terhubung)
    try {
      const remoteHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        remoteHeaders.Authorization = `Bearer ${token}`;
      }

      await fetch(`${REMOTE_API_BASE}/api/resource/content/ulasan`, {
        method: 'POST',
        headers: remoteHeaders,
        body: JSON.stringify({
          rating: Number(payload.rating),
          komentar: payload.komentar,
          nama_pengulas: payload.nama_pengulas || 'Pasien',
          profesi_peran: payload.profesi_peran || 'Keluarga Pasien',
          layanan_id: payload.layanan_id ? Number(payload.layanan_id) : null
        })
      });
    } catch (remoteErr) {
      console.warn('Gagal sinkronisasi ulasan ke remote database:', remoteErr?.message);
    }

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
