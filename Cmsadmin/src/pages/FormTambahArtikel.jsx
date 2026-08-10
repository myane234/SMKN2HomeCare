import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtikelForm from '../components/ArtikelForm';
import { createArtikel } from '../data/artikelData';

export default function FormTambahArtikel() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  async function handleSubmit(data) {
    setSubmitting(true);
    setServerError('');
    try {
      await createArtikel(data);
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
        <h1 className="page-title">Tambah Artikel</h1>
        <p className="page-subtitle">Tulis artikel atau tips kesehatan baru</p>
      </div>

      <ArtikelForm
        mode="tambah"
        onSubmit={handleSubmit}
        submitting={submitting}
        serverError={serverError}
      />
    </div>
  );
}
