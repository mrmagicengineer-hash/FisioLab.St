import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserManagementUser } from '../data/userManagementUsers'
import {
  createUser,
  getUsers,
  type CreateUserRequest,
  type CreateUserRole,
  type CreatedUserDto
} from '../data/services/userManagementService'
import { TablePagination } from './ui/TablePagination'
import { StatusBadge } from './ui/StatusBadge'

const PAGE_SIZE = 5

type RolFilter = 'TODOS' | 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'
type StatusFilter = 'TODOS' | 'ACTIVO' | 'INACTIVO'

type NewUserFormState = CreateUserRequest

const INITIAL_NEW_USER_FORM: NewUserFormState = {
  cedula: '',
  email: '',
  name: '',
  lastName: '',
  password: '',
  rol: 'FISIOTERAPEUTA',
  especialidad: '',
  tipoProfesional: '',
  codigoRegistro: ''
}

function mapCreatedUserToRow(user: CreatedUserDto) {
  return {
    ...user,
    especialidad: user.especialidad ?? '',
    tipoProfesional: user.tipoProfesional ?? '',
    codigoRegistro: user.codigoRegistro ?? ''
  }
}

export function UserManagementView() {
  const [users, setUsers] = useState<UserManagementUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState<RolFilter>('TODOS')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [listError, setListError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newUser, setNewUser] = useState<NewUserFormState>(INITIAL_NEW_USER_FORM)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      setIsLoadingUsers(true)
      setListError('')

      try {
        const response = await getUsers()

        if (!isMounted) {
          return
        }

        setUsers(response.map(mapCreatedUserToRow))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setUsers([])
        setListError(error instanceof Error ? error.message : 'No fue posible cargar los usuarios.')
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false)
        }
      }
    }

    void loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        query.length === 0 ||
        `${user.name} ${user.lastName}`.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.cedula.toLowerCase().includes(query) ||
        user.codigoRegistro.toLowerCase().includes(query)

      const matchesRol = rolFilter === 'TODOS' || user.rol === rolFilter
      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'ACTIVO' && user.activo) ||
        (statusFilter === 'INACTIVO' && !user.activo)

      return matchesSearch && matchesRol && matchesStatus
    })
  }, [users, searchTerm, rolFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE)

  const fromResult = filteredUsers.length === 0 ? 0 : startIndex + 1
  const toResult = Math.min(startIndex + PAGE_SIZE, filteredUsers.length)

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleRolFilterChange(value: RolFilter) {
    setRolFilter(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function handleOpenCreateModal() {
    setFormError('')
    setFormSuccess('')
    setIsCreateModalOpen(true)
  }

  function handleCloseCreateModal() {
    setIsCreateModalOpen(false)
    setFormError('')
  }

  function handleNewUserFieldChange<K extends keyof NewUserFormState>(field: K, value: NewUserFormState[K]) {
    setNewUser((previous) => ({
      ...previous,
      [field]: value
    }))
  }

  async function handleCreateUserSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError('')
    setFormSuccess('')
    setIsCreating(true)

    try {
      const createdUser = await createUser(newUser)

      setUsers((previous) => [mapCreatedUserToRow(createdUser), ...previous])
      setCurrentPage(1)
      setNewUser(INITIAL_NEW_USER_FORM)
      setFormSuccess('Usuario creado correctamente.')
      setIsCreateModalOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible crear el usuario.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold text-slate-800">Gestion de Cuentas</CardTitle>
            <Button type="button" onClick={handleOpenCreateModal}>
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formSuccess && <p className="text-sm text-emerald-600">{formSuccess}</p>}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nombre, email, cedula o registro"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Buscar usuarios"
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
              value={statusFilter}
              onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
              aria-label="Filtrar por estado"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
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
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Estado</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Especialidad</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Tipo profesional</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : listError ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-red-600">
                      {listError}
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      No se encontraron usuarios para los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-2 text-slate-700">{user.cedula}</td>
                      <td className="px-3 py-2 text-slate-700">{`${user.name} ${user.lastName}`}</td>
                      <td className="px-3 py-2 text-slate-700">{user.email}</td>
                      <td className="px-3 py-2 text-slate-700">{user.rol}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={user.activo ? 'Activo' : 'Inactivo'}
                          variant={user.activo ? 'success' : 'error'}
                        />
                      </td>
                      <td className="px-3 py-2 text-slate-700">{user.especialidad}</td>
                      <td className="px-3 py-2 text-slate-700">{user.tipoProfesional}</td>
                      <td className="px-3 py-2 text-slate-700">{user.codigoRegistro}</td>
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
            totalItems={filteredUsers.length}
            itemLabel="usuarios"
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={handleCloseCreateModal}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-5 border-b border-slate-200 pb-4">
              <h3 className="text-xl font-semibold text-slate-900">Crear nuevo usuario</h3>
              <p className="mt-1 text-sm text-slate-500">Completa la informacion para registrar la cuenta.</p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={newUser.cedula}
                  onChange={(event) => handleNewUserFieldChange('cedula', event.target.value)}
                  placeholder="Cedula"
                  required
                  maxLength={20}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) => handleNewUserFieldChange('email', event.target.value)}
                  placeholder="Email"
                  required
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="text"
                  value={newUser.name}
                  onChange={(event) => handleNewUserFieldChange('name', event.target.value)}
                  placeholder="Nombre"
                  required
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(event) => handleNewUserFieldChange('lastName', event.target.value)}
                  placeholder="Apellido"
                  required
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="password"
                  value={newUser.password}
                  onChange={(event) => handleNewUserFieldChange('password', event.target.value)}
                  placeholder="Contrasena"
                  required
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <select
                  value={newUser.rol}
                  onChange={(event) => handleNewUserFieldChange('rol', event.target.value as CreateUserRole)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                >
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
                  <option value="MEDICO">Medico</option>
                </select>

                <input
                  type="text"
                  value={newUser.especialidad}
                  onChange={(event) => handleNewUserFieldChange('especialidad', event.target.value)}
                  placeholder="Especialidad (opcional)"
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="text"
                  value={newUser.tipoProfesional}
                  onChange={(event) => handleNewUserFieldChange('tipoProfesional', event.target.value)}
                  placeholder="Tipo profesional (opcional)"
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40"
                />

                <input
                  type="text"
                  value={newUser.codigoRegistro}
                  onChange={(event) => handleNewUserFieldChange('codigoRegistro', event.target.value)}
                  placeholder="Codigo registro (opcional)"
                  maxLength={120}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#4A7FA5] focus:ring-2 focus:ring-[#4A7FA5]/40 md:col-span-2"
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseCreateModal} disabled={isCreating}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Guardar usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
