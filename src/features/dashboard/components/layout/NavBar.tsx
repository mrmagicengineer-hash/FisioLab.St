import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserRole } from '../../../auth/data/types'
import { PatientCreateDrawer } from '../patient-record/PatientCreateDrawer'
import { PatientSearch, type Patient as SearchPatient } from '../patient-record/PatientSearch'
import { getPatients } from '../../data/services/patientsService'
import {
  isPatientsCacheFresh,
  readPatientsCache,
  writePatientsCache
} from '../../data/services/patientsCache'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

type NavBarProps = {
  onLogout?: () => void
  isCollapsed: boolean
  role: UserRole
  onOpenPatientRecord?: (patientId: number) => void
  onQuickRegisterPatient?: (payload: {
    patientId: number
    hcl: string
    openedAt: string
    healthUnit: string
    clinicalHistoryStatus: 'ABIERTA'
  }) => void
}

export function Navbar({
  onLogout,
  isCollapsed,
  role,
  onOpenPatientRecord,
  onQuickRegisterPatient
}: NavBarProps) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [searchCatalog, setSearchCatalog] = useState<SearchPatient[]>(() => {
    const cached = readPatientsCache('')
    return cached
      ? cached.map((dto) => ({
          id: dto.id,
          hcl: dto.hcl,
          cedula: dto.cedula,
          nombre: dto.nombresCompletos,
          estadoArchivo: dto.estadoArchivo
        }))
      : []
  })

  const canShowQuickRegister = role === 'FISIOTERAPEUTA'

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      if (isPatientsCacheFresh('')) {
        return
      }

      try {
        const result = await getPatients()
        if (cancelled) {
          return
        }

        writePatientsCache('', result)
        setSearchCatalog(
          result.map((dto) => ({
            id: dto.id,
            hcl: dto.hcl,
            cedula: dto.cedula,
            nombre: dto.nombresCompletos,
            estadoArchivo: dto.estadoArchivo
          }))
        )
      } catch {
        // la búsqueda puede quedarse vacía silenciosamente
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 right-0 z-50 w-full border-b border-slate-200 bg-white transition-all duration-300 ${
          isCollapsed ? 'sm:left-20 sm:w-[calc(100%-5rem)]' : 'sm:left-72 sm:w-[calc(100%-18rem)]'
        }`}
      >
        <div className="px-4 py-4 lg:px-6 lg:pl-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 sm:hidden"
                aria-label="Abrir menu"
              >
                <svg className="h-6 w-6" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h10" />
                </svg>
              </Button>

              {isCollapsed && (
                <a href="/" className="ml-2 flex items-center" aria-label="Ir al inicio">
                  <img src="/logo/logofisiolab.png" alt="Fisiolab" className="h-8 w-auto object-contain" />
                </a>
              )}
            </div>

            <div className="hidden flex-1 items-center gap-3 px-3 sm:flex md:px-6">
              <div className="w-full max-w-xl">
                <PatientSearch
                  patients={searchCatalog}
                  onSelect={(patient) => onOpenPatientRecord?.(patient.id)}
                  onCreateNew={() => setIsCreateDrawerOpen(true)}
                />
              </div>
            </div>

            <div className="relative flex items-center gap-2">


              {canShowQuickRegister && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[#4A7FA5]/30 bg-white text-[#4A7FA5] shadow-sm transition-all hover:bg-[#4A7FA5]/5 hover:border-[#4A7FA5]/50 focus-visible:ring-2 focus-visible:ring-[#4A7FA5]/40"
                  onClick={() => setIsCreateDrawerOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                  <span className="font-semibold">Nuevo Paciente</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-[#4A7FA5]/10 focus-visible:ring-2 focus-visible:ring-[#4A7FA5]/40"
                      aria-label="Abrir menu de usuario"
                    />
                  }
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#4A7FA5] text-white transition-colors hover:bg-[#3f6d8f]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="5" />
                      <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                  </span>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end" sideOffset={10} className="w-56 p-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="space-y-0.5">
                      <p className="text-base font-medium text-slate-900">Usuario</p>
                      <p className="truncate text-sm font-normal text-slate-500">usuario@fisiolab.com</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="py-2 text-base">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mr-2"
                    >
                      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" className="py-2 text-base" onClick={onLogout}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mr-2"
                    >
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    </svg>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <PatientCreateDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onCreated={(created) => {
          onQuickRegisterPatient?.({
            patientId: created.id,
            hcl: created.hcl,
            openedAt: new Date().toISOString(),
            healthUnit: import.meta.env.VITE_DEFAULT_HEALTH_UNIT ?? 'Unidad de Salud Fisiolab',
            clinicalHistoryStatus: 'ABIERTA'
          })
        }}
      />
    </>
  )
}