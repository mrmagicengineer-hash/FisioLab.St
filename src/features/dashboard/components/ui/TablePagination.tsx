import { Button } from '@/components/ui/button'

type TablePaginationProps = {
  currentPage: number
  totalPages: number
  fromResult: number
  toResult: number
  totalItems: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

export function TablePagination({
  currentPage,
  totalPages,
  fromResult,
  toResult,
  totalItems,
  itemLabel = 'elementos',
  onPageChange
}: TablePaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Mostrando {fromResult}–{toResult} de {totalItems} {itemLabel}
      </p>

      <nav className="flex items-center gap-1.5" aria-label="Paginacion de resultados">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Ir a la pagina anterior"
        >
          Anterior
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-label={`Ir a la pagina ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Ir a la pagina siguiente"
        >
          Siguiente
        </Button>
      </nav>
    </div>
  )
}
