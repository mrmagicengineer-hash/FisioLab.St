import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Activity } from 'lucide-react'

// import { FichaFamiliarTab } from './FichaFamiliarTab'
import { DatosTarjeteroTab } from './DatosTarjeteroTab'

// Asegúrate de importar tus tipos actualizados
import type {
  PatientData,
  TabKey,
  ClinicalOverviewData,
  FamilyRecordMeta,
  AuditEntry,
  ClinicalHistoryOpeningMeta,
  ClinicalEpisode
} from './types'
import type { UserRole } from '@/features/auth/data/types'
import { PatientDetailHeader } from './PatientDetailHeader'
import { useEffect, useState } from 'react'
import { CreateEpisodeDrawer } from './CreateEpisodeDrawer'

import { clinicalEpisodeService } from '../../data/services/clinicalEpisodeService'
import { EpisodeItem } from './EpisodeItem';

type PatientDetailSectionProps = {
  role: UserRole
  tabsMode: 'consultations' | 'full'
  isLoadingPatients: boolean
  selectedPatient: any
  selectedHistoryOpeningMeta: ClinicalHistoryOpeningMeta | null
  savedData: PatientData
  draftData: PatientData
  activeTab: TabKey
  isEditing: boolean
  canEditRecord: boolean
  isSavingChanges: boolean
  feedbackMessage: string
  saveErrorMessage: string
  recordLoadError: string
  clinicalOverview: ClinicalOverviewData | null
  familyMeta: FamilyRecordMeta
  auditEntries: AuditEntry[]
  onBackToPatientList: () => void
  onOpenAudit: () => void
  onActiveTabChange: (tab: TabKey) => void
  onEditClick: () => void
  onCancelEdit: () => void
  onSaveChanges: () => void
  onFieldChange: (field: keyof PatientData, value: string | null) => void
  onSaveAndContinueFamily: () => void
  onSaveAndBackFamily: () => void
}

