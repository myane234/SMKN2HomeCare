import { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCheck, FaEdit, FaSearch, FaSave, FaTag } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Pagination from '../../components/pagination';
import { getAllLayanan } from '../../data/layananData';
import { getAllTarif } from '../../data/masterTarifData';
import {
  getAllBhpItems,
  getMappingLayananBhp,
  syncMappingLayananBhp,
} from '../../data/mappingLayananBhpData';

const ITEMS_PER_PAGE = 10;
const formatRupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(value) || 0);
const getBhpId = (item) => Number(item.id_bhp ?? item.id ?? item.id_barang);

export default function MappingLayananBhp() {
  const [layananList, setLayananList] = useState([]);
  const [tarifList, setTarifList] = useState([]);
  const [bhpList, setBhpList] = useState([]);
  const [mappingList, setMappingList] = useState([]);
  const [selectedLayanan, setSelectedLayanan] = useState(null);
  const [selectedBhp, setSelectedBhp] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAllLayanan(), getAllTarif(), getAllBhpItems(), getMappingLayananBhp()])
      .then(([layanan, tarif, bhp, mapping]) => {
        setLayananList(layanan);
        setTarifList(tarif);
        setBhpList(bhp.filter((item) => item.is_active !== false));
        setMappingList(mapping);
      })
      .catch((err) => setError(err.message || 'Gagal memuat data layanan dan BHP.'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => layananList.map((layanan) => {
    const id = String(layanan.id);
    const mapping = mappingList.find((item) => String(item.id_layanan) === id);
    const tarif = tarifList.find((item) => String(item.id_layanan ?? item.layanan?.id_layanan) === id);
    return { layanan, mapping, tarif };
  }).filter(({ layanan }) => layanan.nama.toLowerCase().includes(search.trim().toLowerCase())), [layananList, mappingList, tarifList, search]);

  const totalPages = Math.max(Math.ceil(rows.length / ITEMS_PER_PAGE), 1);
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const selectedRow = rows.find(({ layanan }) => String(layanan.id) === String(selectedLayanan));

  useEffect(() => {
    if (!selectedRow) return;
    const initial = {};
    (selectedRow.mapping?.bhp_items || []).forEach((item) => {
      initial[getBhpId(item)] = { qty_default: Number(item.qty_default) || 1, is_mandatory: Boolean(item.is_mandatory) };
    });
    const timer = window.setTimeout(() => setSelectedBhp(initial), 0);
    return () => window.clearTimeout(timer);
  }, [selectedLayanan, selectedRow]);

  const openEditor = (id) => setSelectedLayanan(String(id));
  const closeEditor = () => { setSelectedLayanan(null); setSearch(''); };
  const toggleBhp = (item) => {
    const id = getBhpId(item);
    setSelectedBhp((current) => {
      if (current[id]) {
        const next = { ...current }; delete next[id]; return next;
      }
      return { ...current, [id]: { qty_default: 1, is_mandatory: true } };
    });
  };
  const updateBhp = (id, field, value) => setSelectedBhp((current) => ({
    ...current,
    [id]: { ...current[id], [field]: field === 'qty_default' ? Math.max(1, Number(value) || 1) : value },
  }));

  const saveMapping = async () => {
    setSaving(true);
    try {
      const items = Object.entries(selectedBhp).map(([id, value]) => ({ id_bhp: Number(id), ...value }));
      await syncMappingLayananBhp(selectedLayanan, items);
      setMappingList((current) => current.map((item) => String(item.id_layanan) === String(selectedLayanan) ? {
        ...item,
        bhp_items: items.map((entry) => ({ ...entry, ...bhpList.find((bhp) => getBhpId(bhp) === entry.id_bhp) })),
      } : item));
      Swal.fire({ icon: 'success', title: 'Mapping tersimpan', text: `BHP ${selectedRow?.layanan.nama} berhasil diperbarui.`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan', text: err.message || 'Mapping BHP gagal disimpan.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Memuat mapping layanan...</div>;

  if (selectedLayanan && selectedRow) {
    return (
      <div className="w-full space-y-6 pb-10">
        <button type="button" onClick={closeEditor} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><FaArrowLeft /> Kembali ke daftar mapping</button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Template mapping layanan</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">{selectedRow.layanan.nama}</h1><p className="mt-1 text-sm text-slate-500">Tarif {formatRupiah(selectedRow.layanan.harga)} · {selectedRow.tarif?.nama_template || 'Belum ada template tarif'}</p></div>
          <button type="button" onClick={saveMapping} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><FaSave /> {saving ? 'Menyimpan...' : 'Simpan Mapping'}</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Barang BHP untuk layanan</h2><p className="mt-1 text-xs text-slate-500">{Object.keys(selectedBhp).length} barang dipilih</p></div><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari barang..." className="w-full bg-transparent outline-none sm:w-48" /></div></div>
          <div className="divide-y divide-slate-100">{bhpList.filter((item) => item.nama_bhp.toLowerCase().includes(search.trim().toLowerCase())).map((item) => { const id = getBhpId(item); const value = selectedBhp[id]; return <div key={id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${value ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}><button type="button" onClick={() => toggleBhp(item)} aria-pressed={Boolean(value)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${value ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-transparent'}`}><FaCheck className="text-xs" /></button><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{item.nama_bhp}</p><p className="text-xs text-slate-500">{item.tipe_bhp || 'satuan'} · {formatRupiah(item.harga_jual)}</p></div>{value && <div className="flex items-center gap-3"><label className="text-xs text-slate-500">Qty <input type="number" min="1" value={value.qty_default} onChange={(event) => updateBhp(id, 'qty_default', event.target.value)} className="ml-1 w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center font-semibold" /></label><label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={value.is_mandatory} onChange={(event) => updateBhp(id, 'is_mandatory', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Wajib</label></div>}</div>; })}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Master data</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Mapping Tarif &amp; BHP Layanan</h1><p className="mt-1 text-sm text-slate-500">Setiap layanan memiliki template mapping barang BHP sendiri.</p></div>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"><FaSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama layanan..." className="w-full bg-transparent outline-none" /></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-4 text-center">No.</th><th className="px-5 py-4">Layanan</th><th className="px-5 py-4">Template Tarif</th><th className="px-5 py-4 text-right">Tarif Dasar</th><th className="px-5 py-4 text-center">Barang BHP</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{paginatedRows.length === 0 ? <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-500">Layanan tidak ditemukan.</td></tr> : paginatedRows.map(({ layanan, mapping, tarif }, index) => <tr key={layanan.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-center text-slate-500">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{layanan.nama}</p><p className="text-xs text-slate-400">ID layanan #{layanan.id}</p></td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-slate-700"><FaTag className="text-emerald-500" /> {tarif?.nama_template || 'Belum diatur'}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-800">{formatRupiah(layanan.harga)}</td><td className="px-5 py-4 text-center font-semibold text-slate-700">{mapping?.bhp_items?.length || 0} barang</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapping ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{mapping ? 'Sudah dipetakan' : 'Belum dipetakan'}</span></td><td className="px-5 py-4 text-center"><button type="button" onClick={() => openEditor(layanan.id)} title="Edit mapping layanan" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FaEdit /> Atur BHP</button></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-5 py-1"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div></div>
    </div>
  );
}
