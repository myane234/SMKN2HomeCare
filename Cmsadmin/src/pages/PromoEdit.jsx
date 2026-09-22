import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromoForm from '../components/PromoForm';
import { getPromoById, updatePromo } from '../data/PromoEndpoint';

// 🟢 Helper untuk ubah tanggal dari database ke format YYYY-MM-DD
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function PromoEdit() {
  const { id_promo } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPromoById(id_promo)
      .then((data) => {
        if (data) {
          // 🟢 Format tanggal sebelum dimasukkan ke initialData
          setInitialData({
            ...data,
            tanggal_mulai: formatDate(data.tanggal_mulai),
            tanggal_berakhir: formatDate(data.tanggal_berakhir),
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id_promo]);

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      // 🟢 MAPPING PAYLOAD SESUAI API CONTRACT BARU
      const payload = {
        id_layanan: data.layanan_ids && data.layanan_ids[0] ? Number(data.layanan_ids[0]) : null,
        deskripsi: data.deskripsi,
        tipe_diskon: "persen", // Ubah jadi 'nominal' jika inputnya berupa nominal uang
        nilai_diskon: Number(data.diskon_persen),
        tanggal_mulai: data.tanggal_mulai,
        tanggal_berakhir: data.tanggal_berakhir,
        status_promo: data.status_promo,
      };

      // Jika ada file gambar baru, sertakan juga (karena pakai multipart/form-data)
      if (data.gambar_promo instanceof File) {
        payload.gambar_promo = data.gambar_promo;
      }

      await updatePromo(id_promo, payload);
      navigate('/promo');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Memuat...</div>;

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Edit Promo</h1>
        <p className="page-subtitle">Perbarui paket promo dan layanan yang terhubung</p>
      </div>

      <PromoForm initialData={initialData} onSubmit={handleSubmit} submitting={submitting} mode="edit" />
    </div>
  );
}