"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FiSearch, FiCalendar, FiArrowRight, FiBookOpen, FiChevronLeft, FiChevronRight, FiGrid, FiList } from "react-icons/fi";
import api from "@/services/api";
import { getArtikel } from "@/services/artikelService";
import { resolveImageUrl } from "@/services/resolveImage";

export const KATEGORI_ARTIKEL_OPTIONS = ["Tips Kesehatan", "Kegiatan", "Perawatan Lansia", "Edukasi Medis"];

function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

function createSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getArticleSlug(item) {
  return createSlug(getTextValue(item, ["slug", "slug_artikel", "url_slug", "judul_artikel", "judul", "title"]));
}

function extractArticles(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function stripHtml(html) {
  if (!html) return "";
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function getArticleSummary(item) {
  const explicit = getTextValue(item, ["ringkasan", "excerpt", "deskripsi"]);
  if (explicit) return stripHtml(explicit);

  const rawContent = getTextValue(item, ["isi_artikel", "konten", "content"]);
  const plain = stripHtml(rawContent);
  return plain.length > 130 ? `${plain.slice(0, 130).trim()}…` : plain;
}

function formatDate(dateStr) {
  if (!dateStr) return "Terbaru";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(dateStr);
  }
}

export default function SemuaArtikelPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [displayMode, setDisplayMode] = useState("pagination"); // 'pagination' or 'lazy'
  const [visibleLazyCount, setVisibleLazyCount] = useState(6);

  // Load categories on initial mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const response = await api.get("/api/artikel");
        if (!isMounted) return;

        const items = extractArticles(response?.data);
        const uniqueCategories = Array.from(
          new Set(
            items
              .map((item) => getTextValue(item, ["kategori_artikel", "kategori", "category"]))
              .filter(Boolean)
          )
        );
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Gagal memuat kategori artikel", error);
      }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  // Load articles
  useEffect(() => {
    let isMounted = true;
    async function loadArticles(category = "") {
      try {
        setLoading(true);
        const params = category ? { kategori_artikel: category } : {};
        const items = await getArtikel(params);
        if (!isMounted) return;

        setArticles(items.length > 0 ? items : DEFAULT_ARTIKEL);
        setCurrentPage(1);
        setVisibleLazyCount(6);
      } catch (error) {
        console.error("Gagal memuat artikel", error);
        if (isMounted) {
          setArticles(DEFAULT_ARTIKEL);
          setCurrentPage(1);
          setVisibleLazyCount(6);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticles(selectedCategory);
    return () => { isMounted = false; };
  }, [selectedCategory]);

  const categoryOptions = categories.length > 0 ? categories : KATEGORI_ARTIKEL_OPTIONS;

  // Search & Filter
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase().trim();
    return articles.filter(item => {
      const title = getTextValue(item, ["judul_artikel", "judul", "title"]).toLowerCase();
      const summary = getArticleSummary(item).toLowerCase();
      return title.includes(q) || summary.includes(q);
    });
  }, [articles, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = displayMode === "pagination"
    ? filteredArticles.slice(startIndex, startIndex + itemsPerPage)
    : filteredArticles.slice(0, visibleLazyCount);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLoadMore = () => {
    setVisibleLazyCount(prev => Math.min(prev + 6, filteredArticles.length));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold tracking-widest text-sky-700 uppercase">
            PUSAT ARTIKEL &amp; EDUKASI PASIEN
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Artikel &amp; Edukasi Kesehatan
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed">
            Temukan panduan praktis, tips perawatan rumah medis, dan informasi kesehatan terkini dari tim profesional SmartHomeCare.
          </p>
        </div>

        {/* Filter Bar: Search, Category & Pagination Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Cari judul artikel atau kata kunci..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                  setVisibleLazyCount(6);
                }}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="kategori-select" className="text-xs font-semibold text-slate-500">
                  Kategori:
                </label>
                <select
                  id="kategori-select"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Mode Paging Switch (Numbered vs Lazy Load) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setDisplayMode("pagination")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    displayMode === "pagination" ? "bg-white text-sky-700 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Halaman Berpenomoran (Numbered Paging)"
                >
                  Numbered Paging
                </button>
                <button
                  onClick={() => setDisplayMode("lazy")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    displayMode === "lazy" ? "bg-white text-sky-700 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Tampilan Muat Lebih Banyak (Lazy Load)"
                >
                  Lazy Load
                </button>
              </div>
            </div>

          </div>

          {/* Indicator Info Bar */}
          {!loading && filteredArticles.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>
                {displayMode === "pagination" ? (
                  <>Menampilkan <strong className="text-slate-800">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredArticles.length)}</strong> dari <strong className="text-slate-800">{filteredArticles.length}</strong> artikel</>
                ) : (
                  <>Menampilkan <strong className="text-slate-800">{Math.min(visibleLazyCount, filteredArticles.length)}</strong> dari <strong className="text-slate-800">{filteredArticles.length}</strong> artikel</>
                )}
              </span>

              {displayMode === "pagination" && (
                <span>Halaman <strong className="text-sky-700">{currentPage}</strong> dari <strong className="text-slate-700">{totalPages}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
            <FiBookOpen className="mx-auto text-4xl text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">Artikel Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">Tidak ada artikel yang cocok dengan pencarian atau kategori yang dipilih.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((item, index) => {
                const title = getTextValue(item, ["judul_artikel", "judul", "title"]);
                const summary = getArticleSummary(item);
                const category = getTextValue(item, ["kategori_artikel", "kategori", "category"]);
                const image = resolveImageUrl(getTextValue(item, ["gambar_artikel", "gambar", "image", "foto"]));
                const slug = getArticleSlug(item);
                const date = formatDate(getTextValue(item, ["created_at", "updated_at", "tanggal"]));

                return (
                  <article
                    key={`${slug || title || index}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img
                          src={image}
                          alt={title || "Artikel"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-sky-700 uppercase tracking-wider shadow-2xs">
                          {category || "Kesehatan"}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <FiCalendar size={12} />
                          <span suppressHydrationWarning>{date}</span>
                        </div>

                        <Link href={`/artikel/${slug || index}`}>
                          <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition line-clamp-2 leading-snug">
                            {title || "Judul Artikel"}
                          </h2>
                        </Link>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {summary}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Link */}
                    <div className="p-5 pt-0">
                      <Link
                        href={`/artikel/${slug || index}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
                      >
                        Baca Selengkapnya <FiArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Paging Mode 1: Numbered Pagination Bar */}
            {displayMode === "pagination" && totalPages > 1 && (
              <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiChevronLeft /> Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage === page
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Berikutnya <FiChevronRight />
                </button>
              </div>
            )}

            {/* Paging Mode 2: Lazy Loading Button */}
            {displayMode === "lazy" && visibleLazyCount < filteredArticles.length && (
              <div className="pt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Muat Lebih Banyak Artikel ({filteredArticles.length - visibleLazyCount} tersisa)
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}