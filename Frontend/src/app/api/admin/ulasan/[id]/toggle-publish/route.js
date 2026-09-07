import { NextResponse } from 'next/server';
import { togglePublishUlasan } from '@/lib/cmsDataStore';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const updated = togglePublishUlasan(id);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Ulasan tidak ditemukan' },
        { status: 404 }
      );
    }

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
