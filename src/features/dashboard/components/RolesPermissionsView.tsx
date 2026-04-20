import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PAGE_SIZE = 5

type PermissionRole = {
  id: number
  rol: 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'
  modulo: string
  permiso: 'Lectura' | 'Escritura' | 'Administracion'
  descripcion: string
  actualizado: string
}

const ROLE_PERMISSIONS: PermissionRole[] = [
  {
    id: 1,
    rol: 'ADMINISTRADOR',
    modulo: 'Usuarios',
    permiso: 'Administracion',
    descripcion: 'Gestion completa de usuarios, roles y estados de cuenta.',
    actualizado: 'Hace 2 horas'
  },
  {
    id: 2,
    rol: 'ADMINISTRADOR',
    modulo: 'Auditoria',
    permiso: 'Lectura',
    descripcion: 'Consulta de eventos y exportacion de bitacoras.',
    actualizado: 'Hace 1 dia'
  },
  {
    id: 3,
    rol: 'FISIOTERAPEUTA',
    modulo: 'Pacientes',
    permiso: 'Escritura',
    descripcion: 'Actualiza evoluciones y planes terapeuticos.',
    actualizado: 'Hace 3 horas'
  },
  {
    id: 4,
    rol: 'MEDICO',
    modulo: 'Consultas',
    permiso: 'Escritura',
    descripcion: 'Registra diagnosticos y conductas medicas.',
    actualizado: 'Hace 40 min'
  },
  {
    id: 5,
    rol: 'FISIOTERAPEUTA',
    modulo: 'Agenda',
    permiso: 'Lectura',
    descripcion: 'Consulta disponibilidad y sesiones asignadas.',
    actualizado: 'Hace 8 min'
  }
]

type RolFilter = 'TODOS' | 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'
type PermissionFilter = 'TODOS' | 'Lectura' | 'Escritura' | 'Administracion'

export function RolesPermissionsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState<RolFilter>('TODOS')
  const [permissionFilter, setPermissionFilter] = useState<PermissionFilter>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return ROLE_PERMISSIONS.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        row.rol.toLowerCase().includes(query) ||
        row.modulo.toLowerCase().includes(query) ||
        row.descripcion.toLowerCase().includes(query)

      const matchesRol = rolFilter === 'TODOS' || row.rol === rolFilter
      const matchesPermission = permissionFilter === 'TODOS' || row.permiso === permissionFilter

      return matchesSearch && matchesRol && matchesPermission
    })
  }, [searchTerm, rolFilter, permissionFilter])

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

  function handleRolFilterChange(value: RolFilter) {
    setRolFilter(value)
    setCurrentPage(1)
  }

  function handlePermissionFilterChange(value: PermissionFilter) {
    setPermissionFilter(value)
    setCurrentPage(1)
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">Roles y Permisos</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por rol, modulo o descripcion"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Buscar permisos"
            />

            <select
              value={rolFilter}
              onChange={(event) => handleRolFilterChange(event.target.value as RolFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar por rol"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
              <option value="MEDICO">Medico</option>
            </select>

            <select
              value={permissionFilter}
              onChange={(event) => handlePermissionFilterChange(event.target.value as PermissionFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar por tipo de permiso"
            >
              <option value="TODOS">Todos los permisos</option>
              <option value="Lectura">Lectura</option>
              <option value="Escritura">Escritura</option>
              <option value="Administracion">Administracion</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Rol</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Modulo</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Permiso</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Descripcion</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Actualizado</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                      No se encontraron permisos para los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-slate-700">{row.rol}</td>
                      <td className="px-3 py-2 text-slate-700">{row.modulo}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.permiso === 'Administracion'
                              ? 'bg-red-50 text-red-700'
                              : row.permiso === 'Escritura'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-sky-50 text-sky-700'
                          }`}
                        >
                          {row.permiso}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.descripcion}</td>
                      <td className="px-3 py-2 text-slate-700">{row.actualizado}</td>
                      <td className="px-3 py-2">
                        <Button type="button" variant="outline" size="sm" className="h-7">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {fromResult}-{toResult} de {filteredRows.length} permisos
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
              >
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant={page === safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
