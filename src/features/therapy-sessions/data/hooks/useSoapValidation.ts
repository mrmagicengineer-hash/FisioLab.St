import { useMemo } from 'react'
import type { SoapNote } from '../types'

const MIN_CHARS = 10

export type SoapFieldState = {
  valid:   boolean
  touched: boolean
  message: string
}

export type SoapValidation = {
  fields: Record<keyof SoapNote, SoapFieldState>
  isValid: boolean
}

const LABELS: Record<keyof SoapNote, string> = {
  subjetivo: 'Subjetivo',
  objetivo:  'Objetivo',
  analisis:  'Análisis',
  plan:      'Plan',
}

export function useSoapValidation(soap: SoapNote): SoapValidation {
  return useMemo(() => {
    const entries = (Object.keys(soap) as Array<keyof SoapNote>).map((field) => {
      const value   = soap[field].trim()
      const empty   = value.length === 0
      const short   = value.length > 0 && value.length < MIN_CHARS
      const valid   = value.length >= MIN_CHARS
      const touched = value.length > 0

      const message = empty
        ? `${LABELS[field]} es obligatorio`
        : short
          ? `${LABELS[field]} debe tener al menos ${MIN_CHARS} caracteres`
          : ''

      return [field, { valid, touched, message }] as const
    })

    const fields = Object.fromEntries(entries) as Record<keyof SoapNote, SoapFieldState>
    const isValid = entries.every(([, state]) => state.valid)

    return { fields, isValid }
  }, [soap])
}
