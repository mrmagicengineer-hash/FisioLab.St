import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Search, X, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  registerProblem,
  type ProblemStatus,
} from '../../data/services/clinicalHistoryService'
import { CIF_CATALOG, CIF_GROUPS, type CifCategory } from '../../data/config/treatmentConfig'

type Cie10Result = { code: string; name: string }
type CodeMode = 'cie10' | 'cif'

type Props = {
  episodioId: number
  onSuccess: () => void
  onCancel: () => void
}

const STATUS_OPTIONS: { value: ProblemStatus; label: string; cls: string }[] = [
  { value: 'ACTIVO',     label: 'Activo',     cls: 'bg-green-500 border-green-500' },
  { value: 'CRONICO',    label: 'Crónico',    cls: 'bg-amber-500 border-amber-500' },
  { value: 'RESUELTO',   label: 'Resuelto',   cls: 'bg-blue-500 border-blue-500' },
  { value: 'DESCARTADO', label: 'Descartado', cls: 'bg-slate-400 border-slate-400' },
]

const fieldCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 transition'

export function AddProblemForm({ episodioId, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<ProblemStatus>('ACTIVO')
  const [codeMode, setCodeMode] = useState<CodeMode>('cie10')

  // CIE-10
  const [searchTerm, setSearchTerm] = useState('')
  const [codigoCie10, setCodigoCie10] = useState('')
  const [descripcionCie10, setDescripcionCie10] = useState('')
  const [suggestions, setSuggestions] = useState<Cie10Result[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // CIF
  const [cifSearchTerm, setCifSearchTerm] = useState('')
  const [selectedCif, setSelectedCif] = useState<CifCategory | null>(null)
  const [cifGroup, setCifGroup] = useState<string>('all')

  // Debounce CIE-10
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length > 1 && searchTerm !== codigoCie10) {
        setIsSearching(true)
        setShowDropdown(true)
        try {
          const res = await fetch(
            `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=${encodeURIComponent(searchTerm)}&maxList=12`
          )
          const data = await res.json()
          const results: Cie10Result[] = (data[1] as string[]).map(
            (code: string, i: number) => ({
              code,
              name: Array.isArray(data[3][i]) ? data[3][i][1] : String(data[3][i]),
            })
          )
          setSuggestions(results)
        } catch {
          setSuggestions([])
        } finally {
          setIsSearching(false)
        }
      } else if (searchTerm.length <= 1) {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm, codigoCie10])

  const selectCie10 = (item: Cie10Result) => {
    setCodigoCie10(item.code)
    setDescripcionCie10(item.name)
    setSearchTerm(item.code)
    setShowDropdown(false)
    setSuggestions([])
  }

  const clearCie10 = () => {
    setCodigoCie10('')
    setDescripcionCie10('')
    setSearchTerm('')
    setSuggestions([])
    setShowDropdown(false)
  }

  // CIF filter
  const filteredCif = CIF_CATALOG.filter(c => {
    const matchGroup = cifGroup === 'all' || c.group === cifGroup
    const matchSearch =
      cifSearchTerm === '' ||
      c.label.toLowerCase().includes(cifSearchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(cifSearchTerm.toLowerCase())
    return matchGroup && matchSearch
  })

  // Final code used for submission
  const effectiveCode = codeMode === 'cie10' ? codigoCie10 : (selectedCif?.code ?? '')
  const isValid = descripcion.trim() !== '' && effectiveCode !== ''

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      await registerProblem(episodioId, {
        descripcion: descripcion.trim(),
        codigoCie10: effectiveCode,
        estado,
      })
      toast.success('Problema registrado', {
        description: `${effectiveCode} — ${descripcion.trim()}`,
      })
      onSuccess()
    } catch (error) {
      toast.error('Error al registrar el problema', {
        description: error instanceof Error ? error.message : 'Intente nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-[#1A5276]/20 bg-[#1A5276]/3 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#1A5276] uppercase tracking-wide">Nuevo Problema</p>

        {/* Toggle CIE-10 / CIF */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setCodeMode('cie10')}
            className={`px-3 py-1.5 transition ${codeMode === 'cie10' ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            CIE-10
          </button>
          <button
            type="button"
            onClick={() => setCodeMode('cif')}
            className={`px-3 py-1.5 transition ${codeMode === 'cif' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            CIF
          </button>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
          Descripción funcional <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`${fieldCls} resize-none min-h-16`}
          placeholder="Ej: Lumbalgia crónica con irradiación a miembro inferior derecho..."
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />
      </div>

      {/* Código CIE-10 */}
      {codeMode === 'cie10' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
            Código CIE-10 <span className="text-red-500">*</span>
            <span className="ml-1 text-slate-300 normal-case font-normal">(diagnóstico médico)</span>
          </label>
          <div className="relative">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-300/30 font-medium transition"
                placeholder="Buscar por código o nombre (Ej: M545, lumbalgia...)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
              />
              <div className="absolute right-3 top-3 text-slate-400">
                {isSearching
                  ? <Loader2 size={15} className="animate-spin text-sky-400" />
                  : <Search size={15} />}
              </div>
            </div>
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                {suggestions.map(item => (
                  <button
                    key={item.code}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-sky-50 border-b last:border-b-0 flex items-center gap-3 transition"
                    onClick={() => selectCie10(item)}
                  >
                    <span className="font-bold text-sky-700 text-xs min-w-13">{item.code}</span>
                    <span className="text-slate-600 text-xs line-clamp-1">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {codigoCie10 && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg">
              <span className="text-xs font-bold text-sky-700">{codigoCie10}</span>
              <span className="text-xs text-slate-600 flex-1 line-clamp-1">{descripcionCie10}</span>
              <button type="button" onClick={clearCie10} className="text-slate-400 hover:text-red-400 transition">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Código CIF */}
      {codeMode === 'cif' && (
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
            Código CIF <span className="text-red-500">*</span>
            <span className="ml-1 text-slate-300 normal-case font-normal">(funcionamiento / discapacidad)</span>
          </label>

          {/* Filtros */}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-400 transition"
              placeholder="Buscar código o función..."
              value={cifSearchTerm}
              onChange={e => setCifSearchTerm(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:border-teal-400 transition"
              value={cifGroup}
              onChange={e => setCifGroup(e.target.value)}
            >
              <option value="all">Todos los grupos</option>
              {CIF_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Grid de códigos */}
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 grid grid-cols-1 gap-1">
            {filteredCif.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin resultados</p>
            ) : filteredCif.map(c => {
              const isSelected = selectedCif?.code === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCif(isSelected ? null : c)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs transition border ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-bold min-w-9 ${isSelected ? 'text-teal-100' : 'text-teal-600'}`}>{c.code}</span>
                  <span className="flex-1 line-clamp-1">{c.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-500 text-teal-100' : 'bg-slate-100 text-slate-400'}`}>
                    {c.group.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Seleccionado */}
          {selectedCif && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
              <Tag size={13} className="text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-teal-700">{selectedCif.code}</span>
              <span className="text-xs text-slate-600 flex-1">{selectedCif.label}</span>
              <button type="button" onClick={() => setSelectedCif(null)} className="text-slate-400 hover:text-red-400 transition">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estado */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Estado inicial</label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEstado(opt.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${
                estado === opt.value
                  ? `${opt.cls} text-white`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          size="sm"
          className={`text-white font-bold transition ${
            isValid ? 'bg-[#1A5276] hover:bg-[#154360]' : 'bg-slate-300 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={loading || !isValid}
        >
          {loading
            ? <><Loader2 className="animate-spin mr-1.5" size={13} />Guardando...</>
            : 'Agregar Problema'
          }
        </Button>
      </div>
    </div>
  )
}
