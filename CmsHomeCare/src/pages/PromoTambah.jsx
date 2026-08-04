import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromoForm from '../components/PromoForm';
import { createPromo } from '../data/PromoEndpoint';

export default function PromoTambah() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      await createPromo(data);
      navigate('/promo');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Tambah Promo</h1>
        <p className="page-subtitle">Buat paket promo yang berisi beberapa layanan</p>
      </div>

      <PromoForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}