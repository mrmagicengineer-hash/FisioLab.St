import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { Patient } from '../data/types'
import { searchPatients } from '../data/services/patientSearchService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PatientSearchComboboxProps {
  value: Patient | null
  onSelect: (patient: Patient | null) => void
  placeholder?: string
  disabled?: boolean
  /** aria-invalid para integración con validación de formulario */
  invalid?: boolean
  className?: string
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PatientSearchCombobox({
  value,
  onSelect,
  placeholder = 'Buscar paciente por nombre o documento…',
  disabled = false,
  invalid = false,
  className,
}: PatientSearchComboboxProps) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<Patient[]>([])
  const [isOpen, setIsOpen]         = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Búsqueda con debounce 300ms ──
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const data = await searchPatients(q)
      setResults(data.items)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  // ── Cerrar al clic fuera ──
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // ── Selección ──
  const handleSelect = (patient: Patient) => {
    onSelect(patient)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!isOpen) setIsOpen(true)
    if (value) onSelect(null) // limpiar selección si el usuario escribe de nuevo
  }

  // ── Si hay un paciente seleccionado, mostrar chip ──
  if (value) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm',
          invalid && 'border-destructive ring-3 ring-destructive/20',
          className
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="size-3.5 text-primary" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate font-medium text-foreground text-xs">
            {value.fullName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {value.documentType} {value.documentNumber}
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Quitar paciente"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input de búsqueda */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          invalid && 'border-destructive ring-3 ring-destructive/20',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {isLoading && (
          <div className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && query.length >= 3 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandList>
              {!isLoading && results.length === 0 && (
                <CommandEmpty className="py-4 text-xs text-muted-foreground text-center">
                  Sin resultados para "{query}"
                </CommandEmpty>
              )}
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={String(patient.id)}
                      onSelect={() => handleSelect(patient)}
                      className="cursor-pointer"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="size-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-sm font-medium text-foreground">
                          {patient.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {patient.documentType} {patient.documentNumber}
                          {patient.phone ? ` · ${patient.phone}` : ''}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
