import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllLayanan } from '../data/layananData';
import { getAllPromo } from '../data/PromoEndpoint';
import { getAllArtikel } from '../data/artikelData';
import { getSession } from '../utils/auth';
import { FaStethoscope, FaGift, FaRegFileAlt } from 'react-icons/fa';

export default function Dashboard() {
  const [layanan, setLayanan] = useState([]);
  const [promo, setPromo] = useState([]);
  const [artikel, setArtikel] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = getSession();

  useEffect(() => {
    Promise.all([getAllLayanan(), getAllPromo(), getAllArtikel()])
      .then(([layananData, promoData, artikelData]) => {
        setLayanan(layananData || []);
        setPromo(promoData || []);
        setArtikel(artikelData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      });
  }, []);

  const summaryCards = [
    { label: 'Total Layanan', value: layanan.length, icon: <FaStethoscope /> },
    { label: 'Total Promo', value: promo.length, icon: <FaGift /> },
    { label: 'Total Artikel', value: artikel.length, icon: <FaRegFileAlt /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Selamat datang kembali, {session?.name || 'Admin'} 👋
        </p>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <div className="card flex items-center gap-3.5 p-5" key={card.label}>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-xl">
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-[13px] text-slate-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layanan */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold">Layanan Terbaru</h2>
            <Link to="/layanan" className="btn-outline">
              Lihat Semua
            </Link>
          </div>
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : layanan.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Belum ada data layanan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nama</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Harga</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {layanan.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">{item.nama}</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">Rp {Number(item.harga).toLocaleString('id-ID')}</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
                        <span className={`badge badge-${item.status}`}>
                          {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Promo */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold">Promo Terbaru</h2>
            <Link to="/promo" className="btn-outline">
              Lihat Semua
            </Link>
          </div>
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : promo.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Belum ada data promo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nama Promo</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Diskon (%)</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promo.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">{item.nama_paket}</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">{item.diskon_persen}%</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
                        <span className={`badge ${item.status_promo === 'Aktif' ? 'badge-aktif' : 'badge-nonaktif'}`}>
                          {item.status_promo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Artikel */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold">Artikel Terbaru</h2>
            <Link to="/artikel" className="btn-outline">
              Lihat Semua
            </Link>
          </div>
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : artikel.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Belum ada data artikel.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Judul Artikel</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {artikel.slice(0, 5).map((item) => (
                    <tr key={item.id_artikel || item.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">{item.judul_artikel}</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">{item.kategori_artikel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
