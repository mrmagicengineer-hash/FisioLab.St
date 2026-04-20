import type { PatientFileStatus, PatientListItemDto } from '../../data/services/patientsService'

export type MainViewKey = 'listado' | 'ficha'

export type TabKey = 'filiacion' | 'historia-clinica' | 'episodios'

export type ClinicalHistoryOpeningMeta = {
  patientId: number
  hcl: string
  openedAt: string
  healthUnit: string
  clinicalHistoryStatus: 'ABIERTA'
}

export type PatientData = {
  id: number
  hcl: string
  estado: PatientFileStatus
  cedula: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  genero: string
  tipoSangre: string
  telefonoPrincipal: string
  telefonoSecundario: string
  email: string
  direccion: string
  ocupacion: string
  estadoCivil: string
  grupoCultural: string
  regimenSeguridadSocial: string
  fechaRegistro: string
  fechaUltimaAtencion: string
  jefeHogar: string
  numeroMiembros: string
  tipoVivienda: string
  condicionesSanitarias: string
  contactoEmergenciaNombre: string
  contactoEmergenciaParentesco: string
  contactoEmergenciaTelefono: string
  religion: string
  peso: string
  talla: string
}

export type AuditEntry = {
  id: string
  fecha: string
  detalle: string
}

export type FamilyRecordMeta = {
  updatedAt: string
  updatedBy: string
}

export type ClinicalProblemSummary = {
  id: string
  descripcion: string
  codigoCie10: string
  estado: string
}

export type ClinicalAntecedentSummary = {
  id: string
  tipo: string
  descripcion: string
  codigoCie10: string
  estado: string
}

export type ClinicalFamilyAntecedentSummary = {
  id: string
  parentesco: string
  condicion: string
  codigoCie10: string
}

export type ClinicalEpisodeSummary = {
  id: string
  fecha: string
  detalle: string
}

export type ClinicalOverviewData = {
  cedula: string
  unidadSalud: string
  estadoHistoriaClinica: string
  estadoArchivoPaciente: string
  fechaApertura: string
  problemasActivos: ClinicalProblemSummary[]
  antecedentesPersonales: ClinicalAntecedentSummary[]
  antecedentesFamiliares: ClinicalFamilyAntecedentSummary[]
  episodiosPrevios: ClinicalEpisodeSummary[]
  episodiosPreviosCount: number
}


export interface ClinicalEpisode {
  id: number;
  historiaClinicaId: number;
  numeroHcl: string;
  numeroSecuencial: number;
  numeroEpisodio: string;
  motivoConsulta: string;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: string;
  estadoCierre: string | null;
  observacionCierre: string | null;
}

export type SelectedPatientSummary = PatientListItemDto | null
