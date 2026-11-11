import { useEffect, useState } from 'react';
import { FaEdit, FaSave, FaTruck, FaRoute, FaInfoCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import MasterDataExcelAction from '../../components/MasterDataExcelAction.jsx';
import {
  createTarifTransport,
  getAllTarifTransport,
  getTarifId,
  updateTarifTransport,
} from '../../data/masterTarifTransportData';

const TIERS = [
  { range: '0-10 km', mult: 1 },
  { range: '11-20 km', mult: 2 },
  { range: '21-30 km', mult: 3 },
  { range: '31-40 km', mult: 4 },
];

const formatTanggalWaktu = (value, short = false) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(
    'id-ID',
    short
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : undefined
  );
};

function MetaItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function TierCard({ range, value, index }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-green-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
          <FaRoute className="shrink-0" />
          {range}
        </span>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
          ×{index + 1}
        </span>
      </div>
      <p className="mt-4 break-words text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

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

  const createdBy =
    tarif?.created_by && Number.isNaN(Number(tarif.created_by))
      ? tarif.created_by
      : (tarif?.created_by || tarif?.created_by_name || tarif?.creator || '—');

  /* ── Mode edit ── */
  if (viewMode === 'edit') {
    const base = parseNumber(formTarif);

    return (
      <div className="flex min-h-[calc(100vh-8rem)] w-full min-w-0 flex-col space-y-5 pb-10 sm:space-y-6">
        <div>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Kembali ke Tarif Transport Nasional
          </button>
          <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">Edit Tarif Transport Nasional</h1>
          <p className="mt-1 text-sm text-slate-500">Nilai ini berlaku untuk seluruh kota dan kabupaten.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid w-full flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6"
        >
          {/* Form */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
            <div className="flex-1">
              <label htmlFor="tarif-per-10-km" className="mb-3 block text-sm font-semibold text-slate-700">
                Tarif setiap 10 km <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">Rp</span>
                <input
                  id="tarif-per-10-km"
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatNumber(formTarif)}
                  onChange={(event) => setFormTarif(event.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 text-xl font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:text-2xl"
                  placeholder="20.000"
                />
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800">
                <FaInfoCircle className="mt-0.5 shrink-0" />
                <p>
                  Tarif ini dikalikan sesuai tier jarak dan berlaku untuk semua kota dan kabupaten.
                  Pratinjau di samping akan ikut berubah saat nominal diketik.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 sm:w-auto"
              >
                <FaSave />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tarif'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col rounded-2xl border border-green-100 bg-green-50/60 p-4 sm:p-8">
            <p className="text-sm font-semibold text-green-800">Preview tier transport</p>
            <div className="mt-4 grid flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:auto-rows-fr">
              {TIERS.map((t, i) => (
                <TierCard key={t.range} range={t.range} value={formatRupiah(base * t.mult)} index={i} />
              ))}
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ── Mode list ── */
  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full min-w-0 flex-col space-y-5 pb-10 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Tarif Transport Nasional</h1>
          <p className="mt-1 text-sm text-slate-500">Satu tarif acuan untuk seluruh kota dan kabupaten.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MasterDataExcelAction type="tarif-transport" onSuccess={fetchData} />
          <button
            type="button"
            onClick={openForm}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 sm:w-auto"
          >
            <FaEdit />
            {tarif ? 'Edit Tarif' : 'Atur Tarif'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</div>
      )}

      {loading ? (
        <div className="flex w-full flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Memuat tarif transport nasional...</p>
        </div>
      ) : (
        <>
          {/* Hero tarif */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="shrink-0 rounded-2xl bg-white/20 p-4 text-2xl">
                  <FaTruck />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-50">Tarif per 10 km</p>
                  <p className="mt-1 break-words text-3xl font-bold sm:text-4xl lg:text-5xl">
                    {formatRupiah(tarif?.tarif_per_10_km)}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm text-green-50 sm:text-right">
                Berlaku nasional, tanpa pengaturan tarif per kota. Tarif tiap tier jarak dihitung dari nilai ini.
              </p>
            </div>
          </div>

          {/* Tier */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Rincian tarif per tier jarak</p>
            <div className="grid w-full grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 lg:gap-4">
              {TIERS.map((t, i) => (
                <TierCard
                  key={t.range}
                  range={t.range}
                  value={formatRupiah((Number(tarif?.tarif_per_10_km) || 0) * t.mult)}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Info data */}
          <div className="w-full flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <p className="mb-4 text-sm font-semibold text-slate-700">Informasi data</p>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <MetaItem label="Created At" value={formatTanggalWaktu(tarif?.created_at, true)} />
              <MetaItem label="Created By" value={createdBy} />
              <MetaItem label="Updated At" value={formatTanggalWaktu(tarif?.updated_at)} />
              <MetaItem label="Updated By" value={tarif?.updated_by ?? '—'} />
              <MetaItem label="Deleted At" value={formatTanggalWaktu(tarif?.deleted_at)} />
              <MetaItem label="Deleted By" value={tarif?.deleted_by ?? '—'} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}