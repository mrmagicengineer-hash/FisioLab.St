import { Button } from '@/components/ui/button'
import { Save, X, Edit2, Droplets, Calendar, User } from 'lucide-react'
import type { PatientData } from './types' // Ajusta el import a tu archivo de tipos
import { ClinicalStatusBar, type VitalSigns } from './ClinicalStatusBar'

type PatientDetailHeaderProps = {
  draftData: PatientData
  canEditRecord: boolean
  isEditing: boolean
  isSavingChanges: boolean
  vitals?: VitalSigns
  onBackToPatientList: () => void
  onEditClick: () => void
  onCancelEdit: () => void
  onSaveChanges: () => void
}

export function PatientDetailHeader({
  draftData,
  canEditRecord,
  isEditing,
  isSavingChanges,
  vitals,
  onEditClick,
  onCancelEdit,
  onSaveChanges
}: PatientDetailHeaderProps) {
  return (
    <div className="relative bg-white px-8 pt-8 pb-5 border-b border-slate-200/80 z-10">
      <div className="flex gap-4">
        {/* Contenedor Principal: Aquí aplicamos el Z-Pattern */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* =========================================
              PARTE SUPERIOR (1 -> 2)
              ========================================= */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            
            {/* 1. Top-Left: Identidad Principal */}
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {draftData.nombres} {draftData.apellidos}
              </h2>
              {/* Badge de Estado (Centrado Ópticamente) */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider leading-none ${
                draftData.estado === 'ACTIVO' 
                  ? 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20' 
                  : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
              }`}>
                {draftData.estado || 'ACTIVO'}
              </span>
            </div>

            {/* 2. Top-Right: Acciones Principales (CTA) */}
            {canEditRecord && (
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSavingChanges} className="border-slate-200 shadow-sm h-9 text-base">
                      <X className="w-4 h-4 mr-1.5" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={onSaveChanges} disabled={isSavingChanges} className="bg-[#1A5276] hover:bg-[#154360] shadow-sm h-9 text-base">
                      <Save className="w-4 h-4 mr-1.5" /> {isSavingChanges ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={onEditClick} variant="outline" className="text-[#1A5276] border-[#1A5276]/20 hover:bg-[#1A5276]/5 shadow-sm h-9 text-base">
                    <Edit2 className="w-4 h-4 mr-1.5" /> Editar Ficha
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* =========================================
              PARTE INFERIOR (3 -> 4)
              ========================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-3">
            
            {/* 3. Bottom-Left: Identificadores Secundarios */}
            <p className="text-sm text-slate-600 font-medium flex items-center flex-wrap gap-x-2">
              <span title="Historia Clínica">HCL: <span className="text-slate-900">{draftData.hcl}</span></span>
              <span className="text-slate-300">&bull;</span>
              <span title="Documento de Identidad">Cédula: <span className="text-slate-900">{draftData.cedula}</span></span>
            </p>

            {/* 4. Bottom-Right: Datos Médicos Vitales */}
            <div className="flex items-center flex-wrap gap-2">
              {draftData.fechaNacimiento && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {draftData.fechaNacimiento}
                </span>
              )}
              {draftData.genero && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {draftData.genero}
                </span>
              )}
              {draftData.tipoSangre && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                  <Droplets className="w-3.5 h-3.5" />
                  {draftData.tipoSangre}
                </span>
              )}
            </div>

          </div>

          {/* Barra de Estado Clínico (visible en todas las pestañas) */}
          <ClinicalStatusBar vitals={vitals} />
        </div>

      </div>
    </div>
  )
}