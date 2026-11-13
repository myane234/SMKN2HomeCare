import { NextResponse } from 'next/server';
import { togglePublishUlasan } from '@/lib/cmsDataStore';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    // 1. Coba teruskan ke backend produksi jika token admin tersedia
    const authHeader = request.headers.get('authorization') || '';
    let remoteStatus = null;
    if (authHeader) {
      try {
        const remoteRes = await fetch(`https://citra.faaruq.com/api/admin/ulasan/${id}/toggle-publish`, {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            Authorization: authHeader
          }
        });
        if (remoteRes.ok) {
          const remoteJson = await remoteRes.json();
          remoteStatus = remoteJson?.data?.is_published;
        }
      } catch {}
    }

    // 2. Update status publish di CMS Data Store & status overrides
    const updated = togglePublishUlasan(id, remoteStatus);

    return NextResponse.json({
      success: true,
      message: updated.is_published ? 'Ulasan berhasil dipublikasikan' : 'Ulasan berhasil disembunyikan',
      data: {
        id: updated.id,
        is_published: updated.is_published
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah status publish' },
      { status: 500 }
    );
  }
}
