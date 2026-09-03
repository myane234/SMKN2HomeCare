import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';
import { resolveImageUrl } from '../utils/resolveImage.js';

function mapApiItem(item) {
  const katNama =
    item.kategori?.nama_kategori ||
    item.nama_kategori ||
    item.kategori_layanan ||
    (typeof item.kategori === 'string' ? item.kategori : '');

  return {
    id: item.id_layanan ?? item.id,
    id_layanan: item.id_layanan ?? item.id,
    nama: item.nama_layanan ?? item.nama ?? '',
    nama_layanan: item.nama_layanan ?? item.nama ?? '',
    id_kategori_layanan: item.id_kategori_layanan ?? item.kategori?.id_kategori_layanan ?? '',
    kategori: katNama || (item.id_kategori_layanan ? `Kategori #${item.id_kategori_layanan}` : '-'),
    kategori_layanan: katNama || '',
    harga: Number(item.harga ?? 0),
    tipe_layanan: item.tipe_layanan ?? 'tindakan',
    durasi: item.durasi_menit ?? item.durasi ?? '',
    transport: Boolean(item.include_transport),
    deskripsi: item.deskripsi_layanan ?? item.deskripsi ?? '',
    gambar: resolveImageUrl(item.foto_layanan ?? item.gambar ?? ''),
    updated_at: item.updated_at ?? null,
  };
}

function toFormData(item) {
  const fd = new FormData();
  
  // Ambil ID kategori dengan mengecek berbagai kemungkinan struktur data yang dikirim
  const kategoriId = item.id_kategori_layanan ?? item.kategori?.id_kategori_layanan ?? item.kategori ?? '';

  fd.append('nama_layanan', item.nama ?? '');
  fd.append('id_kategori_layanan', kategoriId);
  fd.append('harga', item.harga ?? 0);
  fd.append('tipe_layanan', item.tipe_layanan ?? 'tindakan');
  
  if (item.tipe_layanan === 'durasi') {
    fd.append('durasi_menit', item.durasi ?? 0);
  } else {
    fd.append('durasi_menit', '');
  }
  
  fd.append('include_transport', item.transport ? 1 : 0);
  fd.append('deskripsi_layanan', item.deskripsi ?? '');
  
  if (item.gambar instanceof File) {
    fd.append('foto_layanan', item.gambar);
  }
  
  return fd;
}

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.message ?? 'Terjadi kesalahan pada server'
    throw new Error(message)
  }
  return body
}

export async function getAllLayanan() {
  const res = await fetch(`${URL}/layanan/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json = await parseJsonResponse(res);
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(json.message || 'Gagal mengambil data layanan');
  }

  return json.data.map(mapApiItem);
}

export async function getKategoriLayanan() {
  const res = await fetch(`${URL}/layanan?ambil_kategori=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const body = await parseJsonResponse(res);
  return body.data;
}

export async function getLayananById(id) {
  const res = await fetch(`${URL}/layanan/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const body = await parseJsonResponse(res);
  if (!body) {
    throw new Error('Layanan tidak ditemukan');
  }

  const data = body.data || body;
  return mapApiItem(data);
}

export async function createLayanan(payload) {
  const res = await fetch(`${URL}/layanan/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: toFormData(payload),
  })

  const body = await parseJsonResponse(res)
  const data = body.data || body
  return mapApiItem(data)
}

export async function updateLayanan(id, payload) {
  const fd = toFormData(payload);
  fd.append('_method', 'PUT'); 
  const res = await fetch(`${URL}/layanan/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: fd,
  })

  const body = await parseJsonResponse(res)
  const data = body.data || body
  return mapApiItem(data)
}

export async function deleteLayanan(id) {
  const res = await fetch(`${URL}/layanan/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
  })

  await parseJsonResponse(res)
  return true
}