import React from 'react'

// --- Tipos ---
export type VitalSigns = {
  presionArterial?: string
  frecuenciaCardiaca?: number
  frecuenciaRespiratoria?: number
  temperatura?: number
  saturacionOxigeno?: number
  registradoEn?: string
}

type VitalLevel = 'normal' | 'warning' | 'danger' | 'unknown'

interface ClinicalStatusBarProps {
  vitals?: VitalSigns
}

interface VitalItemProps {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  unit: string
  level: VitalLevel
  title: string
}

// --- Iconos (Solo los necesarios para los signos) ---
const Icons = {
  Activity: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
  ),
  Heart: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
  ),
  Wind: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>
  ),
  Thermometer: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
  ),
  Droplet: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}

const LEVEL_COLORS: Record<VitalLevel, string> = {
  normal: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
  unknown: 'text-slate-300'
}

// --- Subcomponente VitalItem ---
function VitalItem({ icon: Icon, value, unit, level, title }: VitalItemProps) {
  return (
    <div className="flex items-center gap-2.5 px-5 first:pl-0 border-r last:border-none border-slate-100 group transition-all" title={title}>
      <Icon className={`${LEVEL_COLORS[level]} opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold tabular-nums leading-none ${level !== 'unknown' ? 'text-slate-700' : 'text-slate-300'}`}>
          {value}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {unit}
        </span>
      </div>
    </div>
  )
}

// --- Lógica de Clasificación ---
const classify = {
  pa: (v?: string): VitalLevel => {
    if (!v) return 'unknown'
    const [s, d] = v.split('/').map(Number)
    return (s >= 140 || d >= 90 || s < 90 || d < 60) ? 'danger' : (s >= 130 || d >= 85) ? 'warning' : 'normal'
  },
  fc: (v?: number): VitalLevel => {
    if (v === undefined) return 'unknown'
    return (v < 50 || v > 110) ? 'danger' : (v < 60 || v > 100) ? 'warning' : 'normal'
  },
  fr: (v?: number): VitalLevel => {
    if (v === undefined) return 'unknown'
    return (v < 10 || v > 24) ? 'danger' : (v < 12 || v > 20) ? 'warning' : 'normal'
  },
  temp: (v?: number): VitalLevel => {
    if (v === undefined) return 'unknown'
    return (v >= 38 || v < 35) ? 'danger' : v >= 37.5 ? 'warning' : 'normal'
  },
  spo2: (v?: number): VitalLevel => {
    if (v === undefined) return 'unknown'
    return v < 90 ? 'danger' : v < 95 ? 'warning' : 'normal'
  }
}

// --- Componente Principal ---
export function ClinicalStatusBar({ vitals }: ClinicalStatusBarProps) {
  const v = vitals ?? {}

  return (
    <div className="flex items-center justify-between w-full bg-transparent py-2">
      
      {/* Sección Izquierda: Solo Texto */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">
          Signos Vitales
        </span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Icons.Clock className="opacity-70" />
          <span className="text-[11px] font-medium italic">
            {v.registradoEn ? v.registradoEn : 'Pendiente'}
          </span>
        </div>
      </div>

      {/* Sección Derecha: Signos Vitales Minimalistas */}
      <div className="flex items-center">
        <VitalItem
          icon={Icons.Heart}
          value={v.presionArterial ?? '—'}
          unit="mmHg"
          level={classify.pa(v.presionArterial)}
          title="Presión Arterial"
        />
        <VitalItem
          icon={Icons.Activity}
          value={v.frecuenciaCardiaca ?? '—'}
          unit="bpm"
          level={classify.fc(v.frecuenciaCardiaca)}
          title="Frecuencia Cardíaca"
        />
        <VitalItem
          icon={Icons.Wind}
          value={v.frecuenciaRespiratoria ?? '—'}
          unit="rpm"
          level={classify.fr(v.frecuenciaRespiratoria)}
          title="Frecuencia Respiratoria"
        />
        <VitalItem
          icon={Icons.Thermometer}
          value={v.temperatura ? v.temperatura.toFixed(1) : '—'}
          unit="°C"
          level={classify.temp(v.temperatura)}
          title="Temperatura"
        />
        <VitalItem
          icon={Icons.Droplet}
          value={v.saturacionOxigeno ?? '—'}
          unit="%"
          level={classify.spo2(v.saturacionOxigeno)}
          title="Saturación de Oxígeno"
        />
      </div>
    </div>
  )
}