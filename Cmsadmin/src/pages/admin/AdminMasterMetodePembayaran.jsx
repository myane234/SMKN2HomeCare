
import { useState, useEffect, useMemo } from "react";
import {
  getMetodePembayaran,
  createMetodePembayaran,
  updateMetodePembayaran,
  deleteMetodePembayaran,
} from "../../data/masterMetodePembayaranData.js";
import MetodePembayaranForm from "../../components/MetodePembayaranForm.jsx";

function LogoCell({ logo, nama }) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = typeof logo === "string" ? logo.trim() : "";

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  if (!logoUrl || imageError) {
    return (
      <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-slate-100 text-[10px] font-medium text-slate-400">
        N/A
      </span>
    );
  }

  return (
    <div className="flex h-9 w-14 items-center justify-center rounded-md border border-slate-100 bg-white p-1">
      <img
        src={logoUrl}
        alt={`Logo ${nama || "metode pembayaran"}`}
        className="max-h-full max-w-full object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminMasterMetodePembayaran() {
  const [metodeList, setMetodeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMetode, setSelectedMetode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchMetode();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  async function fetchMetode() {
    setLoading(true);

    try {
      const data = await getMetodePembayaran();
      setMetodeList(data);
    } catch (error) {
      console.error("Gagal mengambil metode pembayaran:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelectedMetode(null);
    setShowForm(true);
  }

  function handleOpenEdit(item) {
    setSelectedMetode(item);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedMetode(null);
  }

  async function handleSubmitForm(formData) {
    setSubmitting(true);

    try {
      if (selectedMetode) {
        await updateMetodePembayaran(selectedMetode.id, formData);
      } else {
        await createMetodePembayaran(formData);
      }

      handleCloseForm();
      await fetchMetode();
    } catch (error) {
      console.error("Gagal menyimpan metode pembayaran:", error);
      alert(
        error?.message ||
          "Terjadi kesalahan saat menyimpan metode pembayaran."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Apakah kamu yakin ingin menghapus metode pembayaran ini?"
      )
    ) {
      return;
    }

    try {
      await deleteMetodePembayaran(id);
      await fetchMetode();
    } catch (error) {
      console.error("Gagal menghapus metode pembayaran:", error);
      alert(error?.message || "Gagal menghapus data.");
    }
  }

  const filteredMetode = useMemo(() => {
    return metodeList.filter((item) => {
      const namaMetode = item.nama_metode || "";
      const namaKategori = item.nama_kategori || "";

      const query = searchQuery.toLowerCase();

      const matchesSearch =
        namaMetode.toLowerCase().includes(query) ||
        namaKategori.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "semua" ||
        (statusFilter === "aktif" && item.is_active) ||
        (statusFilter === "nonaktif" && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [metodeList, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMetode.length / itemsPerPage)
  );

  const paginatedMetode = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMetode.slice(start, start + itemsPerPage);
  }, [filteredMetode, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Master Metode Pembayaran
          </h1>
          <p className="text-sm text-slate-500">
            Kelola pilihan channel pembayaran transaksi.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Tambah Metode
          </button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6">
          <MetodePembayaranForm
            initialData={selectedMetode}
            mode={selectedMetode ? "edit" : "create"}
            onSubmit={handleSubmitForm}
            submitting={submitting}
            onCancel={handleCloseForm}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>

              <input
                type="text"
                placeholder="Cari nama metode atau kategori..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Memuat data...
              </div>
            ) : filteredMetode.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Tidak ada metode pembayaran yang ditemukan.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="w-12 whitespace-nowrap p-4">No</th>
                        <th className="whitespace-nowrap p-4">Logo</th>
                        <th className="p-4">Nama Metode</th>
                        <th className="p-4">Kategori</th>
                        <th className="whitespace-nowrap p-4">Admin</th>
                        <th className="p-4">Status</th>
                        <th className="whitespace-nowrap p-4">Created At</th>
                        <th className="whitespace-nowrap p-4">Created By</th>
                        <th className="whitespace-nowrap p-4">Updated At</th>
                        <th className="whitespace-nowrap p-4">Updated By</th>
                        <th className="whitespace-nowrap p-4">Deleted At</th>
                        <th className="whitespace-nowrap p-4">Deleted By</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedMetode.map((item, index) => {
                        const nomorUrut =
                          (currentPage - 1) * itemsPerPage + index + 1;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/50"
                          >
                            <td className="whitespace-nowrap p-4 font-medium text-slate-500">
                              {nomorUrut}
                            </td>

                            <td className="p-4">
                              <LogoCell
                                logo={item.logo}
                                nama={item.nama_metode}
                              />
                            </td>

                            <td className="min-w-40 p-4 font-semibold text-slate-800">
                              {item.nama_metode || "—"}
                            </td>

                            <td className="p-4 text-slate-500">
                              {item.nama_kategori || "—"}
                            </td>

                            <td className="whitespace-nowrap p-4 font-medium text-slate-700">
                              {item.tipe_potongan === "persen"
                                ? `${Number(item.nilai_potongan || 0)}%`
                                : `Rp ${Number(
                                    item.nilai_potongan || 0
                                  ).toLocaleString("id-ID")}`}
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  item.is_active
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-rose-50 text-rose-600"
                                }`}
                              >
                                {item.is_active ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                              {formatDate(item.created_at)}
                            </td>

                            <td className="p-4 text-xs text-slate-500">
                              {item.created_by &&
                              isNaN(item.created_by)
                                ? item.created_by
                                : "—"}
                            </td>

                            <td className="whitespace-nowrap p-4 text-xs text-slate-500">
                              {formatDate(item.updated_at)}
                            </td>

                            <td className="p-4 text-xs text-slate-500">
                              {item.updated_by &&
                              !isNaN(Number(item.updated_by))
                                ? "—"
                                : item.updated_by || "—"}
                            </td>

                            <td className="whitespace-nowrap p-4 text-xs text-slate-500">
                              {formatDate(item.deleted_at)}
                            </td>

                            <td className="p-4 text-xs text-slate-500">
                              {item.deleted_by ?? "—"}
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-sm text-slate-500">
                    Halaman{" "}
                    <span className="font-semibold text-slate-700">
                      {currentPage}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-slate-700">
                      {totalPages}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Sebelumnya
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === page
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