export function PatientDetailSection({
  draftData,
  activeTab,
  isEditing,
  canEditRecord,
  isSavingChanges,
  onActiveTabChange,
  onEditClick,
  onCancelEdit,
  onSaveChanges,
  onFieldChange,
  onBackToPatientList,
}: PatientDetailSectionProps) {

  // Estado para controlar el Drawer de creación de episodio
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false)
  const [episodes, setEpisodes] = useState<ClinicalEpisode[]>([])
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('')
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)

  // Cargar episodios cuando se activa la pestaña y hay un número HCL disponible
  useEffect(() => {
    if (activeTab === 'episodios' && draftData?.hcl) {
      const fetchEpisodes = async () => {
        setIsLoadingEpisodes(true)
        try {
          const data = await clinicalEpisodeService.getHistory(draftData.hcl)
          setEpisodes(data)
          if (data && data.length > 0) {
            setSelectedEpisodeId(String(data[0].id))
          }
        } catch (error) {
          console.error("Error al cargar los episodios:", error)
          // Aquí podrías setear un estado de error si quieres mostrar un mensaje en la UI
        } finally {
          setIsLoadingEpisodes(false)
        }
      }

      fetchEpisodes()
    }
  }, [activeTab, draftData?.hcl])
  return (
    <div className="flex flex-col h-full gap-3">
      <button
        type="button"
        onClick={onBackToPatientList}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors rounded-md px-2 py-1 -ml-2 hover:bg-slate-100"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al listado
      </button>
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">

        {/* --- CABECERA DE LA FICHA (Ajustada a 24px y 16px) --- */}
        <PatientDetailHeader
          draftData={draftData}
          canEditRecord={canEditRecord}
          isEditing={isEditing}
          isSavingChanges={isSavingChanges}
          vitals={{
            presionArterial: '118/76',
            frecuenciaCardiaca: 72,
            frecuenciaRespiratoria: 16,
            temperatura: 36.6,
            saturacionOxigeno: 98,
            registradoEn: '05/04/2026 10:18'
          }}
          onBackToPatientList={onBackToPatientList}
          onEditClick={onEditClick}
          onCancelEdit={onCancelEdit}
          onSaveChanges={onSaveChanges}
        >
        </PatientDetailHeader>
        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v as TabKey)}>
            {/* Navegación de pestañas */}
            <TabsList className="flex w-full justify-start gap-6 sm:gap-8 rounded-none border-b border-slate-200 bg-transparent p-0 mb-8 h-auto overflow-x-auto overflow-y-hidden scrollbar-width-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

              {/* Pestaña: Filiación */}
              <TabsTrigger
                value="filiacion"
                className="flex-none group relative inline-flex items-center rounded-none border-b-2 border-transparent bg-transparent! px-1 pb-3 pt-2 text-base font-medium text-slate-500 shadow-none transition-colors hover:text-slate-700 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 mr-2 opacity-70 group-data-[state=active]:opacity-100 transition-opacity"
                >
                  <path d="M10.638 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v3.417" />
                  <path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" />
                </svg>
                Datos Personales
              </TabsTrigger>

              {/* Pestaña: Historia Clínica */}
              <TabsTrigger
                value="historia-clinica"
                className="flex-none group relative inline-flex items-center rounded-none border-b-2 border-transparent bg-transparent! px-1 pb-3 pt-2 text-base font-medium text-slate-500 shadow-none transition-colors hover:text-slate-700 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 mr-2 opacity-70 group-data-[state=active]:opacity-100 transition-opacity"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M12 7v5l4 2" />
                </svg>
                Historia Clínica y Antecedentes
              </TabsTrigger>

              {/* Pestaña: Episodios */}
              <TabsTrigger
                value="episodios"
                className="flex-none group relative inline-flex items-center rounded-none border-b-2 border-transparent bg-transparent! px-1 pb-3 pt-2 text-base font-medium text-slate-500 shadow-none transition-colors hover:text-slate-700 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 mr-2 opacity-70 group-data-[state=active]:opacity-100 transition-opacity"
                >
                  <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
                  <path d="M2 6h4" />
                  <path d="M2 10h4" />
                  <path d="M2 14h4" />
                  <path d="M2 18h4" />
                  <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                </svg>
                Consultas y Evaluaciones
              </TabsTrigger>

            </TabsList>

            {/* ==========================================
              PESTAÑA A: FICHA DE FILIACIÓN
              ========================================== */}
            <TabsContent value="filiacion" className="focus-visible:outline-none focus-visible:ring-0 space-y-8 animate-in fade-in duration-500">

              {/* 1. Datos Personales / Tarjetero */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#1A5276] rounded-full inline-block"></span>
                  Datos del Tarjetero
                </h3>
                <DatosTarjeteroTab
                  draftData={draftData}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                />
              </div>


            </TabsContent>

            {/* ==========================================
              PESTAÑA B: HISTORIA CLÍNICA Y ANTECEDENTES
              ========================================== */}
            <TabsContent value="historia-clinica" className="focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in duration-500">
              <div className="p-5 border border-slate-200/80 rounded-xl bg-white shadow-sm">
                {/* Reemplaza esto con tu componente de Resumen y Antecedentes */}
                <h3 className="text-base font-semibold text-slate-800 mb-4">Resumen y Alertas Médicas</h3>
                <p className="text-sm text-slate-500">Aquí se muestra el estado general, alertas y el botón de descarga del resumen.</p>

                <hr className="my-6 border-slate-100" />

                <h3 className="text-base font-semibold text-slate-800 mb-4">Antecedentes Personales y Familiares</h3>
                <p className="text-sm text-slate-500">Registro estático de antecedentes.</p>
              </div>
            </TabsContent>

            {/* ==========================================
              PESTAÑA C: EPISODIOS
              ========================================== */}
            <TabsContent value="episodios" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-500">
              <div className="p-5 border border-slate-200/80 rounded-xl bg-white shadow-sm">

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Historial de Consultas</h3>
                    <p className="text-sm text-slate-500 mt-1">Gestión de episodios clínicos y evoluciones.</p>
                  </div>

                  <Button
                    size="sm"
                    className="bg-[#1A5276] hover:bg-[#154360] shadow-sm flex items-center gap-2 text-base"
                    onClick={() => setIsEpisodeDrawerOpen(true)}
                  >
                    <Activity className="w-4 h-4" />
                    Nuevo Episodio
                  </Button>
                </div>

                {/* AQUI ESTÁ LA CLAVE: Renderizado dinámico */}
                <div className="border-t border-slate-100 pt-6 mt-4">
                  {isLoadingEpisodes ? (
                    <div className="text-sm text-slate-500 py-4 flex items-center justify-center">
                      <Activity className="w-4 h-4 mr-2 animate-pulse" />
                      Cargando historial de consultas...
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Historial de Visitas:</label>
                        <select
                          className="w-full sm:w-[250px] border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A5276]/30 focus:border-[#1A5276]"
                          value={selectedEpisodeId}
                          onChange={(e) => setSelectedEpisodeId(e.target.value)}
                        >
                          {episodes.map((ep, idx) => {
                            const dateLabel = new Date(ep.fechaApertura || new Date()).toLocaleDateString('es-EC')
                            return (
                              <option key={ep.id} value={String(ep.id)}>
                                {idx === 0 ? 'Última Consulta' : `Consulta #${episodes.length - idx}`} - {dateLabel}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      
                      <div className="bg-slate-50/50 p-1 rounded-xl border border-slate-100/50">
                        {episodes.filter(ep => String(ep.id) === selectedEpisodeId).map((ep) => (
                           <EpisodeItem key={`${ep.id}-${ep.estado}`} ep={ep} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-6">
                      Aún no hay episodios registrados. Haz clic en "Nuevo Episodio" para comenzar.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            {/* 3. Instancia del Drawer al final del componente */}
            <CreateEpisodeDrawer
              open={isEpisodeDrawerOpen}
              onOpenChange={setIsEpisodeDrawerOpen}
              numeroHcl={draftData?.hcl || 'Pendiente'}
            />


          </Tabs>
        </div>
      </div>
    </div>
  )
}