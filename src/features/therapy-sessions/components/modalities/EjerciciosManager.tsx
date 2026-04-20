import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSessionEditor } from '../../context/SessionEditorContext'
import type { Ejercicio } from '../../data/types'
import { PlusIcon, XIcon, HomeIcon, FileDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function randomId() {
  return Math.random().toString(36).slice(2, 9)
}

const EMPTY_EJERCICIO: Omit<Ejercicio, 'id'> = {
  nombre:        '',
  series:        3,
  repeticiones:  10,
  instrucciones: '',
  paraDomicilio: false,
}

type Props = {
  onExportPdf?: () => void
}

export function EjerciciosManager({ onExportPdf }: Props) {
  const { ejercicios, setEjercicios, status } = useSessionEditor()
  const locked = status === 'locked'

  const add = () => setEjercicios([...ejercicios, { ...EMPTY_EJERCICIO, id: randomId() }])

  const remove = (id: string) => setEjercicios(ejercicios.filter((e) => e.id !== id))

  const update = <K extends keyof Ejercicio>(id: string, field: K, value: Ejercicio[K]) => {
    setEjercicios(ejercicios.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const domicilioCount = ejercicios.filter((e) => e.paraDomicilio).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!locked && (
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
            Agregar ejercicio
          </Button>
        )}

        {domicilioCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportPdf}
            className="ml-auto border-[#1A5276]/30 text-[#1A5276] hover:bg-[#1A5276]/5"
          >
            <FileDownIcon className="mr-1.5 h-3.5 w-3.5" />
            PDF domicilio ({domicilioCount})
          </Button>
        )}
      </div>

      {ejercicios.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
          No hay ejercicios. Agrega pautas para esta sesión.
        </p>
      )}

      <div className="space-y-3">
        {ejercicios.map((ej, idx) => (
          <div
            key={ej.id}
            className={cn(
              'rounded-xl border bg-white p-4 shadow-sm',
              ej.paraDomicilio
                ? 'border-[#1A5276]/20 bg-[#1A5276]/[0.02]'
                : 'border-slate-200'
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ejercicio {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                {!locked && (
                  <button
                    type="button"
                    onClick={() => update(ej.id, 'paraDomicilio', !ej.paraDomicilio)}
                    title="Marcar para uso domiciliario"
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                      ej.paraDomicilio
                        ? 'bg-[#1A5276]/10 text-[#1A5276]'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    )}
                  >
                    <HomeIcon className="h-3 w-3" />
                    Domicilio
                  </button>
                )}
                {ej.paraDomicilio && locked && (
                  <span className="flex items-center gap-1 rounded-full bg-[#1A5276]/10 px-2.5 py-1 text-xs font-medium text-[#1A5276]">
                    <HomeIcon className="h-3 w-3" />
                    Domicilio
                  </span>
                )}
                {!locked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(ej.id)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Nombre del ejercicio</Label>
                <Input
                  value={ej.nombre}
                  onChange={(e) => update(ej.id, 'nombre', e.target.value)}
                  disabled={locked}
                  placeholder="Ej: Extensión de rodilla con resistencia"
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Series</Label>
                  <Input
                    type="number"
                    min={1}
                    value={ej.series}
                    onChange={(e) => update(ej.id, 'series', Number(e.target.value))}
                    disabled={locked}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Repeticiones</Label>
                  <Input
                    type="number"
                    min={1}
                    value={ej.repeticiones}
                    onChange={(e) => update(ej.id, 'repeticiones', Number(e.target.value))}
                    disabled={locked}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Instrucciones</Label>
                <Input
                  value={ej.instrucciones}
                  onChange={(e) => update(ej.id, 'instrucciones', e.target.value)}
                  disabled={locked}
                  placeholder="Descripción breve para el paciente"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
