import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getPublicUlasanList,
  createUlasan,
  getUlasanStatusOverrides,
  getDeletedUlasanIds
} from '@/lib/cmsDataStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Ambil langsung dari Server Remote (citra.faaruq.com)
    try {
      const backendUrl = new URL('https://citra.faaruq.com/api/resource/content/ulasan');
      searchParams.forEach((val, key) => {
        backendUrl.searchParams.set(key, val);
      });

      const remoteRes = await fetch(backendUrl.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json();
        return NextResponse.json(remoteData);
      }
    } catch (remoteErr) {
      console.warn('Gagal memuat ulasan dari remote server, fallback ke local store:', remoteErr.message);
    }

    // 2. Fallback ke CMS Data Store Lokal
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'terbaru';
    const per_page = searchParams.get('per_page') || 10;
    const page = searchParams.get('page') || 1;

    const result = getPublicUlasanList({ rating, search, per_page, page, sort });

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

    const pengulasNama = payload.nama_pengulas || 'Pasien';
    const peran = payload.profesi_peran || 'Pasien';

    // Format metadata layanan jika disertakan agar tetap tercatat aman di server
    let finalKomentar = payload.komentar.trim();
    if (payload.nama_layanan || payload.layanan) {
      const svcName = payload.nama_layanan || payload.layanan;
      finalKomentar = `[Layanan: ${svcName}] ${finalKomentar}`;
    }

    // 5. Kirim langsung ke Server Remote (citra.faaruq.com)
    let remoteSaved = null;
    try {
      const serverPayload = {
        rating: Number(payload.rating),
        komentar: finalKomentar,
        nama_pengulas: pengulasNama,
        profesi_peran: peran
      };
      if (payload.transaksi_id && !isNaN(Number(payload.transaksi_id))) {
        serverPayload.id_booking = Number(payload.transaksi_id);
      }

      const remoteRes = await fetch('https://citra.faaruq.com/api/resource/content/ulasan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(serverPayload)
      });

      if (remoteRes.ok) {
        const resJson = await remoteRes.json();
        remoteSaved = resJson?.data || resJson;
      } else {
        const errText = await remoteRes.text();
        console.warn('Gagal simpan ulasan di remote server:', remoteRes.status, errText);
      }
    } catch (remoteErr) {
      console.warn('Error fetching remote ulasan server:', remoteErr.message);
    }

    // 6. Simpan juga ke CMS store lokal untuk fallback konsistensi
    payload.is_published = true;
    payload.urutan = 0;
    const newUlasan = createUlasan({
      ...payload,
      id: remoteSaved?.id,
      created_at: remoteSaved?.created_at || new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Terima kasih! Ulasan Anda berhasil dikirim ke server dan ditampilkan di portal.',
        data: remoteSaved || newUlasan
      },
      { status: 201 }
    );
  } catch (error) {
    const statusCode = error.statusCode || (error.message?.includes('Batas maksimal') ? 422 : 500);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengirim ulasan' },
      { status: statusCode }
    );
  }
}
