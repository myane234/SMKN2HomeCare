import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LayananForm from '../components/LayananForm';
import { createLayanan } from '../data/layananData';

export default function FormTambah() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data) {
    setSubmitting(true);
    await createLayanan(data);
    setSubmitting(false);
    navigate('/layanan');
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Tambah Layanan</h1>
        <p className="page-subtitle">Tambahkan layanan HomeCare baru</p>
      </div>

      <LayananForm mode="tambah" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
