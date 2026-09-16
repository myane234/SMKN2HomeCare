import { useState, useEffect } from 'react';
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaSave,
} from 'react-icons/fa';
import Pagination from '../../components/pagination';
import {
  getAllTarif,
  createTarifData,
  updateTarifData,
  deleteTarifData,
  getAllKategoriTarif,
} from '../../data/masterTarifData';
import { getAllLayanan, getKategoriLayanan } from '../../data/layananData';
import { getAllKomponenTarif } from '../../data/masterKomponenTarifData';
import Swal from 'sweetalert2';

export default function AdminMasterTarif() {
  const [viewMode, setViewMode] = useState('list');

  const [tarifList, setTarifList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [kategoriLayananList, setKategoriLayananList] = useState([]);
  const [kategoriTarifList, setKategoriTarifList] = useState([]);
  const [komponenList, setKomponenList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedTarif, setSelectedTarif] = useState(null);

  const [formNama, setFormNama] = useState('');
  const [formLayanan, setFormLayanan] = useState('');
  const [formLayananIds, setFormLayananIds] = useState([]);
  const [formKategoriLayananIds, setFormKategoriLayananIds] = useState([]);
  const [layananSearch, setLayananSearch] = useState('');
  const [formKategoriTarif, setFormKategoriTarif] = useState('');
  const [formKomponenIds, setFormKomponenIds] = useState([]);
  const [formFeeNakesTipe, setFormFeeNakesTipe] = useState('nominal');
  const [formFeeNakesNilai, setFormFeeNakesNilai] = useState('');
  const [formIsTransport, setFormIsTransport] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =========================================================
     HELPER
  ========================================================= */

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const formatDisplayNumber = (val) => {
  if (!val && val !== 0) return '';

  const clean = val.toString().replace(/[^0-9]/g, '');

  if (!clean) return '';

  return Number(clean).toLocaleString('id-ID');
};

const parseFormattedNumber = (val) => {
  if (!val) return '';

  return val.toString().replace(/[^0-9]/g, '');
};
  

  const normalizeBoolean = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true' || value === '1') {
        return true;
      }

      if (value.toLowerCase() === 'false' || value === '0') {
        return false;
      }
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return defaultValue;
  };

  /**
   * Ambil ID komponen dari response master tarif.
   *
   * Response GET /master-tarif:
   * {
   *   "komponen_tarif": [
   *     {
   *       "id_komponen": 1,
   *       ...
   *     }
   *   ]
   * }
   *
   * Fallback tetap disediakan untuk komponen_tarif_ids.
   */
  const extractKomponenIds = (item) => {
    if (!item) {
      return [];
    }

    // PRIORITAS 1:
    // Relationship dari GET /master-tarif
    if (Array.isArray(item.komponen_tarif)) {
      return item.komponen_tarif
        .map((komponen) => {
          if (typeof komponen === 'object' && komponen !== null) {
            return (
              komponen.id_komponen ??
              komponen.id_komponen_biaya ??
              komponen.komponen_id ??
              komponen.id
            );
          }

          return komponen;
        })
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));
    }

    // PRIORITAS 2:
    // Fallback kalau backend mengembalikan komponen_tarif_ids
    let rawIds = item.komponen_tarif_ids;

    if (!rawIds) {
      return [];
    }

    if (!Array.isArray(rawIds)) {
      if (typeof rawIds === 'string') {
        try {
          rawIds = JSON.parse(rawIds);
        } catch {
          rawIds = rawIds
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        }
      } else {
        rawIds = [rawIds];
      }
    }

    return rawIds
      .map((value) => {
        if (typeof value === 'object' && value !== null) {
          return (
            value.id_komponen ??
            value.id_komponen_biaya ??
            value.komponen_id ??
            value.id
          );
        }

        return value;
      })
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  };

  /**
   * Ambil nama komponen langsung dari relationship API.
   * Kalau relationship tidak ada, fallback ke komponenList.
   */
  const getKomponenNames = (item) => {
    if (!item) {
      return 'Belum ada komponen di database';
    }

    // Kalau relationship tersedia dari API
    if (
      Array.isArray(item.komponen_tarif) &&
      item.komponen_tarif.length > 0
    ) {
      const names = item.komponen_tarif
        .map((komponen) => komponen?.nama_komponen || komponen?.nama)
        .filter(Boolean);

      if (names.length > 0) {
        return names.join(', ');
      }
    }

    // Fallback berdasarkan ID
    const ids = extractKomponenIds(item);

    if (ids.length === 0) {
      return 'Belum ada komponen di database';
    }

    const found = komponenList.filter((komponen) =>
      ids.includes(Number(komponen.id))
    );

    if (found.length > 0) {
      return found
        .map((komponen) => komponen.nama || komponen.nama_komponen)
        .filter(Boolean)
        .join(', ');
    }

    return `ID: ${ids.join(', ')}`;
  };

  const getTarifServiceIds = (item) => {
    const included = item?.layanan_termasuk || item?.layananTermasuk || [];
    return Array.from(new Set([
      Number(item?.id_layanan),
      ...(Array.isArray(included) ? included.map((layanan) => Number(layanan.id_layanan ?? layanan.id)) : []),
    ].filter((id) => !Number.isNaN(id))));
  };

  const getLayananCategoryId = (layanan) => (
    layanan?.kategori
      ?? layanan?.id_kategori_layanan
      ?? layanan?.kategori_layanan?.id_kategori_layanan
      ?? layanan?.kategori?.id_kategori_layanan
  );

  const selectedTarifId = selectedTarif?.id_master_tarif || selectedTarif?.id;
  const hasTransportConflict = formLayananIds.some((serviceId) => tarifList.some((item) => {
    const itemId = item?.id_master_tarif || item?.id;
    return Boolean(item?.is_transport)
      && itemId !== selectedTarifId
      && getTarifServiceIds(item).includes(Number(serviceId));
  }));

  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const [
        tarifRes,
        layananRes,
        komponenRes,
        kategoriLayananRes,
        kategoriTarifRes,
      ] = await Promise.all([
        getAllTarif().catch((error) => {
          console.error('Gagal GET master tarif:', error);
          return [];
        }),

        getAllLayanan().catch((error) => {
          console.error('Gagal GET layanan:', error);
          return [];
        }),

        getAllKomponenTarif().catch((error) => {
          console.error('Gagal GET komponen tarif:', error);
          return { data: [] };
        }),

        getKategoriLayanan().catch((error) => {
          console.error('Gagal GET kategori layanan:', error);
          return [];
        }),

        getAllKategoriTarif().catch((error) => {
          console.error('Gagal GET kategori tarif:', error);
          return [];
        }),
      ]);

      /* -----------------------------------------
         MASTER TARIF
      ----------------------------------------- */

      const normalizedTarif = Array.isArray(tarifRes)
        ? tarifRes
        : [];

      /* -----------------------------------------
         KOMPONEN TARIF
      ----------------------------------------- */

      const rawKomponen = Array.isArray(komponenRes)
        ? komponenRes
        : komponenRes?.data || [];

      const normalizedKomponen = rawKomponen
        .map((komponen) => ({
          ...komponen,

          id: Number(
            komponen.id_komponen ??
              komponen.komponen_id ??
              komponen.id
          ),

          nama:
            komponen.nama_komponen ||
            komponen.nama ||
            '',

          tipe_komponen:
            komponen.tipe_komponen ||
            komponen.tipe ||
            '',

          jenis_nilai:
            komponen.jenis_nilai ||
            '',

          nilai:
            komponen.nilai ?? '',
        }))
        .filter(
          (komponen) =>
            !Number.isNaN(komponen.id)
        );

      /* -----------------------------------------
         LAYANAN
      ----------------------------------------- */

      const rawLayanan = Array.isArray(layananRes)
        ? layananRes
        : layananRes?.data || [];

      const normalizedLayanan = rawLayanan
        .map((layanan) => ({
          ...layanan,

          id: Number(layanan.id_layanan ?? layanan.id),

          nama:
            layanan.nama_layanan ||
            layanan.nama ||
            '',
        }))
        .filter(
          (layanan) =>
            !Number.isNaN(layanan.id)
        );

      /* -----------------------------------------
         SET STATE
      ----------------------------------------- */

      setTarifList(normalizedTarif);
      setLayananList(normalizedLayanan);
      setKategoriLayananList(Array.isArray(kategoriLayananRes) ? kategoriLayananRes : []);
      setKategoriTarifList(Array.isArray(kategoriTarifRes) ? kategoriTarifRes : []);
      setKomponenList(normalizedKomponen);

      console.log('=== MASTER TARIF ===', normalizedTarif);
      console.log(
        '=== KOMPONEN TARIF ===',
        normalizedKomponen
      );
    } catch (error) {
      console.error('Fetch master tarif error:', error);
      setErrorMsg('Gagal memuat data master tarif');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /* =========================================================
     ADD FORM
  ========================================================= */

  const handleOpenAddForm = () => {
    setSelectedTarif(null);

    setFormNama('');
    setFormLayanan('');
    setFormLayananIds([]);
    setFormKategoriLayananIds([]);
    setLayananSearch('');
    setFormKategoriTarif('');
    setFormKomponenIds([]);
    setFormFeeNakesTipe('nominal');
    setFormFeeNakesNilai('');
    setFormIsTransport(false);
    setFormActive(true);

    setViewMode('add');
  };

  /* =========================================================
     EDIT FORM
  ========================================================= */

  const handleOpenEditForm = (item) => {
    console.log('=== EDIT MASTER TARIF ===');
    console.log('DATA:', item);
    console.log(
      'KOMPONEN TARIF:',
      item?.komponen_tarif
    );

    setSelectedTarif(item);

    setFormNama(
      item?.nama_template || ''
    );

    setFormLayanan(
      (
        item?.id_layanan ??
        item?.layanan?.id_layanan ??
        ''
      ).toString()
    );

    const includedIds = Array.isArray(item?.layanan_termasuk || item?.layananTermasuk)
      ? (item.layanan_termasuk || item.layananTermasuk).map((layanan) => Number(layanan.id_layanan ?? layanan.id))
      : [];
    const layananIds = Array.from(new Set([
      Number(item?.id_layanan ?? item?.layanan?.id_layanan),
      ...includedIds,
    ].filter((id) => !Number.isNaN(id))));
    setFormLayananIds(layananIds);
    setFormKategoriLayananIds([]);
    setLayananSearch('');
    setFormKategoriTarif(String(item?.id_kategori_tarif ?? item?.kategoriTarif?.id_kategori_tarif ?? ''));

    /*
     * PENTING:
     * GET /master-tarif mengembalikan:
     *
     * komponen_tarif: [
     *   {
     *     id_komponen: 1,
     *     ...
     *   }
     * ]
     *
     * Jadi checkbox harus membaca
     * id_komponen dari relationship tersebut.
     */
    const validKomponenIds =
      extractKomponenIds(item);

    console.log(
      'KOMPONEN IDS YANG AKAN DICENTANG:',
      validKomponenIds
    );

    setFormKomponenIds(
      validKomponenIds
    );

    setFormFeeNakesTipe(
      item?.fee_nakes_tipe ||
        'nominal'
    );

    setFormFeeNakesNilai(
  item.fee_nakes_tipe === 'nominal'
    ? String(Math.round(Number(item.fee_nakes_nilai) || 0))
    : String(item.fee_nakes_nilai ?? '')
);

    setFormIsTransport(normalizeBoolean(item?.is_transport, false));

    setFormActive(
      normalizeBoolean(
        item?.is_active,
        true
      )
    );

    setViewMode('edit');
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTarif(null);
  };

  /* =========================================================
     TOGGLE KOMPONEN
  ========================================================= */

  const toggleKomponen = (id) => {
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return;
    }

    setFormKomponenIds((prev) => {
      if (prev.includes(numericId)) {
        return prev.filter(
          (value) => value !== numericId
        );
      }

      return [
        ...prev,
        numericId,
      ];
    });
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    if (formIsTransport && hasTransportConflict) {
      Swal.fire('Transport sudah digunakan', 'Salah satu layanan yang dipilih sudah memiliki Master Tarif transport.', 'warning');
      setIsSubmitting(false);
      return;
    }

    /*
     * Validasi utama
     */
    if (
      !formNama.trim() ||
      !formKategoriTarif ||
      formLayananIds.length === 0 ||
      formKomponenIds.length === 0
    ) {
      Swal.fire(
        'Error',
        'Nama template, Kategori Tarif, minimal satu layanan, dan Komponen Tarif wajib diisi!',
        'error'
      );

      setIsSubmitting(false);
      return;
    }

    /*
     * Payload SESUAI Swagger API
     *
     * POST /master-tarif:
     * komponen_tarif_ids
     *
     * PUT /master-tarif/{id}:
     * komponen_tarif_ids
     */
    const payload = {
      nama_template:
        formNama.trim(),

      id_layanan: formLayananIds[0] || formLayanan,
      id_kategori_tarif: Number(formKategoriTarif),

      layanan_ids: formLayananIds,

      kategori_layanan_ids: formKategoriLayananIds.map(Number),

      komponen_tarif_ids:
        formKomponenIds
          .map((id) => parseInt(id, 10))
          .filter(
            (id) => !Number.isNaN(id)
          ),

      fee_nakes_tipe:
        formFeeNakesTipe,

      fee_nakes_nilai:
        parseFloat(
          parseFormattedNumber(formFeeNakesNilai)
        ) || 0,

      is_transport: Boolean(formIsTransport),

      is_active:
        Boolean(formActive),
    };

    console.log(
      '=== PAYLOAD MASTER TARIF ==='
    );
    console.log(payload);

    try {
      const idMaster =
        selectedTarif?.id_master_tarif ||
        selectedTarif?.id;

      if (
        viewMode === 'edit' &&
        idMaster
      ) {
        /*
         * UPDATE
         */
        await updateTarifData(
          idMaster,
          payload
        );

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Template master tarif diperbarui!',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        /*
         * CREATE
         */
        await createTarifData(
          payload
        );

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Template master tarif baru ditambahkan!',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      /*
       * Refresh list setelah create/update
       */
      await fetchData();

      setViewMode('list');
      setSelectedTarif(null);
    } catch (error) {
      console.error(
        'Gagal menyimpan master tarif:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text:
          error?.message ||
          'Terjadi kesalahan saat menyimpan data',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDeleteClick = (item) => {
    const idMaster =
      item?.id_master_tarif ||
      item?.id;

    Swal.fire({
      title: 'Hapus Master Tarif?',
      text: `Anda yakin ingin menghapus template "${item?.nama_template || ''}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return;
      }

      try {
        await deleteTarifData(
          idMaster
        );

        await Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Template tarif berhasil dihapus.',
          timer: 1500,
          showConfirmButton: false,
        });

        await fetchData();
      } catch (error) {
        console.error(
          'Gagal menghapus master tarif:',
          error
        );

        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text:
            error?.message ||
            'Gagal menghapus template tarif.',
        });
      }
    });
  };

  /* =========================================================
     FILTER + PAGINATION
  ========================================================= */

  const filteredTarif =
    tarifList.filter((item) => {
      const namaTemplate =
        item?.nama_template || '';

      return namaTemplate
        .toLowerCase()
        .includes(
          search.toLowerCase()
        );
    });

  const totalPages = Math.max(
    Math.ceil(
      filteredTarif.length /
        itemsPerPage
    ),
    1
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginatedData =
    filteredTarif.slice(
      startIndex,
      startIndex +
        itemsPerPage
    );

    const filteredLayanan = layananList.filter((layanan) => (
      layanan.nama.toLowerCase().includes(layananSearch.trim().toLowerCase())
    ));

  /* =========================================================
     FORM VIEW
  ========================================================= */

  if (
    viewMode === 'add' ||
    viewMode === 'edit'
  ) {
    return (
      <div className="w-full space-y-6 pb-10">
        {/* HEADER */}
        <div>
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <FaArrowLeft />

            <span>
              Kembali ke Master Tarif
            </span>
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* TITLE */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {viewMode === 'add'
                ? 'Tambah Template Master Tarif'
                : 'Edit Template Master Tarif'}
            </h2>

            <p className="text-sm text-slate-500 mt-0.5">
              Pilih layanan dan gabungkan
              komponen biaya untuk membuat
              template tarif.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* NAMA + LAYANAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* NAMA TEMPLATE */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Nama Template Tarif{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  maxLength={255}
                  placeholder="Contoh: Tarif Tindakan Medis Standar"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  value={formNama}
                  onChange={(e) =>
                    setFormNama(
                      e.target.value
                    )
                  }
                />
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Kategori Tarif <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formKategoriTarif}
                  onChange={(e) => setFormKategoriTarif(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Pilih kategori tarif</option>
                  {kategoriTarifList.map((kategori) => (
                    <option key={kategori.id_kategori_tarif} value={kategori.id_kategori_tarif}>{kategori.nama_kategori}</option>
                  ))}
                </select>
              </div>

              {/* KATEGORI & LAYANAN */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kategori Layanan <span className="text-slate-400 text-[10px] font-normal">(pilih satu/beberapa — seluruh layanan di kategori terpilih otomatis masuk)</span>
                  </label>
                  <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                    {kategoriLayananList.map((kat) => {
                      const checked = formKategoriLayananIds.includes(String(kat.id_kategori_layanan));
                      return (
                        <label key={kat.id_kategori_layanan} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-transparent bg-white text-slate-600 hover:border-slate-200'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const id = String(kat.id_kategori_layanan);
                              const newKatIds = checked
                                ? formKategoriLayananIds.filter((k) => k !== id)
                                : [...formKategoriLayananIds, id];
                              setFormKategoriLayananIds(newKatIds);
                              // Auto-select all layanan from selected kategori(s)
                              const autoLayananIds = layananList
                                .filter((l) => newKatIds.includes(String(getLayananCategoryId(l))))
                                .map((l) => l.id);
                              // Merge with manually selected ones not from any kategori
                              const manualIds = formLayananIds.filter(
                                (id) => !layananList.find((l) => l.id === id && formKategoriLayananIds.includes(String(getLayananCategoryId(l))))
                              );
                              setFormLayananIds([...new Set([...autoLayananIds, ...manualIds])]);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate font-medium">{kat.nama_kategori}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formKategoriLayananIds.length} kategori dipilih</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Layanan <span className="text-red-500">*</span>
                    </label>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600">{formLayananIds.length} dipilih</span>
                  </div>
                  <div className="mb-2 flex gap-2">
                    <input
                      type="search"
                      value={layananSearch}
                      onChange={(event) => setLayananSearch(event.target.value)}
                      placeholder="Cari layanan..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setFormLayananIds((current) => [...new Set([...current, ...filteredLayanan.map((layanan) => layanan.id)])])}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Pilih hasil
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormLayananIds((current) => current.filter((id) => !filteredLayanan.some((layanan) => layanan.id === id)))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Hapus hasil
                    </button>
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                    {filteredLayanan.map((layanan) => {
                      const checked = formLayananIds.includes(layanan.id);
                      const fromKat = formKategoriLayananIds.includes(String(getLayananCategoryId(layanan)));
                      return (
                        <label key={layanan.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? (fromKat ? 'border-blue-200 bg-blue-50/60 text-blue-800' : 'border-green-300 bg-green-50 text-green-800') : 'border-transparent bg-white text-slate-600 hover:border-slate-200'}`}>
                          <input type="checkbox" checked={checked} onChange={() => setFormLayananIds((current) => checked ? current.filter((id) => id !== layanan.id) : [...current, layanan.id])} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                          <span className="truncate flex-1">{layanan.nama}</span>
                          {fromKat && <span className="ml-auto shrink-0 text-[10px] text-blue-400 font-medium">Dari Kategori</span>}
                        </label>
                      );
                    })}
                  </div>
                  {filteredLayanan.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-400">Layanan tidak ditemukan.</p>}
                  <p className="mt-1 text-xs text-slate-500">{formLayananIds.length} layanan dipilih. Gunakan pencarian untuk memilih banyak layanan dengan cepat.</p>
                </div>
              </div>
            </div>

            {/* KOMPONEN TARIF */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Pilih Komponen Tarif{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {komponenList.length >
                0 ? (
                  komponenList.map(
                    (komponen) => {
                      const numericId =
                        Number(
                          komponen.id
                        );

                      const isChecked =
                        formKomponenIds.includes(
                          numericId
                        );

                      return (
                        <label
                          key={
                            numericId
                          }
                          className={`flex items-start gap-2 p-2 rounded-lg bg-white border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-green-400 bg-green-50/50'
                              : 'border-slate-100 hover:border-green-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              isChecked
                            }
                            onChange={() =>
                              toggleKomponen(
                                numericId
                              )
                            }
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />

                          <div className="text-xs">
                            {/* NAMA */}
                            <div className="font-semibold text-slate-700">
                              {komponen.nama ||
                                komponen.nama_komponen}
                            </div>

                            {/* INFO */}
                            <div className="text-slate-500">
                              {komponen.tipe_komponen ||
                                komponen.tipe ||
                                '-'}{' '}
                              |{' '}
                              {String(
                                komponen.jenis_nilai
                              ).toLowerCase() ===
                                'persen'
                                ? `Persen: ${komponen.nilai ?? 0}%`
                                : `Nominal: ${formatRupiah(
                                    komponen.nilai
                                  )}`}
                            </div>
                          </div>
                        </label>
                      );
                    }
                  )
                ) : (
                  <p className="text-sm text-red-500 col-span-2">
                    Data Komponen Tarif kosong
                    atau gagal dimuat!
                  </p>
                )}
              </div>

              {/* JUMLAH KOMPONEN */}
              <div className="mt-2 text-xs text-slate-500">
                {formKomponenIds.length >
                0
                  ? `${formKomponenIds.length} komponen dipilih`
                  : 'Belum ada komponen dipilih'}
              </div>
            </div>

            {/* FEE NAKES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* TIPE */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Tipe Fee Nakes
                </label>

                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all bg-white"
                  value={
                    formFeeNakesTipe
                  }
                  onChange={(e) =>
                    setFormFeeNakesTipe(
                      e.target.value
                    )
                  }
                >
                  <option value="nominal">
                    Nominal (Rp)
                  </option>

                  <option value="persen">
                    Persen (%)
                  </option>
                </select>
              </div>

              {/* NILAI */}
              <div>
  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
    Nilai Fee Nakes <span className="text-red-500">*</span>
  </label>

  {formFeeNakesTipe === 'nominal' ? (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        Rp
      </span>

      <input
        type="text"
        inputMode="numeric"
        required
        value={formatDisplayNumber(formFeeNakesNilai)}
        onChange={(e) =>
          setFormFeeNakesNilai(
            parseFormattedNumber(e.target.value)
          )
        }
        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all bg-slate-50/50"
        placeholder="Contoh: 50.000"
      />
    </div>
  ) : (
    <input
      type="number"
      required
      min="0"
      step="0.01"
      value={formFeeNakesNilai}
      onChange={(e) =>
        setFormFeeNakesNilai(e.target.value)
      }
      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all bg-slate-50/50"
      placeholder="Contoh: 30"
    />
  )}
</div>
            </div>

            {/* TRANSPORT + STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* IS TRANSPORT */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Termasuk Biaya Transport
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={hasTransportConflict}
                    className={
                      'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                      (formIsTransport === true
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                        : hasTransportConflict
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                    }
                    onClick={() => setFormIsTransport(true)}
                  >
                    Ya (Termasuk)
                  </button>
                  <button
                    type="button"
                    className={
                      'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                      (formIsTransport === false
                        ? 'border-slate-600 bg-slate-100 text-slate-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                    }
                    onClick={() => setFormIsTransport(false)}
                  >
                    Tidak
                  </button>
                </div>
                {hasTransportConflict && (
                  <p className="mt-2 text-xs text-amber-600">
                    Salah satu layanan sudah memiliki Master Tarif transport.
                  </p>
                )}
              </div>

              {/* STATUS */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Status Aktif
                </label>

              <div className="flex gap-3 max-w-sm">
                <button
                  type="button"
                  className={
                    'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                    (formActive ===
                    true
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                  }
                  onClick={() =>
                    setFormActive(
                      true
                    )
                  }
                >
                  Aktif
                </button>

                <button
                  type="button"
                  className={
                    'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                    (formActive ===
                    false
                      ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                  }
                  onClick={() =>
                    setFormActive(
                      false
                    )
                  }
                >
                  Nonaktif
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={
                handleBackToList
              }
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600/20 transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-2"
            >
              <FaSave />

              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : 'Simpan Template Tarif'}
              </span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================================================
     LIST VIEW
  ========================================================= */

  return (
    <div className="w-full space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Master Tarif
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            Kelola skema template perhitungan
            tarif dan bagi hasil hak nakes.
          </p>
        </div>

        <button
          onClick={
            handleOpenAddForm
          }
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm shadow-green-600/20 transition-all cursor-pointer"
        >
          <FaPlus />

          <span>
            Tambah Template Tarif
          </span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 flex-grow focus-within:border-green-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
          <FaSearch className="text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );
              setCurrentPage(1);
            }}
            placeholder="Cari nama template tarif..."
            className="w-full bg-transparent outline-none text-slate-800"
          />
        </div>
      </div>

      {/* ERROR */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">
              Memuat data master tarif...
            </p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4 text-center w-12">
                    No.
                  </th>

                  <th className="px-5 py-4">
                    Nama Template
                  </th>

                  <th className="px-5 py-4">
                    Layanan
                  </th>

                  <th className="px-5 py-4">
                    Komponen Tarif
                  </th>

                  <th className="px-5 py-4 text-center">
                    Fee Nakes
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center w-24">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedData.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      Tidak ada template
                      tarif yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(
                    (
                      item,
                      index
                    ) => {
                      const idMaster =
                        item?.id_master_tarif ||
                        item?.id;

                      const rowNumber =
                        startIndex +
                        index +
                        1;

                      const namaLayananList = getTarifServiceIds(item).map((serviceId) => (
                        layananList.find((layanan) => layanan.id === serviceId)?.nama
                          || (serviceId === Number(item?.id_layanan) ? item?.layanan?.nama_layanan : null)
                          || `Layanan #${serviceId}`
                      ));

                      const komponenText =
                        getKomponenNames(
                          item
                        );

                      const isActive =
                        normalizeBoolean(
                          item?.is_active,
                          true
                        );

                      return (
                        <tr
                          key={
                            idMaster
                          }
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {/* NO */}
                          <td className="px-4 py-4 text-center font-medium text-slate-500">
                            {rowNumber}
                          </td>

                          {/* NAMA */}
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {item?.nama_template}
                            </div>
                          </td>

                          {/* LAYANAN */}
                          <td className="px-5 py-4">
                            <div className="flex max-w-sm flex-wrap gap-1.5">
                              {namaLayananList.map((nama) => (
                                <span key={nama} className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                  {nama}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* KOMPONEN */}
                          <td className="px-5 py-4">
                            <div className="text-xs text-slate-700 max-w-xs">
                              {
                                komponenText
                              }
                            </div>
                          </td>

                          {/* FEE NAKES */}
                          <td className="px-5 py-4 text-center">
                            <div className="text-sm font-medium text-slate-800">
                              {item?.fee_nakes_tipe ===
                              'persen'
                                ? `${item?.fee_nakes_nilai ?? 0}%`
                                : formatRupiah(
                                    item?.fee_nakes_nilai
                                  )}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isActive
                                ? 'Aktif'
                                : 'Nonaktif'}
                            </span>
                          </td>

                          {/* AKSI */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* EDIT */}
                              <button
                                onClick={() =>
                                  handleOpenEditForm(
                                    item
                                  )
                                }
                                className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Template"
                              >
                                <FaEdit />
                              </button>

                              {/* DELETE */}
                              <button
                                onClick={() =>
                                  handleDeleteClick(
                                    item
                                  )
                                }
                                className="p-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                                title="Hapus Template"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!loading &&
          filteredTarif.length >
            0 && (
            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                onPageChange={
                  setCurrentPage
                }
              />
            </div>
          )}
      </div>
    </div>
  );
}