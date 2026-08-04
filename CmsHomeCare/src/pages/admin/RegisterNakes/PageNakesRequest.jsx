import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllNakesRequests,
  approveNakesRequest,
  pelatihanNakesRequest,
  rejectNakesRequest,
} from '../../../data/nakesRequestData';
import { getImageUrl } from '../../../data/imageHelper';

export default function PageNakesRequest() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wilayahFilter, setWilayahFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [pelatihanTarget, setPelatihanTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  function loadData() {
    setLoading(true);
    setErrorMsg('');
    getAllNakesRequests()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setRequests(list);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data permohonan nakes');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, wilayahFilter]);

  const listWilayah = Array.from(
    new Map(
      requests
        .filter((item) => item.id_wilayah_layanan || item.wilayah_layanan)
        .map((item) => {
          const id = item.id_wilayah_layanan || item.wilayah_layanan?.id_wilayah_layanan;
          const nama = item.wilayah_layanan?.nama_wilayah || `Wilayah #${id}`;
          return [id, { id, nama }];
        })
    ).values()
  );

  const filtered = requests.filter((item) => {
    const query = search.toLowerCase();
    const nama = String(
      item.nama_lengkap ?? item.nama ?? item.user?.name ?? ''
    ).toLowerCase();
    const email = String(item.user?.email ?? '').toLowerCase();
    const profesi = String(
      item.jenis_tenaga_medis ?? item.spesialisasi ?? item.peran ?? ''
    ).toLowerCase();
    const nik = String(item.nik ?? '').toLowerCase();
    const noStr = String(item.no_str ?? item.str ?? '').toLowerCase();
    const status = String(item.status ?? 'pending').toLowerCase();
    const idWilayah = String(item.id_wilayah_layanan ?? item.wilayah_layanan?.id_wilayah_layanan ?? '');

    if (wilayahFilter !== 'all' && idWilayah !== wilayahFilter) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && status !== 'pending' && status !== '') return false;
      if (statusFilter === 'pelatihan' && status !== 'pelatihan') return false;
      if (statusFilter === 'approved' && status !== 'approved') return false;
      if (statusFilter === 'rejected' && status !== 'rejected') return false;
    }

    return (
      nama.includes(query) ||
      email.includes(query) ||
      profesi.includes(query) ||
      nik.includes(query) ||
      noStr.includes(query) ||
      status.includes(query)
    );
  });

  const totalPages = Math.max(Math.ceil(filtered.length / itemsPerPage), 1);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function handleConfirmPelatihan() {
    if (!pelatihanTarget) return;
    const targetId = pelatihanTarget.id_tenaga_medis ?? pelatihanTarget.id ?? pelatihanTarget.id_nakes_request;
    setProcessing(true);
    try {
      await pelatihanNakesRequest(targetId, adminNotes);
      setPelatihanTarget(null);
      setAdminNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status ke pelatihan');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmApprove() {
    if (!approveTarget) return;
    const targetId = approveTarget.id_tenaga_medis ?? approveTarget.id ?? approveTarget.id_nakes_request;
    setProcessing(true);
    try {
      await approveNakesRequest(targetId);
      setApproveTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyetujui & membuat akun nakes');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;
    const targetId = rejectTarget.id_tenaga_medis ?? rejectTarget.id ?? rejectTarget.id_nakes_request;
    setProcessing(true);
    try {
      await rejectNakesRequest(targetId, adminNotes);
      setRejectTarget(null);
      setAdminNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menolak permohonan');
    } finally {
      setProcessing(false);
    }
  }

  function renderStatusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
          Sudah Disetujui
        </span>
      );
    }
    if (s === 'pelatihan') {
      return (
        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Menunggu Pelatihan
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
          Ditolak
        </span>
      );
    }
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Menunggu Verifikasi
      </span>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Request Registrasi Nakes</h1>
          <p className="page-subtitle">
            Kelola verifikasi bertahap dan aktivasi akun tenaga kesehatan baru
          </p>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Cari nama, email, NIK, No STR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full sm:w-[280px]"
          />

          <select
            value={wilayahFilter}
            onChange={(e) => setWilayahFilter(e.target.value)}
            className="form-input w-full sm:w-[200px] bg-white cursor-pointer"
          >
            <option value="all">Semua Wilayah</option>
            {listWilayah.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons Filter Status */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('pelatihan')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'pelatihan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Sedang Pelatihan
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Sudah Disetujui
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {/* Table Card */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Tidak ada permohonan nakes ditemukan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr>
                  <th className="w-12 border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">No.</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Foto</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nama & Email</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">NIK</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">No. STR</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Jenis Nakes</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Lulusan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => {
                  const reqId = item.id_tenaga_medis ?? item.id ?? item.id_nakes_request;
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const nama = item.nama_lengkap ?? item.nama ?? item.user?.name ?? '-';
                  const email = item.user?.email ?? '-';
                  const foto = item.foto_profile ?? item.foto ?? item.avatar;
                  const profesi = item.jenis_tenaga_medis ?? item.spesialisasi ?? item.peran ?? '-';
                  
                  const isPending = !item.status || item.status === 'pending';
                  const isPelatihan = item.status === 'pelatihan';

                  return (
                    <tr key={reqId || index} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-500">
                        {itemNumber}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {foto ? (
                          <img
                            src={getImageUrl(foto)}
                            alt={nama}
                            onClick={() => setPreviewImage(getImageUrl(foto))}
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover cursor-pointer hover:scale-105 transition-transform"
                            title="Klik untuk memperbesar"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-100 text-xs font-bold text-slate-400">
                            {nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="font-medium text-slate-900">{nama}</div>
                        <div className="text-xs text-slate-400">{email}</div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {item.nik ?? '-'}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {item.no_str ?? item.str ?? '-'}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <span className="badge badge-aktif">{profesi}</span>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {item.lulusan ?? '-'}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex justify-end gap-1.5">
                          {/* 🟢 Redirect Ke Halaman Detail Baru */}
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => navigate(`/nakes-request/${reqId}`, { state: { requestData: item } })}
                          >
                            Detail
                          </button>

                          {isPending && (
                            <>
                              <button
                                className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                                onClick={() => {
                                  setPelatihanTarget(item);
                                  setAdminNotes('');
                                }}
                              >
                                Setujui Pelatihan
                              </button>
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => {
                                  setRejectTarget(item);
                                  setAdminNotes('');
                                }}
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {isPelatihan && (
                            <>
                              <button
                                className="btn-primary btn-sm"
                                onClick={() => setApproveTarget(item)}
                              >
                                Setujui
                              </button>
                              <button
                                className="btn-danger btn-sm"
                                onClick={() => {
                                  setRejectTarget(item);
                                  setAdminNotes('');
                                }}
                              >
                                Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                  </span>{' '}
                  sampai{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * itemsPerPage, filtered.length)}
                  </span>{' '}
                  dari <span className="font-medium">{filtered.length}</span> data
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center border px-3 py-1.5 text-sm font-semibold ${
                          isCurrent
                            ? 'z-10 border-primary bg-primary text-white'
                            : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Selanjutnya
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Foto */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] p-2 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white font-bold text-sm"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Foto Profil"
              className="max-h-[75vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Modal Steps */}
      {pelatihanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5" onClick={() => !processing && setPelatihanTarget(null)}>
          <div className="w-full max-w-[420px] rounded-card bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2.5 text-lg font-bold">Setujui untuk Pelatihan?</h3>
            <p className="mb-3 text-sm text-slate-500">
              Menyetujui pendaftaran awal nakes <strong>{pelatihanTarget.nama_lengkap ?? '-'}</strong> ke Pelatihan.
            </p>
            <div className="mb-5">
              <label className="form-label">Catatan Pelatihan (Opsional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tuliskan jadwal atau catatan..."
                className="form-input resize-y"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button className="btn-outline" onClick={() => setPelatihanTarget(null)} disabled={processing}>Batal</button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" onClick={handleConfirmPelatihan} disabled={processing}>
                {processing ? 'Memproses...' : 'Setujui & Lanjut Pelatihan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5" onClick={() => !processing && setApproveTarget(null)}>
          <div className="w-full max-w-[420px] rounded-card bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2.5 text-lg font-bold">Setujui & Buat Akun Nakes?</h3>
            <p className="mb-5 text-sm text-slate-500">
              Setujui untuk mengaktifkan akun nakes <strong>{approveTarget.nama_lengkap ?? '-'}</strong> secara resmi.
            </p>
            <div className="flex justify-end gap-2.5">
              <button className="btn-outline" onClick={() => setApproveTarget(null)} disabled={processing}>Batal</button>
              <button className="btn-primary" onClick={handleConfirmApprove} disabled={processing}>
                {processing ? 'Memproses...' : 'Ya, Setujui & Buat Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5" onClick={() => !processing && setRejectTarget(null)}>
          <div className="w-full max-w-[420px] rounded-card bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2.5 text-lg font-bold">Tolak Permohonan Nakes?</h3>
            <p className="mb-3 text-sm text-slate-500">
              Menolak permohonan pendaftaran dari <strong>{rejectTarget.nama_lengkap ?? '-'}</strong>.
            </p>
            <div className="mb-5">
              <label className="form-label">Catatan Admin (Alasan)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tuliskan alasan penolakan..."
                className="form-input resize-y"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button className="btn-outline" onClick={() => setRejectTarget(null)} disabled={processing}>Batal</button>
              <button className="btn-danger" onClick={handleConfirmReject} disabled={processing}>
                {processing ? 'Memproses...' : 'Tolak Permohonan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}