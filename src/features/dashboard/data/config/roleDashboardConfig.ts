import type { UserRole } from '../../../auth/data/types'

export type RoleDashboardConfig = {
  title: string
  subtitle: string
  modules: string[]
  actions: string[]
  accentColor: string
}

export const ROLE_DASHBOARD_CONFIG: Record<UserRole, RoleDashboardConfig> = {
  ADMINISTRADOR: {
    title: 'Administrador',
    subtitle: 'Gestion central del sistema y control de usuarios.',
    modules: ['Usuarios', 'Agenda general', 'Reportes ejecutivos'],
    actions: ['Crear/editar profesionales', 'Asignar permisos', 'Auditar actividad'],
    accentColor: '#155eef'
  },
  FISIOTERAPEUTA: {
    title: 'Fisioterapeuta',
    subtitle: 'Seguimiento clinico y progreso terapeutico de pacientes.',
    modules: ['Agenda de terapias', 'Historias de rehabilitacion', 'Evolucion funcional'],
    actions: ['Registrar sesiones', 'Actualizar planes terapeuticos', 'Emitir recomendaciones'],
    accentColor: '#027a48'
  },
  MEDICO: {
    title: 'Medico',
    subtitle: 'Valoracion clinica y control del tratamiento medico.',
    modules: ['Consultas medicas', 'Diagnosticos', 'Ordenes y remisiones'],
    actions: ['Evaluar pacientes', 'Emitir diagnostico', 'Definir conductas medicas'],
    accentColor: '#b54708'
  },
  UNKNOWN: {
    title: 'Usuario',
    subtitle: 'No fue posible identificar el rol desde el token.',
    modules: ['Inicio'],
    actions: ['Contactar al administrador'],
    accentColor: '#475467'
  }
}
