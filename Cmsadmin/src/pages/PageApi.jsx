import React, { useState, useEffect } from 'react';
import { getKonfigurasiEnv, updateKonfigurasiEnv } from '../data/konfigurasiApiData';

export default function PageApi() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getKonfigurasiEnv();
      const listData = Array.isArray(data) ? data : data?.data || data?.configs || [];
      setConfigs(listData);
    } catch (err) {
      console.error('Gagal memuat konfigurasi:', err);
      setError(err.message || 'Gagal memuat data konfigurasi dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleEditClick = (item) => {
    setEditingKey(item.key);
    setEditValue(item.value ?? '');
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        key: key,
        value: editValue
      };

      await updateKonfigurasiEnv(payload);
      setEditingKey(null);
      await fetchConfigs();
    } catch (err) {
      console.error(`Gagal menyimpan ${key}:`, err);
      setError(`Gagal menyimpan ${key}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">API Konfigurasi</h1>
              <p className="text-xs text-gray-500 mt-0.5">Atur tingkatan akses dan konfigurasi environment aplikasi.</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchConfigs}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium flex items-center space-x-2 text-sm shadow-2xs"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="mb-6 p-4 bg-sky-50/70 border border-sky-100 rounded-xl text-sky-900 shadow-2xs flex items-start space-x-3">
        <svg className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-semibold text-sm">Informasi Konfigurasi Environment</p>
          <p className="text-xs text-sky-700 mt-0.5">
            Konfigurasi dengan <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">is_editable: true</code> dapat diubah. Konfigurasi dengan <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">is_editable: false</code> hanya dapat dibaca.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm shadow-2xs">
          <p className="font-medium">Error HTTP: {error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-base font-bold text-gray-800">Pengaturan Environment</h2>
          <p className="text-xs text-gray-400 mt-0.5">Data konfigurasi diambil langsung dari backend.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Memuat data konfigurasi...
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((item) => {
              const isEditing = editingKey === item.key;

              return (
                <div 
                  key={item.key || item.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    isEditing ? 'border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10' : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-800 text-sm tracking-wide">{item.key}</span>
                      {item.is_sensitive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
                          Sensitive
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      item.is_editable 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.is_editable ? 'Editable' : 'Read Only'}
                    </span>
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="space-y-3 pt-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-800 text-sm font-mono shadow-2xs"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSave(item.key)}
                            disabled={saving}
                            className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-medium transition"
                          >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-600 text-sm font-mono truncate max-w-4xl">
                          {item.value ?? <span className="italic text-gray-300 font-sans">Kosong</span>}
                        </span>
                        {item.is_editable && (
                          <button
                            onClick={() => handleEditClick(item)}
                            className="px-3.5 py-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shadow-2xs"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}