import type { ReactNode } from 'react'
import type { UserRole } from '../../auth/data/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Navbar } from '../components/layout/NavBar'
import { Sidebar, type DashboardView } from '../components/layout/Sidebar'
import { UserManagementView } from '../components/UserManagementView'
import { BlockedAccountsView } from '../components/BlockedAccountsView'
import { RolesPermissionsView } from '../components/RolesPermissionsView'
import { AuditView } from '../components/AuditView'
import { PatientRecordView } from '../components/PatientRecordView'
import { TratamientosView } from '../components/TratamientosView'
import { AgendaPage } from '../../agenda/scenes/AgendaPage'
import { TherapySessionPage } from '../../therapy-sessions/scenes/TherapySessionPage'
import { useEffect, useState } from 'react'
import { getActiveUsers } from '../data/services/activeUsersService'
import { getBlockedUsers } from '../data/services/blockedUsersService'
import { getAuditEvents, type AuditEventDto } from '../data/services/auditService'

type RoleDashboardPageProps = {
  role: UserRole
  onLogout: () => void
}

type UserAccountStateItem = {
  id: string
  initials: string
  name: string
  roleName: string
  status: 'Bloqueada' | 'Activa'
  statusClassName: string
  dateLabel: string
}

type MainAuditEventItem = {
  id: string
  title: string
  subtitle: string
  dotColor: string
  ringColor: string
  isCritical?: boolean
}

type PassiveFileCandidate = {
  id: string
  hcl: string
  nombre: string
  ultimaAtencion: string
  diasSinAtencion: number
}

type PatientRouteState = {
  view: 'list' | 'detail'
  patientId: number | null
}

type ClinicalHistoryOpeningMeta = {
  patientId: number
  hcl: string
  openedAt: string
  healthUnit: string
  clinicalHistoryStatus: 'ABIERTA'
}

const PASSIVE_FILE_THRESHOLD_DAYS = 60
const PATIENTS_BASE_PATH = '/dashboard/pacientes'
const CONSULTATIONS_BASE_PATH = '/dashboard/consultas'

function parseClinicalRoute(pathname: string, basePath: string): PatientRouteState | null {
  if (pathname === basePath || pathname === `${basePath}/`) {
    return {
      view: 'list',
      patientId: null
    }
  }

  const detailMatch = pathname.match(new RegExp(`^${basePath}/(\\d+)/?$`))
  if (!detailMatch) {
    return null
  }

  return {
    view: 'detail',
    patientId: Number(detailMatch[1])
  }
}

function pushPath(pathname: string) {
  if (window.location.pathname !== pathname) {
    window.history.pushState(null, '', pathname)
  }
}

const MOCK_PASSIVE_FILE_CANDIDATES: PassiveFileCandidate[] = [
  {
    id: 'p-1',
    hcl: 'HCL-14827',
    nombre: 'Maria Torres',
    ultimaAtencion: '2026-02-10',
    diasSinAtencion: 56
  },
  {
    id: 'p-2',
    hcl: 'HCL-13988',
    nombre: 'Carlos Ruiz',
    ultimaAtencion: '2026-02-05',
    diasSinAtencion: 61
  },
  {
    id: 'p-3',
    hcl: 'HCL-12764',
    nombre: 'Ana Cedeño',
    ultimaAtencion: '2026-02-01',
    diasSinAtencion: 65
  }
]

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getInitials(name: string, lastName: string): string {
  const first = name.trim().charAt(0).toUpperCase()
  const second = lastName.trim().charAt(0).toUpperCase()
  return `${first}${second}`
}

