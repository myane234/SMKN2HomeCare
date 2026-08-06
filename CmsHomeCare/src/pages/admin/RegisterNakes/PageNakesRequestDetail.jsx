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

// Fix Icon Leaflet default di React
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

  // Parse Koordinat
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans">
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
          <div className="card p-5 text-center bg-white rounded-xl shadow-xs border border-slate-200">
            {data.foto_profile || data.foto_ktp ? (
              <img
                src={getImageUrl(data.foto_profile || data.foto_ktp)}
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
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">{data.kategori_layanan ?? data.jenis_tenaga_medis ?? '-'}</p>

            <div className="mt-4 flex justify-center">{renderStatusBadge(data.status)}</div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-left space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Email Terdaftar</span>
                <span className="font-semibold text-slate-800">{data.email ?? data.user?.email ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">No. Hp</span>
                <span className="font-semibold text-slate-800">{data.no_hp ?? data.no_telp ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Wilayah Operasional</span>
                <span className="inline-block mt-1 rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-700 border border-sky-200">
                  {data.wilayah_operasional ?? '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Leaflet Map Integration */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
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
                    className="text-emerald-600 font-semibold hover:underline"
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
                  {data.tempat_lahir ?? '-'}, {formatDate(data.tanggal_lahir)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Agama</span>
                <span className="font-semibold text-slate-800">{data.agama ?? '-'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Alamat Lengkap</span>
                <span className="font-semibold text-slate-800">{data.alamat_lengkap ?? '-'}</span>
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
                <span className="font-semibold text-slate-800">{data.universitas ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Program Studi</span>
                <span className="font-semibold text-slate-800">{data.program_studi ?? '-'}</span>
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
                <span className="text-slate-400 block">Kategori Layanan</span>
                <span className="font-semibold text-slate-800">{data.kategori_layanan ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Berkas & Dokumen Persyaratan */}
          <div className="card p-5 bg-white rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              Berkas & Dokumen Persyaratan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Foto STR', field: 'photo_str' },
                { title: 'Foto SIP', field: 'photo_sip' },
                { title: 'Foto Ijazah', field: 'photo_ijazah' },
                { title: 'Foto SKCK', field: 'photo_skck' },
                { title: 'Foto CV', field: 'photo_cv' },
                { title: 'Foto KTP', field: 'photo_ktp' },
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

          {/* Opsional: Tempat Kerja, Lama Bekerja & Dokumen Tambahan */}
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

            {data.dokumen_tambahan && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Dokumen Tambahan</p>
                  <p className="text-[10px] text-slate-400">Tersedia</p>
                </div>
                <a
                  href={getImageUrl(data.dokumen_tambahan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm text-xs py-1 px-2.5 bg-white"
                >
                  Lihat Berkas
                </a>
              </div>
            )}
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