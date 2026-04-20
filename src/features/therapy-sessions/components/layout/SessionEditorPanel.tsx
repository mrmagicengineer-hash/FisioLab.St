import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2Icon, PenLineIcon, SaveIcon } from 'lucide-react'
import { SessionTemplateSelector } from '../config/SessionTemplateSelector'
import { SessionCostInput } from '../config/SessionCostInput'
import { SoapEditor } from '../soap/SoapEditor'
import { ModalidadesForm } from '../modalities/ModalidadesForm'
import { EjerciciosManager } from '../modalities/EjerciciosManager'
import { SessionProgressBar } from '../SessionProgressBar'
import { SignAndSaveModal } from '../SignAndSaveModal'
import { PlanTechniquesBar } from '../PlanTechniquesBar'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { useSoapValidation } from '../../data/hooks/useSoapValidation'
import { usePlanTechniques } from '../../data/hooks/usePlanTechniques'
import type { Appointment, Patient } from '@/features/agenda/data/types'
import type { SessionProgress } from '../../data/types'

type Props = {
  patient:    Patient
  appointment: Appointment
  progress:   SessionProgress
  onSaveDraft: () => void
  onSignAndSave: () => Promise<void>
  isSigning:  boolean
}

export function SessionEditorPanel({
  patient,
  appointment,
  progress,
  onSaveDraft,
  onSignAndSave,
  isSigning,
}: Props) {
  const { soap, costo, status, isSaving } = useSessionEditor()
  const { isValid: soapValid } = useSoapValidation(soap)
  const { techniques, loading: techLoading } = usePlanTechniques(patient.id)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const locked = status === 'locked'

  const canSign = soapValid && costo > 0

  const handleExportPdf = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header: progress + patient info */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SessionProgressBar progress={progress} isLocked={locked} />
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {appointment.date} · {appointment.startTime}–{appointment.endTime}
              </p>
              <p className="text-xs font-medium text-slate-700">{appointment.therapistName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config: template + cost */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">
            Configuración de sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SessionTemplateSelector />
          <SessionCostInput />
        </CardContent>
      </Card>

      {/* SOAP editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">
            Nota de evolución — SOAP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SoapEditor />
        </CardContent>
      </Card>

      {/* Modalidades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">
            Modalidades físicas aplicadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanTechniquesBar techniques={techniques} loading={techLoading} />
          <ModalidadesForm />
        </CardContent>
      </Card>

      {/* Ejercicios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">
            Pautas de ejercicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EjerciciosManager onExportPdf={handleExportPdf} />
        </CardContent>
      </Card>

      {/* Actions */}
      {!locked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {isSaving && (
              <>
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                Guardando borrador...
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onSaveDraft}
              disabled={isSigning}
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              Guardar borrador
            </Button>

            <Button
              type="button"
              size="default"
              disabled={!canSign || isSigning}
              onClick={() => setSignModalOpen(true)}
              className="bg-[#1A5276] text-white hover:bg-[#1A5276]/90 disabled:opacity-50"
            >
              <PenLineIcon className="mr-2 h-4 w-4" />
              Guardar y Firmar
            </Button>
          </div>
        </div>
      )}

      {locked && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          Esta sesión ha sido firmada y no puede ser modificada.
        </div>
      )}

      <SignAndSaveModal
        open={signModalOpen}
        onOpenChange={setSignModalOpen}
        onConfirm={async () => {
          await onSignAndSave()
          setSignModalOpen(false)
        }}
        patientName={patient.fullName}
        costo={costo}
        isLoading={isSigning}
      />
    </div>
  )
}
