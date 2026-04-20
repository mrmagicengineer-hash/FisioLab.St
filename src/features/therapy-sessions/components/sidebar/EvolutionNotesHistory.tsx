import { useState, useEffect } from 'react'
import { StatusBadge } from '@/features/dashboard/components/ui/StatusBadge'
import { getHistorialSesionesPorEpisodio } from '@/features/dashboard/data/services/clinicalHistoryService'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

type Props = {
  episodioId?: string | number
  planId?: string | number
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

function NoteItem({ note }: { note: any }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-100 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">
            Sesión {note.numeroSesionEnPlan ?? '?'} — {formatDate(note.fechaHoraInicio)}
          </p>
          <p className="text-[11px] text-slate-500 truncate">{note.profesionalNombre}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <StatusBadge
            label={note.estado === 'FIRMADA' ? 'Firmada' : note.estado}
            variant={note.estado === 'FIRMADA' ? 'success' : 'warning'}
          />
          {expanded
            ? <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
            : <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-3 py-3 space-y-2">
          {(['subjetivo', 'objetivo', 'analisis', 'plan'] as const).map((field) => (
            <div key={field}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {note.notaSOAP?.[field] || <em className="text-slate-400">—</em>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EvolutionNotesHistory({ episodioId, planId }: Props) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!episodioId) {
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    getHistorialSesionesPorEpisodio(Number(episodioId))
      .then((data) => {
        if (mounted) {
          const relevant = data.filter((n: any) => 
            n.estado === 'FIRMADA' && 
            (!planId || String(n.planTratamientoId) === String(planId))
          ).sort((a: any, b: any) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime())
          setNotes(relevant)
        }
      })
      .catch(() => {
        if (mounted) setNotes([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [episodioId, planId])

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        Historial de notas ({notes.length})
      </p>

      {loading && (
        <p className="text-xs text-slate-400 italic">Cargando...</p>
      )}

      {!loading && notes.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
          Sin notas previas en este episodio.
        </p>
      )}

      <div className="space-y-2">
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}
