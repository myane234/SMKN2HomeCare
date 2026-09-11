import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function getDataFile() {
  const candidates = [];
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    if (__dirname && !__dirname.includes('[turbopack') && !__dirname.includes('turbopack/') && !__dirname.includes('/.next/')) {
      candidates.push(path.resolve(__dirname, '..', 'data', 'cms_mock_store.json'));
    }
  } catch (_) {}
  const cwd = process.cwd();
  candidates.push(path.join(cwd, 'Frontend', 'src', 'data', 'cms_mock_store.json'));
  candidates.push(path.join(cwd, 'src', 'data', 'cms_mock_store.json'));
  candidates.push(path.resolve(cwd, '..', 'Frontend', 'src', 'data', 'cms_mock_store.json'));
  let existing = [];
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    if (fs.existsSync(p)) existing.push(p);
  }
  existing.sort(function (a, b) {
    return fs.statSync(b).size - fs.statSync(a).size;
  });
  if (existing[0]) return existing[0];
  for (const p of candidates) {
    if (p.includes('Frontend')) return p;
  }
  return candidates[0];
}

const DEFAULT_STORE = {
  hubungi_settings: {
    hubungi_banner: "/images/hero/hero-bg.jpg",
    hubungi_banner_text: "Hubungi Layanan Home Care",
    hubungi_heading: "Ada Pertanyaan? Kami Siap Membantu Anda",
    hubungi_description: "Silakan tinggalkan pesan atau hubungi tim customer service kami untuk informasi lebih lanjut mengenai layanan Home Care.",
    hubungi_phone: "021-12345678",
    hubungi_email: "info@homecare.com",
    hubungi_whatsapp: "6281234567890",
    hubungi_address: "Jl. Kesehatan No. 123, Jakarta Selatan",
    hubungi_maps_link: "https://maps.google.com/?q=-6.200000,106.816666",
    hubungi_jam_operasional: "Senin - Minggu: 08:00 - 20:00 WIB"
  },
  hubungi_pesan: [
    {
      id: 1,
      nama: "Andi Wijaya",
      email: "andi@gmail.com",
      no_hp: "081299998888",
      subjek: "Tanya Layanan Fisioterapi",
      pesan: "Apakah layanan fisioterapi bisa untuk pasien pasca stroke di daerah Jakarta Barat?",
      status: "belum_dibaca",
      catatan_admin: null,
      created_at: "2026-09-03T14:10:00.000000Z",
      updated_at: "2026-09-03T14:10:00.000000Z"
    },
    {
      id: 2,
      nama: "Siti Sarah",
      email: "siti.sarah@yahoo.com",
      no_hp: "081377889900",
      subjek: "Jadwal Kunjungan Rawat Luka",
      pesan: "Halo admin, apakah bisa menjadwalkan kunjungan perawat untuk perawatan luka diabetes setiap 2 hari sekali?",
      status: "sudah_dibaca",
      catatan_admin: "Jadwal sudah dikonfirmasi ke perawat Ns. Dewi",
      created_at: "2026-09-02T10:30:00.000000Z",
      updated_at: "2026-09-02T11:00:00.000000Z"
    },
    {
      id: 3,
      nama: "Bambang Prakoso",
      email: "bambang.p@gmail.com",
      no_hp: "085612344321",
      subjek: "Konsultasi Pendampingan Lansia",
      pesan: "Selamat pagi, saya ingin bertanya paket pendampingan lansia full day di rumah untuk orang tua saya yang berusia 78 tahun.",
      status: "dibalas",
      catatan_admin: "Sudah dihubungi via WA oleh CS Rina pada 02/09 14:00 dan dikirimkan brosur paket.",
      created_at: "2026-09-01T09:15:00.000000Z",
      updated_at: "2026-09-01T14:05:00.000000Z"
    }
  ],
  ulasan_header: {
    ulasan_heading: "Apa Kata Mereka tentang Kami",
    ulasan_subheading: "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami."
  },
  ulasan_list: []
};

function readStore() {
  const DATA_FILE = getDataFile();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      return DEFAULT_STORE;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading cms_mock_store.json at:', DATA_FILE, err);
    return DEFAULT_STORE;
  }
}

function writeStore(store) {
  const DATA_FILE = getDataFile();
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cms_mock_store.json at:', DATA_FILE, err);
  }
}

// ──────────────── Hubungi Kami ────────────────
export function getHubungiSettings() {
  const store = readStore();
  return store.hubungi_settings || DEFAULT_STORE.hubungi_settings;
}

