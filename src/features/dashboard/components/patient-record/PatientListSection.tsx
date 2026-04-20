import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

import type { PatientListItemDto, PatientFileStatus } from '../../data/services/patientsService'
import { EpisodeItem } from './EpisodeItem';

type PatientListSectionProps = {
  canEditRecord: boolean
  isLoadingPatients: boolean
  patientsError: string
  patients: PatientListItemDto[]
  patientSearchQuery: string
  onSearchQueryChange: (value: string) => void
  onViewRecord: (patientId: number) => void
  onEditRecord: (patientId: number) => void
}

type SortColumn = 'hcl' | 'cedula' | 'nombresCompletos' | 'estadoArchivo' | 'ultimaAtencion' | 'fechaRegistro'
type SortDirection = 'asc' | 'desc'
type EstadoFilter = 'todos' | 'ACTIVO' | 'PASIVO'

const PAGE_SIZE = 5

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'hcl', label: 'Historia Clínica' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'nombresCompletos', label: 'Nombres completos' },
  { key: 'estadoArchivo', label: 'Estado' },
  { key: 'ultimaAtencion', label: 'Última atención' },
  { key: 'fechaRegistro', label: 'Fecha registro' }
]

function getSortValue(patient: PatientListItemDto, column: SortColumn): string {
  return String(patient[column] ?? '')
}

