import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  getAllNakesRequests,
  approveNakesRequest,
  pelatihanNakesRequest,
  rejectNakesRequest,
} from '../../../data/nakesRequestData';
import { getImageUrl } from '../../../data/imageHelper';

// Fix Icon Leaflet default di React (karena webpack/vite sering menghapus path icon default)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

  // Handler Actions
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
      return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Sudah Disetujui</span>;
    }
    if (s === 'pelatihan') {
      return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Menunggu Pelatihan</span>;
    }
    if (s === 'rejected') {
      return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Ditolak</span>;
    }
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Menunggu Verifikasi</span>;
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Memuat detail permohonan...</div>;
  if (errorMsg) return <div className="p-10 text-center text-sm text-red-500">{errorMsg}</div>;
  if (!data) return null;

  const isPending = !data.status || data.status === 'pending';
  const isPelatihan = data.status === 'pelatihan';

  // Parse Koordinat (Pastikan dalam bentuk Number)
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline btn-sm flex items-center gap-1.5"
          >
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-slate-900">Detail Permohonan Registrasi</h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
  {/* TAHAP 1: Masih Pending -> Cuma bisa lanjut ke Pelatihan atau Tolak */}
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
        className="btn-danger btn-sm px-3 py-2 text-xs"
      >
        Tolak
      </button>
    </>
  )}

  {/* TAHAP 2: Sudah Pelatihan -> Baru muncul tombol Final Aktivasi Akun */}
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
        className="btn-danger btn-sm px-3 py-2 text-xs"
      >
        Tolak
      </button>
    </>
  )}
</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="card p-5 text-center">
            {data.foto_profile ? (
              <img
                src={getImageUrl(data.foto_profile)}
                alt={data.nama_lengkap}
                className="mx-auto h-32 w-32 rounded-full border-4 border-slate-100 object-cover shadow-md mb-3"
              />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-4xl font-bold text-slate-400 mb-3">
                {(data.nama_lengkap || 'N').charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="text-lg font-bold text-slate-900">{data.nama_lengkap ?? '-'}</h2>
            <p className="text-xs font-semibold text-primary mt-0.5">{data.jenis_tenaga_medis ?? '-'}</p>

            <div className="mt-4 flex justify-center">{renderStatusBadge(data.status)}</div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-left space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Email Terdaftar</span>
                <span className="font-semibold text-slate-800">{data.user?.email ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. Telepon</span>
                <span className="font-semibold text-slate-800">{data.no_telp ?? '-'}</span>
              </div>
              <div> <span className="text-slate-400 block">Wilayah Layanan</span> <span className="inline-block mt-1 rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 border border-sky-200"> DKI Jakarta </span> </div>   
            </div>
          </div>

          {/* 📍 LEAFLET MAP INTEGRATION */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Lokasi Domisili (Peta)
            </h3>
            {hasValidCoords ? (
              <div className="space-y-3">
                <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 z-0">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <div className="text-xs font-sans">
                          <strong>{data.nama_lengkap}</strong><br />
                          {data.alamat_lengkap}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</span>
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    Buka Google Maps ↗
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Koordinat lokasi tidak valid / belum diatur.</p>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pribadi */}
          <div className="card p-5">
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
                  {data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tempat & Tanggal Lahir</span>
                <span className="font-semibold text-slate-800">
                  {data.tempat_lahir ?? '-'}, {formatDate(data.tanggal_lahir)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Alamat Lengkap</span>
                <span className="font-semibold text-slate-800">{data.alamat_lengkap ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Legalitas */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Legalitas & Lisensi Profesi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">No. STR</span>
                <span className="font-semibold text-slate-800">{data.no_str ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. SIP</span>
                <span className="font-semibold text-slate-800">{data.no_sip ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. NPWP</span>
                <span className="font-semibold text-slate-800">{data.no_npwp ?? '-'}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-400 block">Lulusan Institusi</span>
                <span className="font-semibold text-slate-800">{data.lulusan ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Lampiran Dokumen */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Berkas & Dokumen Persyaratan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Ijazah Terakhir', field: 'ijazah' },
                { title: 'Sertifikat Kompetensi', field: 'sertifikat' },
                { title: 'Curriculum Vitae (CV)', field: 'file_cv' },
                { title: 'SKCK', field: 'file_skck' },
                { title: 'Surat Tanda Registrasi (STR)', field: 'file_str' },
                { title: 'Surat Izin Praktik (SIP)', field: 'file_sip' },
              ].map((doc) => {
                const url = data[doc.field];
                return (
                  <div key={doc.field} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{url ? 'Tersedia' : 'Belum diunggah'}</p>
                    </div>
                    {url && (
                      <a
                        href={getImageUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline btn-sm text-xs py-1 px-2.5 bg-white"
                      >
                        Lihat Berkas
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riwayat Kerja & Seminar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">
                Pengalaman Kerja
              </h3>
              <div className="space-y-3 text-xs">
                {Array.isArray(data.pengalaman_kerja) && data.pengalaman_kerja.length > 0 ? (
                  data.pengalaman_kerja.map((exp, idx) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0 pb-2">
                      <p className="font-bold text-slate-800">{exp.posisi} - {exp.instansi}</p>
                      <p className="text-[10px] text-slate-400">{exp.tahun_mulai} - {exp.tahun_selesai}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Tidak ada data.</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">
                Seminar & Pelatihan
              </h3>
              <div className="space-y-3 text-xs">
                {Array.isArray(data.seminar_pelatihan) && data.seminar_pelatihan.length > 0 ? (
                  data.seminar_pelatihan.map((sem, idx) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0 pb-2">
                      <p className="font-bold text-slate-800">{sem.nama_pelatihan}</p>
                      <p className="text-[10px] text-slate-500">{sem.penyelenggara} ({sem.tahun})</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Tidak ada data.</p>
                )}
              </div>
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
                className="form-input text-xs"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setShowPelatihanModal(false)}>Batal</button>
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
                className="form-input text-xs"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setShowRejectModal(false)}>Batal</button>
              <button className="btn-danger text-xs" onClick={handleConfirmReject}>
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}