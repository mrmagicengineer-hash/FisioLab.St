import { useEffect, useMemo, useState } from 'react'
import type { UserRole } from '../../auth/data/types'
import {
  getPatientFamilyRecord,
  getPatients,
  getPatientById,
  searchPatients,
  upsertPatientFamilyRecord,
  updatePatient,
  type PatientListItemDto
} from '../data/services/patientsService'
import {
  isPatientsCacheFresh,
  readPatientsCache,
  writePatientsCache
} from '../data/services/patientsCache'
import {
  getClinicalHistoryByPatientId,
  getClinicalHistoryComplete
} from '../data/services/clinicalHistoryService'
import { ConfirmCriticalChangesModal } from './patient-record/ConfirmCriticalChangesModal'
import { PatientDetailSection } from './patient-record/PatientDetailSection'
import { PatientCreateDrawer } from './patient-record/PatientCreateDrawer'
import { PacientesTable } from './PacientesTable'
import { ConsultasView } from './ConsultasView'
import type { Paciente } from '../hooks/usePacientesFilter'
import type {
  AuditEntry,
  ClinicalOverviewData,
  ClinicalHistoryOpeningMeta,
  FamilyRecordMeta,
  MainViewKey,
  PatientData,
  TabKey
} from './patient-record/types'

type PatientRecordViewProps = {
  role: UserRole
  sectionMode?: 'patients' | 'consultations'
  mainView: MainViewKey
  selectedPatientIdFromRoute: number | null
  recentClinicalHistoryOpening: ClinicalHistoryOpeningMeta | null
  onOpenPatientRecord: (patientId: number) => void
  onBackToPatientList: () => void
  onOpenAudit: () => void
}

const INITIAL_PATIENT_DATA: PatientData = {
  id: 1,
  hcl: 'HCL-14827',
  estado: 'ACTIVO',
  cedula: '1721212345',
  nombres: 'Maria Fernanda',
  apellidos: 'Torres Velez',
  fechaNacimiento: '1992-08-21',
  genero: 'Femenino',
  tipoSangre: 'O+',
  telefonoPrincipal: '0998765432',
  telefonoSecundario: '022451234',
  email: 'maria.torres@correo.com',
  direccion: 'La Pradera y Calle 8',
  ocupacion: 'Docente',
  estadoCivil: 'Casada',
  grupoCultural: 'Mestizo',
  regimenSeguridadSocial: 'IESS',
  fechaRegistro: '01/04/2026',
  fechaUltimaAtencion: '05/04/2026',
  jefeHogar: 'Rosa Velez',
  numeroMiembros: '4',
  tipoVivienda: 'Casa propia',
  condicionesSanitarias: 'Servicios basicos completos y saneamiento adecuado.',
  contactoEmergenciaNombre: '',
  contactoEmergenciaParentesco: '',
  contactoEmergenciaTelefono: '',
  religion: '',
  peso: '',
  talla: ''
}

const EMPTY_PATIENT_DATA: PatientData = {
  id: 0,
  hcl: '-',
  estado: 'ACTIVO',
  cedula: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  tipoSangre: '',
  telefonoPrincipal: '',
  telefonoSecundario: '',
  email: '',
  direccion: '',
  ocupacion: '',
  estadoCivil: '',
  grupoCultural: '',
  regimenSeguridadSocial: '',
  fechaRegistro: '',
  fechaUltimaAtencion: '',
  jefeHogar: '',
  numeroMiembros: '',
  tipoVivienda: '',
  condicionesSanitarias: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaParentesco: '',
  contactoEmergenciaTelefono: '',
  religion: '',
  peso: '',
  talla: ''
}

function toEsDateTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getFullName(patient: PatientData): string {
  return `${patient.nombres} ${patient.apellidos}`.trim()
}

