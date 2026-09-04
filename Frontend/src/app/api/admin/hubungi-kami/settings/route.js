import { NextResponse } from 'next/server';
import { getHubungiSettings, updateHubungiSettings } from '@/lib/cmsDataStore';

export async function GET() {
  try {
    const data = getHubungiSettings();
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat pengaturan hubungi kami' },
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

    const updated = updateHubungiSettings(payload);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan halaman Hubungi Kami berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui pengaturan hubungi kami' },
      { status: 500 }
    );
  }
}
