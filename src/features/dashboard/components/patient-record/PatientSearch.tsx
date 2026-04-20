import { useEffect, useRef, useState } from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command'
import { StatusBadge } from '../ui/StatusBadge'

export type Patient = {
  id: number
  hcl: string
  cedula: string
  nombre: string
  estadoArchivo: 'ACTIVO' | 'PASIVO'
}

interface PatientSearchProps {
  patients: Patient[]
  onSelect: (patient: Patient) => void
  onCreateNew: () => void
  placeholder?: string
}

export function PatientSearch({
  patients,
  onSelect,
  onCreateNew,
  placeholder = 'Buscar por cédula, HCL o nombres...'
}: PatientSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '/') {
        return
      }

      const target = event.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (isTypingContext) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
      setIsOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showResults = isOpen && query.trim().length > 0

  function handleSelect(patient: Patient) {
    onSelect(patient)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function handleCreateNew() {
    setQuery('')
    setIsOpen(false)
    onCreateNew()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <Command
        shouldFilter
        className="overflow-visible rounded-xl border border-slate-200 bg-slate-50/50 transition-all hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200"
      >
        <div className="flex items-center px-4">
          {/* 1. Lupa manual controlada por ti */}
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={(value: string) => {
              setQuery(value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="h-12 w-full bg-transparent pl-3 text-sm text-slate-700 outline-none placeholder:text-slate-500"
          />

          {/* 4. Atajo de teclado */}
          <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
            /
          </kbd>
        </div>

        {/* Panel de resultados — Z-pattern: header arriba, filas con nombre+estado (fila 1) y HCL/CI+acción (fila 2) */}
        {showResults && (
          <div
            className="motion-soft absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border bg-white shadow-xl animate-in fade-in zoom-in-95"
            style={{ borderColor: 'color-mix(in oklab, var(--color-brand) 22%, white)' }}
          >
            {/* Header del panel: Z-start con caption, Z-end con hint de teclado */}
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{
                borderColor: 'color-mix(in oklab, var(--color-brand) 12%, white)',
                background: 'color-mix(in oklab, var(--color-brand) 6%, white)'
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--petrol-700)', fontFamily: 'var(--font-heading)' }}
              >
                Resultados
                {patients.length > 0 && (
                  <span className="ml-1.5 font-normal text-slate-400">({patients.length})</span>
                )}
              </span>
              <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:flex">
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500">↵</kbd>
                para abrir
              </span>
            </div>

            <CommandList className="max-h-80">
              <CommandEmpty>
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">No encontramos coincidencias.</p>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Registrar nuevo paciente
                  </button>
                </div>
              </CommandEmpty>

              <CommandGroup className="p-1.5">
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={`${patient.nombre} ${patient.cedula} ${patient.hcl}`}
                    onSelect={() => handleSelect(patient)}
                    className="group/item mb-0.5 flex cursor-pointer flex-col gap-1.5 rounded-lg px-3 py-2.5 transition-colors data-[selected=true]:bg-[color-mix(in_oklab,var(--color-brand)_10%,white)]"
                  >
                    {/* Fila 1 (Z-superior): nombre | estado */}
                    <div className="flex w-full items-center justify-between gap-3">
                      <span
                        className="truncate text-sm font-semibold"
                        style={{ color: 'var(--petrol-700)', fontFamily: 'var(--font-heading)' }}
                      >
                        {patient.nombre}
                      </span>
                      <StatusBadge
                        label={patient.estadoArchivo}
                        variant={patient.estadoArchivo === 'ACTIVO' ? 'success' : 'warning'}
                      />
                    </div>

                    {/* Fila 2 (Z-inferior): identificadores | flecha de acción */}
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono font-medium text-slate-600">
                          {patient.hcl}
                        </span>
                        <span className="text-slate-400">CI {patient.cedula}</span>
                      </div>
                      <span
                        className="flex items-center gap-1 text-[11px] font-medium opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[selected=true]/item:opacity-100"
                        style={{ color: 'var(--color-brand)' }}
                      >
                        Ver ficha
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
