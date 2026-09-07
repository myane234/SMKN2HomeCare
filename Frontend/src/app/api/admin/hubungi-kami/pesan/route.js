import { NextResponse } from 'next/server';
import { getHubungiPesanList } from '@/lib/cmsDataStore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const { unread_count, data } = getHubungiPesanList({ status, search });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar pesan masuk',
      unread_count,
      data: {
        current_page: 1,
        data,
        total: data.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat pesan masuk' },
      { status: 500 }
    );
  }
}