function toMainAuditEvent(event: AuditEventDto): MainAuditEventItem {
  const normalizedAction = event.accion.toUpperCase()
  const isUnblockAction =
    normalizedAction.includes('DESACTIVAR') ||
    normalizedAction.includes('DESBLOQUE')

  const isBlockedAction =
    !isUnblockAction &&
    (normalizedAction.includes('BLOQUEADO') ||
      normalizedAction.includes('BLOQUEO') ||
      normalizedAction.includes('BLOQUEAR'))

  const isHighSeverity = event.severidad === 'ALTA'
  const isCritical = isBlockedAction || isHighSeverity

  return {
    id: event.id,
    title: event.accion.replaceAll('_', ' '),
    subtitle: `${event.usuario} - ${event.fecha}`,
    dotColor:
      isBlockedAction || event.severidad === 'ALTA'
        ? 'bg-red-500'
        : event.severidad === 'MEDIA'
          ? 'bg-amber-500'
          : 'bg-emerald-500',
    ringColor:
      isBlockedAction || event.severidad === 'ALTA'
        ? 'ring-red-50'
        : event.severidad === 'MEDIA'
          ? 'ring-amber-50'
          : 'ring-emerald-50',
    isCritical
  }
}

function getAuditSortValue(event: AuditEventDto): number {
  const numericId = Number(event.id)
  return Number.isNaN(numericId) ? 0 : numericId
}

