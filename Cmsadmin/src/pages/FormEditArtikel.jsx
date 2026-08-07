import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArtikelForm from '../components/ArtikelForm';
import { getArtikelById, updateArtikel } from '../data/artikelData';

export default function FormEditArtikel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getArtikelById(id)
      .then((data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setInitialData(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(data) {
    setSubmitting(true);
    setServerError('');
    try {
      await updateArtikel(id, data);
      navigate('/artikel');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Edit Artikel</h1>
        <p className="page-subtitle">Perbarui artikel atau tips kesehatan</p>
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
      ) : notFound ? (
        <p className="p-10 text-center text-sm text-slate-500">Artikel tidak ditemukan.</p>
      ) : (
        <ArtikelForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          submitting={submitting}
          serverError={serverError}
        />
      )}
    </div>
  );
}
