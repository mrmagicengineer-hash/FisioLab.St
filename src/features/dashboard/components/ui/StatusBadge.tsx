type StatusBadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
}

type StatusBadgeProps = {
  label: string
  variant: StatusBadgeVariant
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
