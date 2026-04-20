import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, ClipboardList, ChevronRight, Calendar, Loader2, ClipboardCheck } from 'lucide-react'
import { clinicalEpisodeService } from '../data/services/clinicalEpisodeService'
import { CreateEpisodeDrawer } from './patient-record/CreateEpisodeDrawer'
import { CreateEvaluacionClinicaDrawer } from './patient-record/CreateEvaluacionClinicaDrawer'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ConsultaResumeItem = {
  id: string
  hcl: string
  nombresCompletos: string
  totalConsultas: number
  ultimaConsultaFecha: string
  ultimaConsultaMotivo: string
  tienePlanTratamiento: boolean
  estadoSeguimiento: 'En Progreso' | 'Pendiente de Evaluación' | 'Finalizado' | 'En Pausa'
}

type EpisodioItem = {
  id: number
  motivoConsulta: string
  fechaApertura: string
  estado: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700',
]

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const SEGUIMIENTO_BADGE: Record<string, string> = {
  'Finalizado':              'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En Progreso':             'bg-sky-50 text-sky-700 border-sky-200',
  'Pendiente de Evaluación': 'bg-amber-50 text-amber-700 border-amber-200',
  'En Pausa':                'bg-slate-50 text-slate-500 border-slate-200',
}

const ESTADO_BADGE: Record<string, string> = {
  'ABIERTO':   'bg-sky-50 text-sky-700 border-sky-200',
  'CERRADO':   'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PENDIENTE': 'bg-amber-50 text-amber-700 border-amber-200',
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  searchQuery: string
  onSearchQueryChange: (q: string) => void
}

const PAGE_SIZE = 50

// ── Componente principal ──────────────────────────────────────────────────────

export function ConsultasView({ searchQuery, onSearchQueryChange }: Props) {
  const [patients, setPatients] = useState<ConsultaResumeItem[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<ConsultaResumeItem | null>(null)
  const [episodes, setEpisodes] = useState<EpisodioItem[]>([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [evalDrawerOpen, setEvalDrawerOpen] = useState(false)
  const [evalEpisodio, setEvalEpisodio] = useState<EpisodioItem | null>(null)

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true)
    try {
      const res = await clinicalEpisodeService.getResumenGlobal(1, PAGE_SIZE)
      setPatients(res.data ?? [])
    } catch { /* noop */ }
    finally { setLoadingPatients(false) }
  }, [])

  useEffect(() => { void loadPatients() }, [loadPatients])

  useEffect(() => {
    if (!selectedPatient) { setEpisodes([]); return }
    setLoadingEpisodes(true)
    clinicalEpisodeService.getHistory(selectedPatient.hcl)
      .then((data) => setEpisodes(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEpisodes(false))
  }, [selectedPatient])

  const filtered = patients.filter(p => {
    const q = searchQuery.toLowerCase()
    return !q || p.hcl.toLowerCase().includes(q) || p.nombresCompletos.toLowerCase().includes(q)
  })

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ── Panel izquierdo: Lista de pacientes ─────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h2 className="mb-3 text-base font-bold text-slate-800">Lista Pacientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o HCL..."
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Sin resultados</p>
          ) : (
            filtered.map(patient => {
              const color = avatarColor(patient.nombresCompletos)
              const isSelected = selectedPatient?.id === patient.id
              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 last:border-0 ${
                    isSelected
                      ? 'bg-[#1A5276]/8 border-l-2 border-l-[#1A5276]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
                    {getInitials(patient.nombresCompletos)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{patient.nombresCompletos}</p>
                    <p className="text-xs font-mono text-[#1A5276]">{patient.hcl}</p>
                    <span className={`mt-0.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${SEGUIMIENTO_BADGE[patient.estadoSeguimiento] ?? SEGUIMIENTO_BADGE['En Progreso']}`}>
                      {patient.estadoSeguimiento}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-[#1A5276]' : 'text-slate-300'}`} />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Panel derecho: Consultas del paciente ────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {!selectedPatient ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <ClipboardList className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Selecciona un paciente para ver sus consultas</p>
          </div>
        ) : (
          <>
            {/* Header del paciente */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Consultas del Paciente</p>
                <h3 className="text-lg font-bold text-slate-800 truncate">{selectedPatient.nombresCompletos}</h3>
                <p className="text-xs font-mono text-[#1A5276]">{selectedPatient.hcl}</p>
              </div>
              <Button
                onClick={() => setDrawerOpen(true)}
                className="shrink-0 bg-[#1A5276] hover:bg-[#154360] text-white shadow-sm gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Nueva Consulta
              </Button>
            </div>

            {/* Lista de episodios */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingEpisodes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : episodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                  <ClipboardList className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Este paciente no tiene consultas registradas</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrawerOpen(true)}
                    className="gap-2 border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276]/5"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar primera consulta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {episodes.map((ep, i) => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A5276]/10 text-xs font-bold text-[#1A5276]">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ep.motivoConsulta}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(ep.fechaApertura)}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[ep.estado] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {ep.estado}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEvalEpisodio(ep); setEvalDrawerOpen(true) }}
                        className="shrink-0 gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Evaluación
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedPatient && (
        <CreateEpisodeDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          numeroHcl={selectedPatient.hcl}
          onSuccess={() => {
            setDrawerOpen(false)
            setLoadingEpisodes(true)
            clinicalEpisodeService.getHistory(selectedPatient.hcl)
              .then((data) => setEpisodes(Array.isArray(data) ? data : (data.data ?? [])))
              .catch(() => setEpisodes([]))
              .finally(() => setLoadingEpisodes(false))
          }}
        />
      )}

      {evalEpisodio && (
        <CreateEvaluacionClinicaDrawer
          open={evalDrawerOpen}
          onOpenChange={setEvalDrawerOpen}
          episodioId={evalEpisodio.id}
          numeroEpisodio={evalEpisodio.motivoConsulta}
          motivoConsulta={evalEpisodio.motivoConsulta}
          onSuccess={() => setEvalDrawerOpen(false)}
        />
      )}
    </div>
  )
}
