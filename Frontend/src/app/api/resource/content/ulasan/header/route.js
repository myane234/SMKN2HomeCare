import { NextResponse } from 'next/server';
import { updateUlasanHeader } from '@/lib/cmsDataStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const updated = updateUlasanHeader(body);

    return NextResponse.json({
      message: 'Header Ulasan berhasil diperbarui',
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui header ulasan' },
      { status: 500 }
    );
  }
}
