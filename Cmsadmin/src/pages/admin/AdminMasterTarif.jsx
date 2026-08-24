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
import {
  getAllWilayahLayanan,
  getAllKotaKabupaten,
} from '../../data/wilayahLayananData';
import Swal from 'sweetalert2';

export default function AdminMasterTarif() {
  const [viewMode, setViewMode] = useState('list');

  const [tarifList, setTarifList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [kategoriLayananList, setKategoriLayananList] = useState([]);
  const [kategoriTarifList, setKategoriTarifList] = useState([]);
  const [komponenList, setKomponenList] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedTarif, setSelectedTarif] = useState(null);

  const [formNama, setFormNama] = useState('');
  const [formLayanan, setFormLayanan] = useState('');
  const [formLayananIds, setFormLayananIds] = useState([]);
  const [formKategoriLayanan, setFormKategoriLayanan] = useState('');
  const [formKategoriTarif, setFormKategoriTarif] = useState('');
  const [formKomponenIds, setFormKomponenIds] = useState([]);
  const [formIdProvinsi, setFormIdProvinsi] = useState('');
  const [formIdKota, setFormIdKota] = useState('');
  const [formFeeNakesTipe, setFormFeeNakesTipe] = useState('nominal');
  const [formFeeNakesNilai, setFormFeeNakesNilai] = useState('');
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

  const getProvinsiName = (id) => {
    if (!id) {
      return 'Nasional';
    }

    const found = provinsiList.find(
      (provinsi) =>
        String(provinsi.id_provinsi) === String(id)
    );

    return found?.nama_provinsi || id;
  };

  const getKotaName = (id) => {
    if (!id) {
      return 'Semua Kota';
    }

    const found = kotaList.find(
      (kota) => String(kota.id_kota) === String(id)
    );

    return found?.nama_kota || id;
  };

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
        provinsiRes,
        kotaRes,
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

        getAllWilayahLayanan().catch((error) => {
          console.error('Gagal GET wilayah layanan:', error);
          return [];
        }),

        getAllKotaKabupaten().catch((error) => {
          console.error('Gagal GET kota kabupaten:', error);
          return [];
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
         KOTA
      ----------------------------------------- */

      const rawKota = Array.isArray(kotaRes)
        ? kotaRes
        : kotaRes?.data || [];

      const normalizedKota = rawKota
        .map((kota) => ({
          ...kota,

          id_kota: Number(
            kota.id_kota ??
              kota.id
          ),

          id_provinsi:
            kota.id_provinsi ??
            kota.provinsi_id,

          nama_kota:
            kota.nama_kota ||
            kota.nama ||
            '',
        }))
        .filter(
          (kota) =>
            !Number.isNaN(kota.id_kota)
        );

      /* -----------------------------------------
         PROVINSI
      ----------------------------------------- */

      const rawProvinsi = Array.isArray(provinsiRes)
        ? provinsiRes
        : provinsiRes?.data || [];

      const normalizedProvinsi = rawProvinsi
        .map((provinsi) => ({
          ...provinsi,

          id_provinsi: Number(
            provinsi.id_provinsi ??
              provinsi.provinsi_id ??
              provinsi.id
          ),

          nama_provinsi:
            provinsi.nama_provinsi ||
            provinsi.nama ||
            '',
        }))
        .filter(
          (provinsi) =>
            !Number.isNaN(provinsi.id_provinsi)
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
      setProvinsiList(normalizedProvinsi);
      setKotaList(normalizedKota);

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
    fetchData();
  }, []);

  /* =========================================================
     ADD FORM
  ========================================================= */

  const handleOpenAddForm = () => {
    setSelectedTarif(null);

    setFormNama('');
    setFormLayanan('');
    setFormLayananIds([]);
    setFormKategoriLayanan('');
    setFormKategoriTarif('');
    setFormKomponenIds([]);
    setFormIdProvinsi('');
    setFormIdKota('');
    setFormFeeNakesTipe('nominal');
    setFormFeeNakesNilai('');
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
    setFormKategoriLayanan('');
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

    setFormIdProvinsi(
      (
        item?.id_provinsi ??
        ''
      ).toString()
    );

    setFormIdKota(
      (
        item?.id_kota ??
        ''
      ).toString()
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

      id_kategori_layanan: formKategoriLayanan || null,

      komponen_tarif_ids:
        formKomponenIds
          .map((id) => parseInt(id, 10))
          .filter(
            (id) => !Number.isNaN(id)
          ),

      id_provinsi:
        formIdProvinsi || null,

      id_kota:
        formIdKota || null,

      fee_nakes_tipe:
        formFeeNakesTipe,

      fee_nakes_nilai:
        parseFloat(
          formFeeNakesNilai
        ) || 0,

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

              {/* LAYANAN */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Layanan (bisa lebih dari satu) <span className="text-red-500">*</span>
                </label>
                <select
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  value={formKategoriLayanan}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    setFormKategoriLayanan(categoryId);
                    if (categoryId) {
                      setFormLayananIds(layananList.filter((item) => String(item.kategori) === categoryId).map((item) => item.id));
                    }
                  }}
                >
                  <option value="">Pilih kategori untuk mengambil semua layanan</option>
                  {kategoriLayananList.map((kategori) => (
                    <option key={kategori.id_kategori_layanan} value={kategori.id_kategori_layanan}>{kategori.nama_kategori}</option>
                  ))}
                </select>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                  {layananList.map((layanan) => {
                    const checked = formLayananIds.includes(layanan.id);
                    return (
                      <label key={layanan.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-green-300 bg-green-50 text-green-800' : 'border-transparent bg-white text-slate-600 hover:border-slate-200'}`}>
                        <input type="checkbox" checked={checked} onChange={() => setFormLayananIds((current) => checked ? current.filter((id) => id !== layanan.id) : [...current, layanan.id])} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="truncate">{layanan.nama}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-slate-500">{formLayananIds.length} layanan dipilih. Kategori akan mengambil seluruh layanan di dalamnya.</p>
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

            {/* PROVINSI + KOTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* PROVINSI */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Provinsi (Opsional)
                </label>

                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all bg-white"
                  value={
                    formIdProvinsi
                  }
                  onChange={(e) => {
                    setFormIdProvinsi(
                      e.target.value
                    );

                    setFormIdKota('');
                  }}
                >
                  <option value="">
                    Nasional / Semua Provinsi
                  </option>

                  {provinsiList.map(
                    (provinsi) => (
                      <option
                        key={
                          provinsi.id_provinsi
                        }
                        value={
                          provinsi.id_provinsi
                        }
                      >
                        {
                          provinsi.nama_provinsi
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* KOTA */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Kota/Kabupaten (Opsional)
                </label>

                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all bg-white"
                  value={formIdKota}
                  onChange={(e) =>
                    setFormIdKota(
                      e.target.value
                    )
                  }
                  disabled={
                    !formIdProvinsi
                  }
                >
                  <option value="">
                    Semua Kota di Provinsi
                  </option>

                  {kotaList
                    .filter(
                      (kota) =>
                        !formIdProvinsi ||
                        String(
                          kota.id_provinsi
                        ) ===
                          String(
                            formIdProvinsi
                          )
                    )
                    .map(
                      (kota) => (
                        <option
                          key={
                            kota.id_kota
                          }
                          value={
                            kota.id_kota
                          }
                        >
                          {
                            kota.nama_kota
                          }
                        </option>
                      )
                    )}
                </select>
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

                  <th className="px-5 py-4">
                    Provinsi
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
                      colSpan="8"
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

                      const namaLayanan =
                        layananList.find(
                          (layanan) =>
                            String(
                              layanan.id
                            ) ===
                            String(
                              item?.id_layanan
                            )
                        )?.nama ||
                        item?.layanan
                          ?.nama_layanan ||
                        item?.id_layanan ||
                        'Tidak ditemukan';

                      const komponenText =
                        getKomponenNames(
                          item
                        );

                      const namaProvinsi =
                        getProvinsiName(
                          item?.id_provinsi
                        );

                      const namaKota =
                        getKotaName(
                          item?.id_kota
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
                              {
                                item?.nama_template
                              }
                            </div>
                          </td>

                          {/* LAYANAN */}
                          <td className="px-5 py-4">
                            <div className="text-teal-600 font-medium">
                              {
                                namaLayanan
                              }
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

                          {/* PROVINSI */}
                          <td className="px-5 py-4">
                            <div className="text-xs text-slate-700">
                              {
                                namaProvinsi
                              }

                              {item?.id_kota
                                ? ` - ${namaKota}`
                                : ''}
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