export function updateHubungiSettings(newSettings) {
  const store = readStore();
  store.hubungi_settings = { ...store.hubungi_settings, ...newSettings };
  writeStore(store);
  return store.hubungi_settings;
}

export function getHubungiPesanList({ status, search } = {}) {
  const store = readStore();
  let list = store.hubungi_pesan || [];

  if (status && status !== 'all') {
    list = list.filter((p) => String(p.status).toLowerCase() === String(status).toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        (p.nama && p.nama.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.subjek && p.subjek.toLowerCase().includes(q)) ||
        (p.pesan && p.pesan.toLowerCase().includes(q))
    );
  }

  const unread_count = (store.hubungi_pesan || []).filter((p) => p.status === 'belum_dibaca').length;

  return {
    unread_count,
    data: list
  };
}

export function getHubungiPesanById(id) {
  const store = readStore();
  const index = (store.hubungi_pesan || []).findIndex((p) => String(p.id) === String(id));
  if (index === -1) return null;

  // Auto mark as sudah_dibaca if it was belum_dibaca
  if (store.hubungi_pesan[index].status === 'belum_dibaca') {
    store.hubungi_pesan[index].status = 'sudah_dibaca';
    store.hubungi_pesan[index].updated_at = new Date().toISOString();
    writeStore(store);
  }

  return store.hubungi_pesan[index];
}

