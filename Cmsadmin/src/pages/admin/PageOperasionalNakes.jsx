import { useEffect, useState } from 'react';
import {
  getAllOperasionalNakes,
  approveOperasionalNakes,
  rejectOperasionalNakes,
} from '../../data/nakesOperasionalData';
import { getKategoriLayanan } from '../../data/nakesData';
import { getAllWilayahLayanan } from '../../data/wilayahLayananData';
import { resolveImageUrl } from '../../utils/resolveImage';

export default function PageOperasionalNakes() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Master data
  const [masterKategoriMap, setMasterKategoriMap] = useState({});
  const [listKategori, setListKategori] = useState([]);
  const [masterWilayahMap, setMasterWilayahMap] = useState({});
  const [listWilayah, setListWilayah] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [wilayahFilter, setWilayahFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal / action
  const [detailTarget, setDetailTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Success popup
  const [successMessage, setSuccessMessage] = useState('');

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    setLoading(true);
    setErrorMsg('');

    try {
      const [
        opData,
        katData,
        wilData,
      ] = await Promise.all([
        getAllOperasionalNakes(),
        getKategoriLayanan().catch(() => []),
        getAllWilayahLayanan().catch(() => []),
      ]);

      const operationalList = Array.isArray(opData)
        ? opData
        : opData?.data || [];

      setRequests(operationalList);

      // -----------------------------------------------------
      // MASTER KATEGORI
      // -----------------------------------------------------

      const kategoriMap = {};
      const kategoriNames = [];

      if (Array.isArray(katData)) {
        katData.forEach((item) => {
          const id =
            item?.id ??
            item?.id_kategori_layanan;

          const name =
            item?.nama_kategori ??
            item?.nama;

          if (
            id !== undefined &&
            id !== null &&
            name
          ) {
            kategoriMap[id] = name;
          }

          if (name) {
            kategoriNames.push(name);
          }
        });
      }

      setMasterKategoriMap(kategoriMap);
      setListKategori(
        Array.from(new Set(kategoriNames))
      );

      // -----------------------------------------------------
      // MASTER WILAYAH
      // -----------------------------------------------------

      const wilayahMap = {};
      const wilayahNames = [];

      if (Array.isArray(wilData)) {
        wilData.forEach((item) => {
          const id =
            item?.id ??
            item?.id_wilayah_layanan ??
            item?.id_provinsi;

          const name =
            item?.nama_provinsi ??
            item?.nama_wilayah ??
            item?.nama;

          if (
            id !== undefined &&
            id !== null &&
            name
          ) {
            wilayahMap[id] = name;
          }

          if (name) {
            wilayahNames.push(name);
          }
        });
      }

      setMasterWilayahMap(wilayahMap);
      setListWilayah(
        Array.from(new Set(wilayahNames))
      );
    } catch (error) {
      setErrorMsg(
        error?.message ||
          'Gagal memuat data operasional nakes'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    kategoriFilter,
    wilayahFilter,
  ]);

  // =========================================================
  // HELPERS
  // =========================================================

  const resolveCategoryNames = (raw) => {
    if (!raw) return [];

    const list = Array.isArray(raw)
      ? raw
      : [raw];

    return list
      .map((item) => {
        if (
          typeof item === 'object' &&
          item !== null
        ) {
          return (
            item?.nama_kategori ||
            item?.nama ||
            ''
          );
        }

        return (
          masterKategoriMap[item] ||
          masterKategoriMap[String(item)] ||
          ''
        );
      })
      .filter(Boolean);
  };

  const getWilayahText = (item) => {
    if (!item) return '-';

    const wilayahId =
      item?.id_wilayah_layanan ??
      item?.id_wilayah;

    if (
      wilayahId !== undefined &&
      wilayahId !== null
    ) {
      const mapped =
        masterWilayahMap[wilayahId] ??
        masterWilayahMap[
          String(wilayahId)
        ];

      if (mapped) {
        return mapped;
      }
    }

    const wilayahObject =
      item?.wilayah_layanan ??
      item?.wilayah_operasional;

    if (
      wilayahObject &&
      typeof wilayahObject === 'object'
    ) {
      return (
        wilayahObject?.nama_provinsi ||
        wilayahObject?.nama_wilayah ||
        wilayahObject?.nama ||
        '-'
      );
    }

    if (
      typeof wilayahObject === 'string' &&
      wilayahObject.trim()
    ) {
      return wilayahObject;
    }

    return '-';
  };

  const normalizeSchedule = (value) => {
    if (!value) return [];

    let result = value;

    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch {
        return [];
      }
    }

    return Array.isArray(result)
      ? result.filter(
          (item) =>
            item &&
            item.hari &&
            item.jam_mulai &&
            item.jam_selesai
        )
      : [];
  };

  const formatSchedule = (value) => {
    const waktu =
      normalizeSchedule(value);

    if (waktu.length === 0) {
      return '-';
    }

    const first = waktu[0];
    const last =
      waktu[waktu.length - 1];

    const jamMulai = String(
      first?.jam_mulai || ''
    ).slice(0, 5);

    const jamSelesai = String(
      first?.jam_selesai || ''
    ).slice(0, 5);

    if (
      first?.hari ===
      last?.hari
    ) {
      return `${first.hari}, ${jamMulai} - ${jamSelesai}`;
    }

    return `${first.hari} - ${last.hari}, ${jamMulai} - ${jamSelesai}`;
  };

  /**
   * Identitas nakes untuk mencari
   * data approved milik nakes yang sama.
   */
  const getNakesKey = (item) => {
    if (!item) return '';

    const tenagaMedisId =
      item?.id_tenaga_medis ??
      item?.tenaga_medis
        ?.id_tenaga_medis ??
      item?.id_nakes ??
      item?.nakes?.id_nakes ??
      item?.id_user ??
      item?.tenaga_medis?.id_user;

    if (
      tenagaMedisId !== undefined &&
      tenagaMedisId !== null &&
      tenagaMedisId !== ''
    ) {
      return `id:${tenagaMedisId}`;
    }

    const nama =
      item?.tenaga_medis
        ?.nama_lengkap ??
      item?.nama_lengkap ??
      item?.nama ??
      item?.nakes?.nama_lengkap ??
      item?.user?.name ??
      '';

    const str =
      item?.tenaga_medis
        ?.nomor_str ??
      item?.tenaga_medis?.no_str ??
      item?.no_str ??
      item?.str ??
      item?.nakes?.no_str ??
      '';

    return `name:${String(nama)
      .trim()
      .toLowerCase()}|str:${String(str)
      .trim()
      .toLowerCase()}`;
  };

  const findActiveRecord = (item) => {
    if (!item) return null;

    if (
      item?.data_aktif &&
      typeof item.data_aktif ===
        'object'
    ) {
      return item.data_aktif;
    }

    const targetKey =
      getNakesKey(item);

    if (!targetKey) return null;

    const approved =
      requests
        .filter((candidate) => {
          const status =
            String(
              candidate?.status || ''
            ).toLowerCase();

          return (
            status === 'approved' &&
            getNakesKey(candidate) ===
              targetKey
          );
        })
        .sort((a, b) => {
          const dateA = new Date(
            a?.updated_at ||
              a?.created_at ||
              0
          ).getTime();

          const dateB = new Date(
            b?.updated_at ||
              b?.created_at ||
              0
          ).getTime();

          return dateB - dateA;
        });

    return approved[0] || null;
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filtered = requests.filter(
    (item) => {
      const status =
        String(item?.status || '').toLowerCase();

      if (
        status === 'approved' ||
        status === 'rejected'
      ) {
        return false;
      } 

      const query = search
        .trim()
        .toLowerCase();

      const nama = String(
        item?.tenaga_medis
          ?.nama_lengkap ??
          item?.nama_lengkap ??
          item?.nama ??
          item?.nakes
            ?.nama_lengkap ??
          item?.user?.name ??
          ''
      ).toLowerCase();

      const str = String(
        item?.tenaga_medis
          ?.nomor_str ??
          item?.tenaga_medis
            ?.no_str ??
          item?.no_str ??
          item?.str ??
          item?.nakes?.no_str ??
          ''
      ).toLowerCase();

      const jenis = String(
        item?.jenis_nakes ??
          item?.jenis_tenaga_medis ??
          item?.nakes?.jenis_nakes ??
          ''
      ).toLowerCase();

      const wilayah =
        getWilayahText(item);

      const kategoriList =
        resolveCategoryNames(
          item?.kategori_layanan ??
            item?.layanan ??
            item?.kategori ??
            item?.nakes?.kategori ??
            []
        );

      if (
        wilayahFilter !== 'all' &&
        wilayah !== wilayahFilter
      ) {
        return false;
      }

      if (
        kategoriFilter !== 'all' &&
        !kategoriList.includes(
          kategoriFilter
        )
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        nama.includes(query) ||
        str.includes(query) ||
        jenis.includes(query)
      );
    }
  );

  const totalPages = Math.max(
    Math.ceil(
      filtered.length /
        itemsPerPage
    ),
    1
  );

  const paginatedData =
    filtered.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    );

  // =========================================================
  // SUCCESS POPUP
  // =========================================================

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // =========================================================
  // APPROVE
  // =========================================================

  async function handleConfirmApprove() {
    if (!approveTarget) return;

    const targetId =
      approveTarget?.id_operasional_nakes ??
      approveTarget?.id_tenaga_medis ??
      approveTarget?.id;

    setProcessing(true);

    try {
      await approveOperasionalNakes(
        targetId
      );

      setApproveTarget(null);
      setDetailTarget(null);

      await loadData();

      showSuccess(
        'Pengajuan operasional berhasil disetujui.'
      );
    } catch (error) {
      alert(
        error?.message ||
          'Gagal menyetujui operasional nakes'
      );
    } finally {
      setProcessing(false);
    }
  }

  // =========================================================
  // REJECT
  // =========================================================

  async function handleConfirmReject() {
    if (!rejectTarget) return;

    const targetId =
      rejectTarget?.id_operasional_nakes ??
      rejectTarget?.id_tenaga_medis ??
      rejectTarget?.id;

    setProcessing(true);

    try {
      await rejectOperasionalNakes(
        targetId,
        adminNotes
      );

      setRejectTarget(null);
      setDetailTarget(null);
      setAdminNotes('');

      await loadData();

      showSuccess(
        'Pengajuan operasional berhasil ditolak.'
      );
    } catch (error) {
      alert(
        error?.message ||
          'Gagal menolak operasional nakes'
      );
    } finally {
      setProcessing(false);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          SUCCESS POPUP - CENTER
          ===================================================== */}

      {successMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 text-center">

            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Berhasil
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {successMessage}
            </p>

          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Operasional Nakes
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Kelola verifikasi operasional dan wilayah izin tugas tenaga kesehatan.
        </p>
      </div>

      {/* =====================================================
          FILTER
          ===================================================== */}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">

        <div className="relative w-full md:w-[360px]">

          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
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
            placeholder="Cari nama, jenis nakes, atau STR..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto gap-3 items-center">

          <select
            value={kategoriFilter}
            onChange={(e) =>
              setKategoriFilter(
                e.target.value
              )
            }
            className="w-full md:w-[200px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer focus:bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">
              Semua Kategori
            </option>

            {listKategori.map(
              (kategori, index) => (
                <option
                  key={index}
                  value={kategori}
                >
                  {kategori}
                </option>
              )
            )}
          </select>

          <select
            value={wilayahFilter}
            onChange={(e) =>
              setWilayahFilter(
                e.target.value
              )
            }
            className="w-full md:w-[200px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer focus:bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">
              Semua Wilayah
            </option>

            {listWilayah.map(
              (wilayah, index) => (
                <option
                  key={index}
                  value={wilayah}
                >
                  {wilayah}
                </option>
              )
            )}
          </select>

        </div>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* =====================================================
          TABLE
          ===================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Memuat data operasional nakes...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">

              <table className="w-full text-left border-collapse">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      NO
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      NAKES
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      KATEGORI DIAJUKAN
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      WILAYAH OPERASIONAL
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      JADWAL DIAJUKAN
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      STATUS
                    </th>

                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                      AKSI
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paginatedData.length > 0 ? (
                    paginatedData.map(
                      (item, index) => {

                        const reqId =
                          item?.id_operasional_nakes ??
                          item?.id_tenaga_medis ??
                          item?.id;

                        const itemNumber =
                          (currentPage - 1) *
                            itemsPerPage +
                          index +
                          1;

                        const nama =
                          item?.tenaga_medis
                            ?.nama_lengkap ??
                          item?.nama_lengkap ??
                          item?.nama ??
                          item?.nakes
                            ?.nama_lengkap ??
                          item?.user?.name ??
                          '-';

                        const str =
                          item?.tenaga_medis
                            ?.nomor_str ??
                          item?.tenaga_medis
                            ?.no_str ??
                          item?.no_str ??
                          item?.str ??
                          item?.nakes
                            ?.no_str ??
                          '-';

                        const foto =
                          item?.tenaga_medis
                            ?.foto_profile ??
                          item?.foto_profile ??
                          item?.foto ??
                          item?.avatar;

                        const resolvedFoto =
                          foto
                            ? resolveImageUrl(
                                foto
                              )
                            : null;

                        const status =
                          String(
                            item?.status ||
                              'pending'
                          ).toLowerCase();

                        // DATA YANG DIAJUKAN
                        const kategoriList =
                          resolveCategoryNames(
                            item?.kategori_layanan ??
                              item?.layanan ??
                              item?.kategori ??
                              item?.nakes
                                ?.kategori ??
                              []
                          );

                        const wilayah =
                          getWilayahText(
                            item
                          );

                        const schedule =
                          formatSchedule(
                            item?.waktu_layanan
                          );

                        return (
                          <tr
                            key={
                              reqId ||
                              index
                            }
                            className="hover:bg-slate-50/60 transition-colors"
                          >

                            <td className="py-4 px-6 text-sm font-medium text-slate-400">
                              {itemNumber}
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">

                                {resolvedFoto ? (
                                  <img
                                    src={
                                      resolvedFoto
                                    }
                                    alt={
                                      nama
                                    }
                                    className="w-10 h-10 rounded-full object-cover bg-slate-100"
                                    onError={(
                                      e
                                    ) => {
                                      e.currentTarget.src =
                                        '/nakesgambar.jpg';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                                    {String(
                                      nama
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>
                                )}

                                <div>
                                  <div className="font-semibold text-slate-800 text-sm">
                                    {nama}
                                  </div>

                                  <div className="text-xs text-slate-400">
                                    STR:{" "}
                                    {str}
                                  </div>
                                </div>

                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">

                                {kategoriList.length >
                                0 ? (
                                  kategoriList.map(
                                    (
                                      kategori,
                                      katIndex
                                    ) => (
                                      <span
                                        key={
                                          katIndex
                                        }
                                        className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-100"
                                      >
                                        {
                                          kategori
                                        }
                                      </span>
                                    )
                                  )
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    -
                                  </span>
                                )}

                              </div>
                            </td>

                            <td className="py-4 px-6 text-sm font-medium text-slate-700">
                              {
                                wilayah
                              }
                            </td>

                            <td className="py-4 px-6 text-sm font-medium text-slate-700">
                              {
                                schedule
                              }
                            </td>

                            <td className="py-4 px-6 text-sm">

                              <span
                                className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                  status ===
                                  'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {status.toUpperCase()}
                              </span>

                            </td>

                            <td className="py-4 px-6 text-right">

                              <div className="flex items-center justify-end gap-2">

                                <button
                                  onClick={() =>
                                    setDetailTarget(
                                      item
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  {status ===
                                  'pending'
                                    ? 'Review Perubahan'
                                    : 'Detail'}
                                </button>

                                {status ===
                                  'pending' && (
                                  <>
                                    <button
                                      onClick={() =>
                                        setApproveTarget(
                                          item
                                        )
                                      }
                                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                      Setujui
                                    </button>

                                    <button
                                      onClick={() => {
                                        setRejectTarget(
                                          item
                                        );
                                        setAdminNotes(
                                          ''
                                        );
                                      }}
                                      className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                    >
                                      Tolak
                                    </button>
                                  </>
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-14 px-6 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">

                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>

                          <p className="text-sm font-semibold text-slate-700">
                            Tidak ada pengajuan operasional
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            Semua pengajuan sudah selesai diproses atau belum ada data baru.
                          </p>

                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
                ================================================= */}

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">

              <div className="text-xs text-slate-500">
                Halaman{" "}
                <span className="font-medium text-slate-800">
                  {currentPage}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-slate-800">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-1.5">

                <button
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.max(
                          prev - 1,
                          1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map(
                  (pageNum) => (
                    <button
                      key={
                        pageNum
                      }
                      onClick={() =>
                        setCurrentPage(
                          pageNum
                        )
                      }
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        pageNum ===
                        currentPage
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {
                        pageNum
                      }
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.min(
                          prev + 1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40"
                >
                  Selanjutnya →
                </button>

              </div>
            </div>
          </>
        )}

      </div>

      {/* =====================================================
          MODAL REVIEW / DETAIL
          ===================================================== */}

      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {String(
                    detailTarget?.status ||
                      ''
                  ).toLowerCase() ===
                  'pending'
                    ? 'Review Perubahan Operasional'
                    : 'Detail Operasional'}
                </h3>

                <p className="text-xs text-slate-500">
                  {detailTarget
                    ?.tenaga_medis
                    ?.nama_lengkap ??
                    detailTarget
                      ?.nama_lengkap ??
                    detailTarget?.nama ??
                    '-'}
                </p>
              </div>

              <button
                onClick={() =>
                  setDetailTarget(
                    null
                  )
                }
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            {(() => {

              const status =
                String(
                  detailTarget?.status ||
                    'pending'
                ).toLowerCase();

              const activeObj =
                status === 'pending'
                  ? findActiveRecord(
                      detailTarget
                    )
                  : null;

              const activeWil =
                activeObj
                  ? getWilayahText(
                      activeObj
                    )
                  : '-';

              const proposedWil =
                getWilayahText(
                  detailTarget
                );

              const activeKat =
                activeObj
                  ? resolveCategoryNames(
                      activeObj?.kategori_layanan ??
                        []
                    ).join(', ') ||
                    '-'
                  : '-';

              const proposedKat =
                resolveCategoryNames(
                  detailTarget?.kategori_layanan ??
                    []
                ).join(', ') ||
                '-';

              const activeSchedule =
                activeObj
                  ? formatSchedule(
                      activeObj?.waktu_layanan
                    )
                  : '-';

              const proposedSchedule =
                formatSchedule(
                  detailTarget?.waktu_layanan
                );

              const wilChanged =
                activeWil !==
                proposedWil;

              const katChanged =
                activeKat !==
                proposedKat;

              const scheduleChanged =
                activeSchedule !==
                proposedSchedule;

              return (
                <div className="space-y-4">

                  {status ===
                  'pending' ? (

                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-4">

                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Perubahan yang Diajukan
                      </h4>

                      {wilChanged && (
                        <div className="border-b border-amber-200/40 pb-3">

                          <p className="text-[11px] font-semibold text-amber-700 uppercase">
                            Wilayah Layanan
                          </p>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">

                            <span className="text-xs font-medium text-slate-500 line-through">
                              {
                                activeWil
                              }
                            </span>

                            <span className="text-xs text-slate-400">
                              →
                            </span>

                            <span className="text-xs font-bold text-amber-900">
                              {
                                proposedWil
                              }
                            </span>

                          </div>
                        </div>
                      )}

                      {katChanged && (
                        <div className="border-b border-amber-200/40 pb-3">

                          <p className="text-[11px] font-semibold text-amber-700 uppercase">
                            Kategori Layanan
                          </p>

                          <div className="flex items-start gap-2 mt-1 flex-wrap">

                            <span className="text-xs font-medium text-slate-500 line-through">
                              {
                                activeKat
                              }
                            </span>

                            <span className="text-xs text-slate-400">
                              →
                            </span>

                            <span className="text-xs font-bold text-amber-900">
                              {
                                proposedKat
                              }
                            </span>

                          </div>
                        </div>
                      )}

                      {scheduleChanged && (
                        <div>

                          <p className="text-[11px] font-semibold text-amber-700 uppercase">
                            Jadwal Operasional
                          </p>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">

                            <span className="text-xs font-medium text-slate-500 line-through">
                              {
                                activeSchedule
                              }
                            </span>

                            <span className="text-xs text-slate-400">
                              →
                            </span>

                            <span className="text-xs font-bold text-amber-900">
                              {
                                proposedSchedule
                              }
                            </span>

                          </div>
                        </div>
                      )}

                      {!wilChanged &&
                        !katChanged &&
                        !scheduleChanged && (
                          <p className="text-xs text-slate-500">
                            Tidak ada perubahan data operasional.
                          </p>
                        )}

                    </div>

                  ) : (

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">

                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Data Pengajuan
                      </h4>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Wilayah Layanan
                        </p>

                        <p className="text-xs font-semibold text-slate-800">
                          {
                            proposedWil
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Kategori Layanan
                        </p>

                        <p className="text-xs font-semibold text-slate-800">
                          {
                            proposedKat
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Jadwal Operasional
                        </p>

                        <p className="text-xs font-semibold text-slate-800">
                          {
                            proposedSchedule
                          }
                        </p>
                      </div>

                      {/* ADMIN NOTES */}
                      {detailTarget?.admin_notes && (
                        <div className="pt-3 border-t border-slate-200">

                          <p className="text-[11px] font-semibold text-rose-700 uppercase">
                            Catatan Admin
                          </p>

                          <div className="mt-1 rounded-xl bg-rose-50 border border-rose-100 p-3">

                            <p className="text-xs font-medium text-rose-800 whitespace-pre-wrap">
                              {
                                detailTarget.admin_notes
                              }
                            </p>

                          </div>

                        </div>
                      )}

                    </div>

                  )}

                  {/* ACTION */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">

                    <button
                      onClick={() =>
                        setDetailTarget(
                          null
                        )
                      }
                      className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      Tutup
                    </button>

                    {status ===
                      'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setRejectTarget(
                              detailTarget
                            );
                            setAdminNotes(
                              ''
                            );
                          }}
                          className="px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700"
                        >
                          Tolak
                        </button>

                        <button
                          onClick={() =>
                            setApproveTarget(
                              detailTarget
                            )
                          }
                          className="px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                        >
                          Setujui
                        </button>
                      </>
                    )}

                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* =====================================================
          APPROVE CONFIRMATION
          ===================================================== */}

      {approveTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Setujui Pengajuan?
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Apakah Anda yakin ingin menyetujui pengajuan operasional nakes untuk{" "}
              <strong>
                {approveTarget
                  ?.tenaga_medis
                  ?.nama_lengkap ??
                  approveTarget
                    ?.nama_lengkap ??
                  approveTarget?.nama ??
                  '-'}
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-2">

              <button
                onClick={() =>
                  setApproveTarget(
                    null
                  )
                }
                disabled={processing}
                className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                onClick={
                  handleConfirmApprove
                }
                disabled={processing}
                className="px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {processing
                  ? 'Memproses...'
                  : 'Ya, Setujui'}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          REJECT MODAL
          ===================================================== */}

      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Tolak Pengajuan?
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Aksi ini akan menolak pengajuan operasional nakes untuk{" "}
              <strong>
                {rejectTarget
                  ?.tenaga_medis
                  ?.nama_lengkap ??
                  rejectTarget
                    ?.nama_lengkap ??
                  rejectTarget?.nama ??
                  '-'}
              </strong>
              .
            </p>

            <div className="mb-4">

              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Admin
              </label>

              <textarea
                value={
                  adminNotes
                }
                onChange={(e) =>
                  setAdminNotes(
                    e.target.value
                  )
                }
                maxLength={1000}
                placeholder="Tulis alasan penolakan..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                rows={4}
              />

              <div className="mt-1 text-right text-[10px] text-slate-400">
                {adminNotes.length}/1000
              </div>

            </div>

            <div className="flex justify-end gap-2">

              <button
                onClick={() =>
                  setRejectTarget(
                    null
                  )
                }
                disabled={processing}
                className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                onClick={
                  handleConfirmReject
                }
                disabled={processing}
                className="px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {processing
                  ? 'Memproses...'
                  : 'Ya, Tolak'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}