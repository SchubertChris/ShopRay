interface PaginationProps {
  page:       number;
  totalPages: number;
  onPage:     (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: Array<number | '…'> = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)           pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Seitennavigation">
      <button
        className="pagination__btn"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Vorherige Seite"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="pagination__dots">…</span>
        ) : (
          <button
            key={p}
            className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="pagination__btn"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Nächste Seite"
      >
        →
      </button>
    </nav>
  );
}
