import { useEffect, useState } from 'react';
import { FaEdit, FaSave, FaTruck } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  createTarifTransport,
  getAllTarifTransport,
  getTarifId,
  updateTarifTransport,
} from '../../data/masterTarifTransportData';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const formatUser = (userVal) => {
  if (userVal === null || userVal === undefined || userVal === '') return '-';
  if (typeof userVal === 'object') {
    return userVal.name || userVal.nama || userVal.username || userVal.email || userVal.id || '-';
  }
  return String(userVal);
};

export default function AdminMasterTarifTransport() {
  const [tarif, setTarif] = useState(null);
  const [formTarif, setFormTarif] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAllTarifTransport();
      const data = Array.isArray(response) ? response[0] : response;
      setTarif(data || null);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error.message || 'Gagal memuat tarif transport nasional');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (value) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

  const formatNumber = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    return Number(String(value).replace(/[^0-9]/g, '') || 0).toLocaleString('id-ID');
  };

  const parseNumber = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;

  const openForm = () => {
    setFormTarif(tarif?.tarif_per_10_km ? String(Math.round(Number(tarif.tarif_per_10_km))) : '');
    setViewMode('edit');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const tarifPer10Km = parseNumber(formTarif);

    setIsSubmitting(true);
    try {
      const payload = { tarif_per_10_km: tarifPer10Km };
      const id = getTarifId(tarif);

      if (id === null) {
        await createTarifTransport(payload);
      } else {
        await updateTarifTransport(id, payload);
      }

      await fetchData();
      setViewMode('list');
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Tarif transport nasional berhasil disimpan.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire('Gagal', error.message || 'Gagal menyimpan tarif transport nasional.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewMode === 'edit') {
    return (
      <div className="w-full space-y-6 pb-10">
        <div>
          <button type="button" onClick={() => setViewMode('list')} className="text-sm font-medium text-slate-500 hover:text-slate-800">
            Kembali ke Tarif Transport Nasional
          </button>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Edit Tarif Transport Nasional</h1>
          <p className="mt-1 text-sm text-slate-500">Nilai ini berlaku untuk seluruh kota dan kabupaten.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="tarif-per-10-km" className="mb-2 block text-sm font-semibold text-slate-700">
              Tarif setiap 10 km <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
              <input
                id="tarif-per-10-km"
                type="text"
                inputMode="numeric"
                required
                value={formatNumber(formTarif)}
                onChange={(event) => setFormTarif(event.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                placeholder="20.000"
              />
            </div>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50/70 p-4 text-sm text-green-800">
            <p className="font-semibold">Preview tier transport</p>
            <p className="mt-2">0-10 km: {formatRupiah(parseNumber(formTarif))}</p>
            <p>11-20 km: {formatRupiah(parseNumber(formTarif) * 2)}</p>
            <p>21-30 km: {formatRupiah(parseNumber(formTarif) * 3)}</p>
            <p>31-40 km: {formatRupiah(parseNumber(formTarif) * 4)}</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setViewMode('list')} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60">
              <FaSave />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tarif'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tarif Transport Nasional</h1>
          <p className="mt-1 text-sm text-slate-500">Satu tarif acuan untuk seluruh kota dan kabupaten.</p>
        </div>
        <button type="button" onClick={openForm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700">
          <FaEdit />
          {tarif ? 'Edit Tarif' : 'Atur Tarif'}
        </button>
      </div>

      {errorMsg && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</div>}

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Memuat tarif transport nasional...</p>
        ) : (
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-green-50 p-3 text-green-600"><FaTruck /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Tarif per 10 km</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{formatRupiah(tarif?.tarif_per_10_km)}</p>
              <p className="mt-2 text-sm text-slate-500">Berlaku nasional, tanpa pengaturan tarif per kota.</p>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div>Created At: <span className="font-medium text-slate-700">{formatDate(tarif?.created_at ?? tarif?.createdAt)}</span></div>
                <div>Created By: <span className="font-medium text-slate-700">{formatUser(tarif?.created_by ?? tarif?.created_by_user ?? tarif?.createdBy)}</span></div>
                <div>Updated At: <span className="font-medium text-slate-700">{formatDate(tarif?.updated_at)}</span></div>
                <div>Updated By: <span className="font-medium text-slate-700">{formatUser(tarif?.updated_by ?? tarif?.updated_by_user)}</span></div>
                <div>Deleted At: <span className="font-medium text-slate-700">{formatDate(tarif?.deleted_at)}</span></div>
                <div>Deleted By: <span className="font-medium text-slate-700">{formatUser(tarif?.deleted_by ?? tarif?.deleted_by_user)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
