"use client";

/**
 * Komponen Pagination universal.
 * Tampil jika totalPages > 1.
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  function buildPages() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (currentPage > 4) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const pages = buildPages();

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
      {/* Info Halaman */}
      <span className="text-xs text-slate-500">
        Halaman <strong className="font-semibold text-slate-800">{currentPage}</strong> dari{' '}
        <strong className="font-semibold text-slate-800">{totalPages}</strong>
      </span>

      {/* Tombol Navigasi */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            currentPage <= 1
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : 'cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
          }`}
        >
          ← Sebelumnya
        </button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`flex h-8 w-8 items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'cursor-pointer border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            currentPage >= totalPages
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : 'cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
          }`}
        >
          Selanjutnya →
        </button>
      </div>
    </div>
  );
}