function mapEpisodeSummary(item: unknown, index: number): { id: string; fecha: string; detalle: string } {
  const candidate = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}

  const rawId = candidate.id ?? candidate.episodioId ?? index + 1
  const rawFecha = candidate.fecha ?? candidate.fechaAtencion ?? candidate.fechaRegistro ?? ''
  const rawDetalle =
    candidate.detalle ??
    candidate.descripcion ??
    candidate.motivoConsulta ??
    candidate.observaciones ??
    ''

  let parsedFecha = '-'
  if (typeof rawFecha === 'string' && rawFecha) {
    const dateValue = new Date(rawFecha)
    if (!Number.isNaN(dateValue.getTime())) {
      parsedFecha = new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateValue)
    }
  }

  return {
    id: String(rawId),
    fecha: parsedFecha,
    detalle: typeof rawDetalle === 'string' && rawDetalle.trim().length > 0 ? rawDetalle : 'Episodio registrado'
  }
}

function mapPatientListItemToRecord(item: PatientListItemDto): PatientData {
  const names = item.nombresCompletos.trim().split(/\s+/)

  return {
    id: item.id,
    hcl: item.hcl,
    estado: item.estadoArchivo,
    cedula: item.cedula,
    nombres: names.slice(0, 2).join(' ') || item.nombresCompletos,
    apellidos: names.slice(2).join(' '),
    fechaNacimiento: '',
    genero: '',
    tipoSangre: '',
    telefonoPrincipal: '',
    telefonoSecundario: '',
    email: '',
    direccion: '',
    ocupacion: '',
    estadoCivil: '',
    grupoCultural: '',
    regimenSeguridadSocial: '',
    fechaRegistro: item.fechaRegistro || '',
    fechaUltimaAtencion: item.ultimaAtencion || '',
    jefeHogar: '',
    numeroMiembros: '',
    tipoVivienda: '',
    condicionesSanitarias: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaParentesco: '',
    contactoEmergenciaTelefono: '',
    religion: '',
    peso: '',
    talla: ''
  }
}

export function PatientRecordView({
  role,
  sectionMode = 'patients',
  mainView,
  selectedPatientIdFromRoute,
  recentClinicalHistoryOpening,
  onOpenPatientRecord,
  onBackToPatientList,
  onOpenAudit
}: PatientRecordViewProps) {
  const [patients, setPatients] = useState<PatientListItemDto[]>(() => readPatientsCache('') ?? [])
  const [isLoadingPatients, setIsLoadingPatients] = useState(() => !isPatientsCacheFresh(''))
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)
  const [patientsError, setPatientsError] = useState('')
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientsRefreshSeed, setPatientsRefreshSeed] = useState(0)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('filiacion')
  const [isEditing, setIsEditing] = useState(false)
  const [savedData, setSavedData] = useState<PatientData>(INITIAL_PATIENT_DATA)
  const [draftData, setDraftData] = useState<PatientData>(INITIAL_PATIENT_DATA)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [recordLoadError, setRecordLoadError] = useState('')
  const [clinicalOverview, setClinicalOverview] = useState<ClinicalOverviewData | null>(null)
  const [isSavingChanges, setIsSavingChanges] = useState(false)
  const [familyMeta, setFamilyMeta] = useState<FamilyRecordMeta>({
    updatedAt: '05/04/2026 10:18',
    updatedBy: 'Lic. Andrea Paredes'
  })
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([
    {
      id: 'A-001',
      fecha: '05/04/2026 10:18',
      detalle: 'Actualizacion de ficha familiar por fisioterapeuta.'
    },
    {
      id: 'A-002',
      fecha: '02/04/2026 16:02',
      detalle: 'Cambio de estado de archivo a ACTIVO.'
    }
  ])

  const criticalFieldsChanged = useMemo(() => {
    return (
      draftData.cedula !== savedData.cedula ||
      draftData.nombres !== savedData.nombres ||
      draftData.telefonoPrincipal !== savedData.telefonoPrincipal
    )
  }, [draftData, savedData])

  const canEditRecord = role === 'FISIOTERAPEUTA'
  const [isNewPatientDrawerOpen, setIsNewPatientDrawerOpen] = useState(false)


  const tablePacientes: Paciente[] = patients.map((dto) => ({
    id: String(dto.id),
    hcl: dto.hcl,
    cedula: dto.cedula,
    nombre: dto.nombresCompletos,
    estado: dto.estadoArchivo === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO',
    ultimaAtencion: dto.ultimaAtencion,
    fechaRegistro: dto.fechaRegistro
  }))

