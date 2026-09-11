import { NextResponse } from 'next/server';
import { getAdminUlasanList, createUlasan } from '@/lib/cmsDataStore';


const REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

async function tryFetchRemoteUlasan(request) {
  try {
    const originalUrl = new URL(request.url);
    const searchStr = originalUrl.searchParams.toString();

    const headers = {};
    const authH = request.headers.get('authorization');
    if (authH) headers.authorization = authH;
    const cookieH = request.headers.get('cookie');
    if (cookieH) headers.cookie = cookieH;
    headers.accept = 'application/json';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const remoteRes = await fetch(`${REMOTE_API_BASE}/api/admin/ulasan${searchStr ? '?' + searchStr : ''}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Jika remote merespon HTTP TIDAK OK (401, 404, 500, dsb) →
    // TIDAK anggap "server tidak merespon", anggap "belum / tidak punya endpoint"
    if (!remoteRes.ok) {
      // 401 = backend membutuhkan token admin (normal jika token CMS tidak sync)
      // 404 = endpoint belum ada di backend (normal)
      // 5xx = error backend, tapi anggap server MERESPON (tidak timeout)
      return { source: 'remote_unavailable', list: [], raw: null, status: remoteRes.status };
    }

    const remoteJson = await remoteRes.json().catch(() => null);
    if (!remoteJson) return { source: 'remote_invalid_json', list: [] };

    let list = [];
    if (Array.isArray(remoteJson)) list = remoteJson;
    else if (Array.isArray(remoteJson.data)) list = remoteJson.data;
    else if (remoteJson.data && Array.isArray(remoteJson.data.data)) list = remoteJson.data.data;

    return {
      source: list.length ? 'remote' : 'remote_empty',
      list,
      raw: remoteJson,
      status: remoteRes.status
    };
  } catch (err) {
    // ABORT = timeout (benar-benar tidak merespon)
    const isTimeout = err?.name === 'AbortError' || /timeout|abort/i.test(err?.message || '');
    return {
      source: isTimeout ? 'remote_timeout' : 'remote_error',
      list: [],
      error: err?.message || String(err),
      isTimeout
    };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const is_published = searchParams.get('is_published');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');
    const per_page = searchParams.get('per_page') || 10;
    const page = searchParams.get('page') || 1;

    // 1. Coba ambil dari server backend terlebih dahulu (dengan timeout & categorisasi)
    const remote = await tryFetchRemoteUlasan(request);

    // HANYA GUNAKAN data remote JIKA remote BERHASIL & punya data list
    if (remote && remote.source === 'remote' && remote.list.length) {
      const remotePagination = remote.raw?.data?.current_page !== undefined
        ? remote.raw.data
        : remote.raw?.current_page !== undefined
          ? remote.raw
          : null;

      const normalized = {
        current_page: Number(remotePagination?.current_page || page) || 1,
        data: remote.list,
        total: Number(remotePagination?.total ?? remote.list.length),
        per_page: per_page === 'all' ? remote.list.length : Number(remotePagination?.per_page || per_page) || 10,
        source: 'backend-server'
      };

      return NextResponse.json({
        success: true,
        message: 'Berhasil mengambil data ulasan (Admin) dari server backend.',
        data: normalized,
        debug: { remote_status: remote.status }
      });
    }

    // 2. Fallback ke local cmsDataStore
    // TENTUKAN source_label yang BENAR untuk ditampilkan user:
    //    local-fallback            = server MERESPON tapi data kosong / endpoint belum ada (NORMAL, TIDAK USAH WARNING)
    //    local-fallback-server-down = server BENAR-BENAR timeout / unreachable (PERLU WARN user)
    let dataSource = 'local-fallback';
    let debugInfo = {
      remote_tried: true,
      remote_result: remote?.source || 'skipped'
    };
    if (remote?.source === 'remote_timeout' || remote?.source === 'remote_error') {
      dataSource = 'local-fallback-server-unreachable';
      debugInfo.remote_error = remote?.error || 'Unknown connection error';
      debugInfo.is_timeout = Boolean(remote?.isTimeout);
    }

    const data = getAdminUlasanList({ is_published, rating, search, per_page, page });
    data.source = dataSource;
    data.debug = debugInfo;

    return NextResponse.json({
      success: true,
      message: dataSource.includes('unreachable')
        ? 'Server backend tidak dapat dijangkau. Data ulasan dimuat dari penyimpanan lokal.'
        : 'Berhasil mengambil data ulasan (Admin).',
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
