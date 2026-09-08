import { NextResponse } from 'next/server';
import { getHubungiSettings } from '@/lib/cmsDataStore';

export async function GET() {
  try {
    const data = getHubungiSettings();
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat info hubungi kami' },
      { status: 500 }
    );
  }
}
