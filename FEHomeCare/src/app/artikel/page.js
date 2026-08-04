"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";

export const KATEGORI_ARTIKEL_OPTIONS = ["Tips Kesehatan", "Kegiatan"];

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
  return createSlug(getTextValue(item, ["judul_artikel", "judul", "title"]));
}

function extractArticles(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

// Strip HTML tags/entities left over from the rich text editor (Quill) so we
// never render raw markup like <h1> or <span class="ql-size-huge"> as text.
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
  // Prefer an explicit excerpt/summary field if the API provides one
  const explicit = getTextValue(item, ["ringkasan", "excerpt", "deskripsi"]);
  if (explicit) return stripHtml(explicit);

  // Otherwise fall back to the article body, stripped of HTML tags
  const rawContent = getTextValue(item, ["isi_artikel", "konten", "content"]);
  const plain = stripHtml(rawContent);
  return plain.length > 140 ? `${plain.slice(0, 140).trim()}…` : plain;
}

export default function SemuaArtikelPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Load categories once on initial mount (unfiltered)
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

  // Load/filter articles when selectedCategory changes
  useEffect(() => {
    let isMounted = true;

    async function loadArticles(category = "") {
      try {
        setLoading(true);
        const params = category ? { kategori_artikel: category } : {};
        const response = await api.get("/api/artikel", { params });
        if (!isMounted) return;

        const items = extractArticles(response?.data);
        setArticles(items);
      } catch (error) {
        console.error("Gagal memuat artikel", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticles(selectedCategory);

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const categoryOptions = categories.length > 0 ? categories : KATEGORI_ARTIKEL_OPTIONS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-sky-100 px-5 py-2 text-xs font-bold tracking-[0.2em] text-sky-700" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            PUSAT INFORMASI KESEHATAN
          </span>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-sky-800 sm:text-4xl" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            Artikel &amp; Tips Kesehatan
          </h1>
          <p className="mt-3 mx-auto max-w-3xl text-base leading-7 text-slate-600" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            Temukan informasi dan edukasi kesehatan terpercaya dari perawat dan bidan profesional kami
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 flex justify-start">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="kategori-artikel" className="text-sm font-medium text-slate-500">
              Filter Kategori:
            </label>
            <select
              id="kategori-artikel"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Semua</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <h3 className="text-base font-bold text-slate-900">Belum ada artikel</h3>
            <p className="mt-1 text-sm text-slate-500">
              Kategori yang Anda pilih belum memiliki artikel. Silakan coba kategori lain atau kembali lagi nanti.
            </p>
          </div>
        ) : (
          /* Grid Card Artikel UI Tegak/Grid 3 Kolom */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((item, index) => {
              const title = getTextValue(item, ["judul_artikel", "judul", "title"]);
              const summary = getArticleSummary(item);
              const category = getTextValue(item, ["kategori_artikel", "kategori", "category"]);
              const image = resolveImageUrl(getTextValue(item, ["gambar_artikel", "gambar", "image", "foto"]));
              const slug = getArticleSlug(item);

              return (
                <div
                  key={`${slug || title || index}`}
                  className="group relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-400/20"
                  style={{
                    transition: 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  }}
                >
                  {/* Glow effect di belakang */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }}
                  />

                  <div className="relative flex h-full flex-col overflow-hidden p-0">
                    {/* Image Container dengan Zoom Effect */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                      <img
                        src={image}
                        alt={title || "Artikel"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>

                    {/* Content Container */}
                    <div className="flex flex-grow flex-col justify-between p-4">
                      <div>
                        {/* Category Badge */}
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 transition-colors duration-300 group-hover:bg-blue-100">
                          {category || "Kategori"}
                        </span>

                        {/* Title */}
                        <Link href={`/artikel/${slug || index}`}>
                          <h2 className="mt-2 text-base font-bold leading-snug text-slate-950 transition-colors duration-300 hover:text-blue-600 line-clamp-2">
                            {title || "Judul artikel"}
                          </h2>
                        </Link>

                        {/* Description */}
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2 transition-colors duration-300">
                          {summary || "Baca artikel lengkap untuk informasi lebih lanjut."}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-2 mt-3 border-t border-slate-100">
                        <Link
                          href={`/artikel/${slug || index}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-all duration-300 hover:text-blue-700 hover:gap-2"
                        >
                          Baca Selengkapnya
                          <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                        </Link>
                      </div>
                    </div>
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