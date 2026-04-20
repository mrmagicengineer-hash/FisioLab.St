import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { useSoapValidation } from '../../data/hooks/useSoapValidation'
import type { SoapNote } from '../../data/types'

const SOAP_FIELDS: { key: keyof SoapNote; label: string; hint: string }[] = [
  {
    key:   'subjetivo',
    label: 'S — Subjetivo',
    hint:  'Síntomas referidos por el paciente, dolor EVA, quejas principales.',
  },
  {
    key:   'objetivo',
    label: 'O — Objetivo',
    hint:  'Hallazgos clínicos medibles: ROM, fuerza muscular, signos físicos.',
  },
  {
    key:   'analisis',
    label: 'A — Análisis',
    hint:  'Interpretación clínica, diagnóstico fisioterapéutico, progreso.',
  },
  {
    key:   'plan',
    label: 'P — Plan',
    hint:  'Intervenciones aplicadas hoy y próximos pasos del tratamiento.',
  },
]

export function SoapEditor() {
  const { soap, setSoapField, status } = useSessionEditor()
  const { fields } = useSoapValidation(soap)
  const locked = status === 'locked'

  return (
    <div className="space-y-5">
      {SOAP_FIELDS.map(({ key, label, hint }) => {
        const field = fields[key]
        const hasError = field.touched && !field.valid

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`soap-${key}`}
                className="text-sm font-semibold text-slate-700"
              >
                {label}
                {!locked && <span className="ml-1 text-rose-500">*</span>}
              </Label>

              {!locked && (
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    field.valid
                      ? 'text-emerald-600'
                      : field.touched
                        ? 'text-rose-500'
                        : 'text-slate-400'
                  )}
                >
                  {field.valid ? '✓ Completo' : field.message || hint}
                </span>
              )}
            </div>

            <div className="relative">
              <Textarea
                id={`soap-${key}`}
                value={soap[key]}
                onChange={(e) => setSoapField(key, e.target.value)}
                placeholder={locked ? '' : hint}
                disabled={locked}
                rows={4}
                className={cn(
                  'resize-y text-sm transition-colors',
                  locked && 'cursor-not-allowed bg-slate-50 text-slate-600',
                  !locked && hasError && 'border-rose-300 focus-visible:ring-rose-200',
                  !locked && field.valid && 'border-emerald-300 focus-visible:ring-emerald-200'
                )}
              />
              {!locked && field.valid && (
                <span className="pointer-events-none absolute right-3 top-3 text-emerald-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
