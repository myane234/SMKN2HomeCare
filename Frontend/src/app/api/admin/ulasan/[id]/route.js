import { NextResponse } from 'next/server';
import {
  getUlasanById,
  updateUlasan,
  deleteUlasan
} from '@/lib/cmsDataStore';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ulasan = getUlasanById(id);

    if (!ulasan) {
      return NextResponse.json(
        { success: false, message: 'Ulasan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil detail ulasan',
      data: ulasan
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil detail ulasan' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    if (payload.is_published !== undefined) {
      payload.is_published = payload.is_published === 'true' || payload.is_published === true;
    }
    if (payload.rating !== undefined) {
      payload.rating = Number(payload.rating);
    }
    if (payload.remove_foto === 'true' || payload.remove_foto === true) {
      payload.foto = null;
      payload.foto_url = null;
    }

    const updated = updateUlasan(id, payload);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Ulasan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ulasan berhasil diperbarui',
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui ulasan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const deleted = deleteUlasan(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Ulasan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ulasan berhasil dihapus.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus ulasan' },
      { status: 500 }
    );
  }
}
