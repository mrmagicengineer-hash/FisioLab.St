import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { SESSION_TEMPLATES } from '../../data/types'

export function SessionCostInput() {
  const { costo, setCosto, templateId, status } = useSessionEditor()
  const locked = status === 'locked'

  const tpl = SESSION_TEMPLATES.find((t) => t.id === templateId)

  return (
    <div className="space-y-1.5">
      <Label htmlFor="session-cost" className="text-sm font-semibold text-slate-700">
        Costo de sesión
        {!locked && <span className="ml-1 text-rose-500">*</span>}
      </Label>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">$</span>
        <Input
          id="session-cost"
          type="number"
          min={0}
          step={0.5}
          value={costo}
          onChange={(e) => setCosto(Number(e.target.value))}
          disabled={locked}
          className="w-32"
          placeholder="0.00"
        />
      </div>

      {tpl && !locked && (
        <p className="text-xs text-slate-500">
          Sugerido por plantilla: <strong>${tpl.costoSugerido}</strong>
        </p>
      )}

      {locked && (
        <p className="text-xs text-emerald-600 font-medium">
          Costo enviado a facturación al firmar.
        </p>
      )}
    </div>
  )
}
