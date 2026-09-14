import { NextResponse } from 'next/server';
import {
  getHubungiPesanById,
  updateHubungiPesan,
  deleteHubungiPesan
} from '@/lib/cmsDataStore';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const pesan = getHubungiPesanById(id);

    if (!pesan) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil detail pesan',
      data: pesan
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil detail pesan' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = updateHubungiPesan(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status pesan berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui status pesan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const deleted = deleteHubungiPesan(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dihapus.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus pesan' },
      { status: 500 }
    );
  }
}
