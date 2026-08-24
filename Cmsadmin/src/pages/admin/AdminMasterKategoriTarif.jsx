import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Pagination from '../../components/pagination';
import {
  createKategoriTarif,
  deleteKategoriTarif,
  getKategoriTarif,
  updateKategoriTarif,
} from '../../data/masterKategoriTarifData';

const ITEMS_PER_PAGE = 10;
const formatRupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(value) || 0);

export default function AdminMasterKategoriTarif() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [additionalCost, setAdditionalCost] = useState('0');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      setItems(await getKategoriTarif());
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat kategori tarif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { fetchItems(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => items.filter((item) => (
    (item.nama_kategori || '').toLowerCase().includes(search.trim().toLowerCase())
  )), [items, search]);
  const totalPages = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
  const pageItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openCreate = () => {
    setSelected(null); setName(''); setAdditionalCost('0'); setModalOpen(true);
  };
  const openEdit = (item) => {
    setSelected(item); setName(item.nama_kategori || ''); setAdditionalCost(String(item.biaya_tambahan ?? 0)); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setSelected(null); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cost = Number(additionalCost);
    if (!name.trim() || !Number.isFinite(cost) || cost < 0) return;
    setSaving(true);
    try {
      const payload = { nama_kategori: name.trim(), biaya_tambahan: cost };
      if (selected) await updateKategoriTarif(selected.id_kategori_tarif, payload);
      else await createKategoriTarif(payload);
      closeModal();
      await fetchItems();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori tarif berhasil disimpan.', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Kategori tarif gagal disimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'Hapus kategori tarif?',
      text: `Kategori ${item.nama_kategori} akan dihapus.`, showCancelButton: true,
      confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteKategoriTarif(item.id_kategori_tarif);
      await fetchItems();
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Kategori tarif berhasil dihapus.', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Kategori tarif tidak dapat dihapus.' });
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Master data</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kategori Master Tarif</h1><p className="mt-1 text-sm text-slate-500">Atur nama kategori dan biaya tambahan untuk setiap skema tarif.</p></div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><FaPlus /> Tambah Kategori</button>
      </div>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"><FaSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama kategori..." className="w-full bg-transparent outline-none" /></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-4 text-center">No.</th><th className="px-5 py-4">Nama Kategori</th><th className="px-5 py-4 text-right">Biaya Tambahan</th><th className="px-5 py-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">Memuat data kategori tarif...</td></tr> : pageItems.length === 0 ? <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">Kategori tarif tidak ditemukan.</td></tr> : pageItems.map((item, index) => <tr key={item.id_kategori_tarif} className="hover:bg-slate-50"><td className="px-5 py-4 text-center text-slate-500">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.nama_kategori}</p>{item.is_default && <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Default</span>}</td><td className="px-5 py-4 text-right font-semibold text-slate-800">{formatRupiah(item.biaya_tambahan)}</td><td className="px-5 py-4"><div className="flex justify-center gap-2"><button type="button" onClick={() => openEdit(item)} title="Edit kategori" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><FaEdit /></button><button type="button" onClick={() => handleDelete(item)} title="Hapus kategori" className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"><FaTrash /></button></div></td></tr>)}</tbody></table></div>
        {!loading && filteredItems.length > 0 && <div className="border-t border-slate-100 px-5 py-1"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
      </div>
      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold text-slate-900">{selected ? 'Edit Kategori Tarif' : 'Tambah Kategori Tarif'}</h2><div className="mt-5 space-y-4"><div><label className="form-label" htmlFor="kategori-tarif-name">Nama Kategori</label><input id="kategori-tarif-name" required maxLength="100" value={name} onChange={(event) => setName(event.target.value)} className="form-input" placeholder="Contoh: Reguler" /></div><div><label className="form-label" htmlFor="kategori-tarif-cost">Biaya Tambahan (Rp)</label><input id="kategori-tarif-cost" required min="0" step="0.01" type="number" value={additionalCost} onChange={(event) => setAdditionalCost(event.target.value)} className="form-input" placeholder="0" /><p className="mt-1 text-xs text-slate-500">Isi 0 jika tidak ada biaya tambahan.</p></div></div><div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={closeModal} className="btn-outline btn-sm">Batal</button><button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button></div></form></div>}
    </div>
  );
}
