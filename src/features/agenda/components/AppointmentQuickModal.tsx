import { useState, useEffect } from 'react'
import { CalendarClock, AlertTriangle, Loader2, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { Appointment, Therapist } from '../data/types'
import { PatientSearchCombobox } from './PatientSearchCombobox'
import { crearCita, AppointmentApiError } from '../data/services/appointmentService'
import { minutesToTime, timeToMinutes } from '../data/utils/timeUtils'
import type { Patient } from '../data/types'
import { AvailabilityStatus } from './AvailabilityStatus'
import { usePatientContext } from '../data/hooks/usePatientContext'
import { SessionProgressIndicator } from './SessionProgressIndicator'

// ─── Duraciones disponibles ───────────────────────────────────────────────────

const DURACIONES = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentQuickModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (appointment: Appointment) => void
  therapists: Therapist[]
  initialDate?: string
  initialTime?: string
  initialTherapistId?: number
}

// ─── Estado del formulario ────────────────────────────────────────────────────

interface FormState {
  patient:          Patient | null
  date:             string
  startTime:        string
  duracionMinutos:  number
  profesionalId:    number | null
  motivoConsulta:   string
  codigoCie10:      string
  observaciones:    string
  episodioId:       string
  planId?:          string
}

interface FormErrors {
  patient?:         string
  date?:            string
  startTime?:       string
  profesionalId?:   string
  motivoConsulta?:  string
  episodioId?:      string
}

function buildInitial(
  date = '',
  time = '',
  therapistId?: number
): FormState {
  return {
    patient:         null,
    date,
    startTime:       time,
    duracionMinutos: 45,
    profesionalId:   therapistId ?? null,
    motivoConsulta:  '',
    codigoCie10:     '',
    observaciones:   '',
    episodioId:      '',
    planId:          undefined,
  }
}

function validate(form: FormState, isFisio: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!form.patient)                   errors.patient        = 'Selecciona un paciente'
  if (!form.date)                      errors.date           = 'Fecha requerida'
  if (!form.startTime)                 errors.startTime      = 'Hora requerida'
  if (!isFisio && !form.profesionalId) errors.profesionalId  = 'Selecciona un fisioterapeuta'
  if (!form.motivoConsulta.trim() && !form.episodioId)
                                       errors.motivoConsulta = 'Motivo de consulta requerido si no hay episodio'
  return errors
}

// ─── Subcomponente: campo ─────────────────────────────────────────────────────