const selectedPatient = useMemo(() => {
    if (patients.length === 0 || selectedPatientId === null) {
      return null
    }

    return patients.find((patient) => patient.id === selectedPatientId) ?? null
  }, [patients, selectedPatientId])

  const selectedHistoryOpeningMeta = useMemo(() => {
    if (!selectedPatient || !recentClinicalHistoryOpening) {
      return null
    }

    return recentClinicalHistoryOpening.patientId === selectedPatient.id
      ? recentClinicalHistoryOpening
      : null
  }, [selectedPatient, recentClinicalHistoryOpening])

  useEffect(() => {
    let cancelled = false

    async function loadPatientsList() {
      try {
        const query = patientSearchQuery.trim()

        if (query.length > 0 && query.length < 3) {
          setPatients([])
          setSelectedPatientId(null)
          setIsLoadingPatients(false)
          setPatientsError('')
          return
        }

        const cached = readPatientsCache(query)
        const fresh = isPatientsCacheFresh(query)

        if (cached) {
          setPatients(cached)
          setPatientsError('')
          setIsLoadingPatients(false)
          if (fresh) {
            return
          }
        } else {
          setIsLoadingPatients(true)
          setPatientsError('')
        }

        const result = query.length === 0 ? await getPatients() : await searchPatients(query)

        if (cancelled) {
          return
        }

        writePatientsCache(query, result)
        setPatients(result)

        if (result.length === 0) {
          setSelectedPatientId(null)
        } else {
          setSelectedPatientId((previous) =>
            previous !== null && result.some((patient) => patient.id === previous) ? previous : null
          )
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setPatients([])
        setPatientsError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los pacientes. Revisa tu conexion o intenta nuevamente.'
        )
      } finally {
        if (!cancelled) {
          setIsLoadingPatients(false)
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadPatientsList()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [patientSearchQuery, patientsRefreshSeed])

  useEffect(() => {
    function onPatientCreated() {
      setPatientsRefreshSeed((value) => value + 1)
    }

    window.addEventListener('patient-created', onPatientCreated)
    return () => window.removeEventListener('patient-created', onPatientCreated)
  }, [])

  useEffect(() => {
    if (selectedPatientIdFromRoute === null) {
      return
    }

    setSelectedPatientId(selectedPatientIdFromRoute)
  }, [selectedPatientIdFromRoute])

  useEffect(() => {
    if (sectionMode === 'consultations') {
      setActiveTab('episodios')
      setIsEditing(false)
    }
  }, [sectionMode])

  useEffect(() => {
    if (!selectedPatient) {
      setSavedData(EMPTY_PATIENT_DATA)
      setDraftData(EMPTY_PATIENT_DATA)
      setRecordLoadError('')
      setClinicalOverview(null)
      return
    }

    const mappedRecord = mapPatientListItemToRecord(selectedPatient)
    setSavedData(mappedRecord)
    setDraftData(mappedRecord)
    setFeedbackMessage('')
    setSaveErrorMessage('')
    setIsEditing(false)
  }, [selectedPatient])

  useEffect(() => {
    let cancelled = false

    async function loadClinicalRecord() {
      if (!selectedPatient) {
        return
      }

      try {
        setIsLoadingRecord(true)
        setRecordLoadError('')

        let numeroHcl = selectedPatient.hcl.trim()
        if (!numeroHcl || numeroHcl === '-') {
          const summary = await getClinicalHistoryByPatientId(selectedPatient.id)
          numeroHcl = summary.numeroHcl
        }

        if (!numeroHcl || numeroHcl === '-') {
          throw new Error('No se encontro una historia clinica activa para este paciente.')
        }

        const [complete, patientDetail] = await Promise.all([
          getClinicalHistoryComplete(numeroHcl),
          getPatientById(selectedPatient.id)
        ])

        let familyRecord = {
          jefeHogar: '',
          numeroMiembros: '',
          tipoVivienda: '',
          condicionesSanitarias: ''
        }

        try {
          familyRecord = await getPatientFamilyRecord(selectedPatient.id)
        } catch {
          // If no family record exists yet, keep editable fields empty.
        }

        if (cancelled) {
          return
        }

        const fullName = (patientDetail.nombresCompletos || complete.resumen.paciente).trim()
        const nameParts = fullName.split(/\s+/)
        const nextRecord: PatientData = {
          id: complete.resumen.pacienteId || selectedPatient.id,
          hcl: patientDetail.hcl !== '-' ? patientDetail.hcl : (complete.resumen.numeroHcl || numeroHcl),
          estado: patientDetail.estadoArchivo,
          cedula: patientDetail.cedula || complete.resumen.cedula || selectedPatient.cedula,
          nombres: nameParts.slice(0, 2).join(' ') || fullName,
          apellidos: nameParts.slice(2).join(' '),
          fechaNacimiento: patientDetail.fechaNacimiento || '',
          genero: patientDetail.genero || '',
          tipoSangre: patientDetail.tipoSangre || '',
          telefonoPrincipal: patientDetail.telefonoPrincipal || '',
          telefonoSecundario: patientDetail.telefonoSecundario || '',
          email: patientDetail.email || '',
          direccion: patientDetail.direccion || '',
          ocupacion: patientDetail.ocupacion || '',
          estadoCivil: patientDetail.estadoCivil || '',
          grupoCultural: patientDetail.grupoCultural || '',
          regimenSeguridadSocial: patientDetail.regimenSeguridadSocial || '',
          fechaRegistro: patientDetail.fechaRegistro || selectedPatient.fechaRegistro || '',
          fechaUltimaAtencion: patientDetail.fechaUltimaAtencion || selectedPatient.ultimaAtencion || '',
          jefeHogar: familyRecord.jefeHogar,
          numeroMiembros: familyRecord.numeroMiembros,
          tipoVivienda: familyRecord.tipoVivienda,
          condicionesSanitarias: familyRecord.condicionesSanitarias,
          contactoEmergenciaNombre: '',
          contactoEmergenciaParentesco: '',
          contactoEmergenciaTelefono: '',
          religion: '',
          peso: '',
          talla: ''
        }

        setSavedData(nextRecord)
        setDraftData(nextRecord)
        setClinicalOverview({
          cedula: complete.resumen.cedula || selectedPatient.cedula,
          unidadSalud: complete.resumen.unidadSalud || '-',
          estadoHistoriaClinica: complete.resumen.estadoHistoriaClinica || '-',
          estadoArchivoPaciente: complete.resumen.estadoArchivoPaciente || '-',
          fechaApertura: complete.resumen.fechaApertura || '',
          problemasActivos: (complete.problemasActivos ?? []).map((problem) => ({
            id: String(problem.id),
            descripcion: problem.descripcion,
            codigoCie10: problem.codigoCie10,
            estado: problem.estado
          })),
          antecedentesPersonales: (complete.antecedentesPersonales ?? []).map((item) => ({
            id: String(item.id),
            tipo: item.tipo,
            descripcion: item.descripcion,
            codigoCie10: item.codigoCie10,
            estado: item.estado
          })),
          antecedentesFamiliares: (complete.antecedentesFamiliares ?? []).map((item) => ({
            id: String(item.id),
            parentesco: item.parentesco,
            condicion: item.condicion,
            codigoCie10: item.codigoCie10
          })),
          episodiosPrevios: (complete.episodiosPrevios ?? []).map(mapEpisodeSummary),
          episodiosPreviosCount: (complete.episodiosPrevios ?? []).length
        })
        setFamilyMeta({
          updatedAt: toEsDateTimeLabel(new Date(complete.resumen.fechaApertura)),
          updatedBy: complete.resumen.unidadSalud || 'Unidad de salud'
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setRecordLoadError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar la ficha completa del paciente.'
        )
        setClinicalOverview(null)
      } finally {
        if (!cancelled) {
          setIsLoadingRecord(false)
        }
      }
    }

    void loadClinicalRecord()

    return () => {
      cancelled = true
    }
  }, [selectedPatient])

  function handleFieldChange(field: keyof PatientData, value: string | null) {
    setDraftData((previous) => ({
      ...previous,
      [field]: value ?? ''
    }))
  }

  function handleEditClick() {
    setFeedbackMessage('')
    setSaveErrorMessage('')

    if (!canEditRecord) {
      return
    }

    setIsEditing(true)
  }

  function handleCancelEdit() {
    setDraftData(savedData)
    setIsEditing(false)
    setShowConfirmModal(false)
    setSaveErrorMessage('')
  }

  async function persistChanges() {
      const fullName = getFullName(draftData)
    const canSave =
      /^\d{10}$/.test(draftData.cedula.trim()) &&
        fullName.trim().length > 0

    if (!canSave) {
        setSaveErrorMessage('Verifica cédula (10 dígitos) y nombre completo.')
      return
    }

    try {
      setIsSavingChanges(true)
      setSaveErrorMessage('')

      const patientId = selectedPatient?.id ?? draftData.id
      if (!patientId || patientId <= 0) {
        throw new Error('No se encontro el identificador del paciente para actualizar.')
      }

      await updatePatient(patientId, {
        cedula: draftData.cedula,
        email: draftData.email,
        nombresCompletos: fullName,
        fechaNacimiento: draftData.fechaNacimiento,
        genero: draftData.genero,
        grupoCultural: draftData.grupoCultural,
        estadoCivil: draftData.estadoCivil,
        ocupacion: draftData.ocupacion,
        regimenSeguridadSocial: draftData.regimenSeguridadSocial,
        tipoSangre: draftData.tipoSangre,
        telefonoPrincipal: draftData.telefonoPrincipal,
        telefonoSecundario: draftData.telefonoSecundario,
        direccion: draftData.direccion
      })

      const familyRecordChanged =
        draftData.jefeHogar.trim() !== savedData.jefeHogar.trim() ||
        draftData.numeroMiembros.trim() !== savedData.numeroMiembros.trim() ||
        draftData.tipoVivienda.trim() !== savedData.tipoVivienda.trim() ||
        draftData.condicionesSanitarias.trim() !== savedData.condicionesSanitarias.trim()

      if (familyRecordChanged) {
        await upsertPatientFamilyRecord(patientId, {
          jefeHogar: draftData.jefeHogar,
          numeroMiembros: draftData.numeroMiembros,
          tipoVivienda: draftData.tipoVivienda,
          condicionesSanitarias: draftData.condicionesSanitarias
        })
      }

      const nowLabel = toEsDateTimeLabel(new Date())
      setSavedData(draftData)
      setIsEditing(false)
      setShowConfirmModal(false)
      setFeedbackMessage('Cambios guardados y registrados en auditoria.')
      setPatientsRefreshSeed((value) => value + 1)
      setAuditEntries((previous) => [
        {
          id: `A-${Date.now()}`,
          fecha: nowLabel,
          detalle: `Se guardaron cambios en ficha del paciente ${getFullName(draftData)}.`
        },
        ...previous
      ])

      if (activeTab === 'filiacion') {
        setFamilyMeta({
          updatedAt: nowLabel,
          updatedBy: 'Usuario actual'
        })
      }
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar. Revisa cédula o conexión.'
      )
    } finally {
      setIsSavingChanges(false)
    }
  }

  async function handleSaveChanges() {
    if (!canEditRecord) {
      return
    }

    if (criticalFieldsChanged) {
      setShowConfirmModal(true)
      return
    }

    await persistChanges()
  }

  async function handleSaveAndContinueFamily() {
    if (!isEditing) {
      return
    }

    if (criticalFieldsChanged) {
      setShowConfirmModal(true)
      return
    }

    await persistChanges()
    setActiveTab('episodios')
  }

  async function handleSaveAndBackFamily() {
    if (!isEditing) {
      return
    }

    if (criticalFieldsChanged) {
      setShowConfirmModal(true)
      return
    }

    await persistChanges()
    setActiveTab('historia-clinica')
  }

  function handleViewRecord(patientId: number) {
    setSelectedPatientId(patientId)
    setActiveTab(sectionMode === 'consultations' ? 'episodios' : 'historia-clinica')
    onOpenPatientRecord(patientId)
  }

  function handleEditRecord(patientId: number) {
    setSelectedPatientId(patientId)
    setActiveTab(sectionMode === 'consultations' ? 'episodios' : 'filiacion')
    onOpenPatientRecord(patientId)
    if (sectionMode !== 'consultations') {
      handleEditClick()
    }
  }

  return (
    <div className="clinical-page-bg space-y-4 rounded-2xl p-2">
      {mainView === 'listado' && (
        <div className="space-y-4">
          {/* Loading */}
          {isLoadingPatients && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando pacientes…
            </div>
          )}

          {/* Error */}
          {!isLoadingPatients && patientsError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-600">
              {patientsError}
            </div>
          )}

          {/* Table — search bar, filters and Z-pattern header live inside PacientesTable or ConsultasView */}
          {!isLoadingPatients && !patientsError && sectionMode === 'patients' && (
            <PacientesTable
              pacientes={tablePacientes}
              searchCatalog={patients.map((dto) => ({
                id: dto.id,
                hcl: dto.hcl,
                cedula: dto.cedula,
                nombre: dto.nombresCompletos,
                estadoArchivo: dto.estadoArchivo
              }))}
              canEditRecord={canEditRecord}
              patientSearchQuery={patientSearchQuery}
              onSearchQueryChange={setPatientSearchQuery}
              onNuevoPaciente={() => setIsNewPatientDrawerOpen(true)}
              onVerFicha={(id) => handleViewRecord(Number(id))}
              onEditar={(id) => handleEditRecord(Number(id))}
            />
          )}

          {!isLoadingPatients && !patientsError && sectionMode === 'consultations' && (
            <ConsultasView
              searchQuery={patientSearchQuery}
              onSearchQueryChange={setPatientSearchQuery}
            />
          )}
        </div>
      )}

      <PatientCreateDrawer
        open={isNewPatientDrawerOpen}
        onOpenChange={setIsNewPatientDrawerOpen}
        onCreated={(created) => {
          setPatientsRefreshSeed((value) => value + 1)
          if (created.id > 0) {
            onOpenPatientRecord(created.id)
          }
        }}
      />

      {mainView === 'ficha' && (
        <PatientDetailSection
          role={role}
          tabsMode={sectionMode === 'consultations' ? 'consultations' : 'full'}
          isLoadingPatients={isLoadingPatients || isLoadingRecord}
          selectedPatient={selectedPatient}
          selectedHistoryOpeningMeta={selectedHistoryOpeningMeta}
          savedData={savedData}
          draftData={draftData}
          activeTab={activeTab}
          isEditing={isEditing}
          canEditRecord={canEditRecord}
          isSavingChanges={isSavingChanges}
          feedbackMessage={feedbackMessage}
          saveErrorMessage={saveErrorMessage}
          recordLoadError={recordLoadError}
          clinicalOverview={clinicalOverview}
          familyMeta={familyMeta}
          auditEntries={auditEntries}
          onBackToPatientList={onBackToPatientList}
          onOpenAudit={onOpenAudit}
          onActiveTabChange={setActiveTab}
          onEditClick={handleEditClick}
          onCancelEdit={handleCancelEdit}
          onSaveChanges={() => {
            void handleSaveChanges()
          }}
          onFieldChange={handleFieldChange}
          onSaveAndContinueFamily={() => {
            void handleSaveAndContinueFamily()
          }}
          onSaveAndBackFamily={() => {
            void handleSaveAndBackFamily()
          }}
        />
      )}

      <ConfirmCriticalChangesModal
        open={showConfirmModal}
        isSavingChanges={isSavingChanges}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          void persistChanges()
        }}
      />
    </div>
  )
}
