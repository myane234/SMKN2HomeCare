import { NextResponse } from 'next/server';
import { getHubungiPesanList } from '@/lib/cmsDataStore';

const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const { unread_count, data } = getHubungiPesanList({ status, search });
    let combinedData = Array.isArray(data) ? [...data] : [];
    let unreadCount = unread_count;

    // Coba juga ambil dari remote backend jika ada token dari CMS admin
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader) {
      try {
        const remoteRes = await fetch(`${REMOTE_API_BASE}/api/admin/hubungi-kami/pesan?${searchParams.toString()}`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json'
          }
        });
        if (remoteRes.ok) {
          const remoteJson = await remoteRes.json();
          const remoteList = remoteJson?.data?.data || remoteJson?.data || [];
          if (Array.isArray(remoteList) && remoteList.length > 0) {
            const seen = new Set();
            const merged = [];
            for (const item of [...combinedData, ...remoteList]) {
              const key = `${item.email}_${item.created_at}_${item.pesan?.slice(0, 20)}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
              }
            }
            combinedData = merged;
            unreadCount = merged.filter((p) => p.status === 'belum_dibaca').length;
          }
        }
      } catch (err) {
        console.warn('Gagal fetch remote admin pesan:', err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar pesan masuk',
      unread_count: unreadCount,
      data: {
        current_page: 1,
        data: combinedData,
        total: combinedData.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat pesan masuk' },
      { status: 500 }
    );
  }
}