function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AppointmentQuickModal({
  open,
  onClose,
  onSuccess,
  therapists,
  initialDate,
  initialTime,
  initialTherapistId,
}: AppointmentQuickModalProps) {
  const { role, userId } = useAuth()
  const isFisio = role === 'FISIOTERAPEUTA'

  const [form, setForm]                 = useState<FormState>(() =>
    buildInitial(initialDate, initialTime, initialTherapistId)
  )
  const [errors, setErrors]             = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [isSlotAvailable, setIsSlotAvailable] = useState(true)

  const { data: contextData, isLoading: contextLoading, error: contextError } =
    usePatientContext(form.patient?.id ?? null)

  // Re-inicializar al abrir
  useEffect(() => {
    if (open) {
      const profesionalId = isFisio && userId !== null
        ? userId
        : (initialTherapistId ?? null)
      setForm(buildInitial(initialDate, initialTime, profesionalId ?? undefined))
      setErrors({})
      setSubmitError(null)
    }
  }, [open, initialDate, initialTime, initialTherapistId, isFisio, userId])

  // Auto-preseleccionar primer episodio activo
  useEffect(() => {
    if (contextData && contextData.episodios.length > 0 && !form.episodioId) {
      const ep = contextData.episodios[0]
      setForm((prev) => ({
        ...prev,
        episodioId: String(ep.id),
        motivoConsulta: prev.motivoConsulta || ep.diagnostico,
        planId: ep.planes.length === 1 ? String(ep.planes[0].id) : undefined,
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextData])

  // Limpiar episodio al cambiar paciente
  useEffect(() => {
    setForm((prev) => ({ ...prev, episodioId: '', planId: undefined, motivoConsulta: '' }))
  }, [form.patient?.id])

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const getEndTime = (): string => {
    if (!form.startTime) return ''
    return minutesToTime(timeToMinutes(form.startTime) + form.duracionMinutos)
  }

  const handleEpisodioSelect = (episodioId: string) => {
    if (episodioId === '') {
      setForm((prev) => ({ ...prev, episodioId: '', planId: undefined }))
      return
    }
    const ep = contextData?.episodios.find((e) => String(e.id) === episodioId)
    if (!ep) return
    setForm((prev) => ({
      ...prev,
      episodioId: String(ep.id),
      motivoConsulta: prev.motivoConsulta || ep.diagnostico,
      planId: ep.planes.length === 1 ? String(ep.planes[0].id) : prev.planId,
    }))
    setErrors((prev) => ({ ...prev, episodioId: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(form, isFisio)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const profesionalId = isFisio && userId !== null ? userId : form.profesionalId!
    const endTime       = getEndTime()
    const fechaInicio   = `${form.date}T${form.startTime}:00`
    const fechaFin      = `${form.date}T${endTime}:00`

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const appointment = await crearCita({
        pacienteId:          form.patient!.id,
        profesionalId,
        fechaHoraInicio:     fechaInicio,
        fechaHoraFin:        fechaFin,
        motivoConsulta:      form.motivoConsulta.trim() || 'Consulta (Desde episodio)',
        codigoCie10Sugerido: form.codigoCie10.trim() || undefined,
        observaciones:       form.observaciones.trim() || undefined,
        episodioClinicoId:   form.episodioId ? Number(form.episodioId) : undefined,
        planTratamientoId:   form.planId ? Number(form.planId) : undefined,
      })
      onSuccess(appointment)
      onClose()
    } catch (err) {
      if (err instanceof AppointmentApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Error al crear la cita. Intenta de nuevo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEpisode = contextData?.episodios.find((e) => String(e.id) === form.episodioId)
  const selectedPlan    = selectedEpisode?.planes.find((p) => String(p.id) === form.planId)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[760px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" />
            Agendar cita
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-[500px]">

          {/* ── COLUMNA IZQUIERDA: paciente + episodios ── */}
          <div className="w-64 shrink-0 flex flex-col border-r">

            {/* Buscador de pacientes */}
            <div className="p-4 border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Paciente
              </p>
              <PatientSearchCombobox
                value={form.patient}
                onSelect={(p) => set('patient', p)}
                invalid={Boolean(errors.patient)}
              />
              {errors.patient && (
                <p className="mt-1 text-[11px] text-destructive font-medium">{errors.patient}</p>
              )}
              {form.patient?.estadoArchivo === 'PASIVO' && (
                <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2">
                  <AlertTriangle className="size-3 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium leading-tight">
                    Archivo PASIVO — el backend rechazará la cita
                  </p>
                </div>
              )}
            </div>

            {/* Lista de episodios */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Episodios clínicos
              </p>

              {!form.patient && (
                <p className="text-[11px] text-muted-foreground italic py-2 text-center">
                  Selecciona un paciente
                </p>
              )}

              {form.patient && contextLoading && (
                <div className="flex items-center gap-2 py-3 justify-center">
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Cargando...</span>
                </div>
              )}

              {form.patient && contextError && (
                <p className="text-[11px] text-destructive py-2">
                  Error al cargar episodios
                </p>
              )}

              {form.patient && !contextLoading && !contextError && (
                <>
                  {/* Opción: cita independiente */}
                  <button
                    type="button"
                    onClick={() => handleEpisodioSelect('')}
                    className={cn(
                      'w-full text-left rounded-md border px-3 py-2 text-[11px] transition-colors outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring/50',
                      form.episodioId === ''
                        ? 'border-primary/50 bg-primary/8 text-primary'
                        : 'border-dashed border-border text-muted-foreground hover:border-border hover:bg-muted/40'
                    )}
                  >
                    <span className="font-medium">Cita independiente</span>
                    <p className="text-[10px] opacity-70 mt-0.5">Sin episodio clínico</p>
                  </button>

                  {/* Episodios */}
                  {contextData?.episodios.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleEpisodioSelect(String(ep.id))}
                      className={cn(
                        'w-full text-left rounded-md border px-3 py-2 text-[11px] transition-colors outline-none',
                        'focus-visible:ring-2 focus-visible:ring-ring/50',
                        form.episodioId === String(ep.id)
                          ? 'border-primary bg-primary/8 text-foreground'
                          : 'border-border text-foreground hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <FileText className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium leading-tight line-clamp-2">{ep.diagnostico}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {ep.planes.length > 0
                              ? `${ep.planes.length} plan${ep.planes.length > 1 ? 'es' : ''}`
                              : 'Sin planes'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {contextData?.episodios.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic py-2 text-center">
                      Sin episodios activos
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── COLUMNA DERECHA: detalle + fecha + duración ── */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Indicador de episodio seleccionado */}
              <div className={cn(
                'rounded-lg border px-3 py-2 text-[11px] min-h-[2.5rem] flex items-center gap-2',
                selectedEpisode
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-dashed border-border text-muted-foreground'
              )}>
                <Calendar className="size-3.5 shrink-0" />
                <span className="font-medium leading-tight">
                  {selectedEpisode ? selectedEpisode.diagnostico : 'Cita independiente'}
                </span>
              </div>

              {/* Plan (si episodio tiene planes) */}
              {selectedEpisode && selectedEpisode.planes.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Plan de tratamiento</Label>
                  
                  {selectedEpisode.planes.length > 1 ? (
                    <Select
                      value={form.planId ?? 'none'}
                      onValueChange={(v: string | null) => set('planId', v === 'none' ? undefined : v ?? undefined)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sin plan específico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs italic text-muted-foreground">
                          Sin plan específico
                        </SelectItem>
                        {selectedEpisode.planes.map((plan) => (
                          <SelectItem key={plan.id} value={String(plan.id)} className="text-xs">
                            {plan.tipoTratamiento} ({plan.sesionesRealizadas}/{plan.sesionesPlanificadas})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
                      <span className="text-xs font-medium text-foreground">
                        {selectedEpisode.planes[0].tipoTratamiento}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        Único plan vigente
                      </span>
                    </div>
                  )}

                  {selectedPlan && (
                    <SessionProgressIndicator
                      realizadas={selectedPlan.sesionesRealizadas}
                      planificadas={selectedPlan.sesionesPlanificadas}
                      episodioId={String(selectedEpisode.id)}
                      planId={String(selectedPlan.id)}
                    />
                  )}
                </div>
              )}

              {/* Motivo de consulta */}
              <Field label="Motivo de consulta" error={errors.motivoConsulta} required>
                <Textarea
                  value={form.motivoConsulta}
                  onChange={(e) => set('motivoConsulta', e.target.value)}
                  placeholder="Describa el motivo de la consulta…"
                  rows={4}
                  aria-invalid={Boolean(errors.motivoConsulta)}
                  className="resize-none"
                />
              </Field>

              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" error={errors.date} required>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    aria-invalid={Boolean(errors.date)}
                  />
                </Field>
                <Field label="Hora inicio" error={errors.startTime} required>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    step={900}
                    aria-invalid={Boolean(errors.startTime)}
                  />
                </Field>
              </div>

              {/* Disponibilidad */}
              {form.date && form.startTime && (
                <AvailabilityStatus
                  fecha={form.date}
                  startTime={form.startTime}
                  endTime={getEndTime()}
                  profesionalId={isFisio && userId !== null ? userId : form.profesionalId}
                  onAvailabilityChange={setIsSlotAvailable}
                />
              )}

              {/* Duración */}
              <Field label="Duración">
                <div className="flex flex-wrap gap-1.5">
                  {DURACIONES.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('duracionMinutos', value)}
                      className={cn(
                        'rounded-md border px-3 py-1 text-xs font-medium transition-colors outline-none',
                        'focus-visible:ring-2 focus-visible:ring-ring/50',
                        form.duracionMinutos === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  {form.startTime && (
                    <span className="ml-auto self-center text-[10px] text-muted-foreground">
                      Fin: {getEndTime()}
                    </span>
                  )}
                </div>
              </Field>

              {/* Fisioterapeuta */}
              {isFisio ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Profesional:</span>
                  <span className="text-xs font-medium text-foreground">
                    {therapists[0]?.fullName ?? 'Mi agenda'}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground rounded-full border border-border/50 px-2 py-0.5">
                    Asignado automáticamente
                  </span>
                </div>
              ) : (
                <Field label="Fisioterapeuta" error={errors.profesionalId} required>
                  <Select
                    value={form.profesionalId ? String(form.profesionalId) : ''}
                    onValueChange={(v) => set('profesionalId', Number(v))}
                  >
                    <SelectTrigger className={cn('w-full', errors.profesionalId && 'border-destructive')}>
                      <SelectValue placeholder="Seleccionar fisioterapeuta" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.fullName}
                          {t.specialty && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              {t.specialty}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {/* Error de servidor */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
                  <AlertTriangle className="size-4 shrink-0 text-destructive mt-px" />
                  <p className="text-xs text-destructive">{submitError}</p>
                </div>
              )}
            </div>

            <DialogFooter className="px-5 py-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !isSlotAvailable}>
                {isSubmitting ? (
                  <>
                    <div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Agendando…
                  </>
                ) : 'Confirmar cita'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
