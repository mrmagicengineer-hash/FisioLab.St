import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { UserRole } from '@/features/auth/data/types'
import {
  createPersonalAntecedent,
  getClinicalEpisodeHistory,
  getPersonalAntecedents,
  openClinicalEpisode,
  registerEpisodeEgress,
  type ClinicalEpisodeHistoryDto,
  type PersonalAntecedentDto
} from '../../data/services/clinicalHistoryService'
import type { ClinicalOverviewData, ClinicalProblemSummary, PatientData } from './types'

type EpisodeStatus = 'ABIERTO' | 'COMPLETADO' | 'ABANDONADO' | 'DERIVADO'
type CareType = 'CONSULTA_EXTERNA' | 'EMERGENCIA' | 'HOSPITALIZACION'

type EpisodeAdmission = {
  fechaHora: string
  tipoAtencion: CareType
  motivoIngreso: string
  profesional: string
}

type EpisodeEgress = {
  condicionSalida: string
  causaAlta: string
  destinoPaciente: string
  referidoInstitucion: string
}

type EpisodeItem = {
  id: string
  backendEpisodeId: number | null
  sequence: number
  openedAt: string
  diagnosis: string
  cie10Code: string
  motivoConsulta: string
  priority: 'Alta' | 'Media' | 'Baja'
  actorApertura: string
  status: EpisodeStatus
  closedAt: string
  admission: EpisodeAdmission | null
  egress: EpisodeEgress | null
  linkedProblemId: string | null
}

type ProblemSource = 'NEW' | 'EXISTING'

type OpenEpisodeForm = {
  motivoConsulta: string
  cie10Code: string
  diagnosis: string
  priority: 'Alta' | 'Media' | 'Baja'
  problemSource: ProblemSource
  existingProblemId: string
  problemDescription: string
}

type AdmissionForm = {
  fechaHora: string
  tipoAtencion: CareType
  motivoIngreso: string
  profesional: string
}

type EgressForm = {
  condicionSalida: string
  causaAlta: string
  destinoPaciente: string
  referidoInstitucion: string
  cierreEstado: Exclude<EpisodeStatus, 'ABIERTO'>
}

type EpisodeLifecycleSectionProps = {
  role: UserRole
  savedData: PatientData
  clinicalOverview: ClinicalOverviewData | null
}

const EMPTY_OPEN_FORM: OpenEpisodeForm = {
  motivoConsulta: '',
  cie10Code: '',
  diagnosis: '',
  priority: 'Alta',
  problemSource: 'NEW',
  existingProblemId: '',
  problemDescription: ''
}

const EMPTY_ADMISSION_FORM: AdmissionForm = {
  fechaHora: '',
  tipoAtencion: 'CONSULTA_EXTERNA',
  motivoIngreso: '',
  profesional: ''
}

const EMPTY_EGRESS_FORM: EgressForm = {
  condicionSalida: '',
  causaAlta: '',
  destinoPaciente: '',
  referidoInstitucion: '',
  cierreEstado: 'COMPLETADO'
}

function toDateTimeInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function nowLabel(): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
}

function toDisplayDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function parseDateScore(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function inferDiagnosis(detail: string): string {
  const clean = detail.trim()
  return clean.length > 0 ? clean : 'Diagnostico no especificado'
}

function mapOverviewEpisodes(clinicalOverview: ClinicalOverviewData | null): EpisodeItem[] {
  if (!clinicalOverview) {
    return []
  }

  return (clinicalOverview.episodiosPrevios ?? []).map((entry, index) => {
    const sequence = Number(entry.id) || index + 1
    const parsedEpisodeId = Number(entry.id)
    const backendEpisodeId = Number.isFinite(parsedEpisodeId) && parsedEpisodeId > 0 ? parsedEpisodeId : null

    return {
      id: `prev-${entry.id}`,
      backendEpisodeId,
      sequence,
      openedAt: entry.fecha,
      diagnosis: inferDiagnosis(entry.detalle),
      cie10Code: '',
      motivoConsulta: entry.detalle || 'Motivo no especificado',
      priority: 'Media',
      actorApertura: 'Sistema',
      status: 'COMPLETADO',
      closedAt: entry.fecha,
      admission: null,
      egress: null,
      linkedProblemId: null
    }
  })
}

function inferLinkedProblemId(
  cie10Code: string,
  problems: ClinicalProblemSummary[]
): string | null {
  const normalized = cie10Code.trim().toUpperCase()
  if (!normalized) {
    return null
  }
  const match = problems.find((problem) => problem.codigoCie10.trim().toUpperCase() === normalized)
  return match ? match.id : null
}

function mapHistoryStatus(value: string): EpisodeStatus {
  const normalized = value.trim().toUpperCase()
  if (normalized === 'ABANDONADO') {
    return 'ABANDONADO'
  }
  if (normalized === 'DERIVADO') {
    return 'DERIVADO'
  }
  if (normalized === 'COMPLETADO' || normalized === 'CERRADO') {
    return 'COMPLETADO'
  }
  return 'ABIERTO'
}

function mapEpisodeHistoryToItems(
  items: ClinicalEpisodeHistoryDto[],
  problems: ClinicalProblemSummary[]
): EpisodeItem[] {
  return items.map((entry) => {
    const status = mapHistoryStatus(entry.estado)
    const cie10Code = entry.codigoCie10DiagnosticoPrincipal ?? ''
    return {
      id: `srv-${entry.id}`,
      backendEpisodeId: entry.id,
      sequence: entry.numeroSecuencial,
      openedAt: toDisplayDateTime(entry.fechaApertura),
      diagnosis: inferDiagnosis(entry.motivoConsulta),
      cie10Code,
      motivoConsulta: entry.motivoConsulta || 'Motivo no especificado',
      priority: 'Media',
      actorApertura: 'Sistema',
      status,
      closedAt: entry.fechaCierre ? toDisplayDateTime(entry.fechaCierre) : '',
      admission: null,
      egress:
        entry.fechaCierre || entry.estadoCierre || entry.observacionCierre
          ? {
              condicionSalida: entry.estadoCierre || status,
              causaAlta: entry.observacionCierre || 'No especificada',
              destinoPaciente: '-',
              referidoInstitucion: ''
            }
          : null,
      linkedProblemId: inferLinkedProblemId(cie10Code, problems)
    }
  })
}

export function EpisodeLifecycleSection({
  role,
  savedData,
  clinicalOverview
}: EpisodeLifecycleSectionProps) {
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([])
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(null)
  const [showOpenForm, setShowOpenForm] = useState(true)
  const [openForm, setOpenForm] = useState<OpenEpisodeForm>(EMPTY_OPEN_FORM)
  const [admissionTargetId, setAdmissionTargetId] = useState<string | null>(null)
  const [admissionForm, setAdmissionForm] = useState<AdmissionForm>(EMPTY_ADMISSION_FORM)
  const [egressTargetId, setEgressTargetId] = useState<string | null>(null)
  const [egressForm, setEgressForm] = useState<EgressForm>(EMPTY_EGRESS_FORM)
  const [uiMessage, setUiMessage] = useState('')
  const [isOpeningEpisode, setIsOpeningEpisode] = useState(false)
  const [isSavingEgress, setIsSavingEgress] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [lastAttentionLabel, setLastAttentionLabel] = useState(savedData.fechaUltimaAtencion || '-')
  const [problems, setProblems] = useState<ClinicalProblemSummary[]>([])
  const [linkProblemTargetId, setLinkProblemTargetId] = useState<string | null>(null)
  const [linkProblemSelection, setLinkProblemSelection] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const egressTargetEpisode = useMemo(() => {
    if (!egressTargetId) {
      return null
    }

    return episodes.find((episode) => episode.id === egressTargetId) ?? null
  }, [egressTargetId, episodes])

  useEffect(() => {
    let cancelled = false
    const seeded = clinicalOverview?.problemasActivos ?? []
    setProblems(seeded)

    if (seeded.length > 0) {
      return () => {
        cancelled = true
      }
    }

    const numeroHcl = savedData.hcl.trim()
    if (!numeroHcl || numeroHcl === '-') {
      return () => {
        cancelled = true
      }
    }

    async function loadProblemsFallback() {
      try {
        const antecedents = await getPersonalAntecedents(numeroHcl)
        if (cancelled) {
          return
        }
        const activePatological = antecedents
          .filter((item: PersonalAntecedentDto) => item.tipo === 'PATOLOGICO' && item.estado === 'ACTIVO')
          .map<ClinicalProblemSummary>((item) => ({
            id: String(item.id),
            descripcion: item.descripcion,
            codigoCie10: item.codigoCie10,
            estado: item.estado
          }))
        if (activePatological.length > 0) {
          setProblems(activePatological)
        }
      } catch {
        // ignore fallback errors; selector stays empty with a clear message
      }
    }

    void loadProblemsFallback()

    return () => {
      cancelled = true
    }
  }, [clinicalOverview, savedData.hcl])

  useEffect(() => {
    let cancelled = false

    async function loadEpisodeHistory() {
      const numeroHcl = savedData.hcl.trim()
      const problemList = clinicalOverview?.problemasActivos ?? []
      if (!numeroHcl || numeroHcl === '-') {
        setEpisodes(mapOverviewEpisodes(clinicalOverview))
        return
      }

      try {
        setIsLoadingHistory(true)
        const history = await getClinicalEpisodeHistory(numeroHcl)
        if (cancelled) {
          return
        }
        setEpisodes(mapEpisodeHistoryToItems(history, problemList))
      } catch {
        if (cancelled) {
          return
        }
        setEpisodes(mapOverviewEpisodes(clinicalOverview))
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    void loadEpisodeHistory()

    return () => {
      cancelled = true
    }
  }, [clinicalOverview, savedData.hcl])

  useEffect(() => {
    setLastAttentionLabel(savedData.fechaUltimaAtencion || '-')
  }, [savedData.fechaUltimaAtencion])

  const filteredAndSortedEpisodes = useMemo(() => {
    const sorted = [...episodes].sort((a, b) => parseDateScore(b.openedAt) - parseDateScore(a.openedAt))
    
    if (!searchTerm.trim()) {
      return sorted
    }
    
    const lowerSearch = searchTerm.toLowerCase()
    return sorted.filter(ep => 
      ep.cie10Code.toLowerCase().includes(lowerSearch) ||
      ep.diagnosis.toLowerCase().includes(lowerSearch) ||
      ep.motivoConsulta.toLowerCase().includes(lowerSearch)
    )
  }, [episodes, searchTerm])

  const canOpenEpisode = role === 'ADMINISTRADOR' || role === 'FISIOTERAPEUTA'
  const canRegisterAdmission = role === 'ADMINISTRADOR'
  const canRegisterEgress = role === 'FISIOTERAPEUTA'

  function nextEpisodeSequence(): number {
    if (episodes.length === 0) {
      return 1
    }

    return Math.max(...episodes.map((episode) => episode.sequence)) + 1
  }

  async function handleOpenEpisode() {
    const motivo = openForm.motivoConsulta.trim()
    const numeroHcl = savedData.hcl.trim()

    if (!numeroHcl || numeroHcl === '-') {
      setUiMessage('No se pudo determinar el numero de historia clinica para abrir el episodio.')
      return
    }

    if (!motivo) {
      setUiMessage('Completa el motivo de consulta para abrir el episodio.')
      return
    }

    let cie10Code = openForm.cie10Code.trim()
    let diagnosis = openForm.diagnosis.trim()
    let linkedProblem: ClinicalProblemSummary | null = null

    if (openForm.problemSource === 'EXISTING') {
      const selected = problems.find((problem) => problem.id === openForm.existingProblemId)
      if (!selected) {
        setUiMessage('Selecciona un problema existente del paciente para asociarlo al episodio.')
        return
      }
      linkedProblem = selected
      cie10Code = selected.codigoCie10.trim() || cie10Code
      diagnosis = diagnosis || selected.descripcion
    } else {
      const problemDescription = openForm.problemDescription.trim()
      if (!problemDescription || !cie10Code) {
        setUiMessage('Para crear un problema nuevo ingresa descripcion y codigo CIE-10.')
        return
      }
    }

    if (!cie10Code) {
      setUiMessage('Se requiere un codigo CIE-10 para abrir el episodio.')
      return
    }

    try {
      setIsOpeningEpisode(true)
      setUiMessage('')

      if (openForm.problemSource === 'NEW') {
        const createdProblem = await createPersonalAntecedent(numeroHcl, {
          tipo: 'PATOLOGICO',
          descripcion: openForm.problemDescription.trim(),
          codigoCie10: cie10Code,
          estado: 'ACTIVO'
        })
        linkedProblem = {
          id: String(createdProblem.id),
          descripcion: createdProblem.descripcion,
          codigoCie10: createdProblem.codigoCie10,
          estado: createdProblem.estado
        }
        setProblems((previous) => [...previous, linkedProblem as ClinicalProblemSummary])
      }

      const created = await openClinicalEpisode({
        pacienteId: numeroHcl,
        motivo,
      })

      const sequence = created.numeroSecuencial ?? created.secuencial ?? nextEpisodeSequence()
      const opened = created.fechaApertura ? toDisplayDateTime(created.fechaApertura) : nowLabel()

      const newEpisode: EpisodeItem = {
        id: `ep-${created.id ?? Date.now()}`,
        backendEpisodeId:
          typeof created.id === 'number'
            ? created.id
            : Number.isFinite(Number(created.id)) && Number(created.id) > 0
              ? Number(created.id)
              : null,
        sequence,
        openedAt: opened,
        diagnosis: created.diagnosticoPrincipal?.trim() || diagnosis || motivo,
        cie10Code: created.codigoCie10DiagnosticoPrincipal?.trim() || cie10Code,
        motivoConsulta: created.motivoConsulta?.trim() || motivo,
        priority: openForm.priority,
        actorApertura: created.actorApertura?.trim() || role,
        status: 'ABIERTO',
        closedAt: '',
        admission: null,
        egress: null,
        linkedProblemId: linkedProblem?.id ?? null
      }

      setEpisodes((previous) => [newEpisode, ...previous])
      setExpandedEpisodeId(newEpisode.id)
      setOpenForm(EMPTY_OPEN_FORM)
      setUiMessage(
        linkedProblem
          ? `Episodio #${sequence} abierto y asociado al problema "${linkedProblem.descripcion}".`
          : `Episodio #${sequence} abierto correctamente.`
      )
    } catch (error) {
      setUiMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo abrir el episodio clinico.'
      )
    } finally {
      setIsOpeningEpisode(false)
    }
  }

  function startLinkProblem(episodeId: string) {
    const episode = episodes.find((item) => item.id === episodeId)
    setLinkProblemTargetId(episodeId)
    setLinkProblemSelection(episode?.linkedProblemId ?? '')
    setUiMessage('')
  }

  function cancelLinkProblem() {
    setLinkProblemTargetId(null)
    setLinkProblemSelection('')
  }

  function confirmLinkProblem() {
    if (!linkProblemTargetId) {
      return
    }
    if (!linkProblemSelection) {
      setUiMessage('Selecciona un problema de la lista para asociarlo al episodio.')
      return
    }
    const problem = problems.find((item) => item.id === linkProblemSelection)
    if (!problem) {
      setUiMessage('El problema seleccionado ya no esta disponible.')
      return
    }

    setEpisodes((previous) =>
      previous.map((episode) =>
        episode.id === linkProblemTargetId
          ? {
              ...episode,
              linkedProblemId: problem.id,
              cie10Code: episode.cie10Code || problem.codigoCie10
            }
          : episode
      )
    )
    setLinkProblemTargetId(null)
    setLinkProblemSelection('')
    setUiMessage(`Problema "${problem.descripcion}" asociado al episodio.`)
  }

  function startAdmission(episodeId: string) {
    setAdmissionTargetId(episodeId)
    setAdmissionForm({
      ...EMPTY_ADMISSION_FORM,
      fechaHora: toDateTimeInputValue(new Date())
    })
    setUiMessage('')
  }

  function saveAdmission() {
    if (!admissionTargetId) {
      return
    }

    if (!admissionForm.fechaHora || !admissionForm.motivoIngreso.trim() || !admissionForm.profesional.trim()) {
      setUiMessage('Completa fecha/hora, motivo de ingreso y profesional para registrar la admision.')
      return
    }

    const nextAdmission: EpisodeAdmission = {
      fechaHora: admissionForm.fechaHora,
      tipoAtencion: admissionForm.tipoAtencion,
      motivoIngreso: admissionForm.motivoIngreso.trim(),
      profesional: admissionForm.profesional.trim()
    }

    setEpisodes((previous) =>
      previous.map((episode) =>
        episode.id === admissionTargetId
          ? {
              ...episode,
              admission: nextAdmission
            }
          : episode
      )
    )

    setAdmissionTargetId(null)
    setAdmissionForm(EMPTY_ADMISSION_FORM)
    setUiMessage('Admision registrada correctamente.')
  }

  function startEgress(episodeId: string) {
    setEgressTargetId(episodeId)
    setEgressForm(EMPTY_EGRESS_FORM)
    setUiMessage('')
  }

  function closeEgressDrawer() {
    setEgressTargetId(null)
  }

  async function saveEgress() {
    if (!egressTargetId) {
      return
    }

    if (!egressForm.condicionSalida.trim() || !egressForm.causaAlta.trim() || !egressForm.destinoPaciente.trim()) {
      setUiMessage('Completa condicion de salida, causa del alta y destino para registrar el egreso.')
      return
    }

    const episodeTarget = episodes.find((episode) => episode.id === egressTargetId)
    const backendEpisodeId = episodeTarget?.backendEpisodeId ?? null
    if (!backendEpisodeId) {
      setUiMessage('No se encontro el id del episodio para registrar el egreso en backend.')
      return
    }

    try {
      setIsSavingEgress(true)
      setUiMessage('')

      const egressAtIso = new Date().toISOString()
      const response = await registerEpisodeEgress(backendEpisodeId, {
        fechaHoraEgreso: egressAtIso,
        condicionSalida: egressForm.condicionSalida,
        causaAlta: egressForm.causaAlta,
        destinoPaciente: egressForm.destinoPaciente,
        referidoOtraInstitucion: egressForm.referidoInstitucion.trim().length > 0
      })

      const closed = response.fechaHoraEgreso
        ? toDisplayDateTime(response.fechaHoraEgreso)
        : nowLabel()

      const nextEgress: EpisodeEgress = {
        condicionSalida: egressForm.condicionSalida.trim(),
        causaAlta: egressForm.causaAlta.trim(),
        destinoPaciente: egressForm.destinoPaciente.trim(),
        referidoInstitucion: egressForm.referidoInstitucion.trim()
      }

      setEpisodes((previous) =>
        previous.map((episode) =>
          episode.id === egressTargetId
            ? {
                ...episode,
                status: egressForm.cierreEstado,
                closedAt: closed,
                egress: nextEgress
              }
            : episode
        )
      )

      setLastAttentionLabel(closed)
      setEgressTargetId(null)
      setEgressForm(EMPTY_EGRESS_FORM)
      setUiMessage('Egreso y cierre de episodio registrados. Se actualizo la fecha de ultima atencion.')
    } catch (error) {
      setUiMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el egreso del episodio clinico.'
      )
    } finally {
      setIsSavingEgress(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      
      {/* ================= COLUMNA IZQUIERDA: GESTIÓN Y FORMULARIO ================= */}
      <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-600">Gestión de consultas</p>
              </div>
              {!showOpenForm && (
                <Button
                  type="button"
                  className="bg-[#4A7FA5] text-white hover:bg-[#3f6d8f]"
                  onClick={() => {
                    setShowOpenForm(true)
                    setUiMessage('')
                  }}
                  disabled={!canOpenEpisode}
                  title={!canOpenEpisode ? 'Solo administrador o fisioterapeuta puede abrir episodios.' : undefined}
                >
                  + Abrir consulta
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Abiertas / Totales</p>
                <p className="text-base font-semibold text-slate-800">
                  {episodes.filter((e) => e.status === 'ABIERTO').length} / {episodes.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 overflow-hidden">
                <p className="text-xs text-slate-500">Última atención</p>
                <p className="text-base font-semibold text-slate-800 truncate" title={lastAttentionLabel}>{lastAttentionLabel || '-'}</p>
              </div>
            </div>

            {uiMessage && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{uiMessage}</p>
            )}

            {/* FORMULARIO */}
            {showOpenForm && (
              <div className="rounded-lg border border-[#4A7FA5]/25 bg-[#4A7FA5]/5 p-4">
                <p className="mb-4 text-sm font-semibold text-slate-800">Apertura de consulta</p>
                
                <div className="space-y-4">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-600">Motivo de consulta</span>
                    <input
                      type="text"
                      value={openForm.motivoConsulta}
                      onChange={(e) => setOpenForm(prev => ({ ...prev, motivoConsulta: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    />
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">Diagnóstico principal</span>
                      <input
                        type="text"
                        value={openForm.diagnosis}
                        onChange={(e) => setOpenForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">Prioridad</span>
                      <select
                        value={openForm.priority}
                        onChange={(e) => setOpenForm(prev => ({ ...prev, priority: e.target.value as OpenEpisodeForm['priority'] }))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </label>
                  </div>

                  {/* Sección Problema Asociado */}
                  <div className="rounded-md border border-slate-200 bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Problema asociado</p>
                    
                    <div className="mt-2 flex flex-col gap-2 text-xs text-slate-700">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="problem-source"
                          value="NEW"
                          checked={openForm.problemSource === 'NEW'}
                          onChange={() => setOpenForm(prev => ({ ...prev, problemSource: 'NEW', existingProblemId: '' }))}
                        />
                        <span>Registrar problema nuevo</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="problem-source"
                          value="EXISTING"
                          checked={openForm.problemSource === 'EXISTING'}
                          onChange={() => setOpenForm(prev => ({ ...prev, problemSource: 'EXISTING', problemDescription: '' }))}
                        />
                        <span>Usar problema existente</span>
                      </label>
                    </div>

                    {openForm.problemSource === 'NEW' ? (
                      <div className="mt-3 space-y-3">
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-600">Descripción</span>
                          <input
                            type="text"
                            value={openForm.problemDescription}
                            onChange={(e) => setOpenForm(prev => ({ ...prev, problemDescription: e.target.value }))}
                            placeholder="Ej. Dolor lumbar crónico"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-600">Código CIE-10</span>
                          <input
                            type="text"
                            value={openForm.cie10Code}
                            onChange={(e) => setOpenForm(prev => ({ ...prev, cie10Code: e.target.value }))}
                            placeholder="Ej. M54.5"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <select
                          value={openForm.existingProblemId}
                          onChange={(e) => {
                            const id = e.target.value
                            const picked = problems.find(p => p.id === id)
                            setOpenForm(prev => ({
                              ...prev,
                              existingProblemId: id,
                              cie10Code: picked?.codigoCie10 ?? prev.cie10Code,
                              diagnosis: prev.diagnosis || picked?.descripcion || ''
                            }))
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="">
                            {problems.length === 0 ? 'No hay problemas registrados' : 'Selecciona un problema...'}
                          </option>
                          {problems.map((problem) => (
                            <option key={problem.id} value={problem.id}>
                              {problem.descripcion} {problem.codigoCie10 ? `(${problem.codigoCie10})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowOpenForm(false)}>Cancelar</Button>
                    <Button
                      type="button"
                      className="bg-[#4A7FA5] text-white hover:bg-[#3f6d8f]"
                      onClick={() => { void handleOpenEpisode() }}
                      disabled={isOpeningEpisode}
                    >
                      {isOpeningEpisode ? 'Guardando...' : 'Guardar episodio'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= COLUMNA DERECHA: HISTORIAL Y BÚSQUEDA ================= */}
      <div className="lg:col-span-7">
        <Card className="border-slate-200 shadow-sm flex flex-col h-full lg:max-h-[800px]">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-600">Historial de consultas</p>
              <button type="button" className="text-slate-500 hover:text-slate-800 transition-colors" title="Filtrar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5H2"/><path d="M6 12h12"/><path d="M9 19h6"/><path d="M16 5h6"/><path d="M19 8V2"/>
                </svg>
              </button>
            </div>
            
            <div className="mt-4">
              <input
                type="text"
                placeholder="Buscar por código CEI-10, Diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[#4A7FA5] focus:outline-none focus:ring-1 focus:ring-[#4A7FA5]"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex-1 overflow-y-auto pr-2">
            {isLoadingHistory ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Cargando historial...</p>
            ) : filteredAndSortedEpisodes.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {searchTerm ? 'No se encontraron consultas para tu búsqueda.' : 'Sin consultas registradas.'}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedEpisodes.map((episode) => {
                  const isExpanded = expandedEpisodeId === episode.id
                  const linkedProblem = episode.linkedProblemId
                    ? problems.find((problem) => problem.id === episode.linkedProblemId) ?? null
                    : null
                  const isLinkingHere = linkProblemTargetId === episode.id

                  return (
                    <div key={episode.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                      
                      <button
                        type="button"
                        onClick={() => setExpandedEpisodeId((prev) => (prev === episode.id ? null : episode.id))}
                        className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            Consulta #{episode.sequence} <span className="font-normal text-slate-500 mx-1">·</span> {episode.diagnosis}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Apertura: {episode.openedAt} · CIE-10: <span className="font-medium text-slate-700">{episode.cie10Code || 'S/N'}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              episode.status === 'ABIERTO' 
                                ? 'border-amber-200 bg-amber-50 text-amber-700' 
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${episode.status === 'ABIERTO' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                            {episode.status}
                          </span>
                          <span className="text-slate-400">
                            {isExpanded ? (
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            )}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 space-y-4">
                          
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-md border border-slate-200 bg-white p-2.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo de consulta</p>
                              <p className="mt-1 text-sm text-slate-700">{episode.motivoConsulta}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-2.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actor / Prioridad</p>
                              <p className="mt-1 text-sm text-slate-700">{episode.actorApertura} · {episode.priority}</p>
                            </div>
                          </div>

                          <div className="rounded-md border border-slate-200 border-l-4 border-l-violet-500 bg-white p-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Problema asociado</p>
                            {linkedProblem ? (
                              <>
                                <p className="mt-1 text-sm text-slate-700">
                                  {linkedProblem.descripcion}
                                  {linkedProblem.codigoCie10 ? ` · CIE-10: ${linkedProblem.codigoCie10}` : ''}
                                </p>
                                <p className="text-xs text-slate-500">Estado: {linkedProblem.estado || '-'}</p>
                              </>
                            ) : (
                              <p className="mt-1 text-sm text-slate-600">Este episodio aun no tiene un problema vinculado.</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 text-xs bg-white"
                                onClick={() => startLinkProblem(episode.id)}
                              >
                                {linkedProblem ? 'Cambiar problema asociado' : 'Asociar problema existente'}
                              </Button>
                            </div>

                            {isLinkingHere && (
                              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                                <label className="space-y-1 block">
                                  <span className="text-xs font-medium text-slate-600">Problemas del paciente</span>
                                  <select
                                    value={linkProblemSelection}
                                    onChange={(event) => setLinkProblemSelection(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                  >
                                    <option value="">
                                      {problems.length === 0
                                        ? 'No hay problemas registrados para este paciente'
                                        : 'Selecciona un problema...'}
                                    </option>
                                    {problems.map((problem) => (
                                      <option key={problem.id} value={problem.id}>
                                        {problem.descripcion}
                                        {problem.codigoCie10 ? ` (${problem.codigoCie10})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                {problems.length === 0 && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Abre una consulta nueva y registra un problema para tenerlo disponible en la lista.
                                  </p>
                                )}
                                <div className="mt-2 flex justify-end gap-2">
                                  <Button type="button" variant="ghost" className="h-8 text-xs bg-white" onClick={cancelLinkProblem}>
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    className="h-8 bg-violet-600 text-xs text-white hover:bg-violet-700"
                                    onClick={confirmLinkProblem}
                                    disabled={problems.length === 0 || !linkProblemSelection}
                                  >
                                    Confirmar asociacion
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 text-xs bg-white"
                              onClick={() => startAdmission(episode.id)}
                              disabled={!canRegisterAdmission || episode.status !== 'ABIERTO'}
                              title={!canRegisterAdmission ? 'Solo administrador puede registrar admision.' : undefined}
                            >
                              Registrar admision (RF-19)
                            </Button>
                            <Button
                              type="button"
                              className="h-8 text-xs bg-[#1f5563] text-white hover:bg-[#154451]"
                              onClick={() => startEgress(episode.id)}
                              disabled={!canRegisterEgress || episode.status !== 'ABIERTO'}
                              title={!canRegisterEgress ? 'Solo fisioterapeuta puede registrar egreso y cierre.' : undefined}
                            >
                              Registrar egreso y cierre
                            </Button>
                          </div>

                          {episode.admission && (
                            <div className="rounded-md border border-slate-200 border-l-4 border-l-sky-500 bg-white p-2.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Admision registrada</p>
                              <p className="mt-1 text-sm text-slate-700">{episode.admission.fechaHora} · {episode.admission.tipoAtencion} · {episode.admission.profesional}</p>
                              <p className="text-sm text-slate-700">{episode.admission.motivoIngreso}</p>
                            </div>
                          )}

                          {episode.egress && (
                            <div className="rounded-md border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-2.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Egreso y cierre</p>
                              <p className="mt-1 text-sm text-slate-700">Condicion: {episode.egress.condicionSalida} · Causa: {episode.egress.causaAlta}</p>
                              <p className="text-sm text-slate-700">Destino: {episode.egress.destinoPaciente}{episode.egress.referidoInstitucion ? ` · Referido a: ${episode.egress.referidoInstitucion}` : ''}</p>
                              <p className="text-xs text-slate-500">Fecha de cierre: {episode.closedAt || '-'}</p>
                            </div>
                          )}

                          {admissionTargetId === episode.id && (
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-3 text-sm font-semibold text-slate-800">Registro de admision (RF-19)</p>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-600">Fecha y hora</span>
                                  <input
                                    type="datetime-local"
                                    value={admissionForm.fechaHora}
                                    onChange={(event) => setAdmissionForm((previous) => ({ ...previous, fechaHora: event.target.value }))}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs font-medium text-slate-600">Tipo de atencion</span>
                                  <select
                                    value={admissionForm.tipoAtencion}
                                    onChange={(event) => setAdmissionForm((previous) => ({ ...previous, tipoAtencion: event.target.value as CareType }))}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                                  >
                                    <option value="CONSULTA_EXTERNA">Consulta externa</option>
                                    <option value="EMERGENCIA">Emergencia</option>
                                    <option value="HOSPITALIZACION">Hospitalizacion</option>
                                  </select>
                                </label>
                                <label className="space-y-1 md:col-span-2">
                                  <span className="text-xs font-medium text-slate-600">Motivo de ingreso</span>
                                  <input
                                    type="text"
                                    value={admissionForm.motivoIngreso}
                                    onChange={(event) => setAdmissionForm((previous) => ({ ...previous, motivoIngreso: event.target.value }))}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                                  />
                                </label>
                                <label className="space-y-1 md:col-span-2">
                                  <span className="text-xs font-medium text-slate-600">Profesional que atiende</span>
                                  <input
                                    type="text"
                                    value={admissionForm.profesional}
                                    onChange={(event) => setAdmissionForm((previous) => ({ ...previous, profesional: event.target.value }))}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                                  />
                                </label>
                              </div>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button type="button" variant="ghost" className="h-8 text-xs bg-white" onClick={() => setAdmissionTargetId(null)}>
                                  Cancelar
                                </Button>
                                <Button type="button" className="h-8 text-xs bg-[#4A7FA5] text-white hover:bg-[#3f6d8f]" onClick={saveAdmission}>
                                  Guardar admision
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {egressTargetEpisode && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30 cursor-default"
            onClick={closeEgressDrawer}
            aria-label="Cerrar panel de egreso"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Registro de egreso y cierre"
            className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">RF-20 / RF-22</p>
                  <h3 className="text-base font-bold text-slate-900">Registro de egreso y cierre</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Consulta #{egressTargetEpisode.sequence} · {egressTargetEpisode.diagnosis}
                  </p>
                </div>

                <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={closeEgressDrawer}>
                  Cerrar
                </Button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-600">Condicion de salida</span>
                  <input
                    type="text"
                    value={egressForm.condicionSalida}
                    onChange={(event) => setEgressForm((previous) => ({ ...previous, condicionSalida: event.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-600">Causa del alta</span>
                  <input
                    type="text"
                    value={egressForm.causaAlta}
                    onChange={(event) => setEgressForm((previous) => ({ ...previous, causaAlta: event.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-600">Destino del paciente</span>
                  <input
                    type="text"
                    value={egressForm.destinoPaciente}
                    onChange={(event) => setEgressForm((previous) => ({ ...previous, destinoPaciente: event.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-600">Referido a institucion (opcional)</span>
                  <input
                    type="text"
                    value={egressForm.referidoInstitucion}
                    onChange={(event) => setEgressForm((previous) => ({ ...previous, referidoInstitucion: event.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-600">Estado de cierre</span>
                  <select
                    value={egressForm.cierreEstado}
                    onChange={(event) => setEgressForm((previous) => ({
                      ...previous,
                      cierreEstado: event.target.value as EgressForm['cierreEstado']
                    }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                  >
                    <option value="COMPLETADO">Completado</option>
                    <option value="ABANDONADO">Abandonado</option>
                    <option value="DERIVADO">Derivado</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <Button type="button" variant="ghost" className="h-8 text-xs" onClick={closeEgressDrawer}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-[#1f5563] text-white hover:bg-[#154451]"
                  onClick={() => {
                    void saveEgress()
                  }}
                  disabled={isSavingEgress}
                >
                  {isSavingEgress ? 'Guardando...' : 'Guardar cierre'}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}