import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';

export default function KelolaAdmin() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${URL}/admin`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAdmins(Array.isArray(json.data) ? json.data : []);
      } else {
        setError(json.message || 'Gagal mengambil data admin');
      }
    } catch (err) {
      setError('Gagal menghubungi server: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus admin ini?')) return;
    try {
      const res = await fetch(`${URL}/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchAdmins();
      } else {
        alert(json.message || 'Gagal menghapus admin');
      }
    } catch (err) {
      alert('Gagal menghubungi server: ' + err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Kelola Admin</h1>
          <p className="page-subtitle">Daftar seluruh admin CMS HomeCare</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
        ) : admins.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">Belum ada data admin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nama
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id ?? admin.id_admin} className="hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm font-medium">
                      {admin.nama ?? admin.name ?? '-'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      {admin.email}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      {Array.isArray(admin.roles) ? (
                        admin.roles.map((role) => (
                          <span
                            key={role}
                            className={`mr-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              role === 'super_admin'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                      <button
                        className="rounded-lg bg-danger-bg px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger hover:text-white transition-colors"
                        onClick={() => handleDelete(admin.id ?? admin.id_admin)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

