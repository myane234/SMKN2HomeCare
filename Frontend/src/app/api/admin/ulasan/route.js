import { NextResponse } from 'next/server';
import { getAdminUlasanList, getUlasanStatusOverrides, getDeletedUlasanIds, createUlasan } from '@/lib/cmsDataStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const is_published = searchParams.get('is_published');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const per_page = searchParams.get('per_page') || 10;
    const page = searchParams.get('page') || 1;

    const authHeader = request.headers.get('authorization') || '';
    let serverItems = [];

    // 1. Coba ambil dari /api/admin/ulasan di remote server jika ada auth token
    if (authHeader) {
      try {
        const backendUrl = new URL('https://citra.faaruq.com/api/admin/ulasan');
        searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));
        const adminRes = await fetch(backendUrl.toString(), {
          headers: { Accept: 'application/json', Authorization: authHeader },
          cache: 'no-store'
        });
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          return NextResponse.json(adminJson);
        }
      } catch (errAdmin) {
        console.warn('Gagal fetch remote /api/admin/ulasan:', errAdmin?.message);
      }
    }

    // 2. Ambil dari /api/resource/content/ulasan remote server
    try {
      const backendUrl = new URL('https://citra.faaruq.com/api/resource/content/ulasan');
      backendUrl.searchParams.set('per_page', '100');
      const remoteRes = await fetch(backendUrl.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (remoteRes.ok) {
        const remoteJson = await remoteRes.json();
        serverItems =
          (Array.isArray(remoteJson?.data?.data) && remoteJson.data.data) ||
          (Array.isArray(remoteJson?.data) && remoteJson.data) ||
          [];
      }
    } catch (remoteErr) {
      console.warn('Gagal fetch remote ulasan:', remoteErr?.message);
    }

    let filtered = serverItems.map((item) => ({
      ...item,
      id: item.id || item.id_ulasan,
      is_published: item.is_published !== undefined ? Boolean(item.is_published) : true
    }));

    // Client-side filters
    if (is_published !== undefined && is_published !== '' && is_published !== 'all') {
      const isPub = String(is_published) === 'true';
      filtered = filtered.filter((u) => Boolean(u.is_published) === isPub);
    }
    if (rating && String(rating) !== 'all') {
      filtered = filtered.filter((u) => Number(u.rating) === Number(rating));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.nama_pengulas && u.nama_pengulas.toLowerCase().includes(q)) ||
          (u.nama_pasien && u.nama_pasien.toLowerCase().includes(q)) ||
          (u.profesi_peran && u.profesi_peran.toLowerCase().includes(q)) ||
          (u.komentar && u.komentar.toLowerCase().includes(q))
      );
    }

    // Urutkan terbaru
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const total = filtered.length;
    const resolvedPerPage = per_page === 'all' ? total : Math.max(1, Number(per_page) || 10);
    const resolvedPage = Math.max(1, Number(page) || 1);
    const startIndex = (resolvedPage - 1) * resolvedPerPage;
    const sliced = total === 0 ? [] : filtered.slice(startIndex, startIndex + resolvedPerPage);

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data ulasan (Admin)',
      data: {
        current_page: resolvedPage,
        per_page: resolvedPerPage,
        total,
        data: sliced
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat ulasan admin' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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

    if (!payload.nama_pengulas || !payload.rating || !payload.komentar) {
      return NextResponse.json(
        { success: false, message: 'Field nama_pengulas, rating, dan komentar wajib diisi' },
        { status: 422 }
      );
    }

    if (payload.is_published === undefined) {
      payload.is_published = true;
    }

    const newUlasan = createUlasan(payload);

    return NextResponse.json(
      {
        success: true,
        message: 'Ulasan berhasil ditambahkan oleh Admin',
        data: newUlasan
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menambahkan ulasan' },
      { status: 500 }
    );
  }
}
