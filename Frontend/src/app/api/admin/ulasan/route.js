import { NextResponse } from 'next/server';
import { getAdminUlasanList, createUlasan } from '@/lib/cmsDataStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const is_published = searchParams.get('is_published');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const per_page = searchParams.get('per_page') || 10;
    const page = searchParams.get('page') || 1;

    const data = getAdminUlasanList({ is_published, rating, search, per_page, page });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data ulasan (Admin)',
      data
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
