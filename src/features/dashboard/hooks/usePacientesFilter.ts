import { useMemo, useState } from 'react'

export type EstadoPaciente = 'ACTIVO' | 'INACTIVO'

export type Paciente = {
  id: string
  hcl: string
  cedula: string
  nombre: string
  estado: EstadoPaciente
  ultimaAtencion: string
  fechaRegistro: string
}

export type SortColumn = keyof Paciente
export type SortDirection = 'asc' | 'desc'

export type EstadoFilter = 'todos' | 'ACTIVO' | 'INACTIVO'

export type PacientesFilterState = {
  estadoFilter: EstadoFilter
  fechaDesde: string
  fechaHasta: string
  sortColumn: SortColumn
  sortDirection: SortDirection
  page: number
}

const PAGE_SIZE = 5

function compareValues(a: string, b: string, direction: SortDirection): number {
  const comparison = a.localeCompare(b, 'es', { sensitivity: 'base' })
  return direction === 'asc' ? comparison : -comparison
}

export function usePacientesFilter(pacientes: Paciente[]) {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('hcl')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)

  function clearFilters() {
    setEstadoFilter('todos')
    setFechaDesde('')
    setFechaHasta('')
    setPage(1)
  }

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let result = [...pacientes]

    // Estado filter
    if (estadoFilter !== 'todos') {
      result = result.filter((p) => p.estado === estadoFilter)
    }

    // Date range filter on ultimaAtencion
    if (fechaDesde) {
      result = result.filter((p) => p.ultimaAtencion >= fechaDesde)
    }
    if (fechaHasta) {
      result = result.filter((p) => p.ultimaAtencion <= fechaHasta)
    }

    return result
  }, [pacientes, estadoFilter, fechaDesde, fechaHasta])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      compareValues(String(a[sortColumn]), String(b[sortColumn]), sortDirection)
    )
  }, [filtered, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, safePage])

  // Metrics
  const metrics = useMemo(() => {
    const total = pacientes.length
    const activos = pacientes.filter((p) => p.estado === 'ACTIVO').length
    const inactivos = pacientes.filter((p) => p.estado === 'INACTIVO').length
    const resultados = sorted.length
    return { total, activos, inactivos, resultados }
  }, [pacientes, sorted])

  const hasActiveFilters = estadoFilter !== 'todos' || fechaDesde !== '' || fechaHasta !== ''

  return {
    // Filter state
    estadoFilter,
    setEstadoFilter: (value: EstadoFilter) => { setEstadoFilter(value); setPage(1) },
    fechaDesde,
    setFechaDesde: (value: string) => { setFechaDesde(value); setPage(1) },
    fechaHasta,
    setFechaHasta: (value: string) => { setFechaHasta(value); setPage(1) },
    clearFilters,
    hasActiveFilters,

    // Sort
    sortColumn,
    sortDirection,
    toggleSort,

    // Pagination
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,

    // Data
    data: paginated,
    metrics
  }
}