function SortIcon({ column, currentColumn, direction }: { column: SortColumn; currentColumn: SortColumn; direction: SortDirection }) {
  if (column !== currentColumn) {
    return (
      <svg className="ml-1.5 inline h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M8 9l4-4 4 4M8 15l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return direction === 'asc' ? (
    <svg className="ml-1.5 inline h-3.5 w-3.5 text-[#1A5276]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="ml-1.5 inline h-3.5 w-3.5 text-[#1A5276]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusBadge({ status }: { status: PatientFileStatus }) {
  const isActive = status === 'ACTIVO'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ${
        isActive
          ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-200'
          : 'bg-red-50 text-red-800 ring-1 ring-red-200'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-teal-500' : 'bg-red-500'}`}
      />
      {status}
    </span>
  )
}

export function PatientListSection({
  canEditRecord,
  isLoadingPatients,
  patientsError,
  patients,
  patientSearchQuery,
  onSearchQueryChange,
  onViewRecord,
  onEditRecord
}: PatientListSectionProps) {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('hcl')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)

  const hasActiveFilters = estadoFilter !== 'todos' || fechaDesde !== '' || fechaHasta !== ''

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

  // Filtered data
  const filtered = useMemo(() => {
    let result = [...patients]

    if (estadoFilter !== 'todos') {
      result = result.filter((p) => p.estadoArchivo === estadoFilter)
    }

    if (fechaDesde) {
      result = result.filter((p) => p.ultimaAtencion >= fechaDesde)
    }
    if (fechaHasta) {
      result = result.filter((p) => p.ultimaAtencion <= fechaHasta)
    }

    return result
  }, [patients, estadoFilter, fechaDesde, fechaHasta])

  // Sorted
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const comparison = getSortValue(a, sortColumn).localeCompare(
        getSortValue(b, sortColumn), 'es', { sensitivity: 'base' }
      )
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filtered, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, safePage])

  // Metrics
  const metrics = useMemo(() => {
    const total = patients.length
    const activos = patients.filter((p) => p.estadoArchivo === 'ACTIVO').length
    const inactivos = patients.filter((p) => p.estadoArchivo === 'PASIVO').length
    const resultados = sorted.length
    return { total, activos, inactivos, resultados }
  }, [patients, sorted])

  const pageNumbers: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  const metricCards = [
    { label: 'Total pacientes', value: metrics.total, accent: 'bg-slate-500', bg: 'bg-slate-50 text-slate-700' },
    { label: 'Activos', value: metrics.activos, accent: 'bg-teal-500', bg: 'bg-teal-50 text-teal-700' },
    { label: 'Inactivos', value: metrics.inactivos, accent: 'bg-red-500', bg: 'bg-red-50 text-red-700' },
    { label: 'Resultados', value: metrics.resultados, accent: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700' }
  ]

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl border border-slate-200/80 px-4 py-3.5 ${card.bg}`}
          >
            <div className={`absolute top-0 left-0 h-full w-1 ${card.accent}`} />
            <p className="text-sm font-medium opacity-75">{card.label}</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
        {/* Search */}
        <div className="min-w-[200px] flex-[2]">
          <label htmlFor="patient-search" className="mb-1.5 block text-sm font-medium text-slate-600">
            Buscar paciente
          </label>
          <input
            id="patient-search"
            type="search"
            value={patientSearchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por cédula, HCL o nombres"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 focus:outline-none"
          />
          {patientSearchQuery.trim().length > 0 && patientSearchQuery.trim().length < 3 && (
            <p className="mt-1.5 text-sm text-slate-500">Escribe al menos 3 caracteres.</p>
          )}
        </div>

        {/* Estado */}
        <div className="min-w-[140px] flex-1">
          <label htmlFor="filter-estado" className="mb-1.5 block text-sm font-medium text-slate-600">
            Estado
          </label>
          <select
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value as EstadoFilter); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 focus:outline-none"
          >
            <option value="todos">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="PASIVO">Inactivo</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div className="min-w-[150px] flex-1">
          <label htmlFor="filter-desde" className="mb-1.5 block text-sm font-medium text-slate-600">
            Atención desde
          </label>
          <input
            id="filter-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 focus:outline-none"
          />
        </div>

        {/* Fecha hasta */}
        <div className="min-w-[150px] flex-1">
          <label htmlFor="filter-hasta" className="mb-1.5 block text-sm font-medium text-slate-600">
            Atención hasta
          </label>
          <input
            id="filter-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 focus:outline-none"
          />
        </div>

        {/* Limpiar filtros */}
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Limpiar filtros
        </button>
      </div>

      {!canEditRecord && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Permiso parcial para este rol. Puedes visualizar la ficha, pero no editarla.
        </p>
      )}

      {/* Table */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-[0.938rem]">
              <thead>
                <tr className="bg-slate-50/80">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer select-none px-4 py-2.5 text-left text-base font-semibold text-slate-600 transition-colors hover:text-slate-900"
                      onClick={() => toggleSort(col.key)}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon column={col.key} currentColumn={sortColumn} direction={sortDirection} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-left text-base font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoadingPatients ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <td key={`cell-${index}-${cellIndex}`} className="px-4 py-2.5">
                          <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : patientsError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-rose-600">
                      <svg className="mx-auto mb-2 h-8 w-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {patientsError}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm font-medium">No se encontraron pacientes</p>
                      <p className="mt-0.5 text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((patient, index) => (
                    <>
                      <tr
                        key={patient.id}
                        className="transition-colors hover:bg-slate-50/60"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-[#1A5276]">
                          {patient.hcl}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                          {patient.cedula}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {patient.nombresCompletos}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <StatusBadge status={patient.estadoArchivo} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                          {patient.ultimaAtencion || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                          {patient.fechaRegistro}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onViewRecord(patient.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base font-medium text-[#1A5276] transition hover:bg-[#1A5276]/8"
                              title="Ver ficha"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Ver ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditRecord(patient.id)}
                              disabled={!canEditRecord}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                              title={!canEditRecord ? 'Acción deshabilitada para este rol.' : 'Editar'}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Integración de episodios clínicos: ejemplo de uso de EpisodeItem */}
                      {patient.episodios && Array.isArray(patient.episodios) && patient.episodios.length > 0 && (
                        <tr>
                          <td colSpan={COLUMNS.length + 1} className="bg-slate-50 px-4 py-2.5">
                            <div className="flex flex-wrap gap-3">
                              {patient.episodios.map((ep: any) => (
                                <EpisodeItem key={ep.id} ep={ep} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoadingPatients && !patientsError && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">
                Página <span className="font-semibold text-slate-700">{safePage}</span> de{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
                <span className="ml-2 text-slate-400">
                  ({metrics.resultados} {metrics.resultados === 1 ? 'resultado' : 'resultados'})
                </span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                      num === safePage
                        ? 'bg-[#1A5276] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
