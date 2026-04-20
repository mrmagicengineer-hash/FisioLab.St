import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  deactivateTemporaryBlock,
  getBlockedUsers,
  type BlockedUserDto
} from '../data/services/blockedUsersService'
import { TablePagination } from './ui/TablePagination'

const PAGE_SIZE = 5

type RolFilter = 'TODOS' | 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'

type BlockedAccountRow = {
  id: number
  cedula: string
  fullName: string
  email: string
  rol: string
  especialidad: string
  tipoProfesional: string
  codigoRegistro: string
  motivoBloqueo: string
  bloqueadaDesde: string
}

function mapBlockedUser(user: BlockedUserDto): BlockedAccountRow {
  return {
    id: user.id,
    cedula: user.cedula,
    fullName: `${user.name} ${user.lastName}`,
    email: user.email,
    rol: user.rol,
    especialidad: user.especialidad ?? '-',
    tipoProfesional: user.tipoProfesional ?? '-',
    codigoRegistro: user.codigoRegistro ?? '-',
    motivoBloqueo: 'Bloqueo temporal de seguridad',
    bloqueadaDesde: 'Reciente'
  }
}

export function BlockedAccountsView() {
  const [blockedRows, setBlockedRows] = useState<BlockedAccountRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState<RolFilter>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [listError, setListError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [unlockingIds, setUnlockingIds] = useState<number[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadBlockedUsers() {
      setIsLoadingRows(true)
      setListError('')

      try {
        const users = await getBlockedUsers()

        if (!isMounted) {
          return
        }

        setBlockedRows(users.map(mapBlockedUser))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setBlockedRows([])
        setListError(error instanceof Error ? error.message : 'No fue posible cargar cuentas bloqueadas.')
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    void loadBlockedUsers()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return blockedRows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        row.fullName.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.cedula.toLowerCase().includes(query) ||
        row.codigoRegistro.toLowerCase().includes(query)

      const matchesRol = rolFilter === 'TODOS' || row.rol === rolFilter

      return matchesSearch && matchesRol
    })
  }, [blockedRows, searchTerm, rolFilter])

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

  async function handleUnlockUser(userId: number) {
    setActionError('')
    setActionSuccess('')
    setUnlockingIds((previous) => [...previous, userId])

    try {
      await deactivateTemporaryBlock(userId)
      setBlockedRows((previous) => previous.filter((row) => row.id !== userId))
      setActionSuccess('Cuenta desbloqueada correctamente.')
      setCurrentPage(1)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No fue posible desbloquear la cuenta.')
    } finally {
      setUnlockingIds((previous) => previous.filter((id) => id !== userId))
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800">Cuentas Bloqueadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(actionError || actionSuccess) && (
            <p className={`text-sm ${actionError ? 'text-red-600' : 'text-emerald-600'}`}>
              {actionError || actionSuccess}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nombre, email, cedula o registro"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Buscar cuentas bloqueadas"
            />

            <select
              value={rolFilter}
              onChange={(event) => handleRolFilterChange(event.target.value as RolFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar cuentas bloqueadas por rol"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
              <option value="MEDICO">Medico</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Cedula</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Rol</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Motivo</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Bloqueada desde</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingRows ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      Cargando cuentas bloqueadas...
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
                      No hay cuentas bloqueadas para los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-slate-700">{row.cedula}</td>
                      <td className="px-3 py-2 text-slate-700">{row.fullName}</td>
                      <td className="px-3 py-2 text-slate-700">{row.email}</td>
                      <td className="px-3 py-2 text-slate-700">{row.rol}</td>
                      <td className="px-3 py-2 text-slate-700">{row.motivoBloqueo}</td>
                      <td className="px-3 py-2 text-slate-700">{row.bloqueadaDesde}</td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7"
                          disabled={unlockingIds.includes(row.id)}
                          onClick={() => handleUnlockUser(row.id)}
                        >
                          {unlockingIds.includes(row.id) ? 'Procesando...' : 'Desbloquear'}
                        </Button>
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
            itemLabel="cuentas bloqueadas"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </section>
  )
}
