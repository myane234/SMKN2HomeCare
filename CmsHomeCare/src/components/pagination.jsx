/**
 * Komponen Pagination universal.
 * Selalu tampil selama ada data (totalPages >= 1).
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Jangan tampilkan sama sekali jika belum ada data
  if (!totalPages || totalPages === 0) return null;

  // Bangun array nomor halaman dengan ellipsis untuk halaman banyak
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
    <div
      style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      {/* Info halaman */}
      <span style={{ fontSize: '13px', color: '#64748b' }}>
        Halaman{' '}
        <strong style={{ color: '#1e293b' }}>{currentPage}</strong>
        {' '}dari{' '}
        <strong style={{ color: '#1e293b' }}>{totalPages}</strong>
      </span>

      {/* Tombol navigasi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

        {/* Sebelumnya */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
            color: currentPage <= 1 ? '#94a3b8' : '#374151',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ← Sebelumnya
        </button>

        {/* Angka halaman */}
        {pages.map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '8px',
                border: currentPage === page ? 'none' : '1px solid #e2e8f0',
                background: currentPage === page ? '#1f9d5a' : '#ffffff',
                color: currentPage === page ? '#ffffff' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {page}
            </button>
          )
        )}

        {/* Selanjutnya */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage >= totalPages ? '#94a3b8' : '#374151',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Selanjutnya →
        </button>

      </div>
    </div>
  );
}