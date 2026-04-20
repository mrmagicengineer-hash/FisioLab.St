export type UserManagementUser = {
  id: number
  cedula: string
  email: string
  name: string
  lastName: string
  rol: 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'
  activo: boolean
  especialidad: string
  tipoProfesional: string
  codigoRegistro: string
}

export const USER_MANAGEMENT_USERS: UserManagementUser[] = [
  {
    id: 1,
    cedula: '1721212312',
    email: 'admin@fisiolab.com',
    name: 'Mr Magic',
    lastName: 'Admin',
    rol: 'ADMINISTRADOR',
    activo: true,
    especialidad: 'Administracion',
    tipoProfesional: 'Administrador',
    codigoRegistro: 'ADM-001'
  },
  {
    id: 2,
    cedula: '1234567890',
    email: 'fisio@demo.com',
    name: 'Veronica',
    lastName: 'Estrella',
    rol: 'FISIOTERAPEUTA',
    activo: false,
    especialidad: 'Rehabilitacion',
    tipoProfesional: 'Fisioterapeuta',
    codigoRegistro: 'COL-001'
  },
  {
    id: 3,
    cedula: 'string',
    email: 'andres@test.com',
    name: 'string',
    lastName: 'string',
    rol: 'FISIOTERAPEUTA',
    activo: true,
    especialidad: 'string',
    tipoProfesional: 'string',
    codigoRegistro: 'string'
  }
]