export function createHubungiPesan(data) {
  const store = readStore();
  const newId = (store.hubungi_pesan || []).reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
  const newPesan = {
    id: newId,
    nama: data.nama || '',
    email: data.email || '',
    no_hp: data.no_hp || '',
    subjek: data.subjek || 'Pertanyaan Baru',
    pesan: data.pesan || '',
    status: 'belum_dibaca',
    catatan_admin: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.hubungi_pesan = [newPesan, ...(store.hubungi_pesan || [])];
  writeStore(store);
  return newPesan;
}

export function updateHubungiPesan(id, updates) {
  const store = readStore();
  const index = (store.hubungi_pesan || []).findIndex((p) => String(p.id) === String(id));
  if (index === -1) return null;

  store.hubungi_pesan[index] = {
    ...store.hubungi_pesan[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  writeStore(store);
  return store.hubungi_pesan[index];
}

export function deleteHubungiPesan(id) {
  const store = readStore();
  const initialLength = (store.hubungi_pesan || []).length;
  store.hubungi_pesan = (store.hubungi_pesan || []).filter((p) => String(p.id) !== String(id));
  writeStore(store);
  return store.hubungi_pesan.length < initialLength;
}

// ──────────────── Ulasan ────────────────
export function getUlasanHeader() {
  const store = readStore();
  return store.ulasan_header || DEFAULT_STORE.ulasan_header;
}

export function updateUlasanHeader({ ulasan_heading, ulasan_subheading }) {
  const store = readStore();
  store.ulasan_header = {
    ulasan_heading: ulasan_heading || store.ulasan_header?.ulasan_heading || '',
    ulasan_subheading: ulasan_subheading || store.ulasan_header?.ulasan_subheading || ''
  };
  writeStore(store);
  return store.ulasan_header;
}

export function getPublicUlasanList({ rating, search, per_page, page } = {}) {
  const store = readStore();
  let list = (store.ulasan_list || []).filter((u) => u.is_published === true);

  if (rating && String(rating) !== 'all') {
    list = list.filter((u) => Number(u.rating) === Number(rating));
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (u) =>
        (u.nama_pengulas && u.nama_pengulas.toLowerCase().includes(q)) ||
        (u.profesi_peran && u.profesi_peran.toLowerCase().includes(q)) ||
        (u.komentar && u.komentar.toLowerCase().includes(q))
    );
  }

  const header = getUlasanHeader();
  const pageNum = Math.max(1, Number(page) || 1);
  const perPageNum = per_page === 'all' ? (list.length || 10) : Math.max(1, Number(per_page) || 10);
  const total = list.length;
  const lastPage = Math.max(1, Math.ceil(total / perPageNum));
  const startIndex = (pageNum - 1) * perPageNum;
  const paginatedData = list.slice(startIndex, startIndex + perPageNum);
  const nextPageUrl =
    pageNum < lastPage
      ? `/api/resource/content/ulasan?page=${pageNum + 1}&per_page=${perPageNum}`
      : null;

  return {
    ulasan_heading: header.ulasan_heading,
    ulasan_subheading: header.ulasan_subheading,
    data: {
      current_page: pageNum,
      data: paginatedData,
      last_page: lastPage,
      per_page: perPageNum,
      total: total,
      next_page_url: nextPageUrl
    }
  };
}

export function getAdminUlasanList({ is_published, rating, search, per_page, page } = {}) {
  const store = readStore();
  let list = store.ulasan_list || [];

  if (is_published !== undefined && is_published !== '' && is_published !== 'all') {
    const isPub = String(is_published) === 'true';
    list = list.filter((u) => Boolean(u.is_published) === isPub);
  }

  if (rating && String(rating) !== 'all') {
    list = list.filter((u) => Number(u.rating) === Number(rating));
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (u) =>
        (u.nama_pengulas && u.nama_pengulas.toLowerCase().includes(q)) ||
        (u.profesi_peran && u.profesi_peran.toLowerCase().includes(q)) ||
        (u.komentar && u.komentar.toLowerCase().includes(q))
    );
  }

  return {
    current_page: Number(page) || 1,
    data: list,
    total: list.length,
    per_page: per_page === 'all' ? list.length : Number(per_page) || 10
  };
}

export function getUlasanById(id) {
  const store = readStore();
  return (store.ulasan_list || []).find((u) => String(u.id) === String(id)) || null;
}

export function createUlasan(data) {
  const store = readStore();
  const newId = (store.ulasan_list || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
  
  let resolvedLayanan = null;
  if (data.layanan && typeof data.layanan === 'object') {
    resolvedLayanan = data.layanan;
  } else if (typeof data.layanan === 'string' && data.layanan.trim()) {
    resolvedLayanan = {
      id_master_layanan: Number(data.layanan_id) || 1,
      nama_layanan: data.layanan
    };
  } else if (data.nama_layanan) {
    resolvedLayanan = {
      id_master_layanan: Number(data.layanan_id) || 1,
      nama_layanan: data.nama_layanan
    };
  }

  const newUlasan = {
    id: newId,
    id_user: data.id_user || null,
    email: data.email || null,
    nama_pengulas: data.nama_pengulas || data.nama_pasien || 'Pengunjung',
    profesi_peran: data.profesi_peran || 'Pasien',
    foto: data.foto || null,
    foto_url: data.foto_url || null,
    rating: Number(data.rating) || 5,
    komentar: data.komentar || '',
    layanan_id: data.layanan_id ? Number(data.layanan_id) : null,
    is_published: data.is_published !== undefined ? Boolean(data.is_published) : false,
    urutan: data.urutan !== undefined ? Number(data.urutan) : (store.ulasan_list || []).length + 1,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    layanan: resolvedLayanan
  };

  store.ulasan_list = [newUlasan, ...(store.ulasan_list || [])];
  writeStore(store);
  return newUlasan;
}

export function updateUlasan(id, updates) {
  const store = readStore();
  const index = (store.ulasan_list || []).findIndex((u) => String(u.id) === String(id));
  if (index === -1) return null;

  const current = store.ulasan_list[index];
  let resolvedLayanan = current.layanan;

  if (updates.layanan && typeof updates.layanan === 'object') {
    resolvedLayanan = updates.layanan;
  } else if (typeof updates.layanan === 'string' && updates.layanan.trim()) {
    resolvedLayanan = {
      id_master_layanan: Number(updates.layanan_id || current.layanan_id) || 1,
      nama_layanan: updates.layanan
    };
  } else if (updates.nama_layanan) {
    resolvedLayanan = {
      id_master_layanan: Number(updates.layanan_id || current.layanan_id) || 1,
      nama_layanan: updates.nama_layanan
    };
  }

  store.ulasan_list[index] = {
    ...current,
    ...updates,
    layanan: resolvedLayanan,
    updated_at: new Date().toISOString()
  };
  writeStore(store);
  return store.ulasan_list[index];
}

export function togglePublishUlasan(id) {
  const store = readStore();
  const index = (store.ulasan_list || []).findIndex((u) => String(u.id) === String(id));
  if (index === -1) return null;

  store.ulasan_list[index].is_published = !store.ulasan_list[index].is_published;
  store.ulasan_list[index].updated_at = new Date().toISOString();
  writeStore(store);
  return store.ulasan_list[index];
}

export function deleteUlasan(id) {
  const store = readStore();
  const initialLength = (store.ulasan_list || []).length;
  store.ulasan_list = (store.ulasan_list || []).filter((u) => String(u.id) !== String(id));
  writeStore(store);
  return store.ulasan_list.length < initialLength;
}
