import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
  getAllNakesRequests,
  approveNakesRequest,
  pelatihanNakesRequest,
  rejectNakesRequest,
} from '../../../data/nakesRequestData';
import { getImageUrl } from '../../../data/imageHelper';

export default function PageNakesRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(location.state?.requestData || null);
  const [loading, setLoading] = useState(!data);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Modal State
  const [showPelatihanModal, setShowPelatihanModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!data && id) {
      setLoading(true);
      getAllNakesRequests()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          const found = list.find(
            (item) => String(item.id_tenaga_medis || item.id || item.id_nakes_request) === String(id)
          );
          if (found) {
            setData(found);
          } else {
            setErrorMsg('Data permohonan nakes tidak ditemukan');
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Gagal mengambil detail data');
        })
        .finally(() => setLoading(false));
    }
  }, [id, data]);

  // Handlers
  async function handleQuickApprove() {
    if (!window.confirm(`Setujui & aktifkan akun ${data?.nama_lengkap || 'Nakes'}?`)) return;
    setProcessing(true);
    try {
      await approveNakesRequest(data.id_tenaga_medis ?? data.id);
      alert('Berhasil menyetujui dan mengaktifkan akun Nakes!');
      navigate(-1);
    } catch (err) {
      alert(err.message || 'Gagal menyetujui permohonan');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmPelatihan() {
    setProcessing(true);
    try {
      await pelatihanNakesRequest(data.id_tenaga_medis ?? data.id, adminNotes);
      alert('Status berhasil diubah ke Pelatihan');
      navigate(-1);
    } catch (err) {
      alert(err.message || 'Gagal mengubah ke status pelatihan');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmReject() {
    setProcessing(true);
    try {
      await rejectNakesRequest(data.id_tenaga_medis ?? data.id, adminNotes);
      alert('Permohonan berhasil ditolak');
      navigate(-1);
    } catch (err) {
      alert(err.message || 'Gagal menolak permohonan');
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function renderStatusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') {
      return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Disetujui</span>;
    }
    if (s === 'pelatihan') {
      return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Menunggu Pelatihan</span>;
    }
    if (s === 'rejected') {
      return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Ditolak</span>;
    }
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Verifikasi</span>;
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Memuat detail permohonan...</div>;
  if (errorMsg) return <div className="p-10 text-center text-sm text-red-500">{errorMsg}</div>;
  if (!data) return null;

  const isPending = !data.status || data.status === 'pending';
  const isPelatihan = data.status === 'pelatihan';

  // Helper membaca file dokumen
  const getDocUrl = (keys) => {
    for (const key of keys) {
      if (data[key]) return data[key];
      if (data.dokumen && data.dokumen[key]) return data.dokumen[key];
    }
    return null;
  };

  const strUrl = getDocUrl(['foto_str', 'photo_str', 'file_str', 'str_file', 'str']);
  const sipUrl = getDocUrl(['foto_sip', 'photo_sip', 'file_sip', 'sip_file', 'sip']);
  const ijazahUrl = getDocUrl(['foto_ijazah', 'photo_ijazah', 'file_ijazah', 'ijazah_file', 'ijazah']);
  const skckUrl = getDocUrl(['foto_skck', 'photo_skck', 'file_skck', 'skck_file', 'skck']);
  const cvUrl = getDocUrl(['foto_cv', 'photo_cv', 'file_cv', 'cv_file', 'cv']);
  const ktpUrl = getDocUrl(['foto_ktp', 'photo_ktp', 'file_ktp', 'ktp_file', 'ktp']);

  let rawTambahan = data.dokumen_tambahan ?? data.file_tambahan ?? data.dokumen_lain ?? null;
  let arrayDocTambahan = [];
  if (Array.isArray(rawTambahan)) {
    arrayDocTambahan = rawTambahan;
  } else if (rawTambahan) {
    arrayDocTambahan = [rawTambahan];
  }

  const profileImg = data.foto_profile || data.user?.foto_profile || data.pasien?.foto_profile;
  const jenisNakes = data.jenis_nakes ?? data.jenis_tenaga_medis ?? data.kategori_layanan ?? data.profesi ?? '-';
  const alamatLengkap = data.alamat_lengkap ?? data.alamat ?? '';

  // Penanganan pembacaan wilayah yang aman dari JSON backend
  const wilayahOperasionalText =
    data.wilayah_layanan?.nama_provinsi ||
    (typeof data.wilayah_operasional === 'string' ? data.wilayah_operasional : null) ||
    (typeof data.wilayah === 'string' ? data.wilayah : null) ||
    '-';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline btn-sm flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-slate-900">Detail Permohonan Registrasi</h1>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button
                onClick={() => setShowPelatihanModal(true)}
                disabled={processing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                Setujui Pelatihan
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="btn-danger btn-sm px-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tolak
              </button>
            </>
          )}

          {isPelatihan && (
            <>
              <button
                onClick={handleQuickApprove}
                disabled={processing}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Setujui Akun
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="btn-danger btn-sm px-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tolak
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6 xl:col-span-1">
          <div className="card p-5 text-center bg-white rounded-xl shadow-xs border border-slate-200">
            {profileImg ? (
              <img
                src={getImageUrl(profileImg)}
                alt={data.nama_lengkap}
                className="mx-auto h-32 w-32 rounded-full border-4 border-slate-100 object-cover shadow-md mb-3"
              />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-4xl font-bold text-slate-400 mb-3">
                {(data.nama_lengkap || 'N').charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="text-lg font-bold text-slate-900">{data.nama_lengkap ?? '-'}</h2>
            {data.nama_panggilan && (
              <p className="text-xs text-slate-500">Panggil: {data.nama_panggilan}</p>
            )}
            
            <p className="text-xs font-semibold text-emerald-600 mt-1">{jenisNakes}</p>

            <div className="mt-4 flex justify-center">{renderStatusBadge(data.status)}</div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Email Terdaftar</span>
                <span className="font-semibold text-slate-800 break-all">{data.email ?? data.user?.email ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. Hp</span>
                <span className="font-semibold text-slate-800">{data.no_hp ?? data.no_telp ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Wilayah Operasional</span>
                <span className="inline-block mt-1 rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 border border-sky-200">
                  {wilayahOperasionalText}
                </span>
              </div>
            </div>
          </div>

          {/* Alamat Utama Peta Google Maps Embed */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Alamat Utama (Peta Lokasi)
            </h3>

            <div className="relative h-64 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-3">
              {alamatLengkap ? (
                <iframe
                  title="Peta Alamat Utama"
                  width="100%"
                  height="100%"
                  className="border-0"
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    alamatLengkap
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                  <span className="text-2xl mb-1">📍</span>
                  <p className="text-xs text-slate-400">Teks alamat belum tersedia</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-slate-400 block text-xs font-medium">Detail Alamat</span>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed mt-1">
                {alamatLengkap || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-6 xl:col-span-2">
          {/* Data Pribadi & Identitas */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Informasi Pribadi & Identitas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">NIK</span>
                <span className="font-semibold text-slate-800 text-sm">{data.nik ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">
                  {data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : (data.jenis_kelamin ?? '-')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tempat & Tanggal Lahir</span>
                <span className="font-semibold text-slate-800">
                  {data.tempat_lahir ?? '-'}{data.tanggal_lahir ? `, ${formatDate(data.tanggal_lahir)}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Agama</span>
                <span className="font-semibold text-slate-800">{data.agama ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Pendidikan & Legalitas Profesi */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Pendidikan & Legalitas Profesi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Universitas</span>
                <span className="font-semibold text-slate-800">{data.universitas ?? data.institusi ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Program Studi</span>
                <span className="font-semibold text-slate-800">{data.program_studi ?? data.jurusan ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tahun Lulus</span>
                <span className="font-semibold text-slate-800">{data.tahun_lulus ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. STR</span>
                <span className="font-semibold text-slate-800">{data.no_str ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. SIP</span>
                <span className="font-semibold text-slate-800">{data.no_sip ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jenis Nakes</span>
                <span className="font-semibold text-slate-800">{jenisNakes}</span>
              </div>
            </div>
          </div>

          {/* Berkas & Dokumen Persyaratan */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Berkas & Dokumen Persyaratan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: 'Foto STR', url: strUrl },
                { title: 'Foto SIP', url: sipUrl },
                { title: 'Foto Ijazah', url: ijazahUrl },
                { title: 'Foto SKCK', url: skckUrl },
                { title: 'Foto CV', url: cvUrl },
                { title: 'Foto KTP', url: ktpUrl },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                    <p className="text-[10px] text-slate-400">{doc.url ? 'Tersedia' : 'Belum diunggah'}</p>
                  </div>
                  {doc.url ? (
                    <a
                      href={getImageUrl(doc.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">-</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tempat Kerja & Dokumen Tambahan */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Informasi Opsional & Dokumen Tambahan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <span className="text-slate-400 block">Tempat Kerja</span>
                <span className="font-semibold text-slate-800">{data.tempat_kerja ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Lama Bekerja</span>
                <span className="font-semibold text-slate-800">{data.lama_bekerja ?? '-'}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-800">Dokumen Tambahan</p>
              {arrayDocTambahan.length > 0 ? (
                arrayDocTambahan.map((docPath, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-700 truncate max-w-[250px]">
                      Dokumen {arrayDocTambahan.length > 1 ? `#${index + 1}` : ''}
                    </p>
                    <a
                      href={getImageUrl(docPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Lihat Berkas
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">- Tidak ada dokumen -</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pelatihan */}
      {showPelatihanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold">Lanjut ke Pelatihan?</h3>
            <p className="mb-3 text-sm text-slate-500">
              Ubah status permohonan <strong>{data.nama_lengkap}</strong> ke tahap Pelatihan.
            </p>
            <div className="mb-4">
              <label className="form-label text-xs">Catatan Admin</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tulis instruksi atau jadwal..."
                className="form-input text-xs w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline px-3 py-1.5 border rounded-md" onClick={() => setShowPelatihanModal(false)}>Batal</button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700" onClick={handleConfirmPelatihan}>
                Konfirmasi Pelatihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold">Tolak Permohonan Nakes?</h3>
            <p className="mb-3 text-sm text-slate-500">
              Tolak permohonan dari <strong>{data.nama_lengkap}</strong>.
            </p>
            <div className="mb-4">
              <label className="form-label text-xs">Alasan Penolakan</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Alasan menolak..."
                className="form-input text-xs w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline px-3 py-1.5 border rounded-md" onClick={() => setShowRejectModal(false)}>Batal</button>
              <button className="btn-danger text-xs bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onClick={handleConfirmReject}>
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}