export function RoleDashboardPage({ role, onLogout }: RoleDashboardPageProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    const parsedPatientRoute = role === 'FISIOTERAPEUTA' ? parseClinicalRoute(window.location.pathname, PATIENTS_BASE_PATH) : null
    const parsedConsultationsRoute = role === 'FISIOTERAPEUTA' ? parseClinicalRoute(window.location.pathname, CONSULTATIONS_BASE_PATH) : null

    if (parsedPatientRoute) {
      return 'patients'
    }

    if (parsedConsultationsRoute) {
      return 'consultations'
    }

    return 'dashboard'
  })
  const [patientRoute, setPatientRoute] = useState<PatientRouteState>(() => {
    const parsedPatientRoute = role === 'FISIOTERAPEUTA' ? parseClinicalRoute(window.location.pathname, PATIENTS_BASE_PATH) : null
    const parsedConsultationsRoute = role === 'FISIOTERAPEUTA' ? parseClinicalRoute(window.location.pathname, CONSULTATIONS_BASE_PATH) : null

    return parsedPatientRoute ?? parsedConsultationsRoute ?? {
      view: 'list',
      patientId: null
    }
  })
  const [recentClinicalHistoryOpening, setRecentClinicalHistoryOpening] =
    useState<ClinicalHistoryOpeningMeta | null>(null)
  const [kpiAnimationSeed, setKpiAnimationSeed] = useState(0)
  const [kpiCounts, setKpiCounts] = useState({
    blockedUsers: 0,
    activeUsers: 0,
    securityAlerts: 0,
    pendingChanges: 0
  })
  const [kpiError, setKpiError] = useState('')
  const [userAccountStates, setUserAccountStates] = useState<UserAccountStateItem[]>([])
  const [mainAuditEvents, setMainAuditEvents] = useState<MainAuditEventItem[]>([])
  const [passiveCandidates, setPassiveCandidates] = useState<PassiveFileCandidate[]>(MOCK_PASSIVE_FILE_CANDIDATES)
  const [passiveUpdateSummary, setPassiveUpdateSummary] = useState('')

  const isPhysio = role === 'FISIOTERAPEUTA'

  function getClinicalBasePath(view: DashboardView): string {
    return view === 'consultations' ? CONSULTATIONS_BASE_PATH : PATIENTS_BASE_PATH
  }

  function handleOpenPatientRecord(patientId: number) {
    const nextView: DashboardView = activeView === 'consultations' ? 'consultations' : 'patients'
    setActiveView(nextView)
    setPatientRoute({ view: 'detail', patientId })
    pushPath(`${getClinicalBasePath(nextView)}/${patientId}`)
  }

  function handleBackToPatientList() {
    const nextView: DashboardView = activeView === 'consultations' ? 'consultations' : 'patients'
    setActiveView(nextView)
    setPatientRoute({ view: 'list', patientId: null })
    pushPath(getClinicalBasePath(nextView))
  }

  function handleNavigate(view: DashboardView) {
    setActiveView(view)

    if (isPhysio) {
      if (view === 'patients' || view === 'consultations') {
        setPatientRoute({ view: 'list', patientId: null })
        pushPath(getClinicalBasePath(view))
      } else if (window.location.pathname.startsWith(PATIENTS_BASE_PATH)) {
        pushPath('/dashboard')
      } else if (window.location.pathname.startsWith(CONSULTATIONS_BASE_PATH)) {
        pushPath('/dashboard')
      }
    }

    if (view === 'dashboard') {
      setKpiAnimationSeed((value) => value + 1)
    }
  }

  function handleQuickRegisterPatient(payload: ClinicalHistoryOpeningMeta) {
    if (!isPhysio) {
      return
    }

    setRecentClinicalHistoryOpening(payload)

    if (payload.patientId > 0) {
      handleOpenPatientRecord(payload.patientId)
      return
    }

    handleBackToPatientList()
  }

  useEffect(() => {
    if (!isPhysio) {
      return
    }

    function syncPatientsViewWithLocation() {
      const parsedPatients = parseClinicalRoute(window.location.pathname, PATIENTS_BASE_PATH)
      const parsedConsultations = parseClinicalRoute(window.location.pathname, CONSULTATIONS_BASE_PATH)

      if (parsedPatients) {
        setActiveView('patients')
        setPatientRoute(parsedPatients)
        return
      }

      if (parsedConsultations) {
        setActiveView('consultations')
        setPatientRoute(parsedConsultations)
      }
    }

    window.addEventListener('popstate', syncPatientsViewWithLocation)
    syncPatientsViewWithLocation()

    return () => {
      window.removeEventListener('popstate', syncPatientsViewWithLocation)
    }
  }, [isPhysio])

  // Escucha el trigger de Agenda → Sesiones de Terapia
  // Mismo patrón que auth:logout. El paciente/cita activos viven en ActiveAppointmentContext.
  useEffect(() => {
    function handleSessionHandoff() {
      setActiveView('therapy-sessions')
      pushPath('/dashboard/sesiones/nueva')
    }

    window.addEventListener('agenda:session-handoff', handleSessionHandoff)
    return () => {
      window.removeEventListener('agenda:session-handoff', handleSessionHandoff)
    }
  }, [])

  function executePassiveFileUpdate() {
    const affectedCount = passiveCandidates.filter(
      (candidate) => candidate.diasSinAtencion >= PASSIVE_FILE_THRESHOLD_DAYS
    ).length

    setPassiveUpdateSummary(
      affectedCount > 0
        ? `Actualizacion ejecutada: ${affectedCount} pacientes marcados para archivo pasivo.`
        : 'Actualizacion ejecutada: no hubo pacientes afectados.'
    )

    setPassiveCandidates((previous) =>
      previous.filter((candidate) => candidate.diasSinAtencion < PASSIVE_FILE_THRESHOLD_DAYS)
    )
  }

  useEffect(() => {
    let isMounted = true

    async function loadKpis() {
      if (activeView !== 'dashboard' || isPhysio) {
        return
      }

      setKpiError('')

      const [activeUsersResult, blockedUsersResult, auditEventsResult] = await Promise.allSettled([
        getActiveUsers(),
        getBlockedUsers(),
        getAuditEvents()
      ])

      if (!isMounted) {
        return
      }

      const activeUsers = activeUsersResult.status === 'fulfilled' ? activeUsersResult.value.length : 0
      const blockedUsers = blockedUsersResult.status === 'fulfilled' ? blockedUsersResult.value.length : 0
      const nowLabel = formatDateLabel(new Date())

      setKpiCounts({
        blockedUsers,
        activeUsers,
        // Derivados de estado real de cuentas mientras no exista endpoint dedicado.
        securityAlerts: blockedUsers,
        pendingChanges: blockedUsers > 0 ? 1 : 0
      })

      const blockedAccountsForCard =
        blockedUsersResult.status === 'fulfilled'
          ? blockedUsersResult.value.map((user) => ({
              id: `blocked-${user.id}`,
              initials: getInitials(user.name, user.lastName),
              name: `${user.name} ${user.lastName}`,
              roleName: user.rol,
              status: 'Bloqueada' as const,
              statusClassName: 'bg-red-50 text-red-700 border border-red-200',
              dateLabel: `Fecha de bloqueo: ${nowLabel}`
            }))
          : []

      const activeAccountsForCard =
        activeUsersResult.status === 'fulfilled'
          ? activeUsersResult.value.map((user) => ({
              id: `active-${user.id}`,
              initials: getInitials(user.name, user.lastName),
              name: `${user.name} ${user.lastName}`,
              roleName: user.rol,
              status: 'Activa' as const,
              statusClassName: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
              dateLabel: `Ultima actualizacion: ${nowLabel}`
            }))
          : []

      setUserAccountStates([...blockedAccountsForCard, ...activeAccountsForCard].slice(0, 6))

      if (auditEventsResult.status === 'fulfilled') {
        const latestEvents = [...auditEventsResult.value]
          .sort((a, b) => getAuditSortValue(b) - getAuditSortValue(a))
          .slice(0, 4)
          .map(toMainAuditEvent)

        setMainAuditEvents(latestEvents)
      } else {
        setMainAuditEvents([])
      }

      const errors: string[] = []

      if (activeUsersResult.status === 'rejected') {
        errors.push(
          activeUsersResult.reason instanceof Error
            ? activeUsersResult.reason.message
            : 'No fue posible cargar usuarios activos.'
        )
      }

      if (blockedUsersResult.status === 'rejected') {
        errors.push(
          blockedUsersResult.reason instanceof Error
            ? blockedUsersResult.reason.message
            : 'No fue posible cargar cuentas bloqueadas.'
        )
      }

      if (auditEventsResult.status === 'rejected') {
        errors.push(
          auditEventsResult.reason instanceof Error
            ? auditEventsResult.reason.message
            : 'No fue posible cargar eventos de auditoria.'
        )
      }

      if (errors.length > 0) {
        setKpiError(errors[0])
      }

      setKpiAnimationSeed((value) => value + 1)
    }

    void loadKpis()

    return () => {
      isMounted = false
    }
  }, [activeView])

  // 1. REORGANIZACIÓN DE JERARQUÍA: Lo urgente va primero.
  const kpiItems = [
    {
      title: 'Cuentas Bloqueadas',
      value: kpiCounts.blockedUsers.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-red-600">
          <path d="M19 16v-2a2 2 0 0 0-4 0v2" />
          <path d="M9.5 15H7a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <rect x="13" y="16" width="8" height="5" rx="0.899" />
        </svg>
      ),
      color: 'text-red-700',
      iconContainerClassName: 'bg-red-100/50'
    },
    {
      title: 'Alertas de Seguridad', // Nuevo KPI más útil para el admin
      value: kpiCounts.securityAlerts.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-amber-600">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      ),
      color: 'text-amber-700',
      iconContainerClassName: 'bg-amber-100/50'
    },
    {
      title: 'Cambios Pendientes', // Nuevo KPI enfocado en acción
      value: kpiCounts.pendingChanges.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-sky-600">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: 'text-sky-700',
      iconContainerClassName: 'bg-sky-100/50'
    },
    {
      title: 'Usuarios Activos', // Movido al final
      value: kpiCounts.activeUsers.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-emerald-600">
          <path d="m16 11 2 2 4-4" />
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
      color: 'text-emerald-700',
      iconContainerClassName: 'bg-emerald-100/50'
    }
  ]

  return (
    <div className="clinical-page-bg min-h-screen bg-neutral-primary-soft">
      <Navbar
        onLogout={onLogout}
        isCollapsed={isCollapsed}
        role={role}
        onOpenPatientRecord={handleOpenPatientRecord}
        onQuickRegisterPatient={handleQuickRegisterPatient}
      ></Navbar>
      <Sidebar
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((value) => !value)}
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      <main
        className={`space-y-6 px-4 pb-8 pt-24 transition-all duration-180 sm:px-6 ${isCollapsed ? 'sm:ml-20' : 'sm:ml-72'}`}
      >
        {role === 'FISIOTERAPEUTA' && activeView === 'patients' ? (
          < PatientRecordView
            role={role}
            sectionMode="patients"
            mainView={patientRoute.view === 'detail' ? 'ficha' : 'listado'}
            selectedPatientIdFromRoute={patientRoute.patientId}
            recentClinicalHistoryOpening={recentClinicalHistoryOpening}
            onOpenPatientRecord={handleOpenPatientRecord}
            onBackToPatientList={handleBackToPatientList}
            onOpenAudit={() => setActiveView('audit')}
          />
        ) : role === 'FISIOTERAPEUTA' && activeView === 'consultations' ? (
          <PatientRecordView
            role={role}
            sectionMode="consultations"
            mainView={patientRoute.view === 'detail' ? 'ficha' : 'listado'}
            selectedPatientIdFromRoute={patientRoute.patientId}
            recentClinicalHistoryOpening={recentClinicalHistoryOpening}
            onOpenPatientRecord={handleOpenPatientRecord}
            onBackToPatientList={handleBackToPatientList}
            onOpenAudit={() => setActiveView('audit')}
          />
        ) : role === 'FISIOTERAPEUTA' && activeView === 'agenda' ? (
          <AgendaPage />
        ) : role === 'FISIOTERAPEUTA' && activeView === 'treatment-plans' ? (
          <TratamientosView />
        ) : role === 'FISIOTERAPEUTA' && activeView === 'therapy-sessions' ? (
          <TherapySessionPage />
        ) : activeView === 'user-management' ? (
          <UserManagementView />
        ) : activeView === 'blocked-accounts' ? (
          <BlockedAccountsView />
        ) : activeView === 'roles-permissions' ? (
          <RolesPermissionsView />
        ) : activeView === 'audit' ? (
          <AuditView />
        ) : role === 'FISIOTERAPEUTA' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Inicio clinico</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Accion rapida</p>
                <p className="font-semibold text-slate-900">Encontrar paciente</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Accion rapida</p>
                <p className="font-semibold text-slate-900">Nuevo paciente con HCL automatico</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-slate-500">Accion rapida</p>
                <p className="font-semibold text-slate-900">Actualizar estado clinico y ficha familiar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {kpiItems.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              color={item.color}
              iconContainerClassName={item.iconContainerClassName}
              animationSeed={kpiAnimationSeed}
            />
          ))}
        </div>

        {kpiError && (
          <p className="text-sm text-amber-700">
            {kpiError}
          </p>
        )}

        {!kpiError && kpiCounts.blockedUsers === 0 && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            No existen cuentas bloqueadas actualmente.
          </p>
        )}

        <Card className="motion-soft border-[#1f5563]/15 shadow-md">
          <CardHeader>
            <CardTitle>Pacientes proximos a archivo pasivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {passiveCandidates.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No hay pacientes proximos a cambiar a archivo pasivo.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-[#1f5563]/5">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">HCL</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Paciente</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Ultima atencion</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Dias sin atencion</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {passiveCandidates.map((candidate, index) => {
                      const nearPassive =
                        candidate.diasSinAtencion >= PASSIVE_FILE_THRESHOLD_DAYS - 5

                      return (
                        <tr
                          key={candidate.id}
                          className="stagger-item motion-soft"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <td className="px-3 py-2 text-slate-700">{candidate.hcl}</td>
                          <td className="px-3 py-2 text-slate-700">{candidate.nombre}</td>
                          <td className="px-3 py-2 text-slate-700">{candidate.ultimaAtencion}</td>
                          <td className="px-3 py-2 text-slate-700">{candidate.diasSinAtencion}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${nearPassive
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}
                            >
                              {nearPassive ? 'ALTO' : 'MEDIO'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" className="motion-soft border-amber-300 text-amber-700 hover:bg-amber-50" onClick={executePassiveFileUpdate}>
                Ejecutar actualizacion de archivo pasivo
              </Button>

              {passiveUpdateSummary && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {passiveUpdateSummary}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="motion-soft xl:col-span-2">
            <CardHeader>
              <CardTitle>Estado de cuentas de usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userAccountStates.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  No hay informacion de estado de cuentas para mostrar.
                </p>
              ) : userAccountStates.map((account, index) => (
                <div
                  key={account.id}
                  className="stagger-item motion-soft flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                      {account.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
                      <p className="truncate text-sm text-slate-500">{account.roleName}</p>
                      <p className="truncate text-xs text-slate-400">{account.dateLabel}</p>
                    </div>
                  </div>
                  
                  {/* 3. ACCIONES INLINE: Botón directo para desbloquear si la cuenta está bloqueada */}
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${account.statusClassName}`}>
                      {account.status}
                    </span>
                    {account.status === 'Bloqueada' && (
                      <button 
                        type="button" 
                        className="rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        onClick={() => console.log(`Abrir modal para desbloquear a ${account.name}`)}
                      >
                        Desbloquear
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2 text-right">
                <button type="button" className="text-sm font-bold text-[#4A7FA5] transition-colors hover:text-[#3f6d8f]">
                  Gestionar todas las cuentas {'>'}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="motion-soft h-fit border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Ultimos eventos de auditoria</CardTitle>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="relative ml-2 space-y-5 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-100 before:content-['']">
                {mainAuditEvents.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                    No hay eventos de auditoria recientes.
                  </p>
                ) : (
                  mainAuditEvents.map((event, index) => (
                    <TimelineItem
                      key={event.id}
                      title={event.title}
                      subtitle={event.subtitle}
                      dotColor={event.dotColor}
                      ringColor={event.ringColor}
                      isCritical={event.isCritical}
                      animationDelay={index * 45}
                    />
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center pl-8">
                <button className="group flex items-center gap-1 text-sm font-bold text-[#4A7FA5] transition-colors hover:text-[#3f6d8f]" type="button">
                  Ver registro completo
                  <svg
                    className="transition-transform group-hover:translate-x-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </main>
    </div>
  )
}

type StatCardProps = {
  title: string
  value: string
  icon: ReactNode
  color: string
  iconContainerClassName: string
  animationSeed: number
}

type TimelineItemProps = {
  title: string
  subtitle: string
  dotColor: string
  ringColor: string
  isCritical?: boolean
  animationDelay?: number
}

function StatCard({ title, value, icon, color, iconContainerClassName, animationSeed }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-bold tracking-wider text-slate-400 uppercase">{title}</p>
            <div className="flex items-baseline gap-1">
              <AnimatedKpiValue value={value} className={`text-4xl font-extrabold tracking-tight ${color}`} animationSeed={animationSeed} />
            </div>
          </div>

          <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm', iconContainerClassName)}>
            <div className="scale-110">{icon}</div>
          </div>
        </div>
      </CardContent>

      <div className={cn('h-1.5 w-full opacity-50', iconContainerClassName)} />
    </Card>
  )
}

type AnimatedKpiValueProps = {
  value: string
  className: string
  animationSeed: number
}

function AnimatedKpiValue({ value, className, animationSeed }: AnimatedKpiValueProps) {
  const numericTarget = Number(value.replace(/,/g, ''))
  const isNumeric = Number.isFinite(numericTarget)
  const [displayValue, setDisplayValue] = useState(isNumeric ? 0 : value)

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value)
      return
    }

    let frameId = 0
    const durationMs = 900
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const nextValue = Math.round(numericTarget * progress)

      setDisplayValue(new Intl.NumberFormat('en-US').format(nextValue))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [value, numericTarget, isNumeric, animationSeed])

  return <h3 className={className}>{displayValue}</h3>
}

function TimelineItem({ title, subtitle, dotColor, ringColor, isCritical = false, animationDelay = 0 }: TimelineItemProps) {
  return (
    <div className="stagger-item relative pl-6" style={{ animationDelay: `${animationDelay}ms` }}>
      <span
        className={cn('absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4', dotColor, ringColor)}
        aria-hidden="true"
      />
      <div className="motion-soft rounded-lg border border-slate-200 bg-white p-3">
        <p className={cn('text-sm font-semibold text-slate-800', isCritical && 'text-red-700')}>{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}