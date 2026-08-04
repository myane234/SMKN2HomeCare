"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, MessageCircle, Send, Link as LinkIcon, Calendar, Tag, Check } from "lucide-react";
import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";

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
  if (Array.isArray(payload?.artikels)) return payload.artikels;
  if (Array.isArray(payload?.articles)) return payload.articles;
  return [];
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function estimateReadTime(html) {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function DetailArtikel() {
  const params = useParams();
  const slug = params?.slug;
  const [article, setArticle] = useState(null);
  const [otherArticles, setOtherArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      try {
        const response = await api.get("/api/artikel");
        if (!isMounted) return;

        const items = extractArticles(response?.data);
        const matched = items.find((item) => {
          const itemSlug = getArticleSlug(item);
          const itemId = getTextValue(item, ["id", "id_artikel", "artikel_id"]);
          return itemSlug === String(slug) || itemId === String(slug);
        });

        setArticle(matched || null);

        const others = items
          .filter((item) => {
            const itemSlug = getArticleSlug(item);
            const itemId = getTextValue(item, ["id", "id_artikel", "artikel_id"]);
            return itemSlug !== String(slug) && itemId !== String(slug);
          })
          .slice(0, 5);
        setOtherArticles(others);
      } catch (error) {
        console.error("Gagal memuat detail artikel", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) {
      loadArticle();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
        <p className="mt-4 text-sm text-slate-500">Memuat artikel...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <h2 className="text-2xl font-bold text-slate-800">Artikel Tidak Ditemukan</h2>
        <p className="mt-2 text-slate-500">Maaf, artikel yang Anda cari tidak ada atau telah dihapus.</p>
        <Link href="/" className="mt-6 text-sm font-semibold text-sky-600 hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const title = getTextValue(article, ["judul_artikel", "judul", "title"]);
  const category = getTextValue(article, ["kategori_artikel", "kategori", "category"]) || "Artikel";
  const date = formatDate(getTextValue(article, ["created_at", "updated_at", "tanggal", "published_at"]));
  const image = resolveImageUrl(getTextValue(article, ["gambar_artikel", "gambar", "image", "foto"]));
  const content = getTextValue(article, ["isi_artikel", "konten", "content", "body"]);
  const readTime = estimateReadTime(content);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Breadcrumb bar */}
      <div className="border-b border-slate-100 bg-slate-50/60">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-3 py-3 text-xs text-slate-500 sm:px-6">
          <Link href="/" className="font-medium text-sky-600 hover:underline">
            SmartHomeCare
          </Link>
          <span>/</span>
          <span className="text-slate-400">{category}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10 lg:py-14">
        {/* Layout Grid: Tetap 2 kolom dari HP hingga Desktop */}
        <div className="grid grid-cols-[1fr_110px] items-start gap-3 sm:grid-cols-[1fr_220px] sm:gap-6 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] lg:gap-10">
          
          {/* Main article column */}
          <article className="min-w-0">
            {/* Category + Title */}
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 sm:px-3 sm:py-1 sm:text-xs">
              {category}
            </span>

            <h1 className="mt-2 font-serif text-xl font-bold leading-tight text-slate-900 sm:mt-4 sm:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
              {title || "Judul Artikel"}
            </h1>

            {/* Meta bar: date, read time, share */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-slate-200 py-2 sm:mt-5 sm:py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:gap-4 sm:text-sm">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4" />
                  {date || "-"}
                </span>
                {/* <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline">{readTime} menit baca</span> */}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-sky-600 hover:text-white sm:h-8 sm:w-8"
                  aria-label="Bagikan ke Twitter"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-sky-600 hover:text-white sm:h-8 sm:w-8"
                  aria-label="Salin tautan"
                >
                  {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            {/* Hero image */}
            <figure className="mt-4 sm:mt-6">
              <div className="w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={image}
                  alt={title || "SmartHomeCare"}
                  className="h-44 w-full object-cover sm:h-72 md:h-[420px]"
                />
              </div>
              <figcaption className="mt-1.5 text-[10px] text-slate-400 sm:mt-2 sm:text-xs">
                Sumber foto: SmartHomeCare
              </figcaption>
            </figure>

            {/* Body content */}
            <div className="mt-6 sm:mt-8">
              {content ? (
                <div
                  className="prose prose-slate max-w-none font-serif text-sm leading-relaxed text-slate-700 sm:text-[1.05rem] sm:leading-[1.9] prose-headings:font-sans prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-sky-600 prose-img:rounded-xl break-words"
                  style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-slate-500">Belum ada konten untuk artikel ini.</p>
              )}
            </div>

            {/* Tag / source footer */}
            <div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 sm:mt-10 sm:pt-6">
              <Tag className="h-3.5 w-3.5" />
              <span>Dipublikasikan oleh SmartHomeCare</span>
            </div>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition hover:text-sky-700 sm:mt-8 sm:text-sm"
            >
              &lt; Kembali ke Beranda
            </Link>
          </article>

          {/* Sidebar: Artikel Lainnya (Sticky di semua resolusi) */}
          <aside className="sticky top-6 self-start">
            <h3 className="mb-3 border-b-2 border-sky-600 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 sm:mb-4 sm:pb-2 sm:text-sm">
              Artikel Lain
            </h3>

            {otherArticles.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada artikel lain.</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {otherArticles.map((item, idx) => {
                  const itemTitle = getTextValue(item, ["judul_artikel", "judul", "title"]);
                  const itemSlug = getArticleSlug(item);
                  const itemImage = resolveImageUrl(
                    getTextValue(item, ["gambar_artikel", "gambar", "image", "foto"])
                  );
                  const itemDate = formatDate(
                    getTextValue(item, ["created_at", "updated_at", "tanggal", "published_at"])
                  );

                  return (
                    <Link
                      key={itemSlug || idx}
                      href={`/artikel/${itemSlug}`}
                      className="group flex flex-col gap-1.5 sm:flex-row sm:gap-3"
                    >
                      <div className="h-16 w-full flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-16 sm:w-20">
                        <img
                          src={itemImage}
                          alt={itemTitle}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800 group-hover:text-sky-600 sm:line-clamp-3 sm:text-sm sm:leading-snug">
                          {itemTitle || "Judul artikel"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
                          {itemDate}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}