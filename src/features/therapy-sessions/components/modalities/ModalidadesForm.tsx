import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { MODALIDADES_CATALOG } from '../../data/types'
import { PlusIcon, XIcon } from 'lucide-react'

function randomId() {
  return Math.random().toString(36).slice(2, 9)
}

export function ModalidadesForm() {
  const { modalidades, setModalidades, status } = useSessionEditor()
  const locked = status === 'locked'

  const addModalidad = (nombre: string) => {
    if (modalidades.some((m) => m.nombre === nombre)) return
    const catalog = MODALIDADES_CATALOG.find((c) => c.nombre === nombre)
    const params: Record<string, string> = {}
    catalog?.params.forEach((p) => { params[p.key] = '' })
    setModalidades([...modalidades, { id: randomId(), nombre, params }])
  }

  const removeModalidad = (id: string) => {
    setModalidades(modalidades.filter((m) => m.id !== id))
  }

  const updateParam = (modalidadId: string, key: string, value: string) => {
    setModalidades(
      modalidades.map((m) =>
        m.id === modalidadId ? { ...m, params: { ...m.params, [key]: value } } : m
      )
    )
  }

  return (
    <div className="space-y-4">
      {!locked && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Agregar modalidad
          </p>
          <div className="flex flex-wrap gap-2">
            {MODALIDADES_CATALOG.map((cat) => {
              const active = modalidades.some((m) => m.nombre === cat.nombre)
              return (
                <button
                  key={cat.nombre}
                  type="button"
                  onClick={() => addModalidad(cat.nombre)}
                  disabled={active}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'cursor-not-allowed bg-[#1A5276]/10 text-[#1A5276]'
                      : 'bg-slate-100 text-slate-600 hover:bg-[#1A5276]/10 hover:text-[#1A5276]'
                  )}
                >
                  {!active && <PlusIcon className="h-3 w-3" />}
                  {cat.nombre}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {modalidades.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
          No hay modalidades agregadas.
        </p>
      )}

      <div className="space-y-4">
        {modalidades.map((mod) => {
          const catalog = MODALIDADES_CATALOG.find((c) => c.nombre === mod.nombre)
          return (
            <div
              key={mod.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="secondary" className="font-semibold">
                  {mod.nombre}
                </Badge>
                {!locked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModalidad(mod.id)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {catalog && catalog.params.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {catalog.params.map((param) => (
                    <div key={param.key} className="space-y-1">
                      <Label className="text-xs text-slate-500">
                        {param.label}
                        {param.unit && (
                          <span className="ml-1 text-slate-400">({param.unit})</span>
                        )}
                      </Label>
                      <Input
                        value={mod.params[param.key] ?? ''}
                        onChange={(e) => updateParam(mod.id, param.key, e.target.value)}
                        disabled={locked}
                        placeholder={param.unit ?? '—'}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
