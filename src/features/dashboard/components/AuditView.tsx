import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuditEvents, type AuditEventDto } from '../data/services/auditService'
import { TablePagination } from './ui/TablePagination'
import { StatusBadge } from './ui/StatusBadge'

const PAGE_SIZE = 6

type SeverityFilter = 'TODOS' | 'ALTA' | 'MEDIA' | 'BAJA'
type ModuleFilter = 'TODOS' | 'Usuarios' | 'Seguridad' | 'Roles' | 'Sistema'

export function AuditView() {
  const [events, setEvents] = useState<AuditEventDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('TODOS')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [listError, setListError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsLoadingEvents(true)
      setListError('')

      try {
        const response = await getAuditEvents()

        if (!isMounted) {
          return
        }

        setEvents(response)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setEvents([])
        setListError(error instanceof Error ? error.message : 'No fue posible cargar eventos de auditoria.')
      } finally {
        if (isMounted) {
          setIsLoadingEvents(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return events.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        row.id.toLowerCase().includes(query) ||
        row.usuario.toLowerCase().includes(query) ||
        row.accion.toLowerCase().includes(query) ||
        row.detalle.toLowerCase().includes(query)

      const matchesSeverity = severityFilter === 'TODOS' || row.severidad === severityFilter
      const matchesModule = moduleFilter === 'TODOS' || row.modulo === moduleFilter

      return matchesSearch && matchesSeverity && matchesModule
    })
  }, [events, searchTerm, severityFilter, moduleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  const fromResult = filteredRows.length === 0 ? 0 : startIndex + 1
  const toResult = Math.min(startIndex + PAGE_SIZE, filteredRows.length)

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleSeverityFilterChange(value: SeverityFilter) {
    setSeverityFilter(value)
    setCurrentPage(1)
  }

  function handleModuleFilterChange(value: ModuleFilter) {
    setModuleFilter(value)
    setCurrentPage(1)
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">Auditoria</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por id, usuario, accion o detalle"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Buscar eventos de auditoria"
            />

            <select
              value={severityFilter}
              onChange={(event) => handleSeverityFilterChange(event.target.value as SeverityFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar por severidad"
            >
              <option value="TODOS">Todas las severidades</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>

            <select
              value={moduleFilter}
              onChange={(event) => handleModuleFilterChange(event.target.value as ModuleFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar por modulo"
            >
              <option value="TODOS">Todos los modulos</option>
              <option value="Usuarios">Usuarios</option>
              <option value="Seguridad">Seguridad</option>
              <option value="Roles">Roles</option>
              <option value="Sistema">Sistema</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha y Hora</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Usuario</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Modulo</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Accion</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Detalle</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Severidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingEvents ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      Cargando eventos de auditoria...
                    </td>
                  </tr>
                ) : listError ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-red-600">
                      {listError}
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      No se encontraron eventos para los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-slate-700">{row.id}</td>
                      <td className="px-3 py-2 text-slate-700">{row.fecha}</td>
                      <td className="px-3 py-2 text-slate-700">{row.usuario}</td>
                      <td className="px-3 py-2 text-slate-700">{row.modulo}</td>
                      <td className="px-3 py-2 text-slate-700">{row.accion}</td>
                      <td className="px-3 py-2 text-slate-700">{row.detalle}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={row.severidad}
                          variant={
                            row.severidad === 'ALTA' ? 'error' : row.severidad === 'MEDIA' ? 'warning' : 'info'
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            fromResult={fromResult}
            toResult={toResult}
            totalItems={filteredRows.length}
            itemLabel="eventos"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </section>
  )
}
