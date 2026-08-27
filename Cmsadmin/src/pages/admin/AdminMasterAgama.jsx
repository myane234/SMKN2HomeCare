import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import {
  getAllAgama,
  createAgama,
  updateAgama,
  deleteAgama
} from '../../data/masterAgamaData';

import Swal from 'sweetalert2';

export default function AdminMasterAgama() {
  const [agamaList, setAgamaList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form
  const [formData, setFormData] = useState({
    nama_agama: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // GET ID
  // =========================================================
  const getItemId = (item) => {
    if (!item) return null;

    return (
      item.agama_id_agama ||
      item.id ||
      item.id_agama ||
      Object.values(item)[0]
    );
  };

  // =========================================================
  // LOAD DATA
  // =========================================================
  const loadData = async () => {
    try {
      const data = await getAllAgama();

      const sortedData = [...data].sort((a, b) => {
        const idA = getItemId(a) || 0;
        const idB = getItemId(b) || 0;

        return Number(idA) - Number(idB);
      });

      setAgamaList(sortedData);
    } catch (error) {
      console.error('Gagal memuat data agama:', error);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: error.message || 'Data agama gagal dimuat.',
        confirmButtonColor: '#10b981',
      });
    }
  };

  // =========================================================
  // TAMBAH
  // =========================================================
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);

    setFormData({
      nama_agama: '',
      is_active: true,
    });

    setIsOpenModal(true);
  };

  // =========================================================
  // EDIT
  // =========================================================
  const handleOpenEdit = (item) => {
    setIsEditMode(true);

    const id = getItemId(item);

    setSelectedId(id);

    setFormData({
      nama_agama: item.nama_agama || '',
      is_active:
        item.is_active !== undefined
          ? Boolean(item.is_active)
          : true,
    });

    setIsOpenModal(true);
  };

  // =========================================================
  // SUBMIT TAMBAH / EDIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_agama.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Agama Kosong',
        text: 'Nama agama wajib diisi.',
        confirmButtonColor: '#10b981',
      });

      return;
    }

    try {
      if (isEditMode) {
        await updateAgama(selectedId, {
          nama_agama: formData.nama_agama.trim(),
          is_active: formData.is_active,
        });

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui!',
          text: `Data "${formData.nama_agama}" berhasil diperbarui.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createAgama({
          nama_agama: formData.nama_agama.trim(),
          is_active: formData.is_active,
        });

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan!',
          text: `Agama "${formData.nama_agama}" berhasil ditambahkan.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsOpenModal(false);
      await loadData();

    } catch (error) {
      console.error('Gagal menyimpan data:', error);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#e11d48',
      });
    }
  };

  // =========================================================
  // TOGGLE AKTIF / NONAKTIF
  // =========================================================
  const handleToggleStatus = async (item) => {
    const id = getItemId(item);

    if (!id || updatingStatusId === id) return;

    const oldStatus =
      item.is_active !== undefined
        ? Boolean(item.is_active)
        : true;

    const newStatus = !oldStatus;

    // Tandai sedang update
    setUpdatingStatusId(id);

    // LANGSUNG ubah UI
    setAgamaList((prev) =>
      prev.map((data) =>
        getItemId(data) === id
          ? {
              ...data,
              is_active: newStatus,
            }
          : data
      )
    );

    try {
      await updateAgama(id, {
        nama_agama: item.nama_agama,
        is_active: newStatus,
      });

    } catch (error) {
      console.error('Gagal mengubah status:', error);

      // Kalau API gagal, balikin ke status sebelumnya
      setAgamaList((prev) =>
        prev.map((data) =>
          getItemId(data) === id
            ? {
                ...data,
                is_active: oldStatus,
              }
            : data
        )
      );

      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengubah Status',
        text: error.message || 'Status gagal diubah.',
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (item) => {
    const id = getItemId(item);

    if (!id) return;

    const result = await Swal.fire({
      title: 'Hapus Agama?',
      html: `
        <div style="font-size:15px;color:#64748b;line-height:1.6">
          Anda yakin ingin menghapus
          <strong style="color:#1e293b">
            "${item.nama_agama}"
          </strong>?
          <br>
          <span style="font-size:13px;color:#94a3b8">
            Data yang sudah dihapus tidak dapat digunakan kembali.
          </span>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAgama(id);

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil Dihapus!',
        text: `Agama "${item.nama_agama}" berhasil dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      });

      await loadData();

    } catch (error) {
      console.error('Gagal menghapus data:', error);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: error.message || 'Data gagal dihapus.',
        confirmButtonColor: '#e11d48',
      });
    }
  };

  // =========================================================
  // FILTER
  // =========================================================
  const filteredData = agamaList.filter((item) => {
    const nama = item.nama_agama?.toLowerCase() || '';

    const cocokSearch = nama.includes(
      searchQuery.toLowerCase()
    );

    const isActive =
      item.is_active !== undefined
        ? Boolean(item.is_active)
        : true;

    const cocokStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    return cocokSearch && cocokStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================
  const totalPages =
    Math.ceil(filteredData.length / itemsPerPage) || 1;

  const indexOfLastItem =
    currentPage * itemsPerPage;

  const indexOfFirstItem =
    indexOfLastItem - itemsPerPage;

  const currentData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Master Agama
          </h1>

          <p className="text-sm text-slate-500">
            Kelola data pilihan agama dari database backend.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="
            flex items-center gap-2
            bg-emerald-600
            text-white
            px-4 py-2
            rounded-lg
            hover:bg-emerald-700
            transition
          "
        >
          <FaPlus />
          Tambah Agama
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="
        bg-white
        p-4
        rounded-xl
        shadow-sm
        border border-slate-200
        mb-6
        flex flex-col sm:flex-row
        items-center
        gap-3
      ">

        <div className="
          flex items-center gap-3
          w-full
          border border-slate-200
          rounded-lg
          px-3 py-2
        ">
          <FaSearch className="text-slate-400" />

          <input
            type="text"
            placeholder="Cari nama agama..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="
              w-full
              outline-none
              text-sm
              text-slate-700
            "
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="
            w-full sm:w-48
            border border-slate-200
            rounded-lg
            px-3 py-2
            text-sm
            text-slate-700
            bg-white
            outline-none
          "
        >
          <option value="all">
            Semua Status
          </option>

          <option value="active">
            Aktif
          </option>

          <option value="inactive">
            Nonaktif
          </option>
        </select>

      </div>

      {/* TABLE */}
      <div className="
        bg-white
        rounded-xl
        shadow-sm
        border border-slate-200
        overflow-hidden
      ">

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">

            <thead>
              <tr className="
                bg-slate-50
                text-slate-600
                text-xs
                uppercase
                tracking-wider
                border-b border-slate-200
              ">
                <th className="p-4 w-16 text-center">
                  No
                </th>

                <th className="p-4">
                  Nama Agama
                </th>

                <th className="p-4 w-32">
                  Status
                </th>

                <th className="p-4 w-36 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="
              divide-y
              divide-slate-100
              text-sm
            ">

              {currentData.length === 0 ? (

                <tr>
                  <td
                    colSpan="4"
                    className="
                      p-8
                      text-center
                      text-slate-400
                    "
                  >
                    Tidak ada data agama.
                  </td>
                </tr>

              ) : (

                currentData.map((item, index) => {
                  const itemId = getItemId(item);

                  const absoluteIndex =
                    indexOfFirstItem + index + 1;

                  const isActive =
                    item.is_active !== undefined
                      ? Boolean(item.is_active)
                      : true;

                  const isUpdating =
                    updatingStatusId === itemId;

                  return (
                    <tr
                      key={itemId || index}
                      className="
                        hover:bg-slate-50/50
                        transition-colors
                      "
                    >

                      {/* NO */}
                      <td className="
                        p-4
                        text-center
                        font-medium
                        text-slate-500
                      ">
                        {absoluteIndex}
                      </td>

                      {/* NAMA */}
                      <td className="
                        p-4
                        font-semibold
                        text-slate-800
                      ">
                        {item.nama_agama}
                      </td>

                      {/* STATUS */}
                      <td className="p-4">

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            px-2.5
                            py-1
                            text-xs
                            font-semibold
                            ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }
                          `}
                        >

                          <span
                            className={`
                              w-1.5 h-1.5 rounded-full
                              ${
                                isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }
                            `}
                          />

                          {isActive
                            ? 'Aktif'
                            : 'Nonaktif'}

                        </span>

                      </td>

                      {/* AKSI */}
                      <td className="p-4 text-right">

                        <div className="
                          flex
                          justify-end
                          items-center
                          gap-1.5
                        ">

                          {/* TOGGLE */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(item)
                            }
                            disabled={isUpdating}
                            title={
                              isActive
                                ? 'Nonaktifkan'
                                : 'Aktifkan'
                            }
                            className={`
                              relative
                              inline-flex
                              h-6
                              w-11
                              shrink-0
                              rounded-full
                              border-2
                              border-transparent
                              transition-all
                              duration-200
                              ease-in-out
                              ${
                                isUpdating
                                  ? 'opacity-60 cursor-wait'
                                  : 'cursor-pointer'
                              }
                              ${
                                isActive
                                  ? 'bg-emerald-600'
                                  : 'bg-slate-300'
                              }
                            `}
                          >

                            <span
                              className={`
                                pointer-events-none
                                inline-block
                                h-5
                                w-5
                                rounded-full
                                bg-white
                                shadow
                                transform
                                transition-transform
                                duration-200
                                ease-in-out
                                ${
                                  isActive
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                }
                              `}
                            />

                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(item)
                            }
                            className="
                              rounded-lg
                              border border-slate-200
                              bg-white
                              p-1.5
                              text-slate-600
                              hover:bg-slate-50
                              hover:text-emerald-600
                              transition
                            "
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item)
                            }
                            className="
                              rounded-lg
                              border border-rose-200
                              bg-rose-50
                              p-1.5
                              text-rose-600
                              hover:bg-rose-100
                              transition
                            "
                            title="Hapus"
                          >
                            <FaTrash className="text-sm" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="
          flex flex-col sm:flex-row
          items-center
          justify-between
          p-4
          border-t border-slate-200
          gap-4
        ">

          <div className="text-sm text-slate-500">
            Halaman{' '}
            <span className="font-semibold text-slate-700">
              {currentPage}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-slate-700">
              {totalPages}
            </span>
          </div>

          <div className="
            flex
            items-center
            gap-1
            flex-wrap
          ">

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={currentPage === 1}
              className="
                px-3 py-1.5
                rounded-lg
                border border-slate-200
                text-sm
                text-slate-600
                hover:bg-slate-50
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Sebelumnya
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((page) => (

              <button
                key={page}
                onClick={() =>
                  setCurrentPage(page)
                }
                className={`
                  w-8 h-8
                  rounded-lg
                  text-sm
                  font-medium
                  ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                {page}
              </button>

            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    totalPages
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
              className="
                px-3 py-1.5
                rounded-lg
                border border-slate-200
                text-sm
                text-slate-600
                hover:bg-slate-50
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Selanjutnya
            </button>

          </div>
        </div>

      </div>

      {/* MODAL TAMBAH / EDIT */}
      {isOpenModal && (
        <div className="
          fixed inset-0
          bg-black/50
          flex items-center justify-center
          z-50 p-4
        ">

          <div className="
            bg-white
            rounded-2xl
            w-full max-w-md
            p-6
            shadow-xl
          ">

            <h2 className="
              text-lg
              font-bold
              text-slate-800
              mb-4
            ">
              {isEditMode
                ? 'Edit Agama'
                : 'Tambah Agama'}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* NAMA */}
              <div>

                <label className="
                  block
                  text-xs
                  font-semibold
                  uppercase
                  text-slate-500
                  mb-1
                ">
                  Nama Agama
                </label>

                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Contoh: Islam"
                  value={formData.nama_agama}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama_agama: e.target.value,
                    })
                  }
                  className="
                    w-full
                    border border-slate-200
                    rounded-lg
                    p-2.5
                    text-sm
                    outline-none
                    focus:border-emerald-500
                  "
                />

              </div>

              {/* STATUS */}
              <div>

                <label className="
                  block
                  text-xs
                  font-semibold
                  uppercase
                  text-slate-500
                  mb-2
                ">
                  Status
                </label>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: true,
                      })
                    }
                    className={`
                      flex-1
                      rounded-lg
                      border
                      px-4 py-2.5
                      text-sm
                      font-semibold
                      transition
                      ${
                        formData.is_active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }
                    `}
                  >
                    Aktif
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: false,
                      })
                    }
                    className={`
                      flex-1
                      rounded-lg
                      border
                      px-4 py-2.5
                      text-sm
                      font-semibold
                      transition
                      ${
                        !formData.is_active
                          ? 'border-rose-300 bg-rose-50 text-rose-600'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }
                    `}
                  >
                    Nonaktif
                  </button>

                </div>

              </div>

              {/* BUTTON */}
              <div className="
                flex
                justify-end
                gap-2
                pt-4
                border-t border-slate-100
              ">

                <button
                  type="button"
                  onClick={() =>
                    setIsOpenModal(false)
                  }
                  className="
                    px-4 py-2
                    rounded-lg
                    border border-slate-200
                    text-sm
                    font-medium
                    text-slate-600
                    hover:bg-slate-50
                  "
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="
                    px-4 py-2
                    rounded-lg
                    bg-emerald-600
                    text-sm
                    font-medium
                    text-white
                    hover:bg-emerald-700
                  "
                >
                  Simpan
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}