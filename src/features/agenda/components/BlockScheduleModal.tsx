import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
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
import type { MotivoBloqueo, ScheduleBlock, Therapist } from '../data/types'
import { crearBloqueo } from '../data/services/availabilityService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface BlockScheduleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (block: ScheduleBlock) => void
  therapists: Therapist[]
  /** Pre-llenado desde toolbar */
  initialTherapistId?: number
  initialDate?: string   // 'YYYY-MM-DD'
}

// ─── Estado del formulario ────────────────────────────────────────────────────

const MOTIVOS: { value: MotivoBloqueo; label: string }[] = [
  { value: 'VACACIONES',   label: 'Vacaciones' },
  { value: 'PERMISO',      label: 'Permiso' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'FERIADO',      label: 'Feriado' },
  { value: 'OTRO',         label: 'Otro' },
]

interface BlockForm {
  therapistId: string
  startDate:   string
  startTime:   string
  endDate:     string
  endTime:     string
  motivo:      MotivoBloqueo
  descripcion: string
}

interface BlockErrors {
  therapistId?: string
  startDate?:   string
  startTime?:   string
  endDate?:     string
  endTime?:     string
  range?:       string
}

function buildInitial(therapistId?: number, date = ''): BlockForm {
  return {
    therapistId: therapistId ? String(therapistId) : '',
    startDate:  date,
    startTime:  '08:00',
    endDate:    date,
    endTime:    '09:00',
    motivo:     'OTRO',
    descripcion: '',
  }
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validate(form: BlockForm): BlockErrors {
  const errors: BlockErrors = {}

  if (!form.therapistId) errors.therapistId = 'Selecciona un fisioterapeuta'
  if (!form.startDate)   errors.startDate   = 'Fecha requerida'
  if (!form.startTime)   errors.startTime   = 'Hora requerida'
  if (!form.endDate)     errors.endDate     = 'Fecha requerida'
  if (!form.endTime)     errors.endTime     = 'Hora requerida'

  if (!errors.startDate && !errors.startTime && !errors.endDate && !errors.endTime) {
    const start = new Date(`${form.startDate}T${form.startTime}`)
    const end   = new Date(`${form.endDate}T${form.endTime}`)
    if (end <= start) {
      errors.range = 'La hora de fin debe ser posterior al inicio'
    }
  }

  return errors
}

// ─── Subcomponente: campo ─────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function BlockScheduleModal({
  open,
  onClose,
  onSuccess,
  therapists,
  initialTherapistId,
  initialDate,
}: BlockScheduleModalProps) {
  const [form, setForm]         = useState<BlockForm>(() =>
    buildInitial(initialTherapistId, initialDate)
  )
  const [errors, setErrors]     = useState<BlockErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(buildInitial(initialTherapistId, initialDate))
      setErrors({})
      setSubmitError(null)
    }
  }, [open, initialTherapistId, initialDate])

  const set = <K extends keyof BlockForm>(key: K, val: BlockForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined, range: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const block = await crearBloqueo({
        profesionalId:   Number(form.therapistId),
        fechaHoraInicio: `${form.startDate}T${form.startTime}:00`,
        fechaHoraFin:    `${form.endDate}T${form.endTime}:00`,
        motivo:          form.motivo,
        descripcion:     form.descripcion.trim() || undefined,
      })
      onSuccess(block)
      onClose()
    } catch {
      setSubmitError('No se pudo crear el bloqueo. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4 text-orange-500" />
            Bloquear horario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Fisioterapeuta */}
          <Field label="Fisioterapeuta" error={errors.therapistId} required>
            <Select value={form.therapistId} onValueChange={(v) => set('therapistId', v ?? '')}>
              <SelectTrigger className={cn('w-full', errors.therapistId && 'border-destructive')}>
                <SelectValue placeholder="Seleccionar fisioterapeuta" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Inicio */}
          <div className="flex flex-col gap-1.5">
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              Inicio
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.startDate}</p>
                )}
              </div>
              <div>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set('startTime', e.target.value)}
                  aria-invalid={Boolean(errors.startTime)}
                />
                {errors.startTime && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.startTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fin */}
          <div className="flex flex-col gap-1.5">
            <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">
              Fin
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  aria-invalid={Boolean(errors.endDate)}
                />
                {errors.endDate && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.endDate}</p>
                )}
              </div>
              <div>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set('endTime', e.target.value)}
                  aria-invalid={Boolean(errors.endTime)}
                />
                {errors.endTime && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.endTime}</p>
                )}
              </div>
            </div>
            {errors.range && (
              <p className="text-[11px] text-destructive font-medium">{errors.range}</p>
            )}
          </div>

          {/* Motivo (enum) */}
          <Field label="Tipo de bloqueo" required>
            <Select value={form.motivo} onValueChange={(v) => set('motivo', v as MotivoBloqueo)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Descripción libre (opcional) */}
          <Field label="Descripción (opcional)">
            <Textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Detalle adicional del bloqueo…"
              rows={2}
            />
          </Field>

          {submitError && (
            <p className="text-xs text-destructive font-medium">{submitError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Bloqueando…
                </>
              ) : (
                'Confirmar bloqueo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
