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
    const filteredBhp = bhpList.filter((item) =>
      item.nama_bhp.toLowerCase().includes(search.trim().toLowerCase())
    );

    const selectedBhpItems = Object.entries(selectedBhp).map(([id, val]) => {
      const bhpInfo = bhpList.find((bhp) => String(getBhpId(bhp)) === String(id));
      return {
        id: Number(id),
        nama_bhp: bhpInfo?.nama_bhp || 'Barang Tidak Dikenal',
        harga_jual: bhpInfo?.harga_jual || 0,
        ...val
      };
    });

    const totalEstimatedPrice = selectedBhpItems.reduce((acc, curr) => acc + (curr.harga_jual * curr.qty_default), 0);

    return (
      <div className="w-full space-y-6 pb-10">
        <button type="button" onClick={closeEditor} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <FaArrowLeft /> Kembali ke daftar mapping
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Template mapping layanan</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{selectedRow.layanan.nama}</h1>
            <p className="mt-1 text-sm text-slate-500">Tarif {formatRupiah(selectedRow.layanan.harga)} · {selectedRow.tarif?.nama_template || 'Belum ada template tarif'}</p>
          </div>
          <button type="button" onClick={saveMapping} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Mapping'}
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Available BHP */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Pilih Barang BHP</h2>
              <p className="text-xs text-slate-500 mb-3">Klik barang untuk menambahkan ke layanan</p>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <FaSearch />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari barang..." className="w-full bg-transparent outline-none" />
              </div>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredBhp.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Tidak ada barang ditemukan</div>
              ) : (
                filteredBhp.map((item) => {
                  const id = getBhpId(item);
                  const isSelected = Boolean(selectedBhp[id]);
                  return (
                    <div key={id} onClick={() => toggleBhp(item)} className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}>
                      <button type="button" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <FaCheck className="text-[10px]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-800 truncate">{item.nama_bhp}</p>
                        <p className="text-xs text-slate-500">{formatRupiah(item.harga_jual)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Mappings */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">BHP Terpilih ({selectedBhpItems.length})</h2>
                <p className="text-xs text-slate-500">Sesuaikan jumlah & sifat wajib barang</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Estimasi Total BHP:</span>
                <p className="text-base font-bold text-emerald-600">{formatRupiah(totalEstimatedPrice)}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 bg-slate-50/30">
              {selectedBhpItems.length === 0 ? (
                <div className="p-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center h-full">
                  <span className="text-4xl mb-2">📦</span>
                  <p className="font-medium text-slate-500">Belum ada barang yang dipilih</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Pilih barang di panel kiri untuk mulai memetakan BHP untuk layanan ini.</p>
                </div>
              ) : (
                selectedBhpItems.map((item) => {
                  return (
                    <div key={item.id} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-800">{item.nama_bhp}</p>
                        <p className="text-xs text-slate-500">{formatRupiah(item.harga_jual)} / pcs · Subtotal: <span className="font-medium text-slate-700">{formatRupiah(item.harga_jual * item.qty_default)}</span></p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Jumlah:</span>
                          <input type="number" min="1" value={item.qty_default} onChange={(event) => updateBhp(item.id, 'qty_default', event.target.value)} className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-semibold text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={item.is_mandatory} onChange={(event) => updateBhp(item.id, 'is_mandatory', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                          <span>Wajib</span>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Master data</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mapping BHP Layanan</h1>
        <p className="mt-1 text-sm text-slate-500">Hubungkan dan petakan kebutuhan barang habis pakai (BHP) ke masing-masing layanan.</p>
      </div>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"><FaSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama layanan..." className="w-full bg-transparent outline-none" /></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-4 text-center">No.</th><th className="px-5 py-4">Layanan</th><th className="px-5 py-4">Template Tarif</th><th className="px-5 py-4 text-right">Tarif Dasar</th><th className="px-5 py-4 text-center">Barang BHP</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{paginatedRows.length === 0 ? <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-500">Layanan tidak ditemukan.</td></tr> : paginatedRows.map(({ layanan, mapping, tarif }, index) => <tr key={layanan.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-center text-slate-500">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{layanan.nama}</p><p className="text-xs text-slate-400">ID layanan #{layanan.id}</p></td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-slate-700"><FaTag className="text-emerald-500" /> {tarif?.nama_template || 'Belum diatur'}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-800">{formatRupiah(layanan.harga)}</td><td className="px-5 py-4 text-center font-semibold text-slate-700">{mapping?.bhp_items?.length || 0} barang</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapping ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{mapping ? 'Sudah dipetakan' : 'Belum dipetakan'}</span></td><td className="px-5 py-4 text-center"><button type="button" onClick={() => openEditor(layanan.id)} title="Edit mapping layanan" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FaEdit /> Atur BHP</button></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-5 py-1"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div></div>
    </div>
  );
}
