import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Users, UserCheck, UserX, ClipboardList,
} from 'lucide-react'
import { DataTable, type ColumnDef } from './ui/DataTable'
import type { Paciente } from '../hooks/usePacientesFilter'
import { PatientSearch, type Patient as SearchPatient } from './patient-record/PatientSearch'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PacientesTableProps = {
  pacientes: Paciente[]
  searchCatalog: SearchPatient[]
  isLoading?: boolean
  canEditRecord: boolean
  patientSearchQuery: string
  onSearchQueryChange: (value: string) => void
  onNuevoPaciente: () => void
  onVerFicha: (id: string) => void
  onEditar: (id: string) => void
}

type EstadoFilter = 'todos' | 'ACTIVO' | 'INACTIVO'

const PAGE_SIZE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PacientesTable({
  pacientes,
  searchCatalog,
  isLoading = false,
  canEditRecord,
  patientSearchQuery,
  onSearchQueryChange,
  onNuevoPaciente,
  onVerFicha,
  onEditar,
}: PacientesTableProps) {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [page, setPage] = useState(1)

  // Filtro combinado: búsqueda + estado
  const filtered = useMemo(() => {
    const q = patientSearchQuery.toLowerCase()
    return pacientes.filter(p => {
      const matchQ = !q
        || p.nombre.toLowerCase().includes(q)
        || p.cedula.includes(q)
        || p.hcl.toLowerCase().includes(q)
      const matchEstado = estadoFilter === 'todos' || p.estado === estadoFilter
      return matchQ && matchEstado
    })
  }, [pacientes, patientSearchQuery, estadoFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  // Reset page on filter change
  const handleSearch = (q: string) => { onSearchQueryChange(q); setPage(1) }
  const handleEstado = (f: EstadoFilter) => { setEstadoFilter(f); setPage(1) }

  // Métricas
  const total = pacientes.length
  const activos = pacientes.filter(p => p.estado === 'ACTIVO').length
  const inactivos = pacientes.filter(p => p.estado === 'INACTIVO').length
  const resultados = filtered.length

  // ── Columnas ──────────────────────────────────────────────────────────────

  const columns: ColumnDef<Paciente>[] = [
    {
      header: 'Paciente',
      cell: p => {
        const color = avatarColor(p.id)
        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
              {getInitials(p.nombre)}
            </div>
            <span className="font-semibold text-slate-800 text-sm">{p.nombre}</span>
          </div>
        )
      },
    },
    {
      header: 'Cédula',
      cell: p => <span className="text-sm text-slate-600 font-mono">{p.cedula}</span>,
    },
    {
      header: 'Historia Clínica',
      cell: p => (
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#1A5276]/10 text-[#1A5276]">
          {p.hcl}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: p => {
        const isActive = p.estado === 'ACTIVO'
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isActive ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-teal-500' : 'bg-rose-500'}`} />
            {p.estado}
          </span>
        )
      },
    },
    {
      header: 'Última Atención',
      cell: p => (
        <span className="text-sm text-slate-500">{fmtDate(p.ultimaAtencion)}</span>
      ),
    },
    {
      header: 'Fecha Registro',
      cell: p => (
        <span className="text-sm text-slate-500">{fmtDate(p.fechaRegistro)}</span>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pacientes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Directorio clínico y gestión de fichas de pacientes
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="w-64 hidden sm:block">
            <PatientSearch
              patients={searchCatalog}
              onSelect={patient => onVerFicha(String(patient.id))}
              onCreateNew={onNuevoPaciente}
            />
          </div>
          <Button
            onClick={onNuevoPaciente}
            className="bg-[#1A5276] hover:bg-[#154360] text-white shadow-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-[#1A5276]" />}
          label="Total registrados"
          value={total}
          sub="en el sistema"
          color="bg-[#1A5276]/10"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-teal-600" />}
          label="Activos"
          value={activos}
          sub={`${total > 0 ? Math.round((activos / total) * 100) : 0}% del total`}
          color="bg-teal-50"
        />
        <StatCard
          icon={<UserX className="w-5 h-5 text-rose-500" />}
          label="Inactivos"
          value={inactivos}
          sub="sin actividad reciente"
          color="bg-rose-50"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-amber-500" />}
          label="Resultados filtrados"
          value={resultados}
          sub="según búsqueda actual"
          color="bg-amber-50"
        />
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Chips de estado */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['todos', 'ACTIVO', 'INACTIVO'] as EstadoFilter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => handleEstado(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                estadoFilter === f
                  ? 'bg-[#1A5276] text-white border-[#1A5276]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'ACTIVO' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, cédula o HCL..."
            value={patientSearchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 h-9"
          />
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <DataTable<Paciente>
          data={paged}
          columns={columns}
          isLoading={isLoading}
          onView={p => onVerFicha(p.id)}
          onEdit={canEditRecord ? p => onEditar(p.id) : undefined}
        />
      </div>

      {/* ── Paginación ─────────────────────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            Página {safePage} de {totalPages} · {filtered.length} resultados
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
