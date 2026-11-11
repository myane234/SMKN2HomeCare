import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayananForm from '../components/LayananForm';
import { getLayananById, updateLayanan } from '../data/layananData';

export default function FormEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getLayananById(id).then((data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setInitialData(data);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(data) {
    setSubmitting(true);
    await updateLayanan(id, data);
    setSubmitting(false);
    navigate('/layanan');
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Edit Layanan</h1>
        <p className="page-subtitle">Perbarui data layanan HomeCare</p>
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
      ) : notFound ? (
        <p className="p-10 text-center text-sm text-slate-500">Layanan tidak ditemukan.</p>
      ) : (
        <LayananForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
