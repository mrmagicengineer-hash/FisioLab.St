import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { SESSION_TEMPLATES, MODALIDADES_CATALOG } from '../../data/types'
import type { Modalidad } from '../../data/types'

function randomId() {
  return Math.random().toString(36).slice(2, 9)
}

export function SessionTemplateSelector() {
  const { templateId, setTemplateId, setCosto, setModalidades, status } = useSessionEditor()
  const locked = status === 'locked'

  const handleChange = (id: string) => {
    const tpl = SESSION_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return

    setTemplateId(id)
    setCosto(tpl.costoSugerido)

    const modalidades: Modalidad[] = tpl.modalidadesDefault
      .map((nombre) => {
        const catalog = MODALIDADES_CATALOG.find((m) => m.nombre === nombre)
        const params: Record<string, string> = {}
        catalog?.params.forEach((p) => { params[p.key] = '' })
        return { id: randomId(), nombre, params }
      })
    setModalidades(modalidades)
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">
        Plantilla de sesión
      </Label>
      <Select
        value={templateId ?? ''}
        onValueChange={locked ? undefined : handleChange}
        disabled={locked}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar plantilla..." />
        </SelectTrigger>
        <SelectContent>
          {SESSION_TEMPLATES.map((tpl) => (
            <SelectItem key={tpl.id} value={tpl.id}>
              <span className="font-medium">{tpl.nombre}</span>
              <span className="ml-1.5 text-muted-foreground text-xs">{tpl.descripcion}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {templateId && !locked && (
        <p className="text-xs text-slate-500">
          Costo sugerido aplicado. Puede modificarlo manualmente.
        </p>
      )}
    </div>
  )
